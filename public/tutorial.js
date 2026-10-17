// Quálitas Video Tutorial - Canvas Animation Engine & Synchronized Audio Player

const CHAPTERS = [
  {
    id: 1,
    title: 'Bienvenida e Introducción',
    start: 0.0,
    duration: 27.8,
    text: '¡Hola! Te damos la más cordial bienvenida a tu Portal de Prospección Comercial de Quálitas Compañía de Seguros. Si eres nuevo utilizando esta herramienta, no te preocupes. Este video fue creado especialmente para ti. Aquí aprenderás, paso a paso y de forma muy sencilla, cómo encontrar empresas grandes, universidades y sindicatos en el norte del país para ofrecerles seguros de flotilla y colectividades para empleados.'
  },
  {
    id: 2,
    title: 'El Tablero Principal y las Métricas Clave',
    start: 27.8,
    duration: 24.7,
    text: 'Al entrar a la aplicación, lo primero que verás arriba son cinco tarjetas con números grandes. Estas tarjetas te muestran el panorama general: cuántos prospectos tienes listos para contactar, cuántos vehículos y empleados suman en total, y el valor estimado de prima anual que podrías colocar. Lo mejor de todo es que estos números se actualizan solitos cada vez que aplicas un filtro.'
  },
  {
    id: 3,
    title: 'Cómo Filtrar Negocios Fácilmente',
    start: 52.5,
    duration: 26.6,
    text: 'Buscar exactamente lo que necesitas es facilísimo. En la barra de filtros puedes elegir cualquiera de los ocho estados del norte: Baja California, Baja California Sur, Sonora, Chihuahua, Coahuila, Durango, Nuevo León o Tamaulipas. También puedes filtrar por ciudad o por giro, como maquiladoras, minería o transporte. Si quieres empezar de nuevo, solo dale clic a Limpiar Filtros.'
  },
  {
    id: 4,
    title: 'La Ficha del Prospecto y sus Datos',
    start: 79.1,
    duration: 20.5,
    text: 'En la tabla verás la información completa de cada empresa: su nombre comercial, dirección, número de empleados y cuántos vehículos tienen. Lo más valioso para ti es la columna de Responsables: ahí encuentras el nombre del director o gerente de recursos humanos o compras, junto con su correo electrónico y teléfono directo.'
  },
  {
    id: 5,
    title: 'El Redactor de Correos con Inteligencia Artificial',
    start: 99.6,
    duration: 32.9,
    text: '¿No sabes qué escribir para presentarte? Nuestra Inteligencia Artificial lo hace por ti. Solo haz clic en el botón morado con forma de sobre. Se abrirá una ventana donde puedes elegir el tono del mensaje: un saludo ejecutivo para pedir una cita de quince minutos, un enfoque financiero de ahorro y deducibilidad fiscal, o un beneficio de seguro con descuento vía nómina para los empleados. El correo suena totalmente humano y profesional. Puedes copiarlo o abrirlo directo en tu correo o en WhatsApp con un solo clic.'
  },
  {
    id: 6,
    title: 'Gestión y Registro de Bitácora',
    start: 132.5,
    duration: 19.5,
    text: 'Cuando llames a un prospecto o le mandes un correo, no olvides registrarlo. Haz clic en la etiqueta de estado o en el botón de libreta. Podrás cambiar el estado de Nuevo Prospecto a Contactado, Cita Agendada o En Cotización, y escribir notas sobre lo que platicaron. Así nunca olvidarás en qué te quedaste.'
  },
  {
    id: 7,
    title: 'Buscar Prospectos con IA y Exportar a Excel',
    start: 152.0,
    duration: 28.3,
    text: 'Si necesitas más prospectos frescos, haz clic en el botón morado Buscar Prospectos con IA. El sistema buscará en cascada utilizando cinco inteligencias artificiales para traerte empresas calificadas que cumplan todas las reglas de Quálitas. Y cuando quieras llevarte la lista para trabajar en campo, solo presiona Exportar Excel para descargar un archivo listo para abrir. ¡Mucho éxito en tus ventas con Quálitas Compañía de Seguros!'
  }
];

const TOTAL_DURATION = 180.3; // seconds

let isPlaying = false;
let currentTime = 0;
let currentChapterIndex = 0;
let audioElements = [];
let animFrameId = null;
let lastTimestamp = 0;
let playbackRate = 1.0;
let showCaptions = true;

// Preload Images
const logoImg = new Image();
logoImg.src = 'logo-qualitas.png';

const canvas = document.getElementById('videoCanvas');
const ctx = canvas.getContext('2d');

