import { useState } from "react";
import "../styles/admin.css";

function AdminLogin({ setPage, setIsAdmin }) {
  const [senha, setSenha] = useState("");

  const login = () => {
    if (senha === "s3r3n4") {
      setIsAdmin(true);
      setPage("adminPanel");
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

        <button className="adm-login-btn-back" onClick={() => setPage("home")}>
          Voltar para a Tabela
        </button>
      </div>
    </div>
  );
}

export default AdminLogin;
