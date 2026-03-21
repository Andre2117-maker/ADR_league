import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Importe o navigate
import "../styles/admin.css";

function AdminLogin({ setIsAdmin }) {
  // Removido setPage
  const [senha, setSenha] = useState("");
  const navigate = useNavigate(); // Inicializa o hook

  const login = () => {
    if (senha === "s3r3n4") {
      setIsAdmin(true);
      // Redireciona para o painel. O "replace: true" substitui a tela de login
      // no histórico para o usuário não voltar nela sem querer.
      navigate("/admin-panel", { replace: true });
    } else {
      alert("Senha incorreta!");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") login();
  };

  return (
    <div className="adm-login-page">
      <div className="adm-login-card">
        <div className="adm-login-icon">🔐</div>
        <h1 className="adm-login-title">Área Restrita</h1>
        <p className="adm-login-subtitle">
          Insira a chave de acesso para gerenciar a liga.
        </p>

        <input
          className="adm-login-input"
          type="password"
          placeholder="Senha de acesso"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />

        <button className="adm-login-btn-primary" onClick={login}>
          Acessar Painel
        </button>

        <button className="adm-login-btn-back" onClick={() => navigate("/")}>
          Voltar para a Tabela
        </button>
      </div>
    </div>
  );
}

export default AdminLogin;