// DOM Elements
const btnPlayPause = document.getElementById('btnPlayPause');
const playIcon = document.getElementById('playIcon');
const scrubberBar = document.getElementById('scrubberBar');
const scrubberProgress = document.getElementById('scrubberProgress');
const currentTimeLabel = document.getElementById('currentTimeLabel');
const totalTimeLabel = document.getElementById('totalTimeLabel');
const captionsText = document.getElementById('captionsText');
const chaptersListContainer = document.getElementById('chaptersList');
const btnToggleCc = document.getElementById('btnToggleCc');
const speedSelect = document.getElementById('playbackSpeedSelect');
const btnFullscreen = document.getElementById('btnFullscreen');
const btnDownloadRecording = document.getElementById('btnDownloadRecording');

// Init Audio Elements
function initAudios() {
  audioElements = CHAPTERS.map(c => {
    const a = new Audio(`audio/ch_${c.id}.m4a`);
    a.preload = 'auto';
    return a;
  });
}

// Format Seconds to MM:SS
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Render Sidebar Chapters
function renderChaptersList() {
  chaptersListContainer.innerHTML = '';
  CHAPTERS.forEach((c, idx) => {
    const item = document.createElement('div');
    item.className = `chapter-item ${idx === currentChapterIndex ? 'active' : ''}`;
    item.onclick = () => jumpToChapter(idx);

    item.innerHTML = `
      <div class="chapter-badge">${c.id}</div>
      <div class="chapter-info">
        <h4>${c.title}</h4>
        <span>${formatTime(c.start)} • ${Math.round(c.duration)}s</span>
      </div>
    `;
    chaptersListContainer.appendChild(item);
  });
}

// Play / Pause Logic
function togglePlayPause() {
  if (isPlaying) {
    pause();
  } else {
    play();
  }
}

function play() {
  isPlaying = true;
  lastTimestamp = performance.now();
  syncAudio();
  updatePlayButtonIcon();
  animFrameId = requestAnimationFrame(renderLoop);
}

function pause() {
  isPlaying = false;
  audioElements.forEach(a => a.pause());
  updatePlayButtonIcon();
  if (animFrameId) cancelAnimationFrame(animFrameId);
}

function updatePlayButtonIcon() {
  if (isPlaying) {
    playIcon.setAttribute('data-lucide', 'pause');
  } else {
    playIcon.setAttribute('data-lucide', 'play');
  }
  if (window.lucide) window.lucide.createIcons();
}

function syncAudio() {
  const currentChapter = CHAPTERS[currentChapterIndex];
  const audio = audioElements[currentChapterIndex];
  if (!audio) return;

  const offsetInChapter = currentTime - currentChapter.start;

  // Pause others
  audioElements.forEach((a, i) => {
    if (i !== currentChapterIndex) {
      a.pause();
    }
  });

  if (isPlaying) {
    if (Math.abs(audio.currentTime - offsetInChapter) > 0.3) {
      audio.currentTime = Math.max(0, offsetInChapter);
    }
    audio.playbackRate = playbackRate;
    audio.play().catch(() => {});
  } else {
    audio.pause();
  }
}

function seekTo(targetTime) {
  currentTime = Math.max(0, Math.min(TOTAL_DURATION, targetTime));

  // Determine chapter
  let found = 0;
  for (let i = 0; i < CHAPTERS.length; i++) {
    if (currentTime >= CHAPTERS[i].start && currentTime <= CHAPTERS[i].start + CHAPTERS[i].duration) {
      found = i;
      break;
    }
  }

  const chapterChanged = found !== currentChapterIndex;
  currentChapterIndex = found;

  if (chapterChanged) {
    renderChaptersList();
  }

  syncAudio();
  drawScene(currentTime);
  updateUI();
}

function jumpToChapter(idx) {
  currentChapterIndex = idx;
  seekTo(CHAPTERS[idx].start);
  if (!isPlaying) play();
}

// Main Animation Loop
function renderLoop(now) {
  if (!isPlaying) return;

  const delta = (now - lastTimestamp) / 1000;
  lastTimestamp = now;

  currentTime += delta * playbackRate;

  if (currentTime >= TOTAL_DURATION) {
    currentTime = TOTAL_DURATION;
    pause();
    seekTo(0);
    return;
  }

  // Check if moved to next chapter
  const currentCh = CHAPTERS[currentChapterIndex];
  if (currentTime > currentCh.start + currentCh.duration) {
    if (currentChapterIndex < CHAPTERS.length - 1) {
      currentChapterIndex++;
      renderChaptersList();
      syncAudio();
    }
  }

  drawScene(currentTime);
  updateUI();

  animFrameId = requestAnimationFrame(renderLoop);
}

