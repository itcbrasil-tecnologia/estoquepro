import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA2QbTc66Hir01rxRBO8d8jbldBbdYVNHQ",
  authDomain: "estoque-5bd20.firebaseapp.com",
  projectId: "estoque-5bd20",
  storageBucket: "estoque-5bd20.appspot.com",
  messagingSenderId: "877422312225",
  appId: "1:877422312225:web:b600eaae6f06a752575c60"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

const secondaryAppName = 'secondary';
let secondaryApp;
try {
  secondaryApp = getApp(secondaryAppName);
} catch (e) {
  secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
}

export const auth = getAuth(app);
export const secondaryAuth = getAuth(secondaryApp);
export const db = getFirestore(app);
export const storage = getStorage(app);