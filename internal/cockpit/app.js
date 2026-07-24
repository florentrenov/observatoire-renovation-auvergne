(() => {
  'use strict';

  const data = window.COCKPIT_DATA;
  const root = document.documentElement;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]));
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const human = value => String(value ?? 'non renseigné').replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
  const dateFr = value => value ? new Intl.DateTimeFormat('fr-FR', {dateStyle: 'medium'}).format(new Date(`${value.slice(0, 10)}T12:00:00`)) : 'Non renseignée';
  const badge = value => `<span class="badge ${esc(value)}">${esc(human(value))}</span>`;
  const countBy = (rows, getter) => rows.reduce((result, row) => { const key = typeof getter === 'function' ? getter(row) : row[getter]; result[key] = (result[key] || 0) + 1; return result; }, {});
  const unique = values => [...new Set(values.filter(Boolean))];
  const entityById = new Map((data?.entities || []).map(row => [row.id, row]));
  const relationById = new Map((data?.relations || []).map(row => [row.id, row]));
  const claimById = new Map((data?.claims || []).map(row => [row.id, row]));
  const sourceById = new Map((data?.sources || []).map(row => [row.id, row]));
  const publicationById = new Map((data?.publications || []).map(row => [row.id, row]));
  const graphNodeById = new Map((data?.graph?.nodes || []).map(row => [row.id, row]));

  if (!data) {
    document.body.innerHTML = '<main class="noscript"><h1>Données indisponibles</h1><p>Exécutez <code>npm.cmd run knowledge:dashboard</code>, puis rechargez la page.</p></main>';
    return;
  }

  const params = new URL(location.href).searchParams;
  const viewLabels = {
    overview: "Vue d'ensemble", graph: 'Graphe', timeline: 'Chronologie', claims: 'Affirmations', quality: 'Qualité',
    sources: 'Sources', suggestions: 'Suggestions', matrices: 'Matrices', territories: 'Territoires', search: 'Recherche', gaps: 'Lacunes', comparison: 'Comparaison'
  };
  const state = {
    view: viewLabels[params.get('view')] ? params.get('view') : 'overview',
    graph: {
      mode: params.get('gm') || 'noyau', query: params.get('gq') || '', type: params.get('gt') || 'all',
      territory: params.get('gter') || 'all', confidence: params.get('gc') || 'all', status: params.get('gs') || 'all',
      source: params.get('gsrc') || 'all', period: params.get('gp') || 'all', temporal: params.get('gtemp') || 'all',
      transform: {x: 0, y: 0, scale: 1}, selected: new Set(), pathNodes: new Set(), pathEdges: new Set()
    },
    timelineTheme: params.get('tt') || 'all',
    matrix: Object.keys(data.matrices)[0],
    exports: new Map(),
    toastTimer: null
  };

  function setOptions(element, values, allLabel = 'Tous') {
    element.innerHTML = `<option value="all">${esc(allLabel)}</option>${values.map(value => {
      const id = typeof value === 'object' ? value.id : value;
      const label = typeof value === 'object' ? value.label : human(value);
      return `<option value="${esc(id)}">${esc(label)}</option>`;
    }).join('')}`;
  }

  function syncUrl() {
    try {
      const url = new URL(location.href);
      url.searchParams.set('view', state.view);
      const graphMap = {gm: 'mode', gq: 'query', gt: 'type', gter: 'territory', gc: 'confidence', gs: 'status', gsrc: 'source', gp: 'period', gtemp: 'temporal'};
      Object.entries(graphMap).forEach(([parameter, key]) => state.graph[key] && state.graph[key] !== 'all' ? url.searchParams.set(parameter, state.graph[key]) : url.searchParams.delete(parameter));
      state.timelineTheme !== 'all' ? url.searchParams.set('tt', state.timelineTheme) : url.searchParams.delete('tt');
      history.replaceState(null, '', url);
    } catch (_) { /* Le fichier local reste utilisable si l'historique est indisponible. */ }
  }

  function showToast(message) {
    const toast = $('[data-toast]');
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
  }

  function setView(view) {
    if (!viewLabels[view]) return;
    state.view = view;
    $$('[data-section]').forEach(section => { section.hidden = section.dataset.section !== view; });
    $$('[data-view]').forEach(button => button.setAttribute('aria-current', button.dataset.view === view ? 'page' : 'false'));
    $('[data-breadcrumb-view]').textContent = viewLabels[view];
    syncUrl();
    if (view === 'graph') renderGraph();
    if (view === 'search') $('[data-search-page]').focus();
    window.scrollTo({top: 0, behavior: 'instant'});
  }

  function openButton(kind, id, label = id) {
    return `<button type="button" class="link-button" data-open-kind="${esc(kind)}" data-open-id="${esc(id)}">${esc(label)}</button>`;
  }

  function renderOverview() {
    const s = data.stats;
    const metrics = [
      ['Entités', s.entities, '65 fiches canoniques attendues'], ['Relations', s.relations, `${s.relation_statuses.confirme || 0} confirmées`],
      ['Affirmations', s.claims, `${s.claims_without_primary} sans source primaire explicite`, s.claims_without_primary ? 'alert' : ''],
      ['Sources', s.sources, `${s.observed_sources} observée · ${s.provisional_sources} provisoires`], ['Chronologies', s.timelines, `${s.timeline_events} jalons canoniques`],
      ['Publications ANAH', s.publications_anah, 'Corpus historique observé']
    ];
    const secondary = [
      ['À vérifier', s.elements_to_verify], ['Annonces futures', s.future_announcements], ['Entités isolées', s.isolated_entities],
      ['Relations orphelines', s.orphan_relations], ['Suggestions en attente', s.pending_suggestions], ['Aliases ambigus', data.alias_conflicts.length]
    ];
    const maxType = Math.max(...Object.values(s.entity_types));
    const topGaps = data.gaps.slice(0, 8);
    $('[data-overview]').innerHTML = `
      <div class="metric-grid">${metrics.map(([label, value, note, className = '']) => `<article class="metric ${className}"><span>${esc(label)}</span><strong>${value}</strong><small>${esc(note)}</small></article>`).join('')}</div>
      <div class="metric-grid">${secondary.map(([label, value]) => `<article class="metric ${value ? 'alert' : ''}"><span>${esc(label)}</span><strong>${value}</strong><small>${value ? 'Action ou lecture recommandée' : 'Aucune anomalie détectée'}</small></article>`).join('')}</div>
      <div class="dashboard-grid">
        <article class="panel"><div class="panel-head"><div><h2>Entités par type</h2><p>Distribution du noyau canonique</p></div><strong>${s.entities}</strong></div><div class="bar-list">${Object.entries(s.entity_types).sort((a,b) => b[1]-a[1]).map(([label,value]) => `<div class="bar-row"><span>${esc(human(label))}</span><span class="bar-track"><i style="--bar:${value/maxType*100}%"></i></span><strong>${value}</strong></div>`).join('')}</div></article>
        <article class="panel"><div class="panel-head"><div><h2>Priorités immédiates</h2><p>Premières lacunes critiques ou hautes</p></div><strong>${data.gaps.filter(gap => ['critique','haute'].includes(gap.priority)).length}</strong></div><ul class="action-list">${topGaps.map(gap => `<li>${badge(gap.priority)}<span>${esc(gap.label)}</span>${gap.target_id ? openButton(gap.target_kind, gap.target_id, gap.target_id) : ''}</li>`).join('')}</ul></article>
      </div>
      <div class="dashboard-grid">
        <article class="panel"><div class="panel-head"><div><h2>Statut des relations</h2><p>Les statuts non confirmés restent visibles dans le graphe</p></div></div><div class="bar-list">${Object.entries(s.relation_statuses).map(([label,value]) => `<div class="bar-row"><span>${badge(label)}</span><span class="bar-track"><i style="--bar:${value/s.relations*100}%"></i></span><strong>${value}</strong></div>`).join('')}</div></article>
        <article class="panel"><h2>Lecture prudente</h2><p>${esc(data.quality.interpretation)}</p><p class="interpretation">100 % de fiches sourcées signifie qu'une référence est déclarée. Cela ne vaut ni validation juridique, ni confirmation par une source primaire.</p></article>
      </div>`;
  }

  const graphModes = {
    noyau: {label: 'Noyau métier', types: null, kinds: ['entity']},
    acteurs: {label: 'Acteurs & dispositifs', types: ['acteur','dispositif','financement','public'], kinds: ['entity']},
    territorial: {label: 'Territorial', types: ['territoire','acteur','operation','dispositif'], kinds: ['entity']},
    reglementaire: {label: 'Réglementaire', types: ['reglementation','dispositif','source'], kinds: ['entity','claim']},
    technique: {label: 'Technique', types: ['technique','materiau','label','operation'], kinds: ['entity']},
    incertitudes: {label: 'Incertitudes', uncertain: true},
    anah: {label: 'ANAH · 55 publications', anah: true}
  };
  const graphPositions = new Map();
  const graphGroups = unique(data.graph.nodes.map(node => node.kind === 'entity' ? node.type : node.kind)).sort();
  const groupedNodes = new Map(graphGroups.map(group => [group, data.graph.nodes.filter(node => (node.kind === 'entity' ? node.type : node.kind) === group)]));
  graphGroups.forEach((group, groupIndex) => {
    const angle = (groupIndex / graphGroups.length) * Math.PI * 2 - Math.PI / 2;
    const center = {x: 800 + Math.cos(angle) * 510, y: 500 + Math.sin(angle) * 350};
    groupedNodes.get(group).forEach((node, index) => {
      const spiral = index * 2.399;
      const radius = 25 + 17 * Math.sqrt(index);
      graphPositions.set(node.id, {x: center.x + Math.cos(spiral) * radius, y: center.y + Math.sin(spiral) * radius});
    });
  });

  function nodeMetadata(node) {
    if (node.kind === 'entity') return entityById.get(node.id) || node;
    if (node.kind === 'claim') return claimById.get(node.id) || node;
    if (node.kind === 'publication') return publicationById.get(node.id) || node;
    return node;
  }

  function nodeMatchesGraph(node) {
    const filter = state.graph;
    const mode = graphModes[filter.mode] || graphModes.noyau;
    const meta = nodeMetadata(node);
    if (mode.anah) {
      const isAnahCore = ['ACT-024','SRC-ANAH'].includes(node.id) || node.kind === 'publication';
      const isAnahLinked = data.graph.edges.some(edge => (edge.source === node.id && publicationById.has(edge.target)) || (edge.target === node.id && publicationById.has(edge.source)));
      if (!isAnahCore && !isAnahLinked) return false;
    } else if (mode.uncertain) {
      const provisionalSource = node.kind === 'entity' && meta.type_entite === 'source' && meta.qualification?.type === 'qualification_provisoire';
      const uncertain = ['a_verifier','provisoire','probable','contradictoire','futur','annonce_future'].includes(node.statut || meta.statut || meta.status) || meta.verification_requise || meta.verification_required;
      const uncertainRelationNode = data.relations.some(relation => ['a_verifier','provisoire','probable','contradictoire'].includes(relation.statut_relation) && [relation.source_entite,relation.cible_entite].includes(node.id));
      if (!provisionalSource && !uncertain && !uncertainRelationNode) return false;
    } else {
      if (mode.kinds && !mode.kinds.includes(node.kind)) return false;
      if (mode.types && node.kind === 'entity' && !mode.types.includes(node.type)) return false;
    }
    if (filter.type !== 'all' && node.type !== filter.type && node.kind !== filter.type) return false;
    if (filter.confidence !== 'all' && (node.confiance || meta.niveau_confiance || meta.confidence) !== filter.confidence) return false;
    if (filter.status !== 'all' && (node.statut || meta.statut || meta.status) !== filter.status) return false;
    if (filter.territory !== 'all' && !(meta.territoires || meta.territories || []).includes(filter.territory)) return false;
    if (filter.source !== 'all') {
      const sources = [...(meta.sources_principales || []), ...(meta.sources || [])];
      if (node.id !== filter.source && !sources.includes(filter.source) && !(filter.source === 'SRC-ANAH' && node.kind === 'publication')) return false;
    }
    const date = node.date || meta.date || meta.date_debut_validite || meta.date_publication;
    if (filter.period !== 'all' && (!date || !date.startsWith(filter.period))) return false;
    const temporal = ['futur','annonce_future'].includes(node.statut || meta.statut || meta.status) || (date && date > data.meta.as_of) ? 'futur' : ['historique','remplace'].includes(node.statut || meta.statut || meta.status) ? 'historique' : 'actuel';
    if (filter.temporal !== 'all' && temporal !== filter.temporal) return false;
    if (filter.query) {
      const text = normalize([node.id,node.label,JSON.stringify(meta)].join(' '));
      if (!normalize(filter.query).split(' ').every(term => text.includes(term))) return false;
    }
    return true;
  }

  function graphShape(node, radius) {
    if (node.kind === 'claim') return `<path class="node-shape" d="M0 ${-radius} L${radius} 0 L0 ${radius} L${-radius} 0 Z"></path>`;
    if (node.kind === 'publication') return `<rect class="node-shape" x="${-radius}" y="${-radius}" width="${radius*2}" height="${radius*2}"></rect>`;
    if (node.kind === 'evidence') return `<rect class="node-shape" x="${-radius}" y="${-radius}" width="${radius*2}" height="${radius*2}" rx="3"></rect>`;
    if (node.kind === 'taxonomy') return `<path class="node-shape" d="M0 ${-radius} L${radius*.86} ${-radius*.5} L${radius*.86} ${radius*.5} L0 ${radius} L${-radius*.86} ${radius*.5} L${-radius*.86} ${-radius*.5} Z"></path>`;
    return `<circle class="node-shape" r="${radius}"></circle>`;
  }

  function applyGraphTransform() {
    const {x,y,scale} = state.graph.transform;
    $('[data-graph-viewport]').setAttribute('transform', `translate(${x} ${y}) scale(${scale})`);
  }

  function renderGraph() {
    const nodes = data.graph.nodes.filter(nodeMatchesGraph);
    const ids = new Set(nodes.map(node => node.id));
    const edges = data.graph.edges.filter(edge => ids.has(edge.source) && ids.has(edge.target));
    const degree = new Map(data.analyses.centrality.map(row => [row.id,row.degree]));
    const edgeMarkup = edges.map(edge => {
      const source = graphPositions.get(edge.source), target = graphPositions.get(edge.target);
      const relation = relationById.get(edge.id);
      const status = edge.statut || relation?.statut_relation || '';
      const selected = state.graph.pathEdges.has(edge.id) ? 'is-path' : '';
      return `<g data-graph-edge="${esc(edge.id)}"><line class="graph-edge is-${esc(status)} ${selected}" x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}"></line><line class="graph-edge-hit" x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}"><title>${esc(edge.type)}</title></line></g>`;
    }).join('');
    const labelNodes = nodes.length < 76;
    const nodeMarkup = nodes.map(node => {
      const position = graphPositions.get(node.id);
      const meta = nodeMetadata(node);
      const status = node.statut || meta.statut || meta.status || '';
      const radius = node.kind === 'entity' ? 7 + Math.min(8, (degree.get(node.id) || 0) * .75) : node.kind === 'publication' ? 6 : 7;
      const selected = state.graph.selected.has(node.id) ? 'is-selected' : state.graph.pathNodes.has(node.id) ? 'is-path' : '';
      const label = node.label.length > 34 ? `${node.label.slice(0,32)}…` : node.label;
      return `<g class="graph-node kind-${esc(node.kind)} is-${esc(status)} ${selected}" data-graph-node="${esc(node.id)}" transform="translate(${position.x} ${position.y})"><title>${esc(node.id)} · ${esc(node.label)}</title>${graphShape(node,radius)}${labelNodes || node.kind === 'entity' ? `<text x="${radius+5}" y="4">${esc(label)}</text>` : ''}</g>`;
    }).join('');
    $('[data-graph-viewport]').innerHTML = `<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(237,233,225,.35)"></path></marker></defs><g>${edgeMarkup}</g><g>${nodeMarkup}</g>`;
    applyGraphTransform();
    $('[data-graph-count]').textContent = `${nodes.length} nœuds · ${edges.length} arêtes visibles`;
    $('[data-graph-path]').disabled = state.graph.selected.size !== 2;
    $('[data-graph-legend]').innerHTML = [['entity','Entité','var(--bleu)'],['claim','Affirmation','var(--ocre)'],['publication','Publication','var(--lave)'],['evidence','Preuve','var(--mousse)'],['taxonomy','Taxonomie','var(--violet)']].map(([,label,color]) => `<span class="legend-item"><i class="legend-mark" style="--mark:${color}"></i>${label}</span>`).join('');
    state.exports.set('graph', {rows: nodes.map(node => ({id:node.id,kind:node.kind,type:node.type,label:node.label,status:node.statut || ''})), columns: ['id','kind','type','label','status']});
    renderGraphAnalysis();
  }

  function shortestPath() {
    const [start,end] = [...state.graph.selected];
    const visibleIds = new Set(data.graph.nodes.filter(nodeMatchesGraph).map(node => node.id));
    const edges = data.graph.edges.filter(edge => visibleIds.has(edge.source) && visibleIds.has(edge.target));
    const adjacency = new Map([...visibleIds].map(id => [id,[]]));
    edges.forEach(edge => { adjacency.get(edge.source).push([edge.target,edge.id]); adjacency.get(edge.target).push([edge.source,edge.id]); });
    const queue = [start], previous = new Map([[start,null]]), via = new Map();
    while (queue.length && !previous.has(end)) {
      const current = queue.shift();
      for (const [next,edgeId] of adjacency.get(current) || []) if (!previous.has(next)) { previous.set(next,current); via.set(next,edgeId); queue.push(next); }
    }
    state.graph.pathNodes.clear(); state.graph.pathEdges.clear();
    if (!previous.has(end)) { showToast('Aucun chemin dans le sous-graphe visible.'); renderGraph(); return; }
    let current = end;
    while (current) { state.graph.pathNodes.add(current); if (via.has(current)) state.graph.pathEdges.add(via.get(current)); current = previous.get(current); }
    showToast(`Chemin documentaire : ${state.graph.pathNodes.size} nœuds.`);
    renderGraph();
  }

  function renderGraphAnalysis() {
    const central = data.analyses.centrality.slice(0,8);
    const communities = data.analyses.communities.slice(0,6);
    const relationTypes = data.analyses.relation_types.slice(0,8);
    const leastDocumented = data.analyses.least_documented.slice(0,8);
    const citedSources = data.analyses.source_citations.slice(0,8);
    const oldestClaims = data.analyses.oldest_claims.slice(0,6);
    const nextDates = data.events.filter(row => row.date >= data.meta.as_of).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,8);
    const anahPanel = state.graph.mode === 'anah' ? `<article class="panel"><h3>Corpus ANAH relié</h3><ul><li>${data.publications.length} publications</li><li>${data.suggestions.filter(row => row.origin === 'publication_anah').length} suggestions générées</li><li>${data.events.filter(row => row.sources.includes('SRC-ANAH') || row.sources.some(source => source.startsWith('ANAH-ACTU-'))).length} jalons ou dates reliés</li></ul><p class="interpretation">Les suggestions restent hors du graphe de faits et ne sont jamais appliquées automatiquement.</p></article>` : '';
    $('[data-graph-analysis]').innerHTML = `
      <article class="panel"><h3>Centralité documentaire</h3><ol>${central.map(row => `<li>${openButton('entity',row.id,row.label)} · ${row.degree} relation(s)</li>`).join('')}</ol><p class="interpretation">Calcul par degré sur les 55 relations métier. Il ne mesure pas l'importance métier.</p></article>
      <article class="panel"><h3>Communautés connexes</h3><ul>${communities.map(row => `<li>${esc(row.id)} · ${row.size} entité(s)</li>`).join('')}</ul><p class="interpretation">Composantes connexes, sans inférence thématique.</p></article>
      <article class="panel"><h3>Relations fréquentes</h3><ul>${relationTypes.map(row => `<li>${esc(human(row.type))} · ${row.count}</li>`).join('')}</ul></article>
      <article class="panel"><h3>Entités les moins documentées</h3><ul>${leastDocumented.map(row => `<li>${openButton('entity',row.id,row.label)} · score ${row.score}</li>`).join('')}</ul><p class="interpretation">Score = relations + affirmations + jalons.</p></article>
      <article class="panel"><h3>Sources les plus citées</h3><ul>${citedSources.map(row => `<li>${openButton('source',row.id,sourceById.get(row.id)?.nom || row.id)} · ${row.citations}</li>`).join('')}</ul></article>
      <article class="panel"><h3>Affirmations les plus anciennes</h3><ul>${oldestClaims.map(row => `<li>${openButton('claim',row.id,row.id)} · ${esc(row.date_derniere_verification || 'jamais')}</li>`).join('')}</ul><p class="interpretation">À la phase 3, les dates sont encore identiques.</p></article>
      <article class="panel"><h3>Prochaines dates à confirmer</h3>${nextDates.length ? `<ul>${nextDates.map(row => `<li>${openButton('event',row.id,row.id)} · ${esc(row.date)}</li>`).join('')}</ul>` : '<p class="empty">Aucune date future structurée</p>'}</article>${anahPanel}`;
  }

  const timelinePresets = {
    all: {label:'Chronologies canoniques',terms:[]}, maprimerenov:{label:'MaPrimeRénov’',terms:['maprimerenov']}, ampleur:{label:'Rénovation d’ampleur',terms:['rénovation d ampleur']},
    france:{label:'France Rénov’',terms:['france renov']}, mar:{label:'Mon Accompagnateur Rénov’',terms:['mon accompagnateur renov']}, chauffage:{label:'Décarbonation du chauffage',terms:['chauffage','decarbon']}, fraude:{label:'Lutte contre la fraude',terms:['fraude','controle']}
  };

  function renderTimeline() {
    const preset = timelinePresets[state.timelineTheme] || timelinePresets.all;
    let rows = data.events.map(row => ({...row, title: row.timeline_title || human(row.type), open_kind:'event'}));
    if (state.timelineTheme !== 'all') {
      rows = rows.filter(row => preset.terms.some(term => normalize(JSON.stringify(row)).includes(term)));
      rows.push(...data.publications.filter(publication => preset.terms.some(term => normalize(JSON.stringify(publication)).includes(term))).map(publication => ({
        id: publication.id, date: publication.date, type: publication.nature, statut: publication.status, texte: publication.summary,
        sources: ['SRC-ANAH'], entity_id: null, confidence: publication.confidence, title: publication.title, origin:'publication_anah', open_kind:'publication'
      })));
    }
    const entity = $('[data-timeline-entity]').value, source = $('[data-timeline-source]').value, status = $('[data-timeline-status]').value, year = $('[data-timeline-year]').value, confidence = $('[data-timeline-confidence]').value;
    rows = rows.filter(row => (entity === 'all' || row.entity_id === entity) && (source === 'all' || row.sources.includes(source)) && (status === 'all' || row.statut === status) && (year === 'all' || row.date?.startsWith(year)) && (confidence === 'all' || row.confidence === confidence)).sort((a,b) => (b.date || '').localeCompare(a.date || ''));
    $('[data-timeline-count]').textContent = `${rows.length} événement(s) affiché(s)`;
    $('[data-timeline]').innerHTML = rows.length ? rows.map(row => `<article class="timeline-item"><span class="timeline-date">${esc(dateFr(row.date))}</span><div><h3>${openButton(row.open_kind,row.id,row.title)}</h3><p>${esc(row.texte)}</p><div class="timeline-sources">${badge(row.statut)}${badge(row.confidence)}${row.sources.map(sourceId => badge(sourceId)).join('')}</div></div><span class="badge">${esc(human(row.origin))}</span></article>`).join('') : '<p class="empty">Aucun jalon canonique ou publication reliée ne correspond à ces filtres. Cela signale une chronologie encore incomplète.</p>';
    state.exports.set('timeline',{rows:rows.map(row => ({id:row.id,date:row.date,type:row.type,status:row.statut,text:row.texte,sources:row.sources.join('|')})),columns:['id','date','type','status','text','sources']});
  }

  function renderClaims() {
    const query = normalize($('[data-claim-search]').value), status = $('[data-claim-status]').value, confidence = $('[data-claim-confidence]').value, control = $('[data-claim-control]').value;
    const asOf = new Date(`${data.meta.as_of}T12:00:00`);
    const rows = data.claims.filter(claim => {
      const age = claim.date_derniere_verification ? (asOf - new Date(`${claim.date_derniere_verification}T12:00:00`)) / 86400000 : Infinity;
      const future = claim.date_debut_validite && claim.date_debut_validite > data.meta.as_of;
      const sensitive = claim.verification_requise || ['a_verifier','provisoire','contradictoire'].includes(claim.statut);
      return (!query || normalize(JSON.stringify(claim)).includes(query)) && (status === 'all' || claim.statut === status) && (confidence === 'all' || claim.niveau_confiance === confidence) && (control === 'all' || control === 'no-primary' && !claim.source_primaire || control === 'overdue' && age > 90 || control === 'future' && future || control === 'sensitive' && sensitive);
    });
    $('[data-claim-count]').textContent = `${rows.length} affirmation(s) · ${rows.filter(row => !row.source_primaire).length} sans source primaire`;
    $('[data-claims]').innerHTML = rows.length ? rows.map(claim => {
      const warning = !claim.source_primaire || claim.verification_requise;
      return `<tr class="${warning ? 'row-warning' : ''}" data-open-kind="claim" data-open-id="${esc(claim.id)}"><td>${openButton('entity',claim.sujet,entityById.get(claim.sujet)?.nom || claim.sujet)}</td><td>${esc(human(claim.predicat))}</td><td>${entityById.has(claim.objet) ? openButton('entity',claim.objet,entityById.get(claim.objet).nom) : esc(claim.objet)}</td><td>${openButton('claim',claim.id,claim.texte_affirmation)}</td><td>${badge(claim.statut)}</td><td>${badge(claim.niveau_confiance)}</td><td class="${claim.source_primaire ? '' : 'no-primary'}">${esc(claim.source_primaire || 'Absente')}</td><td>${esc(claim.date_debut_validite || '—')} → ${esc(claim.date_fin_validite || '—')}</td><td>${esc(claim.date_derniere_verification || '—')}</td></tr>`;
    }).join('') : '<tr><td colspan="9"><p class="empty">Aucune affirmation ne correspond aux filtres.</p></td></tr>';
    state.exports.set('claims',{rows,columns:['id','sujet','predicat','objet','texte_affirmation','statut','niveau_confiance','source_primaire','date_debut_validite','date_fin_validite','date_derniere_verification']});
  }

  function issueCard(title, rows, kind = 'entity') {
    return `<article class="issue-card"><h3>${esc(title)}<span>${rows.length}</span></h3>${rows.length ? `<ul>${rows.slice(0,40).map(row => {
      const id = typeof row === 'string' ? row : row.id || row.entity || row.target_id;
      const label = typeof row === 'string' ? row : row.issue || row.label || id;
      return `<li>${id ? openButton(kind,id,label) : esc(label)}</li>`;
    }).join('')}</ul>` : '<p class="empty">Aucun élément détecté.</p>'}</article>`;
  }

  function renderQuality() {
    const q = data.quality, provisionalRelations = data.relations.filter(row => ['probable','provisoire','a_verifier'].includes(row.statut_relation));
    const incompleteTimelines = data.entities.filter(entity => entity.type_entite === 'dispositif' && !data.timelines.some(timeline => timeline.entite_id === entity.id));
    const devicesWithoutCarrier = data.entities.filter(entity => entity.type_entite === 'dispositif' && !data.relations.some(relation => relation.cible_entite === entity.id && ['pilote','porte','gere','met_en_oeuvre'].includes(relation.type_relation)));
    const qualityMetrics = [
      ['Fiches sourcées',`${q.indicateurs.taux_fiches_sourcees} %`,'Référence déclarée, pas validation juridique'],
      ['Relations sourcées',`${q.indicateurs.taux_relations_sourcees} %`,'Présence d’au moins une preuve'],
      ['Affirmations sourcées',`${Math.round(data.claims.filter(row => row.sources.length).length/data.claims.length*100)} %`,'Source primaire analysée séparément'],
      ['Sans source primaire',data.stats.claims_without_primary,'Champ source_primaire absent'],
      ['Relations non confirmées',provisionalRelations.length,'Probables, provisoires ou à vérifier'],
      ['Entités isolées',q.details.entites_orphelines.length,'Aucune relation ou affirmation'],
      ['Aliases ambigus',q.details.aliases_ambigus,'Fusion automatique interdite'],
      ['Liens générés cassés',q.indicateurs.liens_generes_casses,'Contrôle à la génération']
    ];
    $('[data-quality]').innerHTML = `<div class="quality-grid">${qualityMetrics.map(([label,value,note]) => `<article class="metric ${Number(value) ? 'alert' : ''}"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small></article>`).join('')}</div>
      <p class="interpretation">${esc(q.interpretation)}</p>
      <div class="issue-grid">
        ${issueCard('Affirmations sans source primaire',data.claims.filter(row => !row.source_primaire),'claim')}
        ${issueCard('Relations non confirmées',provisionalRelations,'relation')}
        ${issueCard('Entités isolées',q.details.entites_orphelines)}
        ${issueCard('Fiches jamais vérifiées',data.freshness.fiches_jamais_verifiees)}
        ${issueCard('Fiches anciennes',data.freshness.fiches_plus_3_mois)}
        ${issueCard('Anomalies de cohérence',data.coherence.issues)}
        ${issueCard('Aliases ambigus',data.alias_conflicts.map(row => ({id:row.alias,label:`${row.alias} → ${row.candidates.join(', ')}`})),'alias')}
        ${issueCard('Doublons possibles / réconciliations',data.reconciliation.map(row => ({id:row.id,label:row.libelle || row.id})),'reconciliation')}
        ${issueCard('Chronologies incomplètes',incompleteTimelines)}
        ${issueCard('Dispositifs sans porteur documenté',devicesWithoutCarrier)}
        ${issueCard('Opérations sans territoire',data.entities.filter(row => row.type_entite === 'operation' && !row.territoires.length))}
        ${issueCard('Financements sans validité',data.entities.filter(row => row.type_entite === 'financement' && !row.date_validite))}
      </div>`;
  }

  function renderSources() {
    const query = normalize($('[data-source-search]').value), status = $('[data-source-status]').value, frequency = $('[data-source-frequency]').value;
    const rows = data.sources.filter(source => (!query || normalize(JSON.stringify(source)).includes(query)) && (status === 'all' || source.qualification.evidence === status) && (frequency === 'all' || source.qualification.frequence_surveillance_recommandee === frequency));
    $('[data-source-count]').textContent = `${rows.length} source(s) · ${rows.filter(row => row.qualification.evidence === 'observed').length} observée(s)`;
    $('[data-sources]').innerHTML = rows.map(source => {
      const q = source.qualification, qualification = q.evidence === 'observed' ? 'qualification_observee' : 'qualification_provisoire';
      return `<tr class="${q.evidence === 'provisional' ? 'row-warning' : ''}"><td>${openButton('source',source.id,source.nom)}<small class="cell-note">${esc(source.organisme)}</small></td><td>${esc(human(source.type_source))}<small class="cell-note">${esc((source.territoire || []).join(', '))}</small></td><td>Niveau ${source.niveau_priorite}<small class="cell-note">indice ${q.indice_priorite}/100</small></td><td>${esc(human(q.frequence_surveillance_recommandee))}</td><td>${q.indice_confiance}/100</td><td>${q.indice_bruit}/100</td><td>${q.indice_pertinence}/100<small class="cell-note">estimation</small></td><td>${q.temps_total_par_controle} min</td><td>${badge(qualification)}${q.evidence === 'observed' ? '<small class="cell-note">Corpus disponible</small>' : '<small class="cell-note">Recalibration requise</small>'}</td></tr>`;
    }).join('');
    state.exports.set('sources',{rows:rows.map(source => ({id:source.id,name:source.nom,type:source.type_source,territory:(source.territoire||[]).join('|'),priority:source.niveau_priorite,frequency:source.qualification.frequence_surveillance_recommandee,confidence:source.qualification.indice_confiance,noise:source.qualification.indice_bruit,utility:source.qualification.indice_pertinence,time:source.qualification.temps_total_par_controle,qualification:source.qualification.evidence})),columns:['id','name','type','territory','priority','frequency','confidence','noise','utility','time','qualification']});
  }

  function renderSourceMatrices() {
    const frequencies = countBy(data.sources, row => row.qualification.frequence_surveillance_recommandee);
    const themes = unique(data.sources.flatMap(row => row.thematiques)).sort();
    const confidenceBands = countBy(data.sources, row => row.qualification.indice_confiance >= 85 ? '85–100' : row.qualification.indice_confiance >= 70 ? '70–84' : '< 70');
    const qualifications = countBy(data.sources, row => row.qualification.evidence === 'observed' ? 'Observée' : 'Provisoire');
    const smallTable = (title,items) => `<article class="mini-matrix"><h3>${esc(title)}</h3><table><tbody>${Object.entries(items).map(([label,value]) => `<tr><td>${esc(human(label))}</td><td><strong>${value}</strong></td></tr>`).join('')}</tbody></table></article>`;
    $('[data-source-matrices]').innerHTML = `${smallTable('Sources × fréquence',frequencies)}${smallTable('Sources × confiance',confidenceBands)}${smallTable('Sources × qualification',qualifications)}<article class="mini-matrix"><h3>Sources × thèmes</h3><table><tbody>${data.sources.map(source => `<tr><td>${openButton('source',source.id,source.nom)}</td><td><div class="theme-dots">${source.thematiques.map(theme => `<span>${esc(theme)}</span>`).join('')}</div></td></tr>`).join('')}</tbody></table><p class="interpretation">Registre déclaratif de qualification, pas mesure de contenu observé sauf pour l'ANAH.</p></article>`;
  }

  function renderSuggestions() {
    const query = normalize($('[data-suggestion-search]').value), type = $('[data-suggestion-type]').value, status = $('[data-suggestion-status]').value, priority = $('[data-suggestion-priority]').value;
    const rows = data.suggestions.filter(row => (!query || normalize(JSON.stringify(row)).includes(query)) && (type === 'all' || row.type_suggestion === type) && (status === 'all' || row.statut === status) && (priority === 'all' || priority === 'high' && (row.importance?.score >= 75 || row.confidence === 'fort') || priority === 'low-confidence' && row.confidence === 'faible'));
    $('[data-suggestion-count]').textContent = `${rows.length} suggestion(s) · 0 appliquée automatiquement`;
    $('[data-suggestions]').innerHTML = rows.length ? rows.map(row => `<tr class="${row.confidence === 'faible' || row.statut === 'a_verifier' ? 'row-warning' : ''}"><td>${row.publication ? openButton('publication',row.publication,row.publication) : esc(row.source || '—')}<small class="cell-note">${esc(human(row.origin))}</small></td><td>${esc(human(row.type_suggestion))}</td><td>${row.target ? openButton('entity',row.target,row.target) : '—'}<small class="cell-note">${esc(row.champ_cible || 'champ non précisé')}</small></td><td>${esc(typeof row.proposed_value === 'object' ? JSON.stringify(row.proposed_value) : row.proposed_value || '—')}</td><td>${openButton('suggestion',row.id,row.justification)}</td><td>${badge(row.confidence)}</td><td>${badge(row.statut)}</td><td><button type="button" disabled>Accepter</button> <button type="button" disabled>Refuser</button><small class="cell-note">Phase ultérieure historisée</small></td></tr>`).join('') : '<tr><td colspan="8"><p class="empty">Aucune suggestion ne correspond aux filtres.</p></td></tr>';
    state.exports.set('suggestions',{rows:rows.map(row => ({id:row.id,publication:row.publication,type:row.type_suggestion,target:row.target,field:row.champ_cible,proposed_value:typeof row.proposed_value === 'object' ? JSON.stringify(row.proposed_value) : row.proposed_value,justification:row.justification,confidence:row.confidence,status:row.statut})),columns:['id','publication','type','target','field','proposed_value','justification','confidence','status']});
  }

  function renderMatrix() {
    const matrix = data.matrices[state.matrix], query = normalize($('[data-matrix-search]').value), coverage = $('[data-matrix-coverage]').value, sortMode = $('[data-matrix-sort]').value;
    const originalRows = matrix.rows.map((row,index) => ({...row,index,density:matrix.values[index].reduce((a,b)=>a+b,0)}));
    const originalColumns = matrix.columns.map((column,index) => ({...column,index,density:matrix.values.reduce((sum,row)=>sum+row[index],0)}));
    const rowMatches = originalRows.filter(row => !query || normalize(`${row.id} ${row.label}`).includes(query));
    const columnMatches = originalColumns.filter(column => !query || normalize(`${column.id} ${column.label}`).includes(query));
    let rows = rowMatches.length ? rowMatches : query && columnMatches.length ? originalRows : [];
    let columns = columnMatches.length ? columnMatches : query && rowMatches.length ? originalColumns : [];
    const sortRows = (a,b) => sortMode === 'density-desc' ? b.density-a.density || a.label.localeCompare(b.label,'fr') : sortMode === 'density-asc' ? a.density-b.density || a.label.localeCompare(b.label,'fr') : a.label.localeCompare(b.label,'fr');
    rows.sort(sortRows);
    const filled = matrix.values.flat().filter(Boolean).length, total = matrix.rows.length * matrix.columns.length, coverageRate = total ? Math.round(filled/total*1000)/10 : 0;
    $('[data-matrix-count]').textContent = `${rows.length} ligne(s) × ${columns.length} colonne(s)`;
    $('[data-matrix]').innerHTML = rows.length && columns.length ? `<div class="matrix-summary"><div><span>Cellules</span><strong>${total}</strong></div><div><span>Renseignées</span><strong>${filled}</strong></div><div><span>Vides</span><strong>${total-filled}</strong></div><div><span>Couverture</span><strong>${coverageRate} %</strong></div></div><div class="table-wrap"><table class="matrix-table"><thead><tr><th>Ligne / colonne</th>${columns.map(column => `<th>${entityById.has(column.id) ? openButton('entity',column.id,column.label) : esc(column.label)}<small class="cell-note">${column.density}</small></th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr><th>${entityById.has(row.id) ? openButton('entity',row.id,row.label) : esc(row.label)}<small class="cell-note">${row.density}/${matrix.columns.length}</small></th>${columns.map(column => { const value = matrix.values[row.index][column.index]; const hiddenValue = coverage === 'filled' && !value || coverage === 'empty' && value; return `<td class="${value ? 'matrix-filled' : 'matrix-empty'}"><button type="button" ${entityById.has(row.id) ? `data-open-kind="entity" data-open-id="${esc(row.id)}"` : ''} aria-label="${esc(row.label)} × ${esc(column.label)} : ${value ? 'documenté' : 'non documenté'}">${hiddenValue ? '' : value ? '●' : '·'}</button></td>`; }).join('')}</tr>`).join('')}</tbody></table></div><p class="interpretation">Les densités décrivent uniquement les relations enregistrées dans la base. Une cellule vide n'établit aucune absence dans le monde réel.</p>` : '<p class="empty">Aucune ligne ou colonne ne correspond à la recherche.</p>';
    const exportRows = rows.map(row => Object.fromEntries([['id',row.id],['label',row.label],...columns.map(column => [column.id,matrix.values[row.index][column.index]])]));
    state.exports.set('matrix',{rows:exportRows,columns:['id','label',...columns.map(column => column.id)]});
  }

  function renderTerritories() {
    const byParent = new Map();
    data.territories.forEach(territory => { const parent = territory.parent || 'root'; if (!byParent.has(parent)) byParent.set(parent,[]); byParent.get(parent).push(territory); });
    const renderNode = territory => `<li><article class="territory-node"><header><div><span class="kicker">${esc(human(territory.level))}</span><h3>${openButton('entity',territory.id,territory.label)}</h3></div>${badge(territory.id)}</header><div class="territory-counts">${Object.entries(territory.counts).map(([type,count]) => `<span>${esc(human(type))} · ${count}</span>`).join('') || '<span>Aucune fiche reliée</span>'}${territory.local_sources.map(id => `<span>Source locale · ${esc(id)}</span>`).join('')}</div>${territory.missing.length ? `<p class="territory-missing">Fiches manquantes : ${esc(territory.missing.join(', '))}</p>` : ''}</article>${byParent.has(territory.id) ? `<ul>${byParent.get(territory.id).sort((a,b)=>a.label.localeCompare(b.label,'fr')).map(renderNode).join('')}</ul>` : ''}</li>`;
    const roots = data.territories.filter(territory => !territory.parent || !entityById.has(territory.parent));
    $('[data-territories]').innerHTML = `<ul class="territory-tree">${roots.map(renderNode).join('')}</ul><p class="interpretation">Cette vue représente la hiérarchie documentaire France → région → département → métropole → commune. Elle n'est pas une carte et n'utilise aucune coordonnée.</p>`;
  }

  function searchAll(query) {
    const terms = normalize(query).split(' ').filter(Boolean);
    if (!terms.length) return [];
    const groups = [
      ['entity',data.entities,row => [row.nom,...row.aliases,row.description_complete,row.type_entite]],
      ['relation',data.relations,row => [row.id,row.source_entite,row.type_relation,row.cible_entite,row.justification,...row.sources]],
      ['claim',data.claims,row => [row.id,row.sujet,row.predicat,row.objet,row.texte_affirmation,...row.sources]],
      ['event',data.events,row => [row.id,row.texte,row.type,row.entity_id,...row.sources]],
      ['source',data.sources,row => [row.id,row.nom,row.organisme,...row.thematiques,...row.territoire]],
      ['suggestion',data.suggestions,row => [row.id,row.publication,row.type_suggestion,row.target,row.justification]]
    ];
    return groups.flatMap(([kind,rows,text]) => rows.map(row => { const haystack = normalize(text(row).filter(Boolean).join(' ')); return {kind,id:row.id,score:terms.filter(term=>haystack.includes(term)).length,row}; })).filter(result => result.score > 0).sort((a,b)=>b.score-a.score || a.id.localeCompare(b.id));
  }

  function searchResultLabel(result) {
    const row = result.row;
    if (result.kind === 'entity') return [row.nom,row.description_complete];
    if (result.kind === 'relation') return [`${row.source_entite} ${human(row.type_relation)} ${row.cible_entite}`,row.justification];
    if (result.kind === 'claim') return [row.texte_affirmation,`${row.sujet} · ${human(row.predicat)} · ${row.objet}`];
    if (result.kind === 'event') return [row.texte,`${dateFr(row.date)} · ${human(row.type)}`];
    if (result.kind === 'source') return [row.nom,`${row.organisme} · ${row.thematiques.join(', ')}`];
    return [row.justification,`${row.publication || 'suggestion manuelle'} · ${human(row.type_suggestion)}`];
  }

  function renderSearch() {
    const query = $('[data-search-page]').value;
    const results = searchAll(query);
    const grouped = Object.entries(countBy(results,'kind'));
    $('[data-search-count]').textContent = query ? `${results.length} résultat(s) dans ${grouped.length} groupe(s)` : 'Saisissez au moins un terme';
    $('[data-search-results]').innerHTML = results.length ? grouped.map(([kind]) => {
      const rows = results.filter(result => result.kind === kind).slice(0,80);
      return `<section class="search-group"><h2>${esc(human(kind))}<span>${rows.length}</span></h2>${rows.map(result => { const [title,note] = searchResultLabel(result); return `<article class="search-item"><code>${esc(result.id)}</code><div><strong>${esc(title)}</strong><p>${esc(note)}</p></div>${openButton(result.kind,result.id,'Ouvrir')}</article>`; }).join('')}</section>`;
    }).join('') : query ? '<p class="empty">Aucun résultat. Vérifiez les aliases ou essayez un terme plus large.</p>' : '';
  }

  function renderGaps() {
    const priority = $('[data-gap-priority]').value, category = $('[data-gap-category]').value, query = normalize($('[data-gap-search]').value);
    const rows = data.gaps.filter(gap => (priority === 'all' || gap.priority === priority) && (category === 'all' || gap.category === category) && (!query || normalize(JSON.stringify(gap)).includes(query)));
    const counts = countBy(data.gaps,'priority');
    $('[data-gap-count]').textContent = `${rows.length} lacune(s) affichée(s)`;
    $('[data-gaps]').innerHTML = `<div class="gap-summary">${['critique','haute','moyenne','faible'].map(level => `<div><span>${esc(human(level))}</span><strong>${counts[level] || 0}</strong></div>`).join('')}</div><div class="gap-list">${rows.length ? rows.map(gap => `<article class="gap-item"><span>${badge(gap.priority)}</span><span class="gap-category">${esc(human(gap.category))}</span><div><h3>${esc(gap.label)}</h3><p>${esc(gap.explanation)}</p></div>${gap.target_id ? openButton(gap.target_kind,gap.target_id,'Examiner') : ''}</article>`).join('') : '<p class="empty">Aucune lacune ne correspond aux filtres.</p>'}</div>`;
    state.exports.set('gaps',{rows,columns:['id','priority','category','target_kind','target_id','label','explanation']});
  }

  function renderComparison() {
    const comparison = data.snapshots.comparison;
    const cards = [
      ['Entités ajoutées',comparison.entities_added],['Entités retirées',comparison.entities_removed],['Relations ajoutées',comparison.relations_added],
      ['Relations supprimées',comparison.relations_removed],['Affirmations ajoutées',comparison.claims_added],['Affirmations retirées',comparison.claims_removed],
      ['Incertitudes nouvelles',comparison.uncertainties_added],['Incertitudes résolues',comparison.uncertainties_resolved]
    ];
    const snapshot = (title,row) => `<article class="snapshot"><h2>${esc(title)}</h2><span>${esc(row.label)} · ${esc(row.date)}</span><div class="snapshot-counts"><div><span>Entités</span><strong>${row.entities}</strong></div><div><span>Relations</span><strong>${row.relations}</strong></div><div><span>Affirmations</span><strong>${row.claims}</strong></div></div></article>`;
    $('[data-comparison]').innerHTML = `<div class="comparison-head">${snapshot('Avant',comparison.reference)}<span class="comparison-arrow" aria-hidden="true">→</span>${snapshot('Après',comparison.current)}</div><div class="diff-grid">${cards.map(([title,ids]) => `<article class="diff-card"><h3>${esc(title)}<span>${ids.length}</span></h3>${ids.length ? `<ul>${ids.map(id => `<li>${entityById.has(id)?openButton('entity',id,id):relationById.has(id)?openButton('relation',id,id):claimById.has(id)?openButton('claim',id,id):esc(id)}</li>`).join('')}</ul>` : '<p class="empty">Aucun changement</p>'}</article>`).join('')}<article class="diff-card"><h3>Sources recalibrées<span>${comparison.sources_recalibrated}</span></h3><p>${comparison.sources_recalibrated ? 'La qualification observée a progressé.' : 'Aucune nouvelle source observée depuis la référence.'}</p></article></div><p class="interpretation">La photographie compare les identifiants stables. Elle ne remplace pas un historique champ par champ ; ce dernier est reporté à une phase ultérieure.</p>`;
  }

  function detailSection(title, content) { return `<section class="detail-section"><h3>${esc(title)}</h3>${content}</section>`; }
  function detailList(rows) { return `<dl class="detail-list">${rows.map(([term,value]) => `<dt>${esc(term)}</dt><dd>${value ?? '—'}</dd>`).join('')}</dl>`; }

  function openDetail(kind,id) {
    let title = id, body = '', label = human(kind);
    if (kind === 'entity') {
      const row = entityById.get(id); if (!row) { showToast(`Entité inconnue : ${id}`); return; }
      title = row.nom; label = row.type_entite;
      const incoming = data.relations.filter(relation => relation.cible_entite === id), outgoing = data.relations.filter(relation => relation.source_entite === id);
      const claims = data.claims.filter(claim => claim.sujet === id || claim.objet === id), timelines = data.timelines.filter(timeline => timeline.entite_id === id);
      body = detailSection('Identification',detailList([['Identifiant',`<code>${esc(row.id)}</code>`],['Type',badge(row.type_entite)],['Statut',badge(row.statut)],['Confiance',badge(row.niveau_confiance)],['Dernière vérification',esc(dateFr(row.date_derniere_verification))]])) +
        detailSection('Description',`<p>${esc(row.description_complete || row.description_courte)}</p>`) +
        detailSection('Sources',`<div class="detail-links">${row.sources_principales.map(source => `<span class="badge">${esc(source)}</span>`).join('') || 'Aucune'}</div>`) +
        detailSection(`Relations sortantes · ${outgoing.length}`,`<ul class="compact-list">${outgoing.map(relation => `<li>${openButton('relation',relation.id,`${human(relation.type_relation)} → ${entityById.get(relation.cible_entite)?.nom || relation.cible_entite}`)}</li>`).join('') || '<li>Aucune</li>'}</ul>`) +
        detailSection(`Relations entrantes · ${incoming.length}`,`<ul class="compact-list">${incoming.map(relation => `<li>${openButton('relation',relation.id,`${entityById.get(relation.source_entite)?.nom || relation.source_entite} → ${human(relation.type_relation)}`)}</li>`).join('') || '<li>Aucune</li>'}</ul>`) +
        detailSection(`Affirmations · ${claims.length}`,`<ul class="compact-list">${claims.map(claim => `<li>${openButton('claim',claim.id,claim.texte_affirmation)}</li>`).join('') || '<li>Aucune</li>'}</ul>`) +
        detailSection(`Chronologies · ${timelines.length}`,`<ul class="compact-list">${timelines.map(timeline => `<li>${esc(timeline.titre)} · ${timeline.evenements.length} jalon(s)</li>`).join('') || '<li>Aucune chronologie canonique</li>'}</ul>`) +
        detailSection('Éléments à vérifier',`<ul>${row.elements_a_verifier.map(item => `<li>${esc(item)}</li>`).join('') || '<li>Aucun élément signalé</li>'}</ul>`) +
        (row.markdown ? detailSection('Fiche source',`<a href="${esc(row.markdown.href)}">Ouvrir la fiche Markdown</a>`) : '');
    } else if (kind === 'relation') {
      const row = relationById.get(id) || data.graph.edges.find(edge => edge.id === id); if (!row) return showToast(`Relation inconnue : ${id}`);
      title = id; label = 'Relation';
      const sourceId = row.source_entite || row.source, targetId = row.cible_entite || row.target;
      body = detailSection('Relation',detailList([['Source',entityById.has(sourceId)?openButton('entity',sourceId,entityById.get(sourceId).nom):`<code>${esc(sourceId)}</code>`],['Type',esc(human(row.type_relation || row.type))],['Cible',entityById.has(targetId)?openButton('entity',targetId,entityById.get(targetId).nom):`<code>${esc(targetId)}</code>`],['Statut',badge(row.statut_relation || row.statut)],['Confiance',badge(row.niveau_confiance || row.confiance)],['Début',esc(row.date_debut || '—')],['Fin',esc(row.date_fin || '—')],['Vérifiée',esc(row.date_verification || '—')]])) + detailSection('Justification',`<p>${esc(row.justification || 'Arête documentaire générée ; consulter son type et ses extrémités.')}</p>`) + detailSection('Sources',`<div class="detail-links">${(row.sources || row.preuves || []).map(source => `<span class="badge">${esc(source)}</span>`).join('') || 'Non renseignées sur cette arête documentaire'}</div>`);
    } else if (kind === 'claim') {
      const row = claimById.get(id); if (!row) return showToast(`Affirmation inconnue : ${id}`);
      title = row.texte_affirmation; label = 'Affirmation';
      body = detailSection('Proposition',detailList([['Identifiant',`<code>${esc(row.id)}</code>`],['Sujet',openButton('entity',row.sujet,entityById.get(row.sujet)?.nom || row.sujet)],['Prédicat',esc(human(row.predicat))],['Objet',entityById.has(row.objet)?openButton('entity',row.objet,entityById.get(row.objet).nom):esc(row.objet)],['Statut',badge(row.statut)],['Confiance',badge(row.niveau_confiance)],['Source primaire',row.source_primaire ? `<code>${esc(row.source_primaire)}</code>` : '<span class="no-primary">Absente</span>'],['Vérification requise',row.verification_requise ? 'Oui' : 'Non'],['Validité',`${esc(row.date_debut_validite || '—')} → ${esc(row.date_fin_validite || '—')}`]])) + detailSection('Sources déclarées',`<div class="detail-links">${row.sources.map(source => `<span class="badge">${esc(source)}</span>`).join('')}</div>`) + detailSection('Notes',`<p>${esc(row.notes || 'Aucune')}</p>`);
    } else if (kind === 'source') {
      const row = sourceById.get(id); if (!row) return openDetail('entity',id);
      title = row.nom; label = 'Source'; const q = row.qualification;
      body = detailSection('Qualification',detailList([['Organisme',esc(row.organisme)],['Type',esc(human(row.type_source))],['Territoire',esc(row.territoire.join(', '))],['Priorité',`${row.niveau_priorite} · ${q.indice_priorite}/100`],['Fréquence',esc(human(q.frequence_surveillance_recommandee))],['Confiance',`${q.indice_confiance}/100`],['Bruit',`${q.indice_bruit}/100`],['Pertinence estimée',`${q.indice_pertinence}/100`],['Temps',`${q.temps_total_par_controle} min`],['Statut',badge(q.evidence === 'observed'?'qualification_observee':'qualification_provisoire')],['Corpus observé',q.mesures_observees ? `${q.mesures_observees.articles} articles` : 'Non']])) + detailSection('Justification',`<p>${esc(q.justification)}</p>`) + detailSection('Thèmes',`<div class="detail-links">${row.thematiques.map(theme => `<span class="badge">${esc(theme)}</span>`).join('')}</div>`) + detailSection('Accès',`<a href="${esc(row.url_principale)}" target="_blank" rel="noreferrer">Site principal</a>`);
    } else if (kind === 'publication') {
      const row = publicationById.get(id); if (!row) return showToast(`Publication inconnue : ${id}`);
      title = row.title; label = 'Publication ANAH';
      const suggestions = data.suggestions.filter(suggestion => suggestion.publication === id);
      body = detailSection('Publication',detailList([['Identifiant',`<code>${esc(row.id)}</code>`],['Date',esc(dateFr(row.date))],['Nature',esc(human(row.nature))],['Statut',badge(row.status)],['Confiance',badge(row.confidence)],['Vérification',row.verification_required?'Requise':'Non signalée']])) + detailSection('Résumé',`<p>${esc(row.summary)}</p>`) + detailSection(`Suggestions · ${suggestions.length}`,`<ul>${suggestions.map(suggestion => `<li>${openButton('suggestion',suggestion.id,human(suggestion.type_suggestion))}</li>`).join('') || '<li>Aucune</li>'}</ul>`) + detailSection('Source',`<a href="${esc(row.url)}" target="_blank" rel="noreferrer">Ouvrir la publication ANAH</a>`);
    } else if (kind === 'suggestion') {
      const row = data.suggestions.find(suggestion => suggestion.id === id); if (!row) return showToast(`Suggestion inconnue : ${id}`);
      title = human(row.type_suggestion); label = 'Suggestion · lecture seule';
      body = detailSection('Proposition',detailList([['Identifiant',`<code>${esc(row.id)}</code>`],['Publication',row.publication?openButton('publication',row.publication,row.publication):esc(row.source||'—')],['Cible',row.target?openButton('entity',row.target,row.target):'—'],['Champ',esc(row.champ_cible||'—')],['Confiance',badge(row.confidence)],['Statut',badge(row.statut)],['Appliquée automatiquement','Non']])) + detailSection('Justification',`<p>${esc(row.justification)}</p>`) + detailSection('Valeur proposée',`<pre>${esc(typeof row.proposed_value === 'object'?JSON.stringify(row.proposed_value,null,2):row.proposed_value||'Non renseignée')}</pre>`) + '<div class="readonly-notice">Accepter, refuser, corriger et reporter seront disponibles uniquement avec journal sécurisé.</div>';
    } else if (kind === 'event') {
      const row = data.events.find(event => event.id === id); if (!row) return showToast(`Événement inconnu : ${id}`);
      title = row.texte; label = 'Événement';
      body = detailSection('Jalon',detailList([['Identifiant',`<code>${esc(row.id)}</code>`],['Date',esc(dateFr(row.date))],['Type',esc(human(row.type))],['Statut',badge(row.statut)],['Confiance',badge(row.confidence)],['Entité',row.entity_id?openButton('entity',row.entity_id,entityById.get(row.entity_id)?.nom||row.entity_id):'—']])) + detailSection('Sources',`<div class="detail-links">${row.sources.map(source => `<span class="badge">${esc(source)}</span>`).join('')}</div>`);
    } else if (kind === 'gap') {
      const row = data.gaps.find(gap => gap.id === id); if (!row) return; title = row.label; label = `Lacune ${row.priority}`;
      body = detailSection('Diagnostic',detailList([['Catégorie',esc(human(row.category))],['Priorité',badge(row.priority)],['Cible',esc(row.target_id||'—')]])) + detailSection('Explication',`<p>${esc(row.explanation)}</p>`);
    } else if (kind === 'alias') {
      const row = data.alias_conflicts.find(conflict => conflict.alias === id); if (!row) return; title = row.alias; label = 'Alias ambigu';
      body = detailSection('Candidats',`<ul>${row.candidates.map(candidate => `<li>${openButton('entity',candidate,entityById.get(candidate)?.nom||candidate)}</li>`).join('')}</ul>`) + '<p class="interpretation">Aucune fusion automatique n’est autorisée.</p>';
    } else if (kind === 'reconciliation') {
      const row = data.reconciliation.find(item => item.id === id); if (!row) return; title = row.libelle || row.id; label = 'Réconciliation ouverte';
      body = `<pre>${esc(JSON.stringify(row,null,2))}</pre><p class="interpretation">Décision humaine requise ; aucune fusion automatique.</p>`;
    } else return showToast(`Type de détail non pris en charge : ${kind}`);
    $('[data-detail-kind]').textContent = human(label);
    $('[data-detail-title]').textContent = title;
    $('[data-detail-body]').innerHTML = body;
    $('[data-detail]').hidden = false;
    $('[data-detail-close]').focus();
  }

  function csvValue(value) { const text = Array.isArray(value) ? value.join('|') : value == null ? '' : String(value); return `"${text.replaceAll('"','""')}"`; }
  function download(name,content,type) {
    const link = document.createElement('a'), url = URL.createObjectURL(new Blob([content],{type}));
    link.href = url; link.download = name; document.body.append(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function exportView(key) {
    const payload = state.exports.get(key); if (!payload) return showToast('Aucune donnée filtrée à exporter dans cette vue.');
    const csv = [payload.columns.map(csvValue).join(','),...payload.rows.map(row => payload.columns.map(column => csvValue(row[column])).join(','))].join('\r\n');
    download(`${key}-${data.meta.as_of}.csv`,`\ufeff${csv}`,'text/csv;charset=utf-8'); showToast('Export CSV préparé depuis la vue filtrée.');
  }
  function exportSubgraph() {
    const nodes = data.graph.nodes.filter(nodeMatchesGraph), ids = new Set(nodes.map(node=>node.id)), edges = data.graph.edges.filter(edge=>ids.has(edge.source)&&ids.has(edge.target));
    download(`sous-graphe-${data.meta.as_of}.json`,JSON.stringify({date:data.meta.as_of,mode:state.graph.mode,nodes,edges},null,2),'application/json'); showToast('Sous-graphe JSON exporté.');
  }

  function bindFilters() {
    setOptions($('[data-graph-type]'),unique(data.graph.nodes.map(node=>node.kind==='entity'?node.type:node.kind)).sort());
    setOptions($('[data-graph-territory]'),data.entities.filter(row=>row.type_entite==='territoire').map(row=>({id:row.id,label:row.nom})),'Tous les territoires');
    setOptions($('[data-graph-confidence]'),unique(data.graph.nodes.map(row=>row.confiance)).sort(),'Toutes');
    setOptions($('[data-graph-status]'),unique(data.graph.nodes.map(row=>row.statut)).sort(),'Tous');
    setOptions($('[data-graph-source]'),data.sources.map(row=>({id:row.id,label:row.nom})),'Toutes les sources');
    setOptions($('[data-graph-period]'),unique(data.publications.map(row=>row.date?.slice(0,4))).sort().reverse(),'Toutes les années');
    setOptions($('[data-graph-temporal]'),['actuel','historique','futur'],'Toutes');
    Object.entries({query:'[data-graph-search]',type:'[data-graph-type]',territory:'[data-graph-territory]',confidence:'[data-graph-confidence]',status:'[data-graph-status]',source:'[data-graph-source]',period:'[data-graph-period]',temporal:'[data-graph-temporal]'}).forEach(([key,selector]) => { const control=$(selector); control.value=state.graph[key]; control.addEventListener('input',()=>{state.graph[key]=control.value; state.graph.pathNodes.clear(); state.graph.pathEdges.clear(); syncUrl(); renderGraph();}); });
    $('[data-graph-presets]').innerHTML = Object.entries(graphModes).map(([id,mode])=>`<button type="button" data-graph-mode="${id}" aria-pressed="${id===state.graph.mode}">${esc(mode.label)}</button>`).join('');
    $('[data-graph-presets]').addEventListener('click',event=>{const button=event.target.closest('[data-graph-mode]');if(!button)return;state.graph.mode=button.dataset.graphMode;$$('[data-graph-mode]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));syncUrl();renderGraph();});

    $('[data-timeline-presets]').innerHTML = Object.entries(timelinePresets).map(([id,preset])=>`<button type="button" data-timeline-theme="${id}" aria-pressed="${id===state.timelineTheme}">${esc(preset.label)}</button>`).join('');
    $('[data-timeline-presets]').addEventListener('click',event=>{const button=event.target.closest('[data-timeline-theme]');if(!button)return;state.timelineTheme=button.dataset.timelineTheme;$$('[data-timeline-theme]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));syncUrl();renderTimeline();});
    setOptions($('[data-timeline-entity]'),data.timelines.map(row=>({id:row.entite_id,label:row.titre})),'Toutes les entités');
    setOptions($('[data-timeline-source]'),unique(data.events.flatMap(row=>row.sources)).sort(),'Toutes les sources');
    setOptions($('[data-timeline-status]'),unique(data.events.map(row=>row.statut)).sort(),'Tous');
    setOptions($('[data-timeline-year]'),unique([...data.events.map(row=>row.date?.slice(0,4)),...data.publications.map(row=>row.date?.slice(0,4))]).sort().reverse(),'Toutes les années');
    setOptions($('[data-timeline-confidence]'),unique(data.events.map(row=>row.confidence)).sort(),'Toutes');
    $$('[data-timeline-entity],[data-timeline-source],[data-timeline-status],[data-timeline-year],[data-timeline-confidence]').forEach(control=>control.addEventListener('change',renderTimeline));

    setOptions($('[data-claim-status]'),unique(data.claims.map(row=>row.statut)).sort(),'Tous');
    setOptions($('[data-claim-confidence]'),unique(data.claims.map(row=>row.niveau_confiance)).sort(),'Toutes');
    $$('[data-claim-search],[data-claim-status],[data-claim-confidence],[data-claim-control]').forEach(control=>control.addEventListener('input',renderClaims));

    setOptions($('[data-source-frequency]'),unique(data.sources.map(row=>row.qualification.frequence_surveillance_recommandee)).sort(),'Toutes');
    $$('[data-source-search],[data-source-status],[data-source-frequency]').forEach(control=>control.addEventListener('input',renderSources));

    setOptions($('[data-suggestion-type]'),unique(data.suggestions.map(row=>row.type_suggestion)).sort(),'Tous');
    setOptions($('[data-suggestion-status]'),unique(data.suggestions.map(row=>row.statut)).sort(),'Tous');
    $$('[data-suggestion-search],[data-suggestion-type],[data-suggestion-status],[data-suggestion-priority]').forEach(control=>control.addEventListener('input',renderSuggestions));

    $('[data-matrix-select]').innerHTML = Object.keys(data.matrices).map(name=>`<option value="${esc(name)}">${esc(human(name))}</option>`).join('');
    $('[data-matrix-select]').addEventListener('change',event=>{state.matrix=event.target.value;renderMatrix();});
    $$('[data-matrix-search],[data-matrix-coverage],[data-matrix-sort]').forEach(control=>control.addEventListener('input',renderMatrix));

    setOptions($('[data-gap-category]'),unique(data.gaps.map(row=>row.category)).sort(),'Toutes les catégories');
    $$('[data-gap-priority],[data-gap-category],[data-gap-search]').forEach(control=>control.addEventListener('input',renderGaps));
    $('[data-search-page]').addEventListener('input',renderSearch);
  }

  function bindGraphInteractions() {
    const svg = $('[data-graph]'); let pan = null;
    svg.addEventListener('click',event=>{
      const node=event.target.closest('[data-graph-node]'),edge=event.target.closest('[data-graph-edge]');
      if(node){const id=node.dataset.graphNode;if(event.shiftKey){state.graph.selected.has(id)?state.graph.selected.delete(id):state.graph.selected.add(id);while(state.graph.selected.size>2)state.graph.selected.delete(state.graph.selected.values().next().value);state.graph.pathNodes.clear();state.graph.pathEdges.clear();renderGraph();}else openDetail(graphNodeById.get(id)?.kind==='claim'?'claim':graphNodeById.get(id)?.kind==='publication'?'publication':graphNodeById.get(id)?.kind==='entity'?'entity':'relation',id);}
      else if(edge)openDetail('relation',edge.dataset.graphEdge);
    });
    svg.addEventListener('pointerdown',event=>{if(event.target.closest('[data-graph-node],[data-graph-edge]'))return;pan={x:event.clientX,y:event.clientY,ox:state.graph.transform.x,oy:state.graph.transform.y};svg.setPointerCapture(event.pointerId);svg.classList.add('is-panning');});
    svg.addEventListener('pointermove',event=>{if(!pan)return;state.graph.transform.x=pan.ox+(event.clientX-pan.x)/state.graph.transform.scale;state.graph.transform.y=pan.oy+(event.clientY-pan.y)/state.graph.transform.scale;applyGraphTransform();});
    svg.addEventListener('pointerup',()=>{pan=null;svg.classList.remove('is-panning');});
    svg.addEventListener('wheel',event=>{event.preventDefault();state.graph.transform.scale=Math.max(.35,Math.min(4,state.graph.transform.scale*(event.deltaY>0?.88:1.14)));applyGraphTransform();},{passive:false});
    $('[data-zoom-in]').addEventListener('click',()=>{state.graph.transform.scale=Math.min(4,state.graph.transform.scale*1.25);applyGraphTransform();});
    $('[data-zoom-out]').addEventListener('click',()=>{state.graph.transform.scale=Math.max(.35,state.graph.transform.scale/1.25);applyGraphTransform();});
    $('[data-graph-reset]').addEventListener('click',()=>{state.graph.transform={x:0,y:0,scale:1};state.graph.selected.clear();state.graph.pathNodes.clear();state.graph.pathEdges.clear();renderGraph();});
    $('[data-graph-path]').addEventListener('click',shortestPath);
    $('[data-graph-fullscreen]').addEventListener('click',()=>{const stage=$('[data-graph-stage]');if(document.fullscreenElement)document.exitFullscreen();else stage.requestFullscreen?.();});
    $('[data-export-subgraph]').addEventListener('click',exportSubgraph);
  }

  function initialise() {
    $('[data-generated-date]').textContent = `Généré le ${dateFr(data.meta.as_of)}`;
    $('[data-overview-date]').textContent = `Données au ${dateFr(data.meta.as_of)}`;
    bindFilters(); bindGraphInteractions();
    renderOverview(); renderGraphAnalysis(); renderTimeline(); renderClaims(); renderQuality(); renderSources(); renderSourceMatrices(); renderSuggestions(); renderMatrix(); renderTerritories(); renderGaps(); renderComparison();
    $$('[data-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
    document.addEventListener('click',event=>{const trigger=event.target.closest('[data-open-kind]');if(trigger&&!trigger.closest('[data-graph]')){event.preventDefault();event.stopPropagation();openDetail(trigger.dataset.openKind,trigger.dataset.openId);}});
    $('[data-detail-close]').addEventListener('click',()=>{ $('[data-detail]').hidden=true; });
    $('[data-print]').addEventListener('click',()=>window.print());
    $$('[data-export-view]').forEach(button=>button.addEventListener('click',()=>exportView(button.dataset.exportView)));
    $('[data-global-search]').addEventListener('keydown',event=>{if(event.key==='Enter'){const value=event.currentTarget.value;$('[data-search-page]').value=value;setView('search');renderSearch();}});
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'){if(!$('[data-detail]').hidden)$('[data-detail]').hidden=true;else if(document.fullscreenElement)document.exitFullscreen();return;}
      if(event.target.matches('input,select,textarea'))return;
      if(event.key==='/'){event.preventDefault();$('[data-global-search]').focus();}
      if(event.key.toLowerCase()==='g')setView('graph');
      if(event.key.toLowerCase()==='o')setView('overview');
    });
    root.dataset.ready='true'; setView(state.view);
  }

  document.addEventListener('DOMContentLoaded',initialise);
})();