function updateUI() {
  const pct = (currentTime / TOTAL_DURATION) * 100;
  scrubberProgress.style.width = `${pct}%`;
  currentTimeLabel.textContent = formatTime(currentTime);

  // Subtitles
  const currentCh = CHAPTERS[currentChapterIndex];
  if (showCaptions && currentCh) {
    captionsText.style.display = 'block';
    captionsText.textContent = currentCh.text;
  } else {
    captionsText.style.display = 'none';
  }
}

// ---------------- CANVAS SCENE DRAWING ENGINE ---------------- //

function drawScene(time) {
  const w = canvas.width;
  const h = canvas.height;

  // Background
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, w, h);

  // Decorative Top Navbar
  drawPlayerNavbar(w);

  const ch = CHAPTERS[currentChapterIndex];
  const progressInCh = (time - ch.start) / ch.duration;

  switch (ch.id) {
    case 1:
      drawScene1_Welcome(w, h, progressInCh);
      break;
    case 2:
      drawScene2_KPIs(w, h, progressInCh);
      break;
    case 3:
      drawScene3_Filters(w, h, progressInCh);
      break;
    case 4:
      drawScene4_CompanyCard(w, h, progressInCh);
      break;
    case 5:
      drawScene5_AiEmail(w, h, progressInCh);
      break;
    case 6:
      drawScene6_Management(w, h, progressInCh);
      break;
    case 7:
      drawScene7_DiscoveryAndExport(w, h, progressInCh);
      break;
  }

  // Draw Watermark / Chapter Tag
  drawWatermark(w, h, ch);
}

// ---------------- INDIVIDUAL SCENES ---------------- //

function drawPlayerNavbar(w) {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, 70);

  // Quálitas Logo
  if (logoImg.complete && logoImg.naturalWidth > 0) {
    ctx.drawImage(logoImg, 30, 14, 140, 42);
  } else {
    ctx.fillStyle = '#8C1D6B';
    ctx.font = 'bold 22px Segoe UI, sans-serif';
    ctx.fillText('Quálitas', 30, 42);
  }

  // Regional Header Pill
  ctx.fillStyle = '#F1F5F9';
  roundRect(ctx, w - 420, 16, 390, 38, 8);
  ctx.fill();

  ctx.fillStyle = '#009FA9';
  ctx.font = 'bold 13px Segoe UI, sans-serif';
  ctx.fillText('PORTAL DE PROSPECCIÓN • ZONA NORTE DE MÉXICO', w - 405, 40);

  // Border bottom
  ctx.strokeStyle = '#009FA9';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 70);
  ctx.lineTo(w, 70);
  ctx.stroke();
}

function drawScene1_Welcome(w, h, p) {
  // Title
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 38px Segoe UI, sans-serif';
  ctx.fillText('Bienvenido a tu Portal de Prospección Comercial', w / 2, 160);

  ctx.fillStyle = '#00A3B4';
  ctx.font = '600 20px Segoe UI, sans-serif';
  ctx.fillText('Capacitación Rápida para Asesores Comerciales y Nuevos Usuarios', w / 2, 205);

  // 3 Target Pillars
  const pillars = [
    { title: 'Empresas >50 Empleados', subtitle: 'Pólizas Colectivas con Descuento vía Nómina', icon: '👥' },
    { title: 'Flotillas >20 Unidades', subtitle: 'Protección Integral para Vehículos Comerciales', icon: '🚚' },
    { title: 'Sindicatos y Universidades', subtitle: 'Convenios Institucionales de Alto Volumen', icon: '🏛️' }
  ];

  pillars.forEach((pil, i) => {
    const x = 120 + i * 360;
    const y = 260;
    const boxW = 320;
    const boxH = 220;

    // Card background
    ctx.fillStyle = '#1E293B';
    roundRect(ctx, x, y, boxW, boxH, 14);
    ctx.fill();

    ctx.strokeStyle = i === 1 ? '#8C1D6B' : '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Icon
    ctx.font = '48px Segoe UI';
    ctx.fillText(pil.icon, x + boxW / 2, y + 70);

    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Segoe UI, sans-serif';
    ctx.fillText(pil.title, x + boxW / 2, y + 130);

    // Subtitle
    ctx.fillStyle = '#94A3B8';
    ctx.font = '13px Segoe UI, sans-serif';
    wrapText(ctx, pil.subtitle, x + boxW / 2, y + 165, boxW - 40, 18);
  });

  // Bottom 8 States Pills
  const states = ['Baja California', 'B.C. Sur', 'Sonora', 'Chihuahua', 'Coahuila', 'Durango', 'Nuevo León', 'Tamaulipas'];
  ctx.textAlign = 'left';
  states.forEach((st, idx) => {
    const sx = 100 + idx * 135;
    const sy = 550;
    ctx.fillStyle = 'rgba(140, 29, 107, 0.25)';
    roundRect(ctx, sx, sy, 125, 32, 16);
    ctx.fill();
    ctx.strokeStyle = '#8C1D6B';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '600 12px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(st, sx + 62, sy + 21);
  });
}

