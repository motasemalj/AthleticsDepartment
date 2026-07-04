/**
 * Athletics Department — Cloud Functions
 *
 * Responsibilities:
 *  - Stripe: checkout sessions (AED subscriptions with student pricing),
 *    webhook processing, automatic commission splits, refunds.
 *  - Invites: signed invite token creation for coaches.
 *  - Push: FCM fan-out on key events (check-ins, messages, bookings, approvals).
 *
 * Deploy: `firebase deploy --only functions`
 * Secrets: `firebase functions:secrets:set STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET`
 */
import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import Stripe from 'stripe';

admin.initializeApp();
const db = admin.firestore();

const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');

const getStripe = () => new Stripe(stripeSecretKey.value());

// ---------------------------------------------------------------------------
// Stripe: create a subscription checkout session
// ---------------------------------------------------------------------------

export const createCheckoutSession = onCall(
  { secrets: [stripeSecretKey], region: 'europe-west1' },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.');

    const { coachId, months, isStudent } = request.data as {
      coachId: string;
      months: 3 | 6 | 12;
      isStudent: boolean;
    };

    const coachSnap = await db.doc(`coaches/${coachId}`).get();
    if (!coachSnap.exists) throw new HttpsError('not-found', 'Coach not found.');
    const coach = coachSnap.data()!;
    if (coach.status !== 'approved') throw new HttpsError('failed-precondition', 'Coach is not accepting clients.');

    const tier = (coach.pricing as { months: number; pricePerMonthAed: number }[]).find(
      (t) => t.months === months
    );
    if (!tier) throw new HttpsError('invalid-argument', 'Unknown pricing tier.');

    const discountPct = isStudent ? (coach.studentDiscountPct ?? 0) : 0;
    const monthlyAed = Math.round(tier.pricePerMonthAed * (1 - discountPct / 100));

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      client_reference_id: uid,
      metadata: { coachId, months: String(months), isStudent: String(isStudent) },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'aed',
            recurring: { interval: 'month' },
            unit_amount: monthlyAed * 100, // fils
            product_data: {
              name: `Coaching with ${coach.name} — ${months}-month plan`,
              description: discountPct ? `Student pricing (−${discountPct}%)` : undefined,
            },
          },
        },
      ],
      success_url: 'athleticsdept://billing?status=success',
      cancel_url: 'athleticsdept://billing?status=cancelled',
    });

    return { url: session.url };
  }
);

// ---------------------------------------------------------------------------
// Stripe: webhook — record payments and split commission automatically
// ---------------------------------------------------------------------------

export const stripeWebhook = onRequest(
  { secrets: [stripeSecretKey, stripeWebhookSecret], region: 'europe-west1' },
  async (req, res) => {
    const stripe = getStripe();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        req.headers['stripe-signature'] as string,
        stripeWebhookSecret.value()
      );
    } catch (err) {
      res.status(400).send(`Webhook signature verification failed: ${(err as Error).message}`);
      return;
    }

    switch (event.type) {
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
        if (!subId) break;
        const subSnap = await db.collection('subscriptions').where('stripeSubscriptionId', '==', subId).limit(1).get();
        if (subSnap.empty) break;
        const subDoc = subSnap.docs[0];
        const sub = subDoc.data();

        const coachSnap = await db.doc(`coaches/${sub.coachId}`).get();
        const coach = coachSnap.data() ?? {};
        const amountAed = Math.round((invoice.amount_paid ?? 0) / 100);
        // Owner coaches route 100% of net to the platform; partners pay commission.
        const commissionAed = coach.isOwner ? 0 : Math.round(amountAed * ((coach.commissionPct ?? 0) / 100));

        await db.collection('payments').add({
          subscriptionId: subDoc.id,
          athleteId: sub.athleteId,
          coachId: sub.coachId,
          amountAed,
          commissionAed,
          netAed: amountAed - commissionAed,
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'paid',
          stripeInvoiceId: invoice.id,
        });
        await subDoc.ref.update({ status: 'active', lastPaymentAt: admin.firestore.FieldValue.serverTimestamp() });
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
        if (!subId) break;
        const subSnap = await db.collection('subscriptions').where('stripeSubscriptionId', '==', subId).limit(1).get();
        if (!subSnap.empty) await subSnap.docs[0].ref.update({ status: 'past_due' });
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const subSnap = await db
          .collection('subscriptions')
          .where('stripeSubscriptionId', '==', subscription.id)
          .limit(1)
          .get();
        if (!subSnap.empty) await subSnap.docs[0].ref.update({ status: 'cancelled' });
        break;
      }
    }

    res.json({ received: true });
  }
);

