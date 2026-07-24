document.addEventListener("DOMContentLoaded", () => {
  const button = document.querySelector("[data-history-back]");
  if (!button || window.history.length <= 1) return;
  button.hidden = false;
  button.addEventListener("click", () => window.history.back());
});
