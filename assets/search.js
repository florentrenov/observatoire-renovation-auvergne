(function () {
  const form = document.querySelector("[data-search-form]");
  const input = document.querySelector("[data-search-input]");
  const results = document.querySelector("[data-search-results]");
  const status = document.querySelector("[data-search-status]");
  if (!form || !input || !results || !status) return;

  const normalize = (value) =>
    String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’']/g, " ")
      .replace(/[-–—]/g, " ")
      .replace(/œ/g, "oe")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const index = (window.searchIndex || []).map((item) => ({
    ...item,
    titleIndex: normalize(item.title),
    keywordIndex: normalize((item.keywords || []).join(" ")),
    descriptionIndex: normalize(item.description),
    textIndex: normalize(item.text),
  }));

  function render(items, query) {
    if (!query) {
      results.innerHTML = '<p class="notice">Saisir un mot-clé pour interroger les pages publiques de l’observatoire.</p>';
      status.textContent = "Recherche en attente.";
      return;
    }
    if (!items.length) {
      results.innerHTML = '<p class="notice">Aucun résultat public ne correspond à cette recherche.</p>';
      status.textContent = "Aucun résultat.";
      return;
    }
    results.innerHTML = items.slice(0, 12).map((item) => `
      <article class="search-result">
        <span class="meta">${item.type}</span>
        <h2><a href="../${item.url}">${item.title}</a></h2>
        <p>${item.description}</p>
      </article>
    `).join("");
    status.textContent = `${items.length} résultat${items.length > 1 ? "s" : ""}.`;
  }

  function search() {
    const query = normalize(input.value);
    const terms = query.split(" ").filter((term) => term.length > 2);
    const found = !terms.length ? [] : index
      .map((item) => {
        const phrase = query;
        const contains = (term) => item.titleIndex.includes(term) || item.keywordIndex.includes(term) || item.descriptionIndex.includes(term) || item.textIndex.includes(term);
        if (!terms.every(contains)) return { item, score: 0 };
        const score = terms.reduce((total, term) => {
          let next = total;
          if (item.titleIndex === phrase) next += 50;
          if (item.titleIndex.includes(term)) next += 15;
          if (item.keywordIndex.includes(term)) next += 10;
          if (item.descriptionIndex.includes(term)) next += 5;
          if (item.textIndex.includes(term)) next += 1;
          return next;
        }, 0);
        return { item, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
      .map((entry) => entry.item);
    render(found, query);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    search();
  });
  input.addEventListener("input", search);
  render([], "");
})();
