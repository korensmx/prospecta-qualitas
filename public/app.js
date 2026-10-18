// Quálitas Prospector Norte - Client Application State & Controller
let state = {
  prospects: [],
  filtered: [],
  selectedProspect: null,
  activeTone: 'ejecutivo',
  currentView: 'table', // 'table' | 'kanban'
  aiCascadeOnline: true
};

const KANBAN_STAGES = [
  'Nuevo Prospecto',
  'Contactado',
  'Cita Agendada',
  'En Cotización',
  'Cerrado / Ganado'
];

// On Document Load
document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  setupEventListeners();
  loadProspects();
  loadStats();
  checkAiStatusSilent();
});

function initIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Filters
  document.getElementById('filterSearch').addEventListener('input', applyFilters);
  document.getElementById('filterEstado').addEventListener('change', () => {
    updateCityDropdown();
    applyFilters();
  });
  document.getElementById('filterCiudad').addEventListener('change', applyFilters);
  document.getElementById('filterGiro').addEventListener('change', applyFilters);
  document.getElementById('filterTipoOportunidad').addEventListener('change', applyFilters);
  document.getElementById('filterEstadoGestion').addEventListener('change', applyFilters);

  document.getElementById('btnResetFilters').addEventListener('click', resetFilters);

  // View switchers
  document.getElementById('viewBtnTable').addEventListener('click', () => switchView('table'));
  document.getElementById('viewBtnKanban').addEventListener('click', () => switchView('kanban'));

  // Header Actions
  document.getElementById('btnOpenNewProspectModal').addEventListener('click', () => openModal('modalNewProspect'));
  document.getElementById('btnExportCsv').addEventListener('click', () => {
    window.location.href = '/api/export';
  });

  // Start weekly auto-search on load
  scheduleWeeklyAutoSearch();

  // Email Generator Actions
  document.getElementById('btnRegenerateEmail').addEventListener('click', () => {
    if (state.selectedProspect) generateAiEmail(state.selectedProspect.id, state.activeTone);
  });
  document.getElementById('btnCopyEmail').addEventListener('click', copyEmailToClipboard);

  // Management Modal
  document.getElementById('btnAddNoteBtn').addEventListener('click', addNoteToSelectedProspect);
  document.getElementById('btnSaveManagementChanges').addEventListener('click', saveManagementChanges);
  document.getElementById('btnResetSingleManagement').addEventListener('click', resetSingleManagement);

  // Bulk Management Cleanup Actions
document.getElementById('btnDeleteManaged').addEventListener('click', deleteManagedProspects);

  // New Prospect Form
  document.getElementById('btnSubmitNewProspect').addEventListener('click', submitNewProspect);
}

// ---------------- API DATA FETCHING ---------------- //

async function loadProspects() {
  try {
    const res = await fetch('/api/prospects');
    const data = await res.json();
    if (data.success) {
      state.prospects = data.data;
      populateFilterOptions();
      applyFilters();
    }
  } catch (err) {
    console.error('Error al cargar prospectos:', err);
  }
}

async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    if (data.success) {
      document.getElementById('kpiTotalProspectos').textContent = data.total.toLocaleString();
      document.getElementById('kpiTotalVehiculos').textContent = (data.totalVehiculos || 0).toLocaleString() + ' uds';
      document.getElementById('kpiTotalEmpleados').textContent = (data.totalEmpleados || 0).toLocaleString();
      document.getElementById('kpiPrimaEstimada').textContent = '$' + ((data.totalPrimaPotencial || 0) / 1000000).toFixed(1) + 'M MXN';
      document.getElementById('kpiTasaGestion').textContent = (data.tasaGestion || 0) + '%';
    }
  } catch (err) {
    console.error('Error al cargar estadísticas:', err);
  }
}

// ---------------- FILTERS & CITY DROPDOWN ---------------- //

