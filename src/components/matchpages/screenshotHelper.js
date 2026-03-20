// utils/screenshotHelper.js
import html2canvas from "html2canvas";

export const exportMatchImage = async (elementId, matchName) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Esconde botões de interface antes do print
  const buttons = element.querySelectorAll("button, select, .back-btn");
  buttons.forEach((b) => (b.style.display = "none"));

  const canvas = await html2canvas(element, {
    backgroundColor: "#000",
    scale: 2, // Melhora a qualidade
    logging: false,
    useCORS: true,
  });

  // Volta os botões
  buttons.forEach((b) => (b.style.display = ""));

  const image = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.download = `ADR-${matchName}.png`;
  link.href = image;
  link.click();
};
