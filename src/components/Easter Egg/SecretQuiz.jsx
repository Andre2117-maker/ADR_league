import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./secret.css";

import foiAssim from "../../assets/easteregg/foiassim.png";
import naoFoiAssim from "../../assets/easteregg/naofoiassim.png";
import seraSeFoiAssim from "../../assets/easteregg/serasefoiassim.png";

const SecretQuiz = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  const subjects = [
    "Matemática",
    "Biologia",
    "História",
    "Geografia",
    "Física",
    "Química",
  ];

  const handleWrongAnswer = () => {
    alert("ERROU! Voltando para o início...");
    navigate("/");
  };

  const checkName = () => {
    const nameTyped = fullName.trim().toLowerCase();
    const nameParts = fullName.trim().split(" ");
    const correctName = "carlos eduardo silva miller";

    if (nameParts.length < 3) {
      setError("NOME COMPLETO PFV");
    } else if (nameTyped !== correctName) {
      setError("ESTA PÁGINA NÃO É DEDICADA A ESSA PESSOA.");
    } else {
      setError("");
      setStep(1);
    }
  };

  const checkSubjects = () => {
    const correct = ["Biologia", "Geografia"];
    const isCorrect =
      selectedSubjects.length === 2 &&
      selectedSubjects.every((s) => correct.includes(s));

    if (isCorrect) setStep(3);
    else handleWrongAnswer();
  };

  return (
    <div className="secret-container">
      <div className="secret-card">
        {step === 0 && (
          <div className="step-0">
            <h1>SEJA BEM VINDO À PÁGINA SECRETA</h1>
            <p>A QUEM ESSA PÁGINA FOI DEDICADA?</p>
            <input
              type="text"
              placeholder="Digite o nome completo..."
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            {error && <span className="error-msg">{error}</span>}
            <button className="btn-next" onClick={checkName}>
              AVANÇAR
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="step-content">
            <h2>Pergunta 1</h2>
            <p>
              O que o Carlos respondeu quando perguntaram nome, idade e
              sexualidade?
            </p>
            <div className="options-vertical">
              <button onClick={handleWrongAnswer}>Hetero</button>
              <button onClick={() => setStep(2)}>Masculino</button>
              <button onClick={handleWrongAnswer}>18 anos</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <h2>Pergunta 2</h2>
            <p>Quais notas o Carlos não está entendendo?</p>
            <div className="subject-grid">
              {subjects.map((s) => (
                <label key={s} className="check-container">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked)
                        setSelectedSubjects([...selectedSubjects, s]);
                      else
                        setSelectedSubjects(
                          selectedSubjects.filter((item) => item !== s),
                        );
                    }}
                  />
                  <span className="checkmark"></span>
                  {s}
                </label>
              ))}
            </div>
            <button className="btn-next" onClick={checkSubjects}>
              VERIFICAR
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="step-content">
            <h2>Pergunta 3</h2>
            <p>Como foi o soco descrito pelo Carlos?</p>
            <div className="image-selector">
              <div className="img-option" onClick={handleWrongAnswer}>
                <img src={naoFoiAssim} alt="Opção 1" title="Não foi assim" />
              </div>
              <div
                className="img-option"
                onClick={() => navigate("/altar-adr")}
              >
                <img src={foiAssim} alt="Correta" title="Foi assim!" />
              </div>
              <div className="img-option" onClick={handleWrongAnswer}>
                <img
                  src={seraSeFoiAssim}
                  alt="Opção 3"
                  title="Será que foi assim?"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecretQuiz;
