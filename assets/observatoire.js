const cases = [
  {
    id: "PDD-004",
    slug: "pdd-004-combrailles",
    title: "Lycée professionnel des Combrailles",
    place: "Saint-Gervais-d'Auvergne",
    owner: "Région Auvergne-Rhône-Alpes",
    status: "Projet bien documenté",
    buildingType: "Lycée professionnel",
    category: "Enseignement",
    period: "Travaux de juin 2020 à novembre 2021",
    surface: "4 500 m²",
    amount: "Montant non repris dans le catalogue actuel",
    documentStatus: "Documentation solide",
    confidence: "Sources institutionnelles multiples",
    verificationDate: "Date de vérification à documenter",
    complete: "88 %",
    summary: "Isolation, chaufferie à granulés, réseau de chaleur, ventilation et photovoltaïque pour sortir le site scolaire du propane.",
    metrics: ["4 500 m²", "-40 % d'énergie primaire", "-80 % d'émissions", "67 kWc photovoltaïques"],
    takeaways: [
      "Bouquet coordonné sur l'enveloppe, la chaleur, la ventilation et le photovoltaïque.",
      "Objectifs contractuels énergétiques et carbone explicitement publiés.",
      "Résultats mesurés encore à documenter."
    ],
    context: "À environ 700 m d'altitude, le lycée regroupe externat, internats, restauration, administration et logements. Le site dépendait fortement du propane.",
    project: "Les travaux se sont déroulés de juin 2020 à novembre 2021. La garantie complète de performance court jusqu'en novembre 2027.",
    tech: ["Isolation extérieure en laine de bois et PSE", "Chaufferie préfabriquée aux granulés", "Réseau de chaleur de site", "Ventilation simple et double flux", "Toiture végétalisée et photovoltaïque"],
    badges: ["ITE", "Biomasse", "Réseau de chaleur", "Double flux", "Photovoltaïque", "Isolation toiture"],
    actors: [
      { role: "Maître d'ouvrage", names: ["Région Auvergne-Rhône-Alpes"] },
      { role: "Opérateur public", names: ["SPL OSER"] },
      { role: "Entreprise / mandataire travaux", names: ["CDR Construction"] },
      { role: "Architecture", names: ["CHM Architectes"] },
      { role: "Bureau d'études", names: ["SINTEC"] },
      { role: "Exploitation", names: ["IDEX"] }
    ],
    performance: "Les valeurs contractuelles annoncent 1 257 à 748 MWh/an d'énergie primaire et 47,5 à 9,5 kg eq CO₂/m². Les résultats mesurés ne sont pas encore publiés.",
    lesson: "Une action coordonnée sur l'enveloppe et la chaleur peut produire un gain carbone supérieur au gain énergétique.",
    similar: ["PDD-003", "PDD-001"],
    sources: [["Page projet SPL OSER", "https://spl-oser.fr/projets/lycee-professionnel-des-combrailles-a-saint-gervais-dauvergne/"], ["Fiche PDF", "https://spl-oser.fr/wp-content/uploads/2020/04/Fiche-SPL-Lyc%C3%A9%C3%A9-Combrailles-indA.pdf"]]
  },
  {
    id: "PDD-003",
    slug: "pdd-003-rochefort-montagne",
    title: "Lycée professionnel de Rochefort-Montagne",
    place: "Rochefort-Montagne",
    owner: "Région Auvergne-Rhône-Alpes",
    status: "Projet bien documenté",
    buildingType: "Lycée professionnel",
    category: "Enseignement",
    period: "Travaux de novembre 2020 à décembre 2021",
    surface: "6 470 m²",
    amount: "Montant non repris dans le catalogue actuel",
    documentStatus: "Documentation solide",
    confidence: "Sources institutionnelles multiples",
    verificationDate: "Date de vérification à documenter",
    complete: "86 %",
    summary: "Rénovation d'altitude associant isolation, ventilation double flux décentralisée, photovoltaïque et réseau de chaleur biomasse.",
    metrics: ["6 470 m²", "-43 % d'énergie primaire", "-40 % d'émissions", "60 kWc photovoltaïques"],
    takeaways: [
      "Projet situé en altitude, avec enjeux de confort et de besoins de chauffage.",
      "Isolation, ventilation, équilibrage des réseaux et photovoltaïque sont combinés.",
      "Les résultats réels après travaux ne sont pas encore publiés."
    ],
    context: "Le site rassemble des bâtiments construits entre 1965 et 1992 à environ 900 m d'altitude. Les internats et l'atelier étaient particulièrement inconfortables.",
    project: "Les travaux se sont déroulés de novembre 2020 à décembre 2021. Le contrat inclut exploitation-maintenance et garantie complète jusqu'en novembre 2027.",
    tech: ["Isolation extérieure selon les façades", "Isolation des planchers bas", "Ventilation double flux décentralisée", "Équilibrage des réseaux de chauffage", "Deux centrales photovoltaïques"],
    badges: ["ITE", "Isolation plancher", "Double flux", "Photovoltaïque", "Monitoring énergétique"],
    actors: [
      { role: "Maître d'ouvrage", names: ["Région Auvergne-Rhône-Alpes"] },
      { role: "Opérateur public", names: ["SPL OSER"] },
      { role: "Entreprise / mandataire travaux", names: ["TABARD Construction"] },
      { role: "Architecture", names: ["CHM Architectes"] },
      { role: "Bureaux d'études", names: ["LACLAUTRE Ingénierie", "ECIB Project"] },
      { role: "Exploitation", names: ["Vinci Facilities"] }
    ],
    performance: "Les valeurs contractuelles annoncent 1 026 à 590 MWh/an d'énergie primaire et 8,4 à 5,1 kg eq CO₂/m². Les résultats réels ne sont pas encore publiés.",
    lesson: "Le raccordement à une énergie renouvelable ne dispense pas de réduire les besoins.",
    similar: ["PDD-004", "PDD-002"],
    sources: [["Page projet SPL OSER", "https://spl-oser.fr/projets/lycee-professionnel-de-rochefort-montagne/"], ["Fiche PDF", "https://spl-oser.fr/wp-content/uploads/2021/09/Rochefort-Montagne-ind-C.pdf"]]
  },
  {
    id: "PDD-001",
    slug: "pdd-001-la-fayette",
    title: "Lycée La Fayette",
    place: "Clermont-Ferrand",
    owner: "Région Auvergne-Rhône-Alpes",
    status: "Opération documentée",
    buildingType: "Lycée",
    category: "Enseignement",
    period: "Travaux phasés, inauguration le 28 avril 2026",
    surface: "19 134 m² rénovés",
    amount: "23,6 M€ TTC",
    documentStatus: "Projet documenté",
    confidence: "Sources institutionnelles",
    verificationDate: "Date de vérification à documenter",
    complete: "74 %",
    summary: "Une rénovation de grande ampleur centrée sur le confort d'été d'un bâtiment elliptique et de ses internats.",
    metrics: ["19 134 m² rénovés", "23,6 M€ TTC", "23 mois de travaux", "Objectif : -20 %"],
    takeaways: [
      "Le confort d'été structure fortement la lecture du projet.",
      "L'opération porte sur un bâtiment d'enseignement, des internats et une infirmerie.",
      "L'objectif énergétique est publié, mais pas encore le bilan mesuré."
    ],
    context: "Le bâtiment principal de 1991 présentait une façade intérieure en aluminium et verre pénalisante en hiver comme en été.",
    project: "Le marché global concerne le bâtiment d'enseignement, neuf internats et l'infirmerie. Les travaux ont été phasés en site occupé et inaugurés le 28 avril 2026.",
    tech: ["Façade isolante à ossature bois", "Menuiseries et protections solaires", "Isolation des toitures-terrasses", "Seize centrales double flux adiabatiques", "Éclairage et GTC"],
    badges: ["ITE", "Menuiseries", "Protection solaire", "Confort d'été", "Double flux", "GTB", "Isolation toiture"],
    actors: [
      { role: "Maître d'ouvrage", names: ["Région Auvergne-Rhône-Alpes"] },
      { role: "Opérateur public", names: ["SPL OSER"] },
      { role: "Entreprise mentionnée", names: ["Bouygues Bâtiment Sud-Est"] }
    ],
    performance: "Le marché fixe un objectif de réduction de 20 % de l'énergie primaire. Aucune mesure consolidée après travaux n'est encore publiée.",
    lesson: "Le confort d'été peut devenir aussi structurant que la baisse des consommations.",
    similar: ["PDD-004", "PDD-003", "PDD-002"],
    sources: [["Programme SPL OSER", "https://spl-oser.fr/actualites/lycee-la-fayette-a-clermont-ferrand/"], ["Inauguration", "https://spl-oser.fr/actualites/inauguration-du-lycee-la-fayette-a-clermont-ferrand/"]]
  },
  {
    id: "PDD-002",
    slug: "pdd-002-teilhard-de-chardin",
    title: "Collège Teilhard de Chardin",
    place: "Chamalières",
    owner: "Département du Puy-de-Dôme",
    status: "Opération en cours",
    buildingType: "Collège",
    category: "Enseignement",
    period: "Livraison annoncée en décembre 2026",
    surface: "Extension d'environ 100 m² ; surface existante à documenter",
    amount: "Budget annoncé : 8 M€",
    documentStatus: "Documentation partielle",
    confidence: "Source institutionnelle unique",
    verificationDate: "Date de vérification à documenter",
    complete: "64 %",
    summary: "Collège, gymnase et demi-pension réunis dans un marché global avec garantie de performance et photovoltaïque.",
    metrics: ["Objectif : -38 %", "55 MWh/an photovoltaïques", "Extension d'environ 100 m²", "Budget annoncé : 8 M€"],
    takeaways: [
      "Le projet est en cours : les objectifs ne doivent pas être lus comme des résultats.",
      "Le programme associe collège, gymnase et demi-pension.",
      "Le bouquet technique détaillé reste à publier."
    ],
    context: "Ouvert en 1968, le collège public dispose d'une restauration scolaire. Le chantier doit maintenir l'activité.",
    project: "Le programme associe rénovation du collège et du gymnase, extension et réaménagement de la demi-pension. Livraison annoncée en décembre 2026.",
    tech: ["Production photovoltaïque annoncée à 55 MWh/an", "Garantie de performance énergétique", "Bouquet technique détaillé non publié"],
    badges: ["Photovoltaïque", "Monitoring énergétique", "Technique à documenter"],
    actors: [
      { role: "Maître d'ouvrage", names: ["Département du Puy-de-Dôme"] },
      { role: "Opérateur public", names: ["SPL OSER"] }
    ],
    performance: "La baisse de 38 % et la production photovoltaïque sont des objectifs avant livraison. Aucun bilan de consommation n'est disponible.",
    lesson: "Les objectifs d'une opération en cours ne sont pas des résultats obtenus.",
    similar: ["PDD-001", "PDD-003"],
    sources: [["Actualité SPL OSER", "https://spl-oser.fr/actualites/renovation-energetique-du-college-teilhard-de-chardin-a-chamalieres/"]]
  },
  {
    id: "PDD-005",
    slug: "pdd-005-anatole-france",
    title: "Centre Anatole-France",
    place: "Clermont-Ferrand",
    owner: "Ville de Clermont-Ferrand",
    status: "Opération documentée",
    buildingType: "Équipement municipal",
    category: "Collectivité",
    period: "Travaux d'octobre 2021 à juillet 2022",
    surface: "Surface non publiée dans le catalogue actuel",
    amount: "1,2 M€",
    documentStatus: "Projet documenté",
    confidence: "Source institutionnelle locale",
    verificationDate: "Date de vérification à documenter",
    complete: "63 %",
    summary: "Rénovation de l'enveloppe d'un équipement de 1963 intégrée à une stratégie patrimoniale municipale.",
    metrics: ["1,2 M€", "233 750 € France Relance", "Gain estimé : 40 à 50 %", "Environ 40 tCO₂/an"],
    takeaways: [
      "Le projet illustre une stratégie patrimoniale municipale.",
      "L'intervention porte principalement sur l'enveloppe.",
      "Les consommations avant et après travaux ne sont pas publiées."
    ],
    context: "Le centre, au 154 rue Anatole-France, fait partie des sites retenus après l'analyse de 530 installations de mesure municipales.",
    project: "La Ville a conduit les travaux d'octobre 2021 à juillet 2022. La surface et la décomposition du budget ne sont pas publiées.",
    tech: ["Isolation extérieure des façades", "Isolation intérieure du sous-sol", "Isolation de la toiture", "Doubles vitrages", "Portes métalliques thermiques"],
    badges: ["ITE", "ITI", "Isolation toiture", "Menuiseries"],
    actors: [
      { role: "Maître d'ouvrage", names: ["Ville de Clermont-Ferrand"] },
      { role: "Financement mentionné", names: ["État, plan France Relance"] }
    ],
    performance: "La Ville estime une baisse de 40 à 50 % et environ 40 tonnes de CO₂ évitées par an. Les consommations avant et après ne sont pas publiées.",
    lesson: "Un bouquet classique devient utile lorsqu'il est relié à une stratégie patrimoniale.",
    similar: ["PDD-001"],
    sources: [["Ville de Clermont-Ferrand", "https://clermont-ferrand.fr/clermont-une-energie-positive"]]
  }
]