function populateFilterOptions() {
  const giroSelect = document.getElementById('filterGiro');
  const currentGiro = giroSelect.value;
  const giros = new Set();

  state.prospects.forEach(p => {
    if (p.giro) giros.add(p.giro);
  });

  giroSelect.innerHTML = '<option value="Todos">Todos los Giros</option>';
  Array.from(giros).sort().forEach(g => {
    const opt = document.createElement('option');
    opt.value = g;
    opt.textContent = g;
    giroSelect.appendChild(opt);
  });
  giroSelect.value = currentGiro || 'Todos';

  updateCityDropdown();
}

function updateCityDropdown() {
  const estado = document.getElementById('filterEstado').value;
  const ciudadSelect = document.getElementById('filterCiudad');
  const cities = new Set();

  state.prospects.forEach(p => {
    if (estado === 'Todos' || (p.estado && p.estado.toLowerCase() === estado.toLowerCase())) {
      if (p.ciudad) cities.add(p.ciudad);
    }
  });

  ciudadSelect.innerHTML = '<option value="Todas">Todas las Ciudades</option>';
  Array.from(cities).sort().forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    ciudadSelect.appendChild(opt);
  });
}

function applyFilters() {
  const search = document.getElementById('filterSearch').value.trim().toLowerCase();
  const estado = document.getElementById('filterEstado').value;
  const ciudad = document.getElementById('filterCiudad').value;
  const giro = document.getElementById('filterGiro').value;
  const tipo = document.getElementById('filterTipoOportunidad').value;
  const gestion = document.getElementById('filterEstadoGestion').value;

  state.filtered = state.prospects.filter(p => {
    // Search
    if (search) {
      const matchSearch =
        (p.razonSocial && p.razonSocial.toLowerCase().includes(search)) ||
        (p.nombreComercial && p.nombreComercial.toLowerCase().includes(search)) ||
        (p.ciudad && p.ciudad.toLowerCase().includes(search)) ||
        (p.giro && p.giro.toLowerCase().includes(search)) ||
        (p.responsables && p.responsables.some(r => r.nombre && r.nombre.toLowerCase().includes(search)));
      if (!matchSearch) return false;
    }

    // Estado
    if (estado !== 'Todos' && (!p.estado || p.estado.toLowerCase() !== estado.toLowerCase())) {
      return false;
    }

    // Ciudad
    if (ciudad !== 'Todas' && (!p.ciudad || p.ciudad.toLowerCase() !== ciudad.toLowerCase())) {
      return false;
    }

    // Giro
    if (giro !== 'Todos' && (!p.giro || !p.giro.toLowerCase().includes(giro.toLowerCase()))) {
      return false;
    }

    // Tipo Oportunidad
    if (tipo !== 'Todos' && (!p.tipoOportunidad || !p.tipoOportunidad.toLowerCase().includes(tipo.toLowerCase()))) {
      return false;
    }

    // Estado Gestión
    if (gestion !== 'Todos' && (!p.estadoGestion || p.estadoGestion.toLowerCase() !== gestion.toLowerCase())) {
      return false;
    }

    return true;
  });

  document.getElementById('displayedCount').textContent = state.filtered.length;

  if (state.currentView === 'table') {
    renderTable();
  } else {
    renderKanban();
  }
}

function resetFilters() {
  document.getElementById('filterSearch').value = '';
  document.getElementById('filterEstado').value = 'Todos';
  updateCityDropdown();
  document.getElementById('filterCiudad').value = 'Todas';
  document.getElementById('filterGiro').value = 'Todos';
  document.getElementById('filterTipoOportunidad').value = 'Todos';
  document.getElementById('filterEstadoGestion').value = 'Todos';
  applyFilters();
}