function drawScene2_KPIs(w, h, p) {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 32px Segoe UI, sans-serif';
  ctx.fillText('1. El Tablero Principal: Conoce tu Potencial', w / 2, 140);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '16px Segoe UI, sans-serif';
  ctx.fillText('Cinco tarjetas superiores que resumen tus oportunidades al instante', w / 2, 175);

  const kpis = [
    { label: 'PROSPECTOS CALIFICADOS', val: '28', color: '#8C1D6B', desc: 'Negocios listos para contactar' },
    { label: 'FLOTILLA VEHICULAR', val: '3,805 uds', color: '#009FA9', desc: 'Unidades comerciales' },
    { label: 'EMPLEADOS / ASOCIADOS', val: '156,130', color: '#8C1D6B', desc: 'Pólizas colectivas potenciales' },
    { label: 'PRIMA POTENCIAL', val: '$159.9M MXN', color: '#059669', desc: 'Valor estimado de primas' },
    { label: 'TASA DE GESTIÓN', val: '0%', color: '#009FA9', desc: 'Tus prospectos en proceso' }
  ];

  kpis.forEach((kpi, i) => {
    const x = 80 + i * 228;
    const y = 230;
    const kw = 215;
    const kh = 160;

    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, x, y, kw, kh, 12);
    ctx.fill();

    // Colored left border
    ctx.fillStyle = kpi.color;
    roundRect(ctx, x, y, 6, kh, 4);
    ctx.fill();

    // Label
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 10px Segoe UI, sans-serif';
    ctx.fillText(kpi.label, x + 16, y + 32);

    // Value
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 24px Segoe UI, sans-serif';
    ctx.fillText(kpi.val, x + 16, y + 80);

    // Desc
    ctx.fillStyle = '#475569';
    ctx.font = '11px Segoe UI, sans-serif';
    wrapText(ctx, kpi.desc, x + 16, y + 115, kw - 30, 15);
  });

  // Callout Box at bottom
  const boxY = 440;
  ctx.fillStyle = 'rgba(0, 159, 169, 0.15)';
  roundRect(ctx, 160, boxY, 960, 120, 12);
  ctx.fill();
  ctx.strokeStyle = '#009FA9';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#00E5FF';
  ctx.font = 'bold 18px Segoe UI, sans-serif';
  ctx.fillText('💡 Consejo Clave para Principiantes:', 190, boxY + 40);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = '15px Segoe UI, sans-serif';
  ctx.fillText('Cada vez que aplicas un filtro por Estado, Ciudad o Giro, estos números se recalculan automáticamente.', 190, boxY + 70);
  ctx.fillText('Así sabrás exactamente cuántas unidades y prima potencial hay en la zona que vas a visitar.', 190, boxY + 95);
}

function drawScene3_Filters(w, h, p) {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 32px Segoe UI, sans-serif';
  ctx.fillText('2. Cómo Filtrar como un Experto', w / 2, 135);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '16px Segoe UI, sans-serif';
  ctx.fillText('Filtra por Estado, Ciudad o Giro en menos de 5 segundos', w / 2, 170);

  // Filters Card Simulation
  const fx = 120;
  const fy = 210;
  const fw = 1040;
  const fh = 260;

  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, fx, fy, fw, fh, 12);
  ctx.fill();

  // Header of filter card
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 16px Segoe UI, sans-serif';
  ctx.fillText('Filtros de Prospección Comercial', fx + 24, fy + 38);

  // Clear button simulation
  ctx.fillStyle = '#F1F5F9';
  roundRect(ctx, fx + fw - 160, fy + 18, 140, 32, 6);
  ctx.fill();
  ctx.fillStyle = '#8C1D6B';
  ctx.font = 'bold 12px Segoe UI, sans-serif';
  ctx.fillText('↺ Limpiar Filtros', fx + fw - 145, fy + 38);

  // 4 Filter inputs
  const fields = [
    { label: 'BÚSQUEDA RÁPIDA', val: 'Buscar por razón social...' },
    { label: 'ESTADO (NORTE)', val: 'Nuevo León', active: true },
    { label: 'CIUDAD', val: 'Monterrey', active: true },
    { label: 'GIRO EMPRESARIAL', val: 'Manufactura y Acero' }
  ];

  fields.forEach((f, idx) => {
    const colX = fx + 24 + idx * 248;
    const colY = fy + 80;
    const colW = 230;

    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 11px Segoe UI, sans-serif';
    ctx.fillText(f.label, colX, colY);

    ctx.fillStyle = f.active ? '#FDF2F8' : '#F8FAFC';
    roundRect(ctx, colX, colY + 10, colW, 40, 6);
    ctx.fill();

    ctx.strokeStyle = f.active ? '#8C1D6B' : '#CBD5E1';
    ctx.lineWidth = f.active ? 2 : 1;
    ctx.stroke();

    ctx.fillStyle = f.active ? '#8C1D6B' : '#334155';
    ctx.font = f.active ? 'bold 13px Segoe UI, sans-serif' : '13px Segoe UI, sans-serif';
    ctx.fillText(f.val, colX + 14, colY + 35);
  });

  // Animated Pointer Finger / Cursor
  const pointerX = fx + 24 + 1.5 * 248 + Math.sin(p * Math.PI * 4) * 20;
  const pointerY = fy + 160;

  ctx.fillStyle = '#8C1D6B';
  roundRect(ctx, 220, 500, 840, 75, 10);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('¡Sencillo y automático! Al elegir un Estado, las ciudades se acomodan solas.', w / 2, 542);
}