const byId = new Map(cases.map(c => [c.id, c]))

function htmlList(items, className = "") {
  return `<ul${className ? ` class="${className}"` : ""}>${items.map(v => `<li>${v}</li>`).join("")}</ul>`
}

function techBadges(items) {
  return `<div class="tech-badges" aria-label="Techniques observées">${items.map(v => `<span>${v}</span>`).join("")}</div>`
}

function actorGroups(groups) {
  return `<div class="actor-map">${groups.map(group => `<article><span>${group.role}</span><p>${group.names.join(" · ")}</p></article>`).join("")}</div>`
}

function sourceLedger(c) {
  return `<section class="document-trust" aria-labelledby="trust-title"><h2 id="trust-title">Crédibilité documentaire</h2><dl><div><dt>Sources utilisées</dt><dd>${c.confidence}</dd></div><div><dt>Date de vérification</dt><dd>${c.verificationDate}</dd></div><div><dt>Niveau documentaire</dt><dd>${c.documentStatus}</dd></div></dl><p>Les objectifs, estimations et résultats mesurés sont distingués lorsque les sources le permettent.</p></section>`
}

function similarProjects(c) {
  const items = c.similar.map(id => byId.get(id)).filter(Boolean)
  if (!items.length) return ""
  return `<section class="similar-projects" aria-labelledby="similar-title"><h2 id="similar-title">Projets similaires</h2><div class="similar-grid">${items.map(item => `<a href="../${item.slug}/index.html"><span>${item.id} · ${item.category}</span><strong>${item.title}</strong><em>${item.place}</em></a>`).join("")}</div></section>`
}

