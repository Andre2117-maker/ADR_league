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
} from "firebase/firestore";
import "./matchbanner.css";

const ADR_LOGO_DEFAULT = "/logo.png";

const MatchBanner = ({ isAdmin }) => {
  const [banners, setBanners] = useState([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [bannerType, setBannerType] = useState("AMISTOSO");
  const [isConverting, setIsConverting] = useState(false); // Feedback visual para o admin

  const [formData, setFormData] = useState({
    title: "AMISTOSO",
    teamA: { name: "ADR", logo: ADR_LOGO_DEFAULT },
    teamB: { name: "", logo: "" }, // Aqui vai ficar a imagem salva como texto Base64
    date: "",
    time: "",
    location: "",
    footerText: "ADR LEAGUE • O SHOW VAI COMEÇAR • PREPARE SUA TORCIDA •",
  });

  // Alterna a mensagem padrão baseada no tipo
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
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setBanners(data);
    });
    return () => unsubscribe();
  }, []);

  // CORREÇÃO: Converte o arquivo para Base64 (Texto permanente)
  const handleFile = (e, target) => {
    const file = e.target.files[0];
    if (file) {
      // Se a imagem for muito grande, o Firestore pode recusar. Limitamos o tamanho ideal.
      if (file.size > 1024 * 1024) {
        alert("A imagem é muito pesada! Escolha uma imagem de até 1MB.");
        return;
      }

      setIsConverting(true);
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64String = reader.result; // Esse é o texto que representa a imagem
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

      reader.readAsDataURL(file); // Inicia a conversão
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

      // Reseta o formulário
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

  const Countdown = ({ targetDate, targetTime }) => {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
      const timer = setInterval(() => {
        const target = new Date(`${targetDate}T${targetTime}:00`).getTime();
        const now = new Date().getTime();
        const distance = target - now;

        if (distance < 0) {
          setTimeLeft("EM ANDAMENTO");
          return;
        }

        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);

        const format = (num) => String(num).padStart(2, "0");
        setTimeLeft(`${format(d)}d ${format(h)}h ${format(m)}m ${format(s)}s`);
      }, 1000);
      return () => clearInterval(timer);
    }, [targetDate, targetTime]);

    return <div className="banner-countdown">{timeLeft}</div>;
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
            <input
              type="text"
              placeholder="Local"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
            />

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
