import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  onSnapshot,
  doc,
  deleteDoc,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";
import LogoIDR from "../../assets/IDR.png";
import "./matchalert.css";

const ADR_LOGO_DEFAULT = "/logo.png";

// Compressor automático de imagem via Canvas (< 35KB) para não estourar o Firebase
const compressBannerImage = (file, maxWidth = 480) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL("image/webp", 0.82));
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Cronômetro independente fora do componente principal
const Countdown = ({ targetDate, targetTime }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [statusClass, setStatusClass] = useState("");

  useEffect(() => {
    if (!targetDate || !targetTime) return;

    const updateTimer = () => {
      const target = new Date(`${targetDate}T${targetTime}:00`).getTime();
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        if (distance > -(2 * 60 * 60 * 1000)) {
          setTimeLeft("⚽ BOLA ROLANDO • EM ANDAMENTO");
          setStatusClass("is-live");
        } else {
          setTimeLeft("🛑 PARTIDA ENCERRADA");
          setStatusClass("is-ended");
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
        `FALTAM: ${format(d)}d : ${format(h)}h : ${format(m)}m : ${format(s)}s`,
      );
      setStatusClass("");
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [targetDate, targetTime]);

  if (!timeLeft) return null;

  return <div className={`banner-countdown ${statusClass}`}>{timeLeft}</div>;
};

const MatchBanner = ({ isAdmin }) => {
  const [banners, setBanners] = useState([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [bannerType, setBannerType] = useState("TREINO");
  const [isConverting, setIsConverting] = useState(false);
  const [savedVenues, setSavedVenues] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [isIdrTheme, setIsIdrTheme] = useState(false);

  const initialFormState = {
    title: "TREINO",
    teamA: { name: "O ADR", logo: ADR_LOGO_DEFAULT },
    teamB: { name: "", logo: "" },
    date: "",
    time: "",
    location: "",
    championshipPhase: "",
    // Campos para ARRECADACAO (Vaquinha / Camisas)
    goalTitle: "NOVO MANTO D'O ADR 2026",
    goalSubtitle: "Arrecadação oficial para a confecção dos novos uniformes",
    currentAmount: "",
    targetAmount: "",
    customPercent: "", // Caso queira digitar só a % direto (ex: 65)
    pixKey: "",
    // Campos para NOTICIA (Plantão / Comunicado)
    newsCategory: "DIRETORIA",
    newsHeadline: "",
    newsBody: "",
    newsImage: "",
    footerText: "O ADR • TREINO OFICIAL CONFIRMADO • CONFIRME SUA PRESENÇA •",
  };

  const [formData, setFormData] = useState(initialFormState);

  // Observa em tempo real se o Tema IDR (.theme-idr) está ativo
  useEffect(() => {
    const checkTheme = () => {
      const hasIdr =
        document.body.classList.contains("theme-idr") ||
        document.documentElement.classList.contains("theme-idr") ||
        Boolean(document.querySelector(".theme-idr"));
      setIsIdrTheme(hasIdr);
    };

    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      subtree: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Busca os locais salvos no Firebase
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

  // Atualiza automaticamente a sugestão de letreiro conforme o tipo de card
  useEffect(() => {
    const defaultFooters = {
      TREINO:
        "O ADR • TREINO OFICIAL CONFIRMADO • NÃO FALTE PARA NÃO PERDER POSIÇÃO NA TABELA •",
      AMISTOSO:
        "O ADR • CONFRONTO AMISTOSO CONFIRMADO • O SHOW VAI COMEÇAR • PREPARE A TORCIDA •",
      CAMPEONATO:
        "O ADR • DIA DE DECISÃO NO CAMPEONATO • FOCO TOTAL EM BUSCA DA TAÇA •",
      ARRECADACAO:
        "O ADR • CAMPANHA OFICIAL DOS NOVOS UNIFORMES • FAÇA SUA CONTRIBUIÇÃO VIA PIX •",
      NOTICIA:
        "PLANTÃO D'O ADR • COMUNICADO OFICIAL DA DIRETORIA • FIQUE POR DENTRO •",
    };

    setFormData((prev) => ({
      ...prev,
      footerText: defaultFooters[bannerType] || defaultFooters.TREINO,
    }));
  }, [bannerType]);

  // Escuta os banners ativos do Firestore
  useEffect(() => {
    const q = query(collection(db, "banners"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = new Date().getTime();
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      const filteredBanners = data.filter((b) => {
        // Vaquinhas e Notícias permanecem ativas até o Admin deletar
        if (b.type === "ARRECADACAO" || b.type === "NOTICIA") return true;
        if (!b.date || !b.time) return true;
        const matchTime = new Date(`${b.date}T${b.time}:00`).getTime();
        // Partidas expiram 12 horas após o horário marcado
        return now - matchTime < 12 * 60 * 60 * 1000;
      });

      setBanners(filteredBanners);
    });
    return () => unsubscribe();
  }, []);

  // Upload com compressão automática para Logo Adversário ou Foto da Notícia
  const handleFile = async (e, target) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsConverting(true);
      const maxDim = target === "NEWS" ? 720 : 200;
      const compressedBase64 = await compressBannerImage(file, maxDim);

      if (target === "B") {
        setFormData((prev) => ({
          ...prev,
          teamB: { ...prev.teamB, logo: compressedBase64 },
        }));
      } else if (target === "NEWS") {
        setFormData((prev) => ({
          ...prev,
          newsImage: compressedBase64,
        }));
      }
    } catch (err) {
      console.error("Erro ao processar imagem:", err);
      alert("Erro ao processar imagem.");
    } finally {
      setIsConverting(false);
    }
  };

  const addBanner = async () => {
    if (isConverting) {
      return alert("Aguarde o processamento da imagem...");
    }

    if (bannerType === "NOTICIA" && !formData.newsHeadline.trim()) {
      return alert("Digite a manchete da notícia!");
    }

    if (bannerType === "ARRECADACAO" && !formData.goalTitle.trim()) {
      return alert("Digite o título da arrecadação (ex: Novas Camisas)!");
    }

    try {
      await addDoc(collection(db, "banners"), {
        ...formData,
        type: bannerType,
        title: bannerType,
        createdAt: new Date(),
      });

      setFormData(initialFormState);
      setShowAdmin(false);
    } catch (err) {
      console.error("Erro ao salvar banner:", err);
      alert("Erro ao publicar no site.");
    }
  };

  const deleteBanner = async (id) => {
    if (!window.confirm("Deseja remover este aviso do site?")) return;
    try {
      await deleteDoc(doc(db, "banners", id));
    } catch (err) {
      console.error("Erro ao deletar:", err);
    }
  };

  // Permite ao Admin atualizar o valor ou a % da vaquinha direto pelo card sem recriar!
  const handleQuickUpdateFundraiser = async (banner) => {
    const novoAtual = prompt(
      "Digite o NOVO VALOR ARRECADADO em R$ (ou deixe vazio se usar apenas %):",
      banner.currentAmount ?? "",
    );
    if (novoAtual === null) return;

    const novaMeta = prompt(
      "Digite a META TOTAL em R$ (ou deixe igual):",
      banner.targetAmount ?? "",
    );
    if (novaMeta === null) return;

    const novaPorcentagem = prompt(
      "Porcentagem manual (0 a 100) — Deixe em branco para calcular automaticamente pelos valores R$:",
      banner.customPercent ?? "",
    );
    if (novaPorcentagem === null) return;

    try {
      await updateDoc(doc(db, "banners", banner.id), {
        currentAmount: novoAtual,
        targetAmount: novaMeta,
        customPercent: novaPorcentagem,
      });
    } catch (err) {
      console.error("Erro ao atualizar arrecadação:", err);
      alert("Não foi possível atualizar.");
    }
  };

  const handleCopyPix = (pixKey, id) => {
    if (!pixKey) return;
    navigator.clipboard.writeText(pixKey);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const isMatchType =
    bannerType === "TREINO" ||
    bannerType === "AMISTOSO" ||
    bannerType === "CAMPEONATO";

  return (
    <div className="banners-wrapper">
      {isAdmin && (
        <button
          type="button"
          className="admin-toggle-btn"
          onClick={() => setShowAdmin(!showAdmin)}
        >
          {showAdmin
            ? "✕ FECHAR CENTRAL DE AVISOS"
            : "📢 CRIAR BANNER / NOTÍCIA / VAQUINHA"}
        </button>
      )}

      {/* ==================== PAINEL DO ADMINISTRADOR ==================== */}
      {showAdmin && (
        <div className="admin-internal-panel">
          <div className="admin-type-selector-bar">
            {[
              { id: "TREINO", label: "⚽ Treino" },
              { id: "AMISTOSO", label: "🤝 Amistoso" },
              { id: "CAMPEONATO", label: "🏆 Campeonato" },
              { id: "ARRECADACAO", label: "💰 Vaquinha / Camisas" },
              { id: "NOTICIA", label: "📰 Notícia / Aviso" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`admin-type-pill ${
                  bannerType === tab.id ? "active" : ""
                }`}
                onClick={() => setBannerType(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="admin-grid">
            {/* --- FORMULÁRIO DE JOGOS (TREINO, AMISTOSO, CAMPEONATO) --- */}
            {isMatchType && (
              <>
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

                <select
                  className={bannerType === "CAMPEONATO" ? "" : "full-width"}
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
                    📍 Selecione o local da partida...
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

                {bannerType === "CAMPEONATO" && (
                  <input
                    type="text"
                    placeholder="Fase (Ex: Fase de Grupos, Semifinal, Final)"
                    value={formData.championshipPhase}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        championshipPhase: e.target.value,
                      })
                    }
                  />
                )}

                {(bannerType === "AMISTOSO" || bannerType === "CAMPEONATO") && (
                  <div className="upload-group full-width">
                    <div className="upload-col">
                      <label>
                        {isConverting
                          ? "Comprimindo escudo..."
                          : "🛡️ Escudo Adversário"}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFile(e, "B")}
                      />
                    </div>
                    <div className="upload-col">
                      <label>🏷️ Nome do Adversário</label>
                      <input
                        type="text"
                        placeholder="Ex: Rato de Campo FC"
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
              </>
            )}

            {/* --- FORMULÁRIO DE ARRECADAÇÃO / VAQUINHA DAS CAMISAS --- */}
            {bannerType === "ARRECADACAO" && (
              <>
                <input
                  type="text"
                  placeholder="Título (Ex: NOVAS CAMISAS D'O ADR 2026)"
                  value={formData.goalTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, goalTitle: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Subtítulo (Ex: Prazo até dia 15 • R$ 65 por atleta)"
                  value={formData.goalSubtitle}
                  onChange={(e) =>
                    setFormData({ ...formData, goalSubtitle: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Valor Já Arrecadado R$ (Ex: 450)"
                  value={formData.currentAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, currentAmount: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Meta Total R$ (Ex: 1200)"
                  value={formData.targetAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, targetAmount: e.target.value })
                  }
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="% Manual Opcional (Ex: 75 — se não quiser usar R$)"
                  value={formData.customPercent}
                  onChange={(e) =>
                    setFormData({ ...formData, customPercent: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Chave PIX (Para botão Copiar PIX no card)"
                  value={formData.pixKey}
                  onChange={(e) =>
                    setFormData({ ...formData, pixKey: e.target.value })
                  }
                />
              </>
            )}

            {/* --- FORMULÁRIO DE NOTÍCIA / COMUNICADO OFICIAL --- */}
            {bannerType === "NOTICIA" && (
              <>
                <select
                  value={formData.newsCategory}
                  onChange={(e) =>
                    setFormData({ ...formData, newsCategory: e.target.value })
                  }
                >
                  <option value="DIRETORIA">📋 COMUNICADO DA DIRETORIA</option>
                  <option value="URGENTE">🚨 PLANTÃO URGENTE</option>
                  <option value="UNIFORMES">👕 NOVOS UNIFORMES</option>
                  <option value="RESENHA">🔥 DESTAQUE DA RODADA</option>
                  <option value="MERCADO">🤝 MERCADO DA BOLA</option>
                </select>

                <input
                  type="text"
                  placeholder="Manchete Principal da Notícia..."
                  value={formData.newsHeadline}
                  onChange={(e) =>
                    setFormData({ ...formData, newsHeadline: e.target.value })
                  }
                />

                <textarea
                  className="full-width admin-textarea"
                  rows={3}
                  placeholder="Escreva o texto completo da notícia, aviso ou regulamento..."
                  value={formData.newsBody}
                  onChange={(e) =>
                    setFormData({ ...formData, newsBody: e.target.value })
                  }
                />

                <div className="upload-group full-width">
                  <div className="upload-col">
                    <label>
                      {isConverting
                        ? "Comprimindo foto..."
                        : "📸 Foto da Notícia (Opcional)"}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFile(e, "NEWS")}
                    />
                  </div>
                </div>
              </>
            )}

            {/* LETREIRO INFERIOR COMUM A TODOS */}
            <input
              type="text"
              className="full-width"
              placeholder="Texto do Letreiro Animado (Rodapé)"
              value={formData.footerText}
              onChange={(e) =>
                setFormData({ ...formData, footerText: e.target.value })
              }
            />

            <button
              type="button"
              className="confirm-btn"
              onClick={addBanner}
              disabled={isConverting}
            >
              {isConverting ? "PROCESSANDO IMAGEM..." : "PUBLICAR NO SITE"}
            </button>
          </div>
        </div>
      )}

      {/* ==================== RENDERIZAÇÃO DOS CARDS ATIVOS ==================== */}
      {banners.map((item) => {
        const typeKey = (item.type || "TREINO").toUpperCase();
        const typeClass = typeKey.toLowerCase();
        const clubLogo = isIdrTheme ? LogoIDR : ADR_LOGO_DEFAULT;
        const clubName = isIdrTheme ? "IDR" : item.teamA?.name || "O ADR";

        // Cálculo da porcentagem da Vaquinha
        const curVal = Number(item.currentAmount || 0);
        const tarVal = Number(item.targetAmount || 0);
        const rawPercent =
          item.customPercent !== undefined && item.customPercent !== ""
            ? Number(item.customPercent)
            : tarVal > 0
              ? Math.round((curVal / tarVal) * 100)
              : 0;
        const clampedPercent = Math.min(100, Math.max(0, rawPercent));

        const badgeLabels = {
          TREINO: "TREINO OFICIAL",
          AMISTOSO: "AMISTOSO OFICIAL",
          CAMPEONATO: item.championshipPhase
            ? `CAMPEONATO • ${item.championshipPhase}`
            : "CAMPEONATO",
          ARRECADACAO: "💰 META & ARRECADAÇÃO",
          NOTICIA: `📰 ${item.newsCategory || "COMUNICADO"}`,
        };

        return (
          <div
            key={item.id}
            className={`match-banner-container type-${typeClass}`}
          >
            <div className="banner-badge">
              {badgeLabels[typeKey] || item.title}
            </div>

            {/* -------------------- 1. CARD DE VAQUINHA / CAMISAS -------------------- */}
            {typeKey === "ARRECADACAO" ? (
              <div className="banner-fundraiser-content">
                <div className="fundraiser-header">
                  <div className="fundraiser-title-block">
                    <span className="fundraiser-kicker">
                      CAMPANHA OFICIAL DO CLUBE
                    </span>
                    <h2 className="fundraiser-title">{item.goalTitle}</h2>
                    {item.goalSubtitle && (
                      <p className="fundraiser-subtitle">{item.goalSubtitle}</p>
                    )}
                  </div>

                  <div className="fundraiser-percent-circle">
                    <span className="percent-big">{rawPercent}%</span>
                    <span className="percent-sub">ATINGIDO</span>
                  </div>
                </div>

                {/* Barra de Progresso Animada com Shimmer */}
                <div className="fundraiser-progress-track">
                  <div
                    className="fundraiser-progress-fill"
                    style={{ width: `${clampedPercent}%` }}
                  />
                </div>

                <div className="fundraiser-bottom-row">
                  <div className="fundraiser-amounts">
                    {(curVal > 0 || tarVal > 0) && (
                      <>
                        <span className="amount-raised">
                          Arrecadado:{" "}
                          <strong>
                            R${" "}
                            {curVal.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </strong>
                        </span>
                        {tarVal > 0 && (
                          <span className="amount-target">
                            Meta: R${" "}
                            {tarVal.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <div className="fundraiser-actions">
                    {item.pixKey && (
                      <button
                        type="button"
                        className="pix-copy-btn"
                        onClick={() => handleCopyPix(item.pixKey, item.id)}
                      >
                        {copiedId === item.id
                          ? "✅ CHAVE PIX COPIADA!"
                          : `💠 COPIAR PIX: ${item.pixKey}`}
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        type="button"
                        className="admin-quick-edit-btn"
                        onClick={() => handleQuickUpdateFundraiser(item)}
                      >
                        ✏️ Atualizar Valor / %
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : typeKey === "NOTICIA" ? (
              /* -------------------- 2. CARD DE NOTÍCIA / COMUNICADO -------------------- */
              <div
                className={`banner-news-content ${
                  item.newsImage ? "has-image" : "no-image"
                }`}
              >
                {item.newsImage && (
                  <div className="news-image-box">
                    <img src={item.newsImage} alt={item.newsHeadline} />
                  </div>
                )}

                <div className="news-text-box">
                  <div className="news-meta-row">
                    <span className="news-tag-pill">
                      {item.newsCategory || "OFICIAL"}
                    </span>
                  </div>
                  <h2 className="news-headline">{item.newsHeadline}</h2>
                  {item.newsBody && (
                    <p className="news-body-text">{item.newsBody}</p>
                  )}
                </div>
              </div>
            ) : typeKey === "AMISTOSO" || typeKey === "CAMPEONATO" ? (
              /* -------------------- 3. CARD DE AMISTOSO OU CAMPEONATO -------------------- */
              <div className="banner-content">
                <div className="banner-team">
                  <img
                    src={
                      item.teamA?.logo && item.teamA.logo !== ADR_LOGO_DEFAULT
                        ? item.teamA.logo
                        : clubLogo
                    }
                    className="banner-logo"
                    alt="Logo A"
                  />
                  <span className="banner-team-name">{clubName}</span>
                </div>

                <div className="banner-info">
                  <div className="banner-datetime">
                    <span>{item.date?.split("-").reverse().join("/")}</span>
                    <span className="b-divider">•</span>
                    <span>{item.time}</span>
                  </div>
                  <Countdown targetDate={item.date} targetTime={item.time} />
                  {item.location && (
                    <div className="banner-location">📍 {item.location}</div>
                  )}
                </div>

                <div className="banner-team">
                  <img
                    src={item.teamB?.logo || clubLogo}
                    className="banner-logo"
                    alt="Logo B"
                  />
                  <span className="banner-team-name">
                    {item.teamB?.name || "ADVERSÁRIO"}
                  </span>
                </div>
              </div>
            ) : (
              /* -------------------- 4. CARD DE TREINO OFICIAL -------------------- */
              <div className="banner-content">
                <div className="banner-treino-full">
                  <img
                    src={clubLogo}
                    className="banner-logo-center"
                    alt={clubName}
                  />
                  <div className="banner-info">
                    <div className="banner-datetime">
                      <span>{item.date?.split("-").reverse().join("/")}</span>
                      {item.time && (
                        <>
                          <span className="b-divider">•</span>
                          <span>{item.time}</span>
                        </>
                      )}
                    </div>
                    {item.location && (
                      <div className="banner-location">📍 {item.location}</div>
                    )}
                    <Countdown targetDate={item.date} targetTime={item.time} />
                  </div>
                </div>
              </div>
            )}

            {/* RODAPÉ COM LETREIRO ANIMADO */}
            <div className="banner-footer">
              <div className="scrolling-text">{item.footerText}</div>
            </div>

            {isAdmin && (
              <button
                type="button"
                className="del-btn"
                onClick={() => deleteBanner(item.id)}
                title="Excluir este banner"
              >
                ✕
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MatchBanner;
