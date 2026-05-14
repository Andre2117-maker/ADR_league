import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";

export const saveTeamPreset = async (team, date, presetName) => {
  await addDoc(collection(db, "teamsPresets"), {
    name: presetName,

    date,

    players: team.players || [],

    goalkeeperId: team.goalkeeperId || null,

    captainId: team.captainId || null,

    logo: team.logo || "",

    createdAt: serverTimestamp(),
  });
};

export const loadTeamPresets = async (date) => {
  const q = query(collection(db, "teamsPresets"), where("date", "==", date));

  const snap = await getDocs(q);

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
