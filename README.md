# Athletics Department

A multi-coach fitness marketplace for iOS and Android. Coaches manage their athletes, deliver
personalised training and nutrition plans, run video check-ins over Google Meet, and earn through
AED subscriptions with automatic commission splits — while athletes train, track progress, and stay
connected to their coach whether they have internet or not.

Built with **Expo (React Native) + TypeScript + Expo Router**, backed by **Firebase**
(Firestore, Auth, Storage, FCM, Cloud Functions) and **Stripe**.

## Quick start

```bash
npm install
npx expo start
```

Scan the QR with Expo Go (or press `i` / `a` for simulators). The app ships with a fully seeded
**demo mode** — no credentials required:

| Role    | How to enter                                                  |
| ------- | ------------------------------------------------------------- |
| Athlete | Welcome screen → "Explore the demo" → Athlete (Maya Khalil)   |
| Coach   | Welcome screen → "Explore the demo" → Coach (Omar Al-Rashid)  |
| Admin   | Welcome screen → "Explore the demo" → Admin (platform owner)  |

You can also walk the real onboarding flows: redeem the demo invite code `OMAR-TRAIN-24` as a new
athlete, or submit a coach application and approve it from the admin account.

## Features

**Athlete** — invite-only login (link or QR), fitness disclaimer & 18+ gate, home dashboard,
daily check-ins (journal, mood, energy, photo), day-by-day training plans with demo videos,
**offline workout logging with automatic sync**, workout calendar & streaks, nutrition plans with
macro targets and meal logging, progress tracking (weight, body fat, measurements, photos),
before/after comparison, video check-in bookings, in-app messaging, subscription & billing.

**Coach** — registration with certification upload and admin approval, dashboard (clients, revenue,
pending check-ins), check-in review queue (oldest-first), searchable client roster with 4-tab
profiles, workout plan builder with exercise library and **drag-to-reorder**, nutrition plan
builder, video library with exercise assignment, health-goal tracking with compliance view,
session scheduling with Google Meet links, 3/6/12-month pricing with student discounts,
earnings dashboard (gross / commission / net / payouts), athlete invitations via link and QR.

**Admin / Platform** — coach approval with certification review and commission setting,
subscription oversight (pause / cancel / refund), split-revenue dashboard (owner coaching income vs
platform commission, per-coach drill-down), Stripe payments in AED with automatic commission
splits, real-time sync, push notifications, in-app FAQ with email & WhatsApp support, privacy
compliance and full account deletion.

## Project structure

```
src/app/              Expo Router routes
  (auth)/             Welcome, sign-in, invite redemption, coach application, disclaimer
  (athlete)/          Athlete tabs + workout player, check-ins, progress, bookings, billing
  (coach)/            Coach tabs + plan builders, video library, earnings, pricing, invites
  (admin)/            Admin tabs + coach approvals, subscriptions, revenue split
  chat/[id].tsx       Shared chat thread (athlete ↔ coach)
src/components/       Design system (Text, Button, Card, Sheet, charts, calendar, sortable list)
src/services/         Data store (Zustand), chat (Firebase-aware), offline sync, push, session
src/theme/            Design tokens: color, typography, spacing, radius, motion
src/types/            Domain models
functions/            Cloud Functions: Stripe checkout/webhooks/refunds, invites, FCM fan-out
firestore.rules       Locked-down security rules
storage.rules         Storage rules (progress photos private to athlete + coach)
```

## Demo mode vs production

The app runs against a seeded local data layer (persisted with AsyncStorage) so every feature works
end-to-end out of the box, including the offline workout-logging lifecycle. Messaging is already
dual-path: when Firebase credentials are present, chat reads/writes Cloud Firestore in real time.

### Switching to production (~15 minutes)

1. **Firebase** — create a project, enable Auth (email/password), Firestore, Storage and FCM. Add a
   web app and put its config in `.env` (see `.env.example`):

   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=...
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
   ...
   ```

2. **Rules & indexes** — `firebase deploy --only firestore,storage`.

3. **Cloud Functions** — set secrets and deploy:

   ```bash
   firebase functions:secrets:set STRIPE_SECRET_KEY
   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
   firebase deploy --only functions
   ```

4. **Stripe** — create a UAE (AED) account, point a webhook at the deployed `stripeWebhook`
   function for `invoice.paid`, `invoice.payment_failed` and `customer.subscription.deleted`.
   Checkout sessions, student pricing and commission splits are handled by
   `functions/src/index.ts`.

5. **Push** — FCM fan-out is live via the `sendPush` function; device registration is in
   `src/services/push.ts` (called after sign-in in production builds).

## Builds

```bash
npx expo run:ios          # local dev build
npx expo run:android
eas build --platform all  # store builds via EAS
```

## Verification

- `npx tsc --noEmit` — typecheck (app + functions)
- `npm run lint` — ESLint (React Compiler rules enabled)
- `npx expo export --platform ios|android` — bundle check
