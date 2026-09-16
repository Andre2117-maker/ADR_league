import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import "./Elenco.css";
import Footer from "../../components/Footer";

export default function Elenco() {
  const [players, setPlayers] = useState([]);
  const [genderTab, setGenderTab] = useState("Masculino");
  const [seasonTab, setSeasonTab] = useState("2026");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");

    if (tabParam === "feminino") {
      setGenderTab("Feminino");
    } else if (tabParam === "masculino") {
      setGenderTab("Masculino");
    }
  }, [location.search]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playersSnapshot, memorialSnapshot] = await Promise.all([
          getDocs(collection(db, "players")),
          getDocs(collection(db, "memorial")),
        ]);

        const memorialData = memorialSnapshot.docs.map((doc) => doc.data());

        const playersData = playersSnapshot.docs.map((doc) => {
          const pData = doc.data();
          const memInfo = memorialData.find((m) => m.playerId === doc.id) || {};

          return {
            id: doc.id,
            ...pData,
            entrada: memInfo.entrada || "2023",
            saida: memInfo.saida || "",
          };
        });

        const sortedPlayers = playersData.sort((a, b) =>
          a.name.localeCompare(b.name, "pt-BR"),
        );

        setPlayers(sortedPlayers);
      } catch (error) {
        console.error("Erro ao buscar elenco:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="elenco-loading-screen">
        <div className="spinner"></div>
        <p>Carregando Elenco...</p>
      </div>
    );
  }

  const finalList = players.filter((p) => {
    if (p.isAnonymous) return false;

    const isRightGender =
      genderTab === "Masculino"
        ? p.gender === "Male" || !p.gender
        : p.gender === "Female";
    if (!isRightGender) return false;

    const activeSeason = parseInt(seasonTab);
    const entryYear = parseInt(p.entrada) || 2023;
    const exitYear = parseInt(p.saida) || 9999;

    return activeSeason >= entryYear && activeSeason <= exitYear;
  });

  return (
    <div className="elenco-psg-wrapper">
      <div className="elenco-main-content">
        <div className="elenco-content-limit">
          <header className="elenco-page-header">
            <h1 className="elenco-page-title">ELENCO</h1>

            <div className="elenco-selectors-group">
              <div className="elenco-dropdown">
                <select
                  value={seasonTab}
                  onChange={(e) => setSeasonTab(e.target.value)}
                >
                  <option value="2027">Temporada 2027</option>
                  <option value="2026">Temporada 2026</option>
                  <option value="2025">Temporada 2025</option>
                  <option value="2024">Temporada 2024</option>
                  <option value="2023">Temporada 2023</option>
                </select>
              </div>

              <div className="elenco-dropdown">
                <select
                  value={genderTab}
                  onChange={(e) => setGenderTab(e.target.value)}
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                </select>
              </div>
            </div>
          </header>

          <section className="elenco-grid-psg">
            {finalList.length === 0 ? (
              <p className="elenco-empty-msg">
                Nenhum atleta encontrado nesta temporada.
              </p>
            ) : (
              finalList.map((p) => {
                const nameParts = p.name.trim().split(" ");
                const firstName = nameParts.length > 1 ? nameParts[0] : "";
                const lastName =
                  nameParts.length > 1
                    ? nameParts.slice(1).join(" ")
                    : nameParts[0];

                let periodoDisplay = p.clubRole || "Atleta";
                if (p.entrada) {
                  periodoDisplay = p.saida
                    ? `${p.entrada} - ${p.saida}`
                    : `${p.entrada} - PRESENTE`;
                }

                return (
                  <div
                    className="psg-card"
                    key={p.id}
                    onClick={() => navigate(`/player/${p.id}`)}
                  >
                    <div className="psg-card-bg"></div>

                    <img
                      src={p.photo || "/players/Anonimo.png"}
                      alt={p.name}
                      className="psg-player-img"
                    />

                    <div className="psg-card-footer">
                      <div className="psg-number">{p.number || "-"}</div>

                      <div className="psg-name-block">
                        <span className="psg-firstname">{firstName}</span>
                        <span className="psg-lastname">{lastName}</span>
                      </div>
                    </div>

                    <div className="psg-badges-area">
                      {p.titlesADR > 0 && (
                        <span className="badge-title">🏆 {p.titlesADR}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