function drawScene4_CompanyCard(w, h, p) {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 32px Segoe UI, sans-serif';
  ctx.fillText('3. La Ficha del Prospecto: Datos Directos', w / 2, 135);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '16px Segoe UI, sans-serif';
  ctx.fillText('Sin intermediarios: Teléfonos, Correos y Nombres de Decisores', w / 2, 170);

  // Detail Card
  const cx = 140;
  const cy = 205;
  const cw = 1000;
  const chH = 340;

  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, cx, cy, cw, chH, 14);
  ctx.fill();

  // Company Title
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 24px Segoe UI, sans-serif';
  ctx.fillText('Ternium México, S.A. de C.V.', cx + 32, cy + 50);

  ctx.fillStyle = '#009FA9';
  ctx.font = 'bold 14px Segoe UI, sans-serif';
  ctx.fillText('San Nicolás de los Garza, Nuevo León • Siderurgia y Manufactura Pesada', cx + 32, cy + 76);

  // Line
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx + 32, cy + 95);
  ctx.lineTo(cx + cw - 32, cy + 95);
  ctx.stroke();

  // 3 Detail Columns
  // Col 1: Volumetría
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 11px Segoe UI, sans-serif';
  ctx.fillText('DIMENSIÓN DE LA EMPRESA', cx + 32, cy + 130);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 16px Segoe UI, sans-serif';
  ctx.fillText('👥 9,800 Colaboradores', cx + 32, cy + 165);
  ctx.fillText('🚚 180 Vehículos Utilitarios', cx + 32, cy + 195);
  ctx.fillStyle = '#8C1D6B';
  ctx.fillText('💰 $8,750,000 MXN Prima Estimada', cx + 32, cy + 235);

  // Col 2: Decisor
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 11px Segoe UI, sans-serif';
  ctx.fillText('CONTACTO Y RESPONSABLE', cx + 360, cy + 130);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 16px Segoe UI, sans-serif';
  ctx.fillText('👤 Lic. Mauricio Garza Santos', cx + 360, cy + 165);
  ctx.fillStyle = '#475569';
  ctx.font = '13px Segoe UI, sans-serif';
  ctx.fillText('Director de Compensaciones y Beneficios', cx + 360, cy + 188);

  ctx.fillStyle = '#0284C7';
  ctx.font = 'bold 14px Segoe UI, sans-serif';
  ctx.fillText('✉️ mgarza@ternium.com.mx', cx + 360, cy + 220);
  ctx.fillStyle = '#334155';
  ctx.fillText('📞 +52 (81) 8865-2000', cx + 360, cy + 245);

  // Col 3: Domicilio
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 11px Segoe UI, sans-serif';
  ctx.fillText('DOMICILIO FISCAL / PARQUE', cx + 700, cy + 130);
  ctx.fillStyle = '#334155';
  ctx.font = '13px Segoe UI, sans-serif';
  wrapText(ctx, 'Av. Manuel L. Barragán 333, Col. Residencial Anáhuac, C.P. 66450', cx + 700, cy + 160, 260, 18);

  // Highlight Box
  ctx.fillStyle = '#ECFDF5';
  roundRect(ctx, cx + 32, cy + 270, cw - 64, 48, 8);
  ctx.fill();
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#065F46';
  ctx.font = 'bold 13px Segoe UI, sans-serif';
  ctx.fillText('✓ Cumple con el criterio Quálitas: Más de 50 empleados y flotilla activa mayor a 20 unidades.', cx + 50, cy + 300);
}

