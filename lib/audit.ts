import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';

export const logAction = async (action: string, details: object) => {
  try {
    await addDoc(collection(db, 'auditoria'), {
      action,
      details,
      userEmail: auth.currentUser?.email,
      userId: auth.currentUser?.uid,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error logging action:", error);
  }
};