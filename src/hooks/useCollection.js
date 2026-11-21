import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";

/* Escuta uma coleção do Firestore em tempo real, já ordenada.
   Ex.: const players = useCollection("players", "name"); */
export default function useCollection(nome, campoOrdem) {
  const [dados, setDados] = useState([]);

  useEffect(() => {
    const q = query(collection(db, nome), orderBy(campoOrdem, "asc"));
    return onSnapshot(q, (snapshot) => {
      setDados(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [nome, campoOrdem]);

  return dados;
}
