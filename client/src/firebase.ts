import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import * as firebaseui from "firebaseui";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDx41iF5h4hCCauY8pPtP4AkZVmtVddo3g",
  authDomain: "hey-internship-2022-heyho.firebaseapp.com",
  projectId: "hey-internship-2022-heyho",
  storageBucket: "hey-internship-2022-heyho.appspot.com",
  messagingSenderId: "319633478738",
  appId: "1:319633478738:web:00013406449b6836643b8b",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth(app);

const initFirebaseAuth = () => {
  return new Promise<User | null>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      resolve(user);
      unsubscribe();
    });
  });
};

export const getUser = async () => {
  const user = await initFirebaseAuth();
  return {
    user,
    userId: user?.uid,
  };
};

export const ui = new firebaseui.auth.AuthUI(auth);

const functions = getFunctions(getApp());

if (process.env.NODE_ENV === "development") {
  console.log();
  connectFunctionsEmulator(functions, "localhost", 5001);
}
