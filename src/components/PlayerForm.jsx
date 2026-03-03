import { useState } from "react";

function PlayerForm({ addPlayer }) {
  const [nome, setNome] = useState("");

  function handleSubmit() {
    if (!nome.trim()) {
      alert("Digite um nome!");
      return;
    }

    const novoJogador = {
      id: Date.now(),
      nome,
      gols: 0,
      assist: 0,
      jogos: 0,
      pontos: 0,
    };

    addPlayer(novoJogador);
    setNome(""); // limpa o input
  }

  return (
    <div>
      <h3>Adicionar Jogador</h3>

      <input
        placeholder="Nome do jogador"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />

      <button onClick={handleSubmit}>Adicionar</button>
    </div>
  );
}

export default PlayerForm;