function switchView(viewName) {
  state.currentView = viewName;
  const btnTable = document.getElementById('viewBtnTable');
  const btnKanban = document.getElementById('viewBtnKanban');
  const tableContainer = document.getElementById('tableViewContainer');
  const kanbanContainer = document.getElementById('kanbanViewContainer');

  if (viewName === 'table') {
    btnTable.classList.add('active');
    btnKanban.classList.remove('active');
    tableContainer.style.display = 'block';
    kanbanContainer.style.display = 'none';
    renderTable();
  } else {
    btnTable.classList.remove('active');
    btnKanban.classList.add('active');
    tableContainer.style.display = 'none';
    kanbanContainer.style.display = 'grid';
    renderKanban();
  }
}

// ---------------- TABLE RENDERING ---------------- //

function renderTable() {
  const tbody = document.getElementById('prospectsTableBody');
  tbody.innerHTML = '';

  if (state.filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: var(--qualitas-gray);">
          <i data-lucide="inbox" style="width: 36px; height: 36px; margin-bottom: 8px; display: inline-block;"></i>
          <p style="font-weight: 600;">No se encontraron prospectos con los filtros seleccionados.</p>
          <button class="btn btn-primary btn-sm" onclick="resetFilters()" style="margin-top: 10px;">Limpiar Filtros</button>
        </td>
      </tr>
    `;
    initIcons();
    return;
  }

  state.filtered.forEach(p => {
    const tr = document.createElement('tr');
    const resp = p.responsables?.[0] || { nombre: 'Dirección General', cargo: 'Decisor' };
    const primaFmt = (p.potencialPrimaEstimada || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

    const statusClass = getStatusClass(p.estadoGestion);

    tr.innerHTML = `
      <td>
        <div class="company-cell">
          <span class="company-name">${escapeHTML(p.razonSocial)}</span>
          ${p.nombreComercial && p.nombreComercial !== p.razonSocial ? `<span class="company-commercial">${escapeHTML(p.nombreComercial)}</span>` : ''}
          <span class="giro-tag">${escapeHTML(p.giro || 'General')}</span>
        </div>
      </td>
      <td>
        <div class="location-cell">
          <div class="location-state">${escapeHTML(p.estado)}</div>
          <div class="location-city">${escapeHTML(p.ciudad)}</div>
          <div style="font-size: 0.72rem; color: #94A3B8; margin-top: 2px;" title="${escapeHTML(p.domicilio)}">
            ${escapeHTML(p.domicilio ? p.domicilio.slice(0, 32) + '...' : '')}
          </div>
        </div>
      </td>
      <td>
        <div class="metrics-badge-group">
          <span class="metric-pill" title="Empleados / Agremiados">
            <i data-lucide="users" style="width: 12px; height: 12px; color: var(--qualitas-magenta);"></i>
            <strong>${(p.numeroEmpleados || 0).toLocaleString()}</strong> emp.
          </span>
          <span class="metric-pill" title="Unidades en Flotilla">
            <i data-lucide="truck" style="width: 12px; height: 12px; color: var(--qualitas-cyan);"></i>
            <strong>${p.numeroVehiculos || 0}</strong> vehs.
          </span>
        </div>
      </td>
      <td>
        <div style="font-size: 0.84rem;">
          <strong style="color: var(--qualitas-dark);">${escapeHTML(resp.nombre)}</strong>
          <div style="font-size: 0.74rem; color: var(--qualitas-gray);">${escapeHTML(resp.cargo)}</div>
          <div style="font-size: 0.74rem; color: #0284C7; margin-top: 2px;">
            <a href="mailto:${resp.correo || p.correo}" style="color: inherit; text-decoration: none;">
              ${escapeHTML(resp.correo || p.correo || 'Sin correo')}
            </a>
          </div>
          <div style="font-size: 0.72rem; color: #64748B;">
            ${escapeHTML(resp.telefono || p.telefonos || '')}
          </div>
        </div>
      </td>
      <td>
        <div style="font-size: 0.82rem;">
          <span style="font-weight: 700; color: var(--qualitas-magenta);">${escapeHTML(p.tipoOportunidad || 'Flotilla Comercial')}</span>
          <div style="font-weight: 800; font-size: 0.9rem; color: var(--qualitas-dark); margin-top: 2px;">
            ${primaFmt}
          </div>
          <span style="font-size: 0.7rem; color: #10B981; font-weight: 600;">Prima Anual Estimada</span>
        </div>
      </td>
      <td>
        <span class="status-badge ${statusClass}" onclick="openManagementModal('${p.id}')" title="Clic para cambiar estado o ver bitácora">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor;"></span>
          ${escapeHTML(p.estadoGestion || 'Nuevo Prospecto')}
        </span>
        ${p.fechaUltimoContacto ? `<div style="font-size: 0.7rem; color: #94A3B8; margin-top: 4px;">Contacto: ${p.fechaUltimoContacto}</div>` : ''}
      </td>
      <td style="text-align: center;">
        <div class="action-buttons" style="justify-content: center;">
          <!-- Button: Generate AI Email -->
          <button class="action-btn email-btn" onclick="openEmailModal('${p.id}')" title="Generar Correo de Invitación Personalizado con IA">
            <i data-lucide="mail"></i>
          </button>
          <!-- Button: Open Management / Bitácora -->
          <button class="action-btn" onclick="openManagementModal('${p.id}')" title="Gestionar y Notas">
            <i data-lucide="clipboard-list"></i>
          </button>
          <!-- Button: WhatsApp Direct -->
          <a class="action-btn wa-btn" href="${getWhatsAppUrl(p, resp)}" target="_blank" title="Contactar por WhatsApp">
            <i data-lucide="message-circle"></i>
          </a>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  initIcons();
}

// ---------------- KANBAN BOARD RENDERING ---------------- //

function renderKanban() {
  const container = document.getElementById('kanbanViewContainer');
  container.innerHTML = '';

  KANBAN_STAGES.forEach(stage => {
    const col = document.createElement('div');
    col.className = 'kanban-col';

    const stageProspects = state.filtered.filter(p => p.estadoGestion === stage);

    col.innerHTML = `
      <div class="kanban-col-header">
        <span>${stage}</span>
        <span class="kanban-col-count">${stageProspects.length}</span>
      </div>
      <div class="kanban-cards-wrapper" id="col-${stage.replace(/\s+/g, '')}">
        ${stageProspects.length === 0 ? '<div style="text-align: center; color: #94A3B8; font-size: 0.75rem; padding: 20px;">Sin prospectos en esta etapa</div>' : ''}
      </div>
    `;

    const wrapper = col.querySelector('.kanban-cards-wrapper');

    stageProspects.forEach(p => {
      const resp = p.responsables?.[0] || { nombre: 'Dirección' };
      const card = document.createElement('div');
      card.className = 'kanban-card';
      card.innerHTML = `
        <div class="kanban-card-title">${escapeHTML(p.nombreComercial || p.razonSocial)}</div>
        <div class="kanban-card-meta">
          <strong>${escapeHTML(p.ciudad)}, ${escapeHTML(p.estado)}</strong> • ${escapeHTML(p.giro)}
        </div>
        <div class="kanban-card-metrics">
          <span>👥 ${p.numeroEmpleados || 0} emp.</span>
          <span>🚚 ${p.numeroVehiculos || 0} vehs.</span>
        </div>
        <div style="font-size: 0.74rem; color: var(--qualitas-magenta); font-weight: 700; margin-bottom: 6px;">
          ${(p.potencialPrimaEstimada || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })}
        </div>
        <div class="kanban-card-actions">
          <span style="font-size: 0.72rem; color: #64748B;">👤 ${escapeHTML(resp.nombre.slice(0, 18))}</span>
          <div style="display: flex; gap: 4px;">
            <button class="action-btn email-btn btn-sm" style="width: 26px; height: 26px;" onclick="openEmailModal('${p.id}')" title="Generar Correo">
              <i data-lucide="mail" style="width: 13px; height: 13px;"></i>
            </button>
            <button class="action-btn btn-sm" style="width: 26px; height: 26px;" onclick="openManagementModal('${p.id}')" title="Gestionar">
              <i data-lucide="edit" style="width: 13px; height: 13px;"></i>
            </button>
          </div>
        </div>
      `;
      wrapper.appendChild(card);
    });

    container.appendChild(col);
  });

  initIcons();
}

// ---------------- AI EMAIL GENERATOR ---------------- //

function openEmailModal(prospectId) {
  const p = state.prospects.find(item => item.id === prospectId);
  if (!p) return;
  state.selectedProspect = p;

  document.getElementById('emailModalCompanyName').textContent = p.razonSocial;
  const resp = p.responsables?.[0] || { nombre: 'Dirección' };
  document.getElementById('emailModalDetails').textContent = `Destinatario: ${resp.nombre} (${resp.cargo || 'Responsable'}) • ${p.ciudad}, ${p.estado}`;

  document.getElementById('emailGeneratedContent').value = 'Generando correo profesional altamente persuasivo con Cascada de IA Quálitas...';
  document.getElementById('emailAiSourceBadge').textContent = 'Consultando Cascada IA...';

  openModal('modalEmailGenerator');
  generateAiEmail(p.id, state.activeTone);
}

function selectEmailTone(tone) {
  state.activeTone = tone;
  document.querySelectorAll('.tone-card').forEach(c => {
    if (c.getAttribute('data-tone') === tone) {
      c.classList.add('active');
    } else {
      c.classList.remove('active');
    }
  });

  if (state.selectedProspect) {
    generateAiEmail(state.selectedProspect.id, tone);
  }
}

async function generateAiEmail(prospectId, tono) {
  const p = state.prospects.find(item => item.id === prospectId);
  if (!p) return;

  const contentArea = document.getElementById('emailGeneratedContent');
  contentArea.value = 'Generando correo con Gemini IA... Por favor espera unos segundos.';

  try {
    const res = await fetch('/api/generate-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prospectId,
        tono,
        remitente: 'Asesor Ejecutivo Corporativo Quálitas'
      })
    });

    const data = await res.json();
    if (data.success) {
      contentArea.value = data.emailText;
      const badge = document.getElementById('emailAiSourceBadge');
      if (badge) badge.textContent = `✓ Generado con ${data.providerUsed} (${data.modelUsed})`;

      // Prepare mailto and WhatsApp links
      setupEmailActionLinks(p, data.emailText);
    } else {
      contentArea.value = 'Error al generar el correo: ' + data.error;
    }
  } catch (err) {
    contentArea.value = 'Error de conexión con el servidor de IA.';
    console.error(err);
  }
}

