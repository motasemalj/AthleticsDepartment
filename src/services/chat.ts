/**
 * Messaging layer.
 *
 * When Firebase is configured (see `src/services/firebase.ts`) messages are
 * written to and streamed from Cloud Firestore in real time. Otherwise the
 * local demo store acts as the transport so chat is fully usable offline.
 */
import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

import { getDb, isFirebaseConfigured } from '@/services/firebase';
import { useData } from '@/services/data/store';
import type { ID, Message } from '@/types';

export function useMessages(conversationId: ID): Message[] {
  const localMessages = useData((s) => s.messages);
  const [remote, setRemote] = useState<Message[] | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const db = getDb();
    if (!db) return;
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('sentAt', 'asc')
    );
    return onSnapshot(q, (snap) => {
      setRemote(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            conversationId,
            senderId: data.senderId,
            text: data.text,
            imageUri: data.imageUri,
            videoUri: data.videoUri,
            sentAt: data.sentAt?.toMillis?.() ?? Date.now(),
            readBy: data.readBy ?? [],
          } as Message;
        })
      );
    });
  }, [conversationId]);

  if (isFirebaseConfigured && remote) return remote;
  return localMessages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => a.sentAt - b.sentAt);
}

export async function sendChatMessage(
  conversationId: ID,
  senderId: ID,
  content: { text?: string; imageUri?: string; videoUri?: string }
): Promise<void> {
  // Always write locally so previews/unread counts stay consistent in demo mode.
  useData.getState().sendMessage(conversationId, senderId, content);

  if (isFirebaseConfigured) {
    const db = getDb();
    if (db) {
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        senderId,
        ...content,
        sentAt: serverTimestamp(),
        readBy: [senderId],
      });
    }
  }
}
