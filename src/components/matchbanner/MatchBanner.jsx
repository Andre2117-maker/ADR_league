import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  query,
  orderBy,
  getDocs, // <-- Adicionado para buscar os locais
} from "firebase/firestore";
import "./matchbanner.css";

const ADR_LOGO_DEFAULT = "/logo.png";

// ⚙️ MELHORIA 4: O cronômetro agora fica FORA do componente principal para não travar a memória
const Countdown = ({ targetDate, targetTime }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!targetDate || !targetTime) return;

    const timer = setInterval(() => {
      const target = new Date(`${targetDate}T${targetTime}:00`).getTime();
      const now = new Date().getTime();
      const distance = target - now;

      // 🕒 MELHORIA 2: Lógica de status da partida
      if (distance < 0) {
        // Se passou menos de 2 horas do horário, mostra EM ANDAMENTO
        if (distance > -(2 * 60 * 60 * 1000)) {
          setTimeLeft("⚽ EM ANDAMENTO");
        } else {
          setTimeLeft("🛑 ENCERRADO");
        }
        return;
      }

      const d = Math.floor(distance / (1000 * 60 * 60 * 24));
      const h = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);

      const format = (num) => String(num).padStart(2, "0");
      setTimeLeft(
        `FALTAM: ${format(d)}d ${format(h)}h ${format(m)}m ${format(s)}s`,
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate, targetTime]);

  return (
    <div
      className="banner-countdown"
      style={{ margin: "8px 0", color: "#d4af37", fontWeight: "bold" }}
    >
      {timeLeft}
    </div>
  );
};