function listCases() {
  const el = document.querySelector("[data-case-list]")
  if (!el) return
  el.innerHTML = cases.map(c => `<article class="observation-card project-card"><div class="case-meta"><span>${c.id}</span><span>${c.status}</span></div><h2><a href="${c.slug}/index.html">${c.title}</a></h2><p class="case-place">${c.place} · ${c.owner}</p>${techBadges(c.badges.slice(0, 5))}<p>${c.summary}</p><ul class="metric-list">${c.metrics.map(v=>`<li>${v}</li>`).join("")}</ul><p class="case-lesson"><strong>À retenir</strong>${c.lesson}</p><a class="text-action" href="${c.slug}/index.html">Découvrir le projet →</a></article>`).join("")
}

function showCase() {
  const el = document.querySelector("[data-case-detail]")
  if (!el) return
  const c = byId.get(el.dataset.caseDetail)
  if (!c) return
  document.title = `${c.title} · Projet d'Auvergne`
  el.innerHTML = `
    <header class="project-header">
      <span class="reference">${c.id} · ${c.status}</span>
      <span class="eyebrow">${c.place} · ${c.owner}</span>
      <h1>${c.title}</h1>
      <p class="lead">${c.summary}</p>
      ${techBadges(c.badges)}
      <ul class="metric-list detail-metrics">${c.metrics.map(v=>`<li>${v}</li>`).join("")}</ul>
    </header>
    <section class="project-identity" aria-labelledby="identity-title">
      <h2 id="identity-title">Fiche d'identité</h2>
      <dl>
        <div><dt>Type de bâtiment</dt><dd>${c.buildingType}</dd></div>
        <div><dt>Localisation</dt><dd>${c.place}</dd></div>
        <div><dt>Période</dt><dd>${c.period}</dd></div>
        <div><dt>Surface</dt><dd>${c.surface}</dd></div>
        <div><dt>Montant</dt><dd>${c.amount}</dd></div>
        <div><dt>Porteur du projet</dt><dd>${c.owner}</dd></div>
        <div><dt>Statut documentaire</dt><dd>${c.documentStatus}</dd></div>
      </dl>
    </section>
    <section class="executive-summary" aria-labelledby="takeaway-title">
      <h2 id="takeaway-title">À retenir</h2>
      ${htmlList(c.takeaways)}
    </section>
    <nav class="project-network" aria-label="Explorer le réseau documentaire">
      <a href="#techniques">Techniques observées</a>
      <a href="#acteurs">Acteurs</a>
      <a href="../../territoires/puy-de-dome/index.html">Territoire</a>
      <a href="#sources">Sources</a>
    </nav>
    <h2>Contexte territorial</h2>
    <p>${c.context}</p>
    <h2>Description du projet</h2>
    <p>${c.project}</p>
    <h2 id="techniques">Choix techniques</h2>
    ${techBadges(c.badges)}
    ${htmlList(c.tech)}
    <h2 id="acteurs">Acteurs impliqués</h2>
    ${actorGroups(c.actors)}
    <h2>Résultats et performances</h2>
    <p>${c.performance}</p>
    <h2>Point remarquable</h2>
    <p>${c.lesson}</p>
    ${sourceLedger(c)}
    <h2 id="sources">Sources</h2>
    <ul>${c.sources.map(([n,u])=>`<li><a href="${u}">${n}</a></li>`).join("")}</ul>
    ${similarProjects(c)}
  `
}

document.addEventListener("DOMContentLoaded", () => { listCases(); showCase() })
