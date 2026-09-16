import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase"; // Ajuste o caminho do seu firebase
import "./LocalTreinos.css";

// ⚠️ CORREÇÃO AQUI: Use { isAdmin } com chaves para desestruturar a prop!
export default function LocalTreinos({ isAdmin }) {
  const [locais, setLocais] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para edição (Admin)
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Busca os locais no Firebase
  const fetchLocais = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "locais"));
      const locaisData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setLocais(locaisData);
      if (locaisData.length > 0 && !activeTab) {
        setActiveTab(locaisData[0].id);
      }
    } catch (error) {
      console.error("Erro ao buscar locais:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocais();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Quando trocar de aba, cancela a edição
  useEffect(() => {
    setIsEditing(false);
  }, [activeTab]);

  // Ativar modo de edição
  const handleEditClick = (local) => {
    setEditForm({ ...local });
    setIsEditing(true);
  };

  // Salvar alterações no Firebase
  const handleSaveClick = async () => {
    try {
      const docRef = doc(db, "locais", editForm.id);
      await updateDoc(docRef, editForm);
      alert("Local atualizado com sucesso!");
      setIsEditing(false);
      fetchLocais(); // Recarrega os dados novos
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      alert("Erro ao salvar as alterações.");
    }
  };

  const handleInputChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="local-loading-screen">
        <div className="spinner"></div>
        <p>Carregando Arenas...</p>
      </div>
    );
  }

  if (locais.length === 0) {
    return (
      <div className="local-loading-screen">
        <p>Nenhuma arena cadastrada no momento.</p>
      </div>
    );
  }

  const localAtivo = locais.find((l) => l.id === activeTab);

  return (
    <div className="local-psg-wrapper">
      {/* TABS (ABAS) - Ficam no topo para trocar os locais */}
      <div className="local-tabs-container">
        {locais.map((local) => (
          <button
            key={local.id}
            className={`local-tab-btn ${activeTab === local.id ? "active" : ""}`}
            onClick={() => setActiveTab(local.id)}
          >
            {local.nome || local.name}
          </button>
        ))}
      </div>

      {localAtivo && (
        <div className="local-active-content">
          {/* BARRA DE ADMINISTRAÇÃO INLINE */}
          {isAdmin && !isEditing && (
            <div className="admin-edit-bar">
              <button
                className="btn-admin-edit"
                onClick={() => handleEditClick(localAtivo)}
              >
                ✏️ Editar Página Atual
              </button>
            </div>
          )}

          {/* MODO EDIÇÃO ATIVADO */}
          {isAdmin && isEditing ? (
            <div className="admin-edit-panel">
              <h3>Modo de Edição - {localAtivo.nome}</h3>
              <div className="admin-form-grid">
                <input
                  name="nome"
                  placeholder="Nome do Local (Aba/Banner)"
                  value={editForm.nome || editForm.name || ""}
                  onChange={handleInputChange}
                />
                <input
                  name="imagemBanner"
                  placeholder="URL Imagem do Banner (Ex: /images/banner.jpg)"
                  value={editForm.imagemBanner || ""}
                  onChange={handleInputChange}
                />
                <textarea
                  name="descricao"
                  placeholder="Texto de Introdução..."
                  value={editForm.descricao || ""}
                  onChange={handleInputChange}
                  rows="3"
                />

                <h4
                  style={{
                    gridColumn: "1 / -1",
                    color: "#d4af37",
                    marginTop: "10px",
                  }}
                >
                  Seção: Apresentação (Zigue-Zague)
                </h4>
                <input
                  name="apresentacaoTitulo"
                  placeholder="Título da Apresentação"
                  value={editForm.apresentacaoTitulo || ""}
                  onChange={handleInputChange}
                />
                <input
                  name="apresentacaoImg"
                  placeholder="URL Imagem Lateral"
                  value={editForm.apresentacaoImg || ""}
                  onChange={handleInputChange}
                />
                <textarea
                  name="apresentacaoTexto"
                  placeholder="Texto da Apresentação..."
                  value={editForm.apresentacaoTexto || ""}
                  onChange={handleInputChange}
                  rows="4"
                  style={{ gridColumn: "1 / -1" }}
                />
              </div>
              <div className="admin-form-actions">
                <button
                  className="btn-cancel"
                  onClick={() => setIsEditing(false)}
                >
                  Cancelar
                </button>
                <button className="btn-save" onClick={handleSaveClick}>
                  Salvar Alterações
                </button>
              </div>
            </div>
          ) : (
            /* =======================================================
               VISUAL NORMAL (PÚBLICO) - ESTILO PSG
               ======================================================= */
            <>
              {/* BANNER DO LOCAL ATUAL */}
              <section
                className="local-hero"
                style={{
                  backgroundImage: `url(${localAtivo.imagemBanner || localAtivo.imagem || "/images/default-banner.jpg"})`,
                }}
              >
                <div className="local-hero-overlay"></div>
                <h1 className="local-hero-text">
                  {localAtivo.nome || localAtivo.name}
                </h1>
              </section>

              {/* INTRODUÇÃO */}
              <section className="local-intro">
                <p className="local-intro-desc">
                  {localAtivo.descricao || "Descrição inicial do estádio..."}
                </p>
              </section>

              {/* SEÇÃO APRESENTAÇÃO (ZIGUE-ZAGUE) */}
              <section className="local-zigzag-container">
                <div className="zigzag-row">
                  <div className="zigzag-text-box">
                    <h3 className="zigzag-title">
                      {localAtivo.apresentacaoTitulo || "APRESENTAÇÃO"}
                    </h3>
                    <p className="zigzag-desc">
                      {localAtivo.apresentacaoTexto ||
                        "Texto detalhado sobre a arena..."}
                    </p>
                    <button className="btn-saiba-mais">SAIBA MAIS &gt;</button>
                  </div>
                  <div className="zigzag-img-box">
                    <img
                      src={
                        localAtivo.apresentacaoImg ||
                        localAtivo.imagem ||
                        "/images/default-arena.jpg"
                      }
                      alt="Apresentação do Local"
                      className="zigzag-img"
                    />
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      )}
    </div>
  );
}
