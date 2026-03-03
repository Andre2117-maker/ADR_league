import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDmNaQxA3Mv54N4U6KJ5tA8wt0traP6yaA",
  authDomain: "adr-league.firebaseapp.com",
  projectId: "adr-league",
  storageBucket: "adr-league.firebasestorage.app",
  messagingSenderId: "569066041468",
  appId: "1:569066041468:web:d7f4c256078c78de44d9f9",
  measurementId: "G-C7Y80FGV2R",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