function drawScene5_AiEmail(w, h, p) {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 32px Segoe UI, sans-serif';
  ctx.fillText('4. La Magia de la Inteligencia Artificial', w / 2, 130);

  ctx.fillStyle = '#00A3B4';
  ctx.font = '16px Segoe UI, sans-serif';
  ctx.fillText('El Botón de Correo: Redacción humana, profesional y personalizada en 2 segundos', w / 2, 165);

  // Modal Simulation Box
  const mx = 180;
  const my = 195;
  const mw = 920;
  const mh = 380;

  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, mx, my, mw, mh, 14);
  ctx.fill();

  // Modal header
  ctx.textAlign = 'left';
  ctx.fillStyle = '#8C1D6B';
  ctx.font = 'bold 18px Segoe UI, sans-serif';
  ctx.fillText('✉️ Generador de Correo de Invitación Quálitas', mx + 24, my + 38);

  // 3 Tones Pills
  const tones = ['1. Ejecutivo / Cita (15 min)', '2. Financiero y Flotilla', '3. Beneficio Colectividad Empleados'];
  tones.forEach((t, i) => {
    const tx = mx + 24 + i * 290;
    const ty = my + 60;
    ctx.fillStyle = i === 0 ? '#FDF2F8' : '#F8FAFC';
    roundRect(ctx, tx, ty, 275, 36, 6);
    ctx.fill();
    ctx.strokeStyle = i === 0 ? '#8C1D6B' : '#E2E8F0';
    ctx.lineWidth = i === 0 ? 2 : 1;
    ctx.stroke();

    ctx.fillStyle = i === 0 ? '#8C1D6B' : '#475569';
    ctx.font = 'bold 12px Segoe UI, sans-serif';
    ctx.fillText(t, tx + 14, ty + 23);
  });

  // Simulated Email Preview
  ctx.fillStyle = '#F8FAFC';
  roundRect(ctx, mx + 24, my + 115, mw - 48, 185, 8);
  ctx.fill();
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 13px Segoe UI, sans-serif';
  ctx.fillText('Asunto: Solución integral de protección y movilidad para Ternium México | Quálitas', mx + 40, my + 145);

  ctx.fillStyle = '#334155';
  ctx.font = '12px Segoe UI, sans-serif';
  ctx.fillText('Estimado Lic. Mauricio Garza Santos,', mx + 40, my + 175);
  ctx.fillText('Es un placer saludarle. En Quálitas hemos preparado una propuesta personalizada para el personal de Ternium en Nuevo León.', mx + 40, my + 200);
  ctx.fillText('Ofrecemos un esquema de seguro de auto con descuento vía nómina sin costo para la empresa, con tarifas preferenciales.', mx + 40, my + 225);
  ctx.fillText('¿Podríamos coordinar una breve reunión de 15 minutos este jueves o viernes?', mx + 40, my + 250);
  ctx.fillStyle = '#8C1D6B';
  ctx.fillText('Atentamente: Asesor Ejecutivo Quálitas Compañía de Seguros', mx + 40, my + 280);

  // 3 Action Buttons at bottom
  const btnActions = [
    { label: '📋 Copiar Texto', bg: '#009FA9', col: '#fff' },
    { label: '📤 Abrir en Correo', bg: '#8C1D6B', col: '#fff' },
    { label: '💬 Enviar por WhatsApp', bg: '#25D366', col: '#fff' }
  ];

  btnActions.forEach((b, i) => {
    const bx = mx + mw - 540 + i * 170;
    const by = my + 320;
    ctx.fillStyle = b.bg;
    roundRect(ctx, bx, by, 160, 38, 8);
    ctx.fill();

    ctx.fillStyle = b.col;
    ctx.font = 'bold 12px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(b.label, bx + 80, by + 24);
  });
}