function setupEmailActionLinks(prospect, emailBody) {
  // Soporte para ambos formatos: array responsables[] o campos planos responsable/cargo
  const resp = prospect.responsables?.[0] || { nombre: prospect.responsable || '', cargo: prospect.cargo || '', telefono: prospect.telefonos || '' };
  const emailTo = resp.correo || prospect.correo || '';

  // Extract Subject if present
  let subject = `Propuesta Estratégica Quálitas Seguros para ${prospect.nombreComercial || prospect.razonSocial}`;
  let cleanBody = emailBody;

  const lines = emailBody.split('\n');
  const subjectLine = lines.find(l => l.toLowerCase().startsWith('asunto:'));
  if (subjectLine) {
    subject = subjectLine.replace(/asunto:/i, '').trim();
    cleanBody = lines.filter(l => !l.toLowerCase().startsWith('asunto:')).join('\n').trim();
  }

  // Mailto link
  const mailtoUrl = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(cleanBody)}`;
  document.getElementById('btnOpenMailto').href = mailtoUrl;

  // WhatsApp link
  const waPhone = (resp.telefono || prospect.telefonos || '').replace(/\D/g, '');
  const waMsg = `Hola ${resp.nombre || ''}, te saluda Quálitas Compañía de Seguros. Le compartimos una propuesta ejecutiva de seguro para ${prospect.nombreComercial || prospect.razonSocial}. ¿Cuándo podríamos coordinar 10 minutos?`;
  document.getElementById('btnOpenWhatsApp').href = `https://wa.me/${waPhone.length >= 10 ? (waPhone.startsWith('52') ? waPhone : '52' + waPhone) : ''}?text=${encodeURIComponent(waMsg)}`;
}

