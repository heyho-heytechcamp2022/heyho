import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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