function drawScene6_Management(w, h, p) {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 32px Segoe UI, sans-serif';
  ctx.fillText('5. Tu Bitácora: Marca y Lleva el Control', w / 2, 135);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '16px Segoe UI, sans-serif';
  ctx.fillText('Registra cada llamada, cita y cotización para no perder ningún seguimiento', w / 2, 170);

  // Pipeline Flow
  const stages = [
    { name: '1. Nuevo Prospecto', color: '#4F46E5', bg: '#EEF2FF' },
    { name: '2. Contactado', color: '#0284C7', bg: '#E0F2FE' },
    { name: '3. Cita Agendada', color: '#D97706', bg: '#FEF3C7', active: true },
    { name: '4. En Cotización', color: '#DB2777', bg: '#FDF2F8' },
    { name: '5. Cerrado Ganado', color: '#059669', bg: '#ECFDF5' }
  ];

  stages.forEach((st, i) => {
    const sx = 100 + i * 220;
    const sy = 230;
    const sw = 200;
    const sh = 70;

    ctx.fillStyle = st.bg;
    roundRect(ctx, sx, sy, sw, sh, 10);
    ctx.fill();

    ctx.strokeStyle = st.active ? '#D97706' : st.color;
    ctx.lineWidth = st.active ? 3 : 1;
    ctx.stroke();

    ctx.fillStyle = st.color;
    ctx.font = 'bold 14px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(st.name, sx + sw / 2, sy + 40);

    // Arrow between
    if (i < stages.length - 1) {
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 20px Segoe UI';
      ctx.fillText('➔', sx + sw + 10, sy + 42);
    }
  });

  // Bitácora Notes Card
  const nx = 180;
  const ny = 340;
  const nw = 920;
  const nh = 210;

  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, nx, ny, nw, nh, 12);
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 16px Segoe UI, sans-serif';
  ctx.fillText('Historial de Notas del Prospecto', nx + 24, ny + 35);

  const notes = [
    { date: '16 Oct 2026', user: 'Agente Quálitas', text: 'Se envió correo al Lic. Garza solicitando 15 minutos para presentar esquema de flotilla.' },
    { date: '17 Oct 2026', user: 'Agente Quálitas', text: 'Confirmó llamada telefónica para el próximo martes a las 11:00 AM para cotizar 45 camionetas.' }
  ];

  notes.forEach((n, i) => {
    const itemY = ny + 55 + i * 65;
    ctx.fillStyle = '#F8FAFC';
    roundRect(ctx, nx + 24, itemY, nw - 48, 55, 6);
    ctx.fill();

    ctx.fillStyle = '#8C1D6B';
    ctx.font = 'bold 12px Segoe UI, sans-serif';
    ctx.fillText(n.user + ' • ' + n.date, nx + 40, itemY + 22);

    ctx.fillStyle = '#334155';
    ctx.font = '13px Segoe UI, sans-serif';
    ctx.fillText(n.text, nx + 40, itemY + 42);
  });
}

function drawScene7_DiscoveryAndExport(w, h, p) {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 32px Segoe UI, sans-serif';
  ctx.fillText('6. Nuevos Prospectos y Exportación a Excel', w / 2, 130);

  ctx.fillStyle = '#00A3B4';
  ctx.font = '16px Segoe UI, sans-serif';
  ctx.fillText('Generación continua con 5 IAs gratuitas y descarga para trabajo en campo', w / 2, 165);

  // Left Card: AI Cascade Discovery
  const lx = 140;
  const ly = 210;
  const cw = 470;
  const chH = 320;

  ctx.fillStyle = '#1E293B';
  roundRect(ctx, lx, ly, cw, chH, 14);
  ctx.fill();
  ctx.strokeStyle = '#8C1D6B';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px Segoe UI, sans-serif';
  ctx.fillText('✨ Búsqueda de Prospectos con IA', lx + 24, ly + 40);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '12px Segoe UI, sans-serif';
  ctx.fillText('Consulta en cascada a 5 IAs gratuitas con respaldo automático:', lx + 24, ly + 68);

  const ias = [
    { name: '1. Google Gemini', status: 'Activo' },
    { name: '2. Groq Cloud', status: 'Respaldo' },
    { name: '3. OpenRouter', status: 'Respaldo' },
    { name: '4. SambaNova', status: 'Respaldo' },
    { name: '5. Build NVIDIA', status: 'Respaldo' }
  ];

  ias.forEach((ia, idx) => {
    const iy = ly + 95 + idx * 36;
    ctx.fillStyle = '#0F172A';
    roundRect(ctx, lx + 24, iy, cw - 48, 30, 6);
    ctx.fill();

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '13px Segoe UI, sans-serif';
    ctx.fillText(ia.name, lx + 36, iy + 20);

    ctx.fillStyle = idx === 0 ? '#10B981' : '#94A3B8';
    ctx.font = 'bold 11px Segoe UI, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(ia.status, lx + cw - 40, iy + 20);
    ctx.textAlign = 'left';
  });

  // Right Card: Export to Excel
  const rx = 650;
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, rx, ly, cw, chH, 14);
  ctx.fill();
  ctx.strokeStyle = '#009FA9';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 18px Segoe UI, sans-serif';
  ctx.fillText('📊 Exportación Lista para Excel (CSV)', rx + 24, ly + 40);

  ctx.fillStyle = '#475569';
  ctx.font = '13px Segoe UI, sans-serif';
  ctx.fillText('Descarga con 1 solo clic todos los prospectos.', rx + 24, ly + 75);
  ctx.fillText('Codificación UTF-8 BOM compatible con acentos.', rx + 24, ly + 100);

  // Big Download Button Graphic
  ctx.fillStyle = '#8C1D6B';
  roundRect(ctx, rx + 40, ly + 140, cw - 80, 55, 10);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('📥 Exportar Base Completa a Excel', rx + cw / 2, ly + 174);

  ctx.fillStyle = '#059669';
  ctx.font = 'bold 16px Segoe UI, sans-serif';
  ctx.fillText('¡Mucho éxito en tus ventas!', rx + cw / 2, ly + 250);
  ctx.fillStyle = '#8C1D6B';
  ctx.font = 'bold 14px Segoe UI, sans-serif';
  ctx.fillText('Quálitas Compañía de Seguros', rx + cw / 2, ly + 275);
}