function copyEmailToClipboard() {
  const content = document.getElementById('emailGeneratedContent').value;
  navigator.clipboard.writeText(content).then(() => {
    const btn = document.getElementById('btnCopyEmail');
    const oldText = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="check"></i> ¡Copiado!';
    initIcons();
    setTimeout(() => {
      btn.innerHTML = oldText;
      initIcons();
    }, 2000);
  });
}

function getWhatsAppUrl(prospect, resp) {
  const rawPhone = (resp.telefono || prospect.telefonos || '').replace(/\D/g, '');
  const phone = rawPhone.length >= 10 ? (rawPhone.startsWith('52') ? rawPhone : '52' + rawPhone) : '';
  const msg = `Estimado(a) ${resp.nombre || ''}, un gusto saludarle de Quálitas Compañía de Seguros respecto a alternativas para ${prospect.nombreComercial || prospect.razonSocial}.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

// ---------------- AI AUTO WEEKLY SEARCH ---------------- //

const ESTADOS_NORTE = [
  'Baja California', 'Baja California Sur', 'Sonora', 'Chihuahua',
  'Coahuila', 'Durango', 'Nuevo León', 'Tamaulipas'
];

const WEEKLY_SEARCH_KEY = 'prospecta_last_weekly_search';
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

async function runWeeklyAutoSearch() {
  const statusEl = document.getElementById('aiActiveProviderText');
  if (statusEl) statusEl.textContent = 'Buscando prospectos...';

  try {
    // Search 1 prospect per state (8 states), one at a time to avoid rate limits
    let totalAdded = 0;
    for (const estado of ESTADOS_NORTE) {
      try {
        const res = await fetch('/api/generate-prospects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado, giro: '', count: 1 })
        });
        const data = await res.json();
        if (data.success) {
          totalAdded += data.addedCount || 0;
        }
        // Small pause between requests
        await new Promise(r => setTimeout(r, 2000));
      } catch (e) {
        console.warn(`Error buscando en ${estado}:`, e);
      }
    }

    // Save timestamp
    try { localStorage.setItem(WEEKLY_SEARCH_KEY, Date.now().toString()); } catch(e) {}

    // Reload data
    await loadProspects();
    await loadStats();

    if (statusEl) statusEl.textContent = `IA Automática Semanal ✓ (+${totalAdded} nuevos)`;
    setTimeout(() => {
      if (statusEl) statusEl.textContent = 'IA Automática Semanal';
    }, 5000);

  } catch (err) {
    console.error('Error en búsqueda automática semanal:', err);
    if (statusEl) statusEl.textContent = 'IA Automática Semanal';
  }
}

function scheduleWeeklyAutoSearch() {
  let lastSearch = 0;
  try { lastSearch = parseInt(localStorage.getItem(WEEKLY_SEARCH_KEY) || '0', 10); } catch(e) {}

  const now = Date.now();
  const elapsed = now - lastSearch;

  if (lastSearch === 0 || elapsed >= ONE_WEEK_MS) {
    // Never run before, or a week has passed — run after page loads
    setTimeout(runWeeklyAutoSearch, 3000);
  } else {
    // Schedule for when the week is up
    const remaining = ONE_WEEK_MS - elapsed;
    setTimeout(() => {
      runWeeklyAutoSearch();
      // Then repeat every week
      setInterval(runWeeklyAutoSearch, ONE_WEEK_MS);
    }, remaining);
  }

  // Also set a weekly interval for subsequent runs
  setInterval(runWeeklyAutoSearch, ONE_WEEK_MS);
}

// ---------------- MANAGEMENT & BITÁCORA MODAL ---------------- //

function openManagementModal(prospectId) {
  const p = state.prospects.find(item => item.id === prospectId);
  if (!p) return;
  state.selectedProspect = p;

  document.getElementById('managementCompanyName').textContent = p.razonSocial;
  document.getElementById('managementCompanyMeta').textContent = `${p.ciudad}, ${p.estado} • Giro: ${p.giro} • ${p.tipoOportunidad}`;
  document.getElementById('editEstadoGestion').value = p.estadoGestion || 'Nuevo Prospecto';
  document.getElementById('newNoteText').value = '';

  renderNotesList(p.notas || []);
  openModal('modalManagement');
}

function renderNotesList(notes) {
  const container = document.getElementById('notesHistoryContainer');
  container.innerHTML = '';

  if (notes.length === 0) {
    container.innerHTML = '<div style="font-size: 0.8rem; color: #94A3B8;">Sin notas registradas aún.</div>';
    return;
  }

  notes.forEach(n => {
    const item = document.createElement('div');
    item.style.background = '#F8FAFC';
    item.style.padding = '8px 12px';
    item.style.borderRadius = '6px';
    item.style.border = '1px solid #E2E8F0';
    item.style.fontSize = '0.8rem';
    item.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
        <strong style="color: var(--qualitas-dark);">${escapeHTML(n.usuario || 'Agente')}</strong>
        <span style="color: #94A3B8; font-size: 0.72rem;">${n.fecha}</span>
      </div>
      <div style="color: #334155;">${escapeHTML(n.texto)}</div>
    `;
    container.appendChild(item);
  });
}