// ---------------------------------------------------------------------------
// Stripe: refund (admin only)
// ---------------------------------------------------------------------------

export const refundPayment = onCall(
  { secrets: [stripeSecretKey], region: 'europe-west1' },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.');
    const caller = await db.doc(`users/${uid}`).get();
    if (caller.data()?.role !== 'admin') throw new HttpsError('permission-denied', 'Admins only.');

    const { paymentId } = request.data as { paymentId: string };
    const paySnap = await db.doc(`payments/${paymentId}`).get();
    if (!paySnap.exists) throw new HttpsError('not-found', 'Payment not found.');

    const stripe = getStripe();
    const invoice = await stripe.invoices.retrieve(paySnap.data()!.stripeInvoiceId);
    const paymentIntentId =
      typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent?.id;
    if (paymentIntentId) {
      await stripe.refunds.create({ payment_intent: paymentIntentId });
    }
    await paySnap.ref.update({ status: 'refunded' });
    return { ok: true };
  }
);

// ---------------------------------------------------------------------------
// Invites: generate a unique token for a coach
// ---------------------------------------------------------------------------

export const createInvite = onCall({ region: 'europe-west1' }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.');
  const coach = await db.doc(`coaches/${uid}`).get();
  if (!coach.exists || coach.data()?.status !== 'approved') {
    throw new HttpsError('permission-denied', 'Only approved coaches can invite athletes.');
  }

  const token = `${Math.random().toString(36).slice(2, 6)}-${Math.random().toString(36).slice(2, 7)}`.toUpperCase();
  const invite = await db.collection('invites').add({
    coachId: uid,
    token,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    usedBy: null,
    revoked: false,
  });
  return { id: invite.id, token, link: `https://join.athleticsdept.ae/join/${token}` };
});

// ---------------------------------------------------------------------------
// Push notifications: fan-out on new notification documents
// ---------------------------------------------------------------------------

export const sendPush = onDocumentCreated(
  { document: 'notifications/{id}', region: 'europe-west1' },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const tokensSnap = await db.collection(`users/${data.userId}/pushTokens`).get();
    if (tokensSnap.empty) return;

    const tokens = tokensSnap.docs.map((d) => d.id);
    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title: data.title, body: data.body },
      data: { route: data.route ?? '' },
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    });
  }
);

// ---------------------------------------------------------------------------
// Messages: notify the recipient of a new chat message
// ---------------------------------------------------------------------------

export const onNewMessage = onDocumentCreated(
  { document: 'conversations/{conversationId}/messages/{messageId}', region: 'europe-west1' },
  async (event) => {
    const message = event.data?.data();
    if (!message) return;

    const convSnap = await db.doc(`conversations/${event.params.conversationId}`).get();
    const conv = convSnap.data();
    if (!conv) return;

    const recipientId = message.senderId === conv.athleteId ? conv.coachId : conv.athleteId;
    const sender = await db.doc(`users/${message.senderId}`).get();

    await db.collection('notifications').add({
      userId: recipientId,
      kind: 'message',
      title: `New message from ${sender.data()?.name ?? 'your coach'}`,
      body: message.text ?? (message.imageUri ? '📷 Photo' : '🎥 Video'),
      route: `/chat/${event.params.conversationId}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
    });

    await convSnap.ref.update({
      lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
      lastMessagePreview: message.text ?? '📎 Attachment',
      [`unread.${recipientId}`]: admin.firestore.FieldValue.increment(1),
    });
  }
);