function drawWatermark(w, h, ch) {
  // Bottom chapter pill
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  roundRect(ctx, 30, h - 50, 420, 32, 6);
  ctx.fill();

  ctx.fillStyle = '#00E5FF';
  ctx.font = 'bold 12px Segoe UI, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Capítulo ${ch.id}/7: ${ch.title}`, 45, h - 30);
}

// ---------------- CANVAS HELPERS ---------------- //

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

// ---------------- EVENT LISTENERS ---------------- //

btnPlayPause.addEventListener('click', togglePlayPause);
canvas.addEventListener('click', togglePlayPause);

document.getElementById('btnRewind').addEventListener('click', () => {
  seekTo(currentTime - 10);
});

document.getElementById('btnForward').addEventListener('click', () => {
  seekTo(currentTime + 10);
});

scrubberBar.addEventListener('click', (e) => {
  const rect = scrubberBar.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const pct = clickX / rect.width;
  seekTo(pct * TOTAL_DURATION);
});

btnToggleCc.addEventListener('click', () => {
  showCaptions = !showCaptions;
  btnToggleCc.style.color = showCaptions ? 'var(--qualitas-cyan)' : '#64748B';
  btnToggleCc.style.borderColor = showCaptions ? 'var(--qualitas-cyan)' : '#64748B';
  updateUI();
});

speedSelect.addEventListener('change', (e) => {
  playbackRate = parseFloat(e.target.value);
  audioElements.forEach(a => a.playbackRate = playbackRate);
});

btnFullscreen.addEventListener('click', () => {
  const card = document.querySelector('.player-card');
  if (!document.fullscreenElement) {
    card.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

// Built-in Video Recorder (Canvas Stream + Audio -> WebM/MP4)
btnDownloadRecording.addEventListener('click', async () => {
  if (!window.MediaRecorder) {
    alert('Tu navegador no soporta grabación directa de video. Te recomendamos reproducirlo en pantalla completa.');
    return;
  }

  btnDownloadRecording.disabled = true;
  btnDownloadRecording.innerHTML = '<i data-lucide="loader"></i> Grabando video en segundo plano...';
  if (window.lucide) window.lucide.createIcons();

  // Create stream from canvas
  const canvasStream = canvas.captureStream(30);

  // Setup Web Audio to mix chapter audio into recorder
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const dest = audioContext.createMediaStreamDestination();

  // Connect current chapter audio
  const currentAudio = audioElements[currentChapterIndex];
  try {
    const source = audioContext.createMediaElementSource(currentAudio);
    source.connect(dest);
    source.connect(audioContext.destination);
  } catch (e) {
    // Already connected or cross-origin
  }

  // Combine canvas and audio streams
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...dest.stream.getAudioTracks()
  ]);

  const chunks = [];
  const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9' });

  recorder.ondataavailable = e => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'video_tutorial_prospeccion_qualitas.webm';
    a.click();
    URL.revokeObjectURL(url);
    btnDownloadRecording.disabled = false;
    btnDownloadRecording.innerHTML = '<i data-lucide="download"></i> Descargar Video (.webm)';
    if (window.lucide) window.lucide.createIcons();
  };

  recorder.start();
  seekTo(0);
  play();

  // Stop after full playback or 3 minutes
  setTimeout(() => {
    if (recorder.state === 'recording') {
      recorder.stop();
      pause();
    }
  }, (TOTAL_DURATION / playbackRate) * 1000 + 1000);
});

// Initial Setup
initAudios();
renderChaptersList();
drawScene(0);
updateUI();
if (window.lucide) window.lucide.createIcons();