async function addNoteToSelectedProspect() {
  if (!state.selectedProspect) return;
  const text = document.getElementById('newNoteText').value.trim();
  if (!text) return;

  try {
    const res = await fetch(`/api/prospects/${state.selectedProspect.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: text, usuario: 'Agente Quálitas' })
    });

    const data = await res.json();
    if (data.success) {
      state.selectedProspect = data.data;
      // Update in local array
      const idx = state.prospects.findIndex(p => p.id === data.data.id);
      if (idx !== -1) state.prospects[idx] = data.data;

      document.getElementById('newNoteText').value = '';
      renderNotesList(data.data.notas || []);
      loadStats();
      applyFilters();
    }
  } catch (err) {
    console.error('Error al guardar nota:', err);
  }
}

async function saveManagementChanges() {
  if (!state.selectedProspect) return;
  const newStatus = document.getElementById('editEstadoGestion').value;

  try {
    const res = await fetch(`/api/prospects/${state.selectedProspect.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estadoGestion: newStatus })
    });

    const data = await res.json();
    if (data.success) {
      const idx = state.prospects.findIndex(p => p.id === data.data.id);
      if (idx !== -1) state.prospects[idx] = data.data;

      closeModal('modalManagement');
      loadStats();
      applyFilters();
    }
  } catch (err) {
    console.error('Error al actualizar estado:', err);
  }
}