const MatchBanner = ({ isAdmin }) => {
  const [banners, setBanners] = useState([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [bannerType, setBannerType] = useState("AMISTOSO");
  const [isConverting, setIsConverting] = useState(false);

  // 📍 MELHORIA 5: Estado para guardar os locais do banco
  const [savedVenues, setSavedVenues] = useState([]);

  const [formData, setFormData] = useState({
    title: "AMISTOSO",
    teamA: { name: "ADR", logo: ADR_LOGO_DEFAULT },
    teamB: { name: "", logo: "" },
    date: "",
    time: "",
    location: "",
    footerText: "ADR LEAGUE • O SHOW VAI COMEÇAR • PREPARE SUA TORCIDA •",
  });

  // Busca os locais salvos ao abrir o painel
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const snap = await getDocs(collection(db, "locais"));
        const venuesList = snap.docs.map((doc) => doc.data().name);
        setSavedVenues(venuesList);
      } catch (err) {
        console.error("Erro ao carregar locais:", err);
      }
    };
    fetchVenues();
  }, []);

  useEffect(() => {
    if (bannerType === "TREINO") {
      setFormData((prev) => ({
        ...prev,
        footerText:
          "ADR LEAGUE • TREINO OFICIAL CONFIRMADO • PISCINA • COMPAREÇA •",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        footerText:
          "ADR LEAGUE • O SHOW VAI COMEÇAR • PREPARE SUA TORCIDA • AMISTOSO CONFIRMADO •",
      }));
    }
  }, [bannerType]);

  useEffect(() => {
    const q = query(collection(db, "banners"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date().getTime();
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // 🕒 MELHORIA 2: Ocultar banners de jogos velhos
      const filteredBanners = data.filter((b) => {
        if (!b.date || !b.time) return true;
        const matchTime = new Date(`${b.date}T${b.time}:00`).getTime();
        // Permite exibir se a partida for no futuro ou se aconteceu há menos de 12 horas
        return now - matchTime < 12 * 60 * 60 * 1000;
      });

      setBanners(filteredBanners);
    });
    return () => unsubscribe();
  }, []);

  const handleFile = (e, target) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("A imagem é muito pesada! Escolha uma imagem de até 1MB.");
        return;
      }
      setIsConverting(true);
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64String = reader.result;
        if (target === "B") {
          setFormData((prev) => ({
            ...prev,
            teamB: {
              ...prev.teamB,
              logo: base64String,
            },
          }));
        }
        setIsConverting(false);
      };

      reader.readAsDataURL(file);
    }
  };

  const addBanner = async () => {
    if (isConverting) {
      alert("Aguarde o processamento da imagem...");
      return;
    }

    try {
      await addDoc(collection(db, "banners"), {
        ...formData,
        type: bannerType,
        title: bannerType,
        createdAt: new Date(),
      });

      setFormData({
        title: "AMISTOSO",
        teamA: { name: "ADR", logo: ADR_LOGO_DEFAULT },
        teamB: { name: "", logo: "" },
        date: "",
        time: "",
        location: "",
        footerText: "ADR LEAGUE • O SHOW VAI COMEÇAR • PREPARE SUA TORCIDA •",
      });
      setShowAdmin(false);
    } catch (err) {
      console.error("Erro ao salvar banner:", err);
    }
  };

  const deleteBanner = async (id) => {
    try {
      await deleteDoc(doc(db, "banners", id));
    } catch (err) {
      console.error("Erro ao deletar:", err);
    }
  };

  return (
    <div className="banners-wrapper">
      {isAdmin && (
        <button
          className="admin-toggle-btn"
          onClick={() => setShowAdmin(!showAdmin)}
        >
          {showAdmin ? "FECHAR EDITOR" : "⚙️ CONFIGURAR NOVO BANNER"}
        </button>
      )}

      {showAdmin && (
        <div className="admin-internal-panel">
          <div className="admin-grid">
            <select
              className="full-width"
              value={bannerType}
              onChange={(e) => setBannerType(e.target.value)}
            >
              <option value="AMISTOSO">AMISTOSO</option>
              <option value="TREINO">TREINO</option>
            </select>

            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
            <input
              type="time"
              value={formData.time}
              onChange={(e) =>
                setFormData({ ...formData, time: e.target.value })
              }
            />

            {/* 📍 MELHORIA 5: Select integrado com Firebase no Banner */}
            <select
              value={formData.location}
              onChange={async (e) => {
                if (e.target.value === "ADD_NEW") {
                  const newVenue = prompt("Digite o nome do novo local:");
                  if (newVenue && newVenue.trim() !== "") {
                    const formattedVenue = newVenue.trim();
                    if (!savedVenues.includes(formattedVenue)) {
                      setSavedVenues((prev) => [...prev, formattedVenue]);
                      try {
                        await addDoc(collection(db, "locais"), {
                          name: formattedVenue,
                        });
                      } catch (err) {
                        console.error("Erro ao salvar local:", err);
                      }
                    }
                    setFormData({ ...formData, location: formattedVenue });
                  }
                } else {
                  setFormData({ ...formData, location: e.target.value });
                }
              }}
            >
              <option value="" disabled>
                Selecione o local...
              </option>
              {savedVenues.map((venue, idx) => (
                <option key={idx} value={venue}>
                  {venue}
                </option>
              ))}
              <option
                value="ADD_NEW"
                style={{ fontWeight: "bold", color: "#d4af37" }}
              >
                + Adicionar novo local...
              </option>
            </select>

            {bannerType === "AMISTOSO" && (
              <div
                className="upload-group full-width"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: "10px",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1 }}>
                  <label>
                    {isConverting ? "Carregando foto..." : "Logo Adversário"}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFile(e, "B")}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Nome Adversário</label>
                  <input
                    type="text"
                    placeholder="Ex: Rato de Campo"
                    value={formData.teamB.name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        teamB: { ...prev.teamB, name: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            )}

            <input
              type="text"
              className="full-width"
              placeholder="Letreiro Personalizado"
              value={formData.footerText}
              onChange={(e) =>
                setFormData({ ...formData, footerText: e.target.value })
              }
            />
            <button className="confirm-btn" onClick={addBanner}>
              {isConverting ? "PROCESSANDO IMAGEM..." : "PUBLICAR NO SITE"}
            </button>
          </div>
        </div>
      )}

      {banners.map((match) => (
        <div
          key={match.id}
          className={`match-banner-container ${match.type?.toLowerCase()}`}
        >
          <div className="banner-badge">{match.title}</div>
          <div className="banner-content">
            {match.type === "AMISTOSO" ? (
              <>
                <div className="banner-team">
                  <img
                    src={match.teamA.logo}
                    className="banner-logo"
                    alt="logo"
                  />
                  <span className="banner-team-name">{match.teamA.name}</span>
                </div>
                <div className="banner-info">
                  <div className="banner-datetime">
                    <span>{match.date?.split("-").reverse().join("/")}</span>
                    <span className="b-divider">|</span>
                    <span>{match.time}</span>
                  </div>
                  {/* ⏱️ MELHORIA 3: Cronômetro aparecendo no Amistoso também */}
                  <Countdown targetDate={match.date} targetTime={match.time} />
                  <div className="banner-location">📍 {match.location}</div>
                </div>
                <div className="banner-team">
                  <img
                    src={match.teamB?.logo || ADR_LOGO_DEFAULT}
                    className="banner-logo"
                    alt="logo"
                  />
                  <span className="banner-team-name">
                    {match.teamB?.name || "ADVERSÁRIO"}
                  </span>
                </div>
              </>
            ) : (
              <div className="banner-treino-full">
                <img
                  src={ADR_LOGO_DEFAULT}
                  className="banner-logo-center"
                  alt="ADR"
                />
                <div className="banner-info">
                  <div className="banner-datetime">
                    {match.date?.split("-").reverse().join("/")} - {match.time}
                  </div>
                  <div className="banner-location">📍 {match.location}</div>
                  <Countdown targetDate={match.date} targetTime={match.time} />
                </div>
              </div>
            )}
          </div>
          <div className="banner-footer">
            <div className="scrolling-text">{match.footerText}</div>
          </div>
          {isAdmin && (
            <button className="del-btn" onClick={() => deleteBanner(match.id)}>
              X
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default MatchBanner;
