function watchStatusClass(status) {
  return String(status || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")
}

function watchCategoryKey(category) {
  return String(category || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

function watchCategoryLabel(category) {
  const value = String(category || "Veille")
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function isPublished(item) {
  const status = String(item?.status || item?.statut || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  return status === "publie" || status === "published"
}

function renderWatchItem(item, featured = false, targetUrl = "") {
  const title = item.title || "Publication de veille"
  const date = item.date || "Date à vérifier"
  const category = watchCategoryLabel(item.category)
  const territory = item.territory || "Périmètre à préciser"
  const sourceName = item.sourceName || "Source à vérifier"
  const summary = item.summary || "Synthèse en cours de rédaction."
  const verificationDate = item.verificationDate || "À vérifier avant publication"
  const publicStatus = item.legalStatus || "Information publiée"
  const statusClass = watchStatusClass(publicStatus)
  const action = targetUrl
    ? `<a class="text-action" href="${targetUrl}">Lire la synthèse →</a>`
    : `<span class="disabled-action" aria-disabled="true">Synthèse non publiée</span>`
  return `<article class="watch-entry${featured ? " is-featured" : ""}">
    <div class="watch-entry-meta">
      <span>${date}</span>
      <span>${category}</span>
      <span class="watch-status status-${statusClass}">${publicStatus}</span>
    </div>
    <h3>${title}</h3>
    <p>${summary}</p>
    <dl>
      <div><dt>Source</dt><dd>${item.sourceUrl ? `<a href="${item.sourceUrl}">${sourceName}</a>` : sourceName}</dd></div>
      <div><dt>Territoire</dt><dd>${territory}</dd></div>
      <div><dt>Vérification</dt><dd>${verificationDate}</dd></div>
    </dl>
    ${action}
  </article>`
}

function watchTargetUrl(item, selector) {
  const target = item.targetUrl || ""
  if (!target || /^(?:[a-z]+:|\/|\.\.\/)/i.test(target)) return target
  return selector === "[data-watch-preview]" ? `veille/${target}` : target
}

function renderWatchFeed(selector, limit, category = "") {
  const el = document.querySelector(selector)
  if (!el) return
  const sourceItems = Array.isArray(window.watchItems) ? window.watchItems : []
  const categoryKey = watchCategoryKey(category)
  const items = sourceItems
    .filter(isPublished)
    .filter((item) => !categoryKey || watchCategoryKey(item.category) === categoryKey)
    .slice(0, limit || sourceItems.length)
  if (!items.length) {
    const message = categoryKey
      ? "Aucune publication validée dans cette catégorie pour le moment."
      : "Les premières publications de veille sont en préparation. Elles seront affichées ici après sélection, vérification et validation humaine."
    el.innerHTML = `<div class="watch-empty"><p>${message}</p></div>`
    return
  }
  el.innerHTML = items.map((item, index) => renderWatchItem(
    item,
    index === 0 && selector === "[data-watch-preview]",
    watchTargetUrl(item, selector),
  )).join("")
}

function bindWatchFilters() {
  const controls = document.querySelector("[data-watch-filters]")
  if (!controls) return
  controls.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-watch-category]")
    if (!button) return
    for (const candidate of controls.querySelectorAll("button[data-watch-category]")) {
      candidate.setAttribute("aria-pressed", candidate === button ? "true" : "false")
    }
    renderWatchFeed("[data-watch-list]", undefined, button.dataset.watchCategory || "")
  })
}

document.addEventListener("DOMContentLoaded", () => {
  renderWatchFeed("[data-watch-preview]", 3)
  renderWatchFeed("[data-watch-list]")
  bindWatchFilters()
})