async function resetSingleManagement() {
  if (!state.selectedProspect) return;
  if (!confirm(`¿Deseas limpiar la gestión de "${state.selectedProspect.nombreComercial || state.selectedProspect.razonSocial}" y regresarlo a "Nuevo Prospecto"?`)) return;

  try {
    const res = await fetch(`/api/prospects/${state.selectedProspect.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estadoGestion: 'Nuevo Prospecto',
        fechaUltimoContacto: null,
        notas: []
      })
    });

    const data = await res.json();
    if (data.success) {
      const idx = state.prospects.findIndex(p => p.id === data.data.id);
      if (idx !== -1) state.prospects[idx] = data.data;

      closeModal('modalManagement');
      loadStats();
      applyFilters();
    }
  } catch (err) {
    console.error('Error al limpiar gestión individual:', err);
  }
}

async function resetAllManagement() {
  if (!confirm('¿Deseas reiniciar TODOS los negocios al estado inicial "Nuevo Prospecto"?\nEsto limpiará las notas de bitácora y fechas de contacto para iniciar la prospección desde cero manteniendo todos los negocios.')) return;

  try {
    const res = await fetch('/api/prospects/reset-management', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      await loadProspects();
      await loadStats();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (err) {
    console.error('Error al reiniciar gestiones:', err);
  }
}

async function deleteManagedProspects() {
  if (!confirm('ATENCIÓN: ¿Estás seguro de que deseas ELIMINAR permanentemente todos los negocios que ya cuentan con alguna gestión (Contactado, Cita, etc.)?\nSolo quedarán los negocios que aún no han sido gestionados.')) return;

  try {
    const res = await fetch('/api/prospects/managed/bulk', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      await loadProspects();
      await loadStats();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (err) {
    console.error('Error al eliminar prospectos gestionados:', err);
  }
}

// ---------------- NEW MANUAL PROSPECT ---------------- //

async function submitNewProspect(e) {
  e.preventDefault();
  const razonSocial = document.getElementById('newRazonSocial').value.trim();
  const nombreComercial = document.getElementById('newNombreComercial').value.trim();
  const giro = document.getElementById('newGiro').value.trim();
  const estado = document.getElementById('newEstado').value;
  const ciudad = document.getElementById('newCiudad').value.trim();
  const empleados = parseInt(document.getElementById('newEmpleados').value || 0, 10);
  const vehiculos = parseInt(document.getElementById('newVehiculos').value || 0, 10);
  const tipoOportunidad = document.getElementById('newTipoOportunidad').value;
  const responsable = document.getElementById('newResponsable').value.trim();
  const cargo = document.getElementById('newCargo').value.trim();
  const telefonos = document.getElementById('newTelefonos').value.trim();
  const correo = document.getElementById('newCorreo').value.trim();
  const domicilio = document.getElementById('newDomicilio').value.trim();

  if (!razonSocial || !giro || !ciudad) {
    alert('Por favor completa los campos obligatorios (*).');
    return;
  }

  const payload = {
    razonSocial,
    nombreComercial: nombreComercial || razonSocial,
    giro,
    estado,
    ciudad,
    numeroEmpleados: empleados,
    numeroVehiculos: vehiculos,
    tipoOportunidad,
    responsables: [
      {
        nombre: responsable || 'Dirección de Recursos Humanos / Compras',
        cargo: cargo || 'Responsable de Área',
        telefono: telefonos,
        correo: correo
      }
    ],
    telefonos,
    correo,
    domicilio,
    estadoGestion: 'Nuevo Prospecto',
    fuente: 'Registro Manual'
  };

  try {
    const res = await fetch('/api/prospects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      document.getElementById('newProspectForm').reset();
      closeModal('modalNewProspect');
      await loadProspects();
      await loadStats();
    }
  } catch (err) {
    console.error('Error al guardar prospecto:', err);
  }
}

// (AI health modal removed — búsquedas ahora son automáticas semanales)

// ---------------- UTILS & MODAL CONTROLS ---------------- //

function openModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = 'flex';
    initIcons();
  }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = 'none';
  }
}

function getStatusClass(status) {
  switch (status) {
    case 'Nuevo Prospecto': return 'status-nuevo';
    case 'Contactado': return 'status-contactado';
    case 'Cita Agendada': return 'status-cita';
    case 'En Cotización': return 'status-cotizacion';
    case 'Cerrado / Ganado': return 'status-cerrado';
    default: return 'status-descartado';
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
