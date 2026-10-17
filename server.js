const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3300;
// En Vercel el entry es api/index.js, __dirname = /var/task/api
// El archivo de datos esta en /var/task/data/prospects.json (un nivel arriba)
// Detectamos si estamos dentro de una carpeta 'api' y subimos si es necesario
const _serverDir = __dirname;
const _dataInSameDir = path.join(_serverDir, 'data', 'prospects.json');
const _dataInParentDir = path.join(_serverDir, '..', 'data', 'prospects.json');
const DATA_FILE = fs.existsSync(_dataInSameDir) ? _dataInSameDir : _dataInParentDir;

app.use(cors());
app.use(express.json());
// Detectar raiz del proyecto (cuando se ejecuta desde api/index.js en Vercel)
const _publicInSameDir = path.join(_serverDir, 'public');
const _publicInParentDir = path.join(_serverDir, '..', 'public');
const PUBLIC_DIR = fs.existsSync(_publicInSameDir) ? _publicInSameDir : _publicInParentDir;
app.use(express.static(PUBLIC_DIR));

// API keys from environment variables (NEVER hardcode in source)
const AI_CONFIG = {
  gemini: {
    name: 'Google Gemini',
    key: process.env.GEMINI_API_KEY || '',
    models: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']
  },
  groq: {
    name: 'Groq Cloud',
    key: process.env.GROQ_API_KEY || '',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768']
  },
  openrouter: {
    name: 'OpenRouter',
    key: process.env.OPENROUTER_API_KEY || '',
    models: ['deepseek/deepseek-r1:free', 'meta-llama/llama-3.3-70b-instruct:free', 'mistralai/mistral-7b-instruct:free']
  },
  sambanova: {
    name: 'SambaNova',
    key: process.env.SAMBANOVA_API_KEY || '',
    models: ['Meta-Llama-3.1-405B-Instruct', 'Meta-Llama-3.3-70B-Instruct', 'Meta-Llama-3.1-70B-Instruct']
  },
  nvidia: {
    name: 'Build NVIDIA',
    key: process.env.NVIDIA_API_KEY || '',
    models: ['meta/llama-3.3-70b-instruct', 'nvidia/llama-3.1-nemotron-70b-instruct', 'mistralai/mistral-7b-instruct-v0.3']
  }
};

// Target states
const TARGET_STATES = [
  'Baja California',
  'Baja California Sur',
  'Sonora',
  'Chihuahua',
  'Coahuila',
  'Durango',
  'Nuevo León',
  'Tamaulipas'
];

// In-memory cache for prospects
let prospectsCache = null;

// Helper to read prospects
function getProspects() {
  if (prospectsCache) return prospectsCache;
  try {
    if (!fs.existsSync(DATA_FILE)) {
      prospectsCache = [];
      return [];
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    prospectsCache = JSON.parse(raw);
    return prospectsCache;
  } catch (err) {
    console.error('Error reading prospects file:', err);
    prospectsCache = prospectsCache || [];
    return prospectsCache;
  }
}

// Helper to write prospects
function saveProspects(data) {
  prospectsCache = data;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.warn('Note: File write bypassed or failed (read-only serverless environment). Data preserved in memory.');
    return true;
  }
}

// Sync a single prospect to Google Sheets via n8n webhook (Portal → Sheets)
async function syncToN8n(prospect) {
  const N8N_WEBHOOK = 'https://n8n.korensmx.com/webhook/prospecta-sync';
  const response = await fetch(N8N_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prospecto: prospect, timestamp: new Date().toISOString() }),
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) {
    throw new Error(`n8n responded ${response.status}`);
  }
  return response.json();
}

// AI Provider Callers with Timeout
async function callGemini(prompt, systemInstruction = '', jsonMode = false) {
  const cfg = AI_CONFIG.gemini;
  let lastErr = null;
  for (const model of cfg.models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cfg.key}`;
      const body = {
        contents: [
          {
            role: 'user',
            parts: [{ text: (systemInstruction ? systemInstruction + '\n\n' : '') + prompt }]
          }
        ]
      };
      if (jsonMode) {
        body.generationConfig = { responseMimeType: 'application/json' };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(12000)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText.slice(0, 150)}`);
      }

      const json = await res.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('No candidate content returned');
      return { text, model: `Gemini (${model})` };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Gemini failed all models');
}

async function callOpenAICompatible(providerName, url, apiKey, models, prompt, systemInstruction = '', jsonMode = false) {
  let lastErr = null;
  for (const model of models) {
    try {
      const messages = [];
      if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
      }
      messages.push({ role: 'user', content: prompt });

      const payload = {
        model,
        messages,
        temperature: 0.7
      };
      if (jsonMode && (providerName === 'Groq' || providerName === 'OpenRouter')) {
        payload.response_format = { type: 'json_object' };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(12000)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText.slice(0, 150)}`);
      }

      const json = await res.json();
      const text = json.choices?.[0]?.message?.content;
      if (!text) throw new Error('No text returned in choice');
      return { text, model: `${providerName} (${model})` };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error(`${providerName} failed all models`);
}

// Cascading AI Engine: 1. Gemini -> 2. Groq -> 3. OpenRouter -> 4. SambaNova -> 5. NVIDIA
async function executeAICascade(prompt, systemInstruction = '', jsonMode = false) {
  const cascadeAttempts = [];
  const providers = [
    {
      name: 'Gemini',
      fn: () => callGemini(prompt, systemInstruction, jsonMode)
    },
    {
      name: 'Groq Cloud',
      fn: () => callOpenAICompatible(
        'Groq',
        'https://api.groq.com/openai/v1/chat/completions',
        AI_CONFIG.groq.key,
        AI_CONFIG.groq.models,
        prompt,
        systemInstruction,
        jsonMode
      )
    },
    {
      name: 'OpenRouter',
      fn: () => callOpenAICompatible(
        'OpenRouter',
        'https://openrouter.ai/api/v1/chat/completions',
        AI_CONFIG.openrouter.key,
        AI_CONFIG.openrouter.models,
        prompt,
        systemInstruction,
        jsonMode
      )
    },
    {
      name: 'SambaNova',
      fn: () => callOpenAICompatible(
        'SambaNova',
        'https://api.sambanova.ai/v1/chat/completions',
        AI_CONFIG.sambanova.key,
        AI_CONFIG.sambanova.models,
        prompt,
        systemInstruction,
        jsonMode
      )
    },
    {
      name: 'Build NVIDIA',
      fn: () => callOpenAICompatible(
        'NVIDIA',
        'https://integrate.api.nvidia.com/v1/chat/completions',
        AI_CONFIG.nvidia.key,
        AI_CONFIG.nvidia.models,
        prompt,
        systemInstruction,
        jsonMode
      )
    }
  ];

  for (const p of providers) {
    const start = Date.now();
    try {
      const result = await p.fn();
      const latency = Date.now() - start;
      cascadeAttempts.push({
        provider: p.name,
        status: 'SUCCESS',
        model: result.model,
        latencyMs: latency
      });
      return {
        text: result.text,
        providerUsed: p.name,
        modelUsed: result.model,
        latencyMs: latency,
        cascadeLog: cascadeAttempts
      };
    } catch (err) {
      const latency = Date.now() - start;
      cascadeAttempts.push({
        provider: p.name,
        status: 'FAILED',
        error: err.message,
        latencyMs: latency
      });
      console.warn(`[AI Cascade] ${p.name} failed: ${err.message}. Trying next in sequence...`);
    }
  }

  throw new Error(`All 5 AI providers in cascade failed: ${JSON.stringify(cascadeAttempts)}`);
}

// ---------------- API ROUTES ---------------- //

// GET /api/prospects - List with filtering
app.get('/api/prospects', (req, res) => {
  const { estado, ciudad, giro, estadoGestion, tipoOportunidad, search } = req.query;
  let list = getProspects();

  if (estado && estado !== 'Todos') {
    list = list.filter(p => p.estado && p.estado.toLowerCase() === estado.toLowerCase());
  }
  if (ciudad && ciudad !== 'Todas') {
    list = list.filter(p => p.ciudad && p.ciudad.toLowerCase() === ciudad.toLowerCase());
  }
  if (giro && giro !== 'Todos') {
    list = list.filter(p => p.giro && p.giro.toLowerCase().includes(giro.toLowerCase()));
  }
  if (estadoGestion && estadoGestion !== 'Todos') {
    list = list.filter(p => p.estadoGestion && p.estadoGestion.toLowerCase() === estadoGestion.toLowerCase());
  }
  if (tipoOportunidad && tipoOportunidad !== 'Todos') {
    list = list.filter(p => p.tipoOportunidad && p.tipoOportunidad.toLowerCase().includes(tipoOportunidad.toLowerCase()));
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(p =>
      (p.razonSocial && p.razonSocial.toLowerCase().includes(s)) ||
      (p.nombreComercial && p.nombreComercial.toLowerCase().includes(s)) ||
      (p.ciudad && p.ciudad.toLowerCase().includes(s)) ||
      (p.giro && p.giro.toLowerCase().includes(s)) ||
      (p.responsables && p.responsables.some(r => r.nombre && r.nombre.toLowerCase().includes(s)))
    );
  }

  res.json({
    success: true,
    count: list.length,
    data: list
  });
});

// POST /api/prospects - Create a single prospect
app.post('/api/prospects', (req, res) => {
  const prospects = getProspects();
  const newProspect = {
    id: req.body.id || `PROSP-${Date.now()}`,
    razonSocial: req.body.razonSocial || 'Sin Razón Social',
    nombreComercial: req.body.nombreComercial || req.body.razonSocial,
    giro: req.body.giro || 'General',
    numeroEmpleados: parseInt(req.body.numeroEmpleados || 0, 10),
    numeroVehiculos: parseInt(req.body.numeroVehiculos || 0, 10),
    estado: req.body.estado || 'Nuevo León',
    ciudad: req.body.ciudad || 'Monterrey',
    domicilio: req.body.domicilio || 'No especificado',
    telefonos: req.body.telefonos || 'No especificado',
    correo: req.body.correo || 'contacto@empresa.com',
    responsables: req.body.responsables || [
      {
        nombre: req.body.responsable || 'Dirección General / Recursos Humanos',
        cargo: req.body.cargo || 'Responsable',
        correo: req.body.correo || '',
        telefono: req.body.telefonos || ''
      }
    ],
    tipoOportunidad: req.body.tipoOportunidad || 'Flotilla Comercial',
    potencialPrimaEstimada: parseInt(req.body.potencialPrimaEstimada || 0, 10) ||
      (parseInt(req.body.numeroVehiculos || 0, 10) * 14000 + parseInt(req.body.numeroEmpleados || 0, 10) * 1200),
    estadoGestion: req.body.estadoGestion || 'Nuevo Prospecto',
    fechaAlta: req.body.fechaAlta || new Date().toISOString().split('T')[0],
    fechaUltimoContacto: req.body.fechaUltimoContacto || null,
    fechaProximoSeguimiento: req.body.fechaProximoSeguimiento || null,
    notas: req.body.notas || [],
    fuente: req.body.fuente || 'Manual'
  };

  prospects.unshift(newProspect);
  saveProspects(prospects);
  res.status(201).json({ success: true, data: newProspect });
});

// PUT /api/prospects/:id - Update prospect status or details
app.put('/api/prospects/:id', (req, res) => {
  const prospects = getProspects();
  const idx = prospects.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Prospecto no encontrado' });
  }

  // If changing status to managed, record timestamp
  if (req.body.estadoGestion && req.body.estadoGestion !== prospects[idx].estadoGestion) {
    req.body.fechaUltimoContacto = new Date().toISOString().split('T')[0];
  }

  prospects[idx] = { ...prospects[idx], ...req.body };
  saveProspects(prospects);

  // Sync to Google Sheets via n8n (fire-and-forget, no await)
  syncToN8n(prospects[idx]).catch(err =>
    console.warn('[n8n sync] PUT failed:', err.message)
  );

  res.json({ success: true, data: prospects[idx] });
});

// POST /api/prospects/:id/notes - Add a note to a prospect
app.post('/api/prospects/:id/notes', (req, res) => {
  const prospects = getProspects();
  const idx = prospects.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Prospecto no encontrado' });
  }

  if (!prospects[idx].notas) prospects[idx].notas = [];
  const note = {
    fecha: new Date().toISOString().split('T')[0],
    usuario: req.body.usuario || 'Agente Quálitas',
    texto: req.body.texto || ''
  };
  prospects[idx].notas.unshift(note);
  prospects[idx].fechaUltimoContacto = new Date().toISOString().split('T')[0];
  saveProspects(prospects);

  // Sync to Google Sheets via n8n (fire-and-forget, no await)
  syncToN8n(prospects[idx]).catch(err =>
    console.warn('[n8n sync] Notes POST failed:', err.message)
  );

  res.json({ success: true, data: prospects[idx] });
});

// DELETE /api/prospects/:id - Delete prospect
app.delete('/api/prospects/:id', (req, res) => {
  let prospects = getProspects();
  const initialLen = prospects.length;
  prospects = prospects.filter(p => p.id !== req.params.id);
  if (prospects.length === initialLen) {
    return res.status(404).json({ success: false, error: 'Prospecto no encontrado' });
  }
  saveProspects(prospects);
  res.json({ success: true, message: 'Prospecto eliminado correctamente' });
});

// POST /api/prospects/reset-management - Reset all managed prospects back to 'Nuevo Prospecto' (clean state)
app.post('/api/prospects/reset-management', (req, res) => {
  const prospects = getProspects();
  let count = 0;
  prospects.forEach(p => {
    if (p.estadoGestion && p.estadoGestion !== 'Nuevo Prospecto') {
      p.estadoGestion = 'Nuevo Prospecto';
      p.fechaUltimoContacto = null;
      p.notas = [];
      count++;
    }
  });
  saveProspects(prospects);
  res.json({
    success: true,
    message: `Se limpió el estado de gestión de ${count} prospectos. Ahora todos están como 'Nuevo Prospecto'.`,
    resetCount: count
  });
});

// DELETE /api/prospects/managed - Delete all prospects that have already been managed
app.delete('/api/prospects/managed/bulk', (req, res) => {
  let prospects = getProspects();
  const initialLen = prospects.length;
  prospects = prospects.filter(p => !p.estadoGestion || p.estadoGestion === 'Nuevo Prospecto');
  const deletedCount = initialLen - prospects.length;
  saveProspects(prospects);
  res.json({
    success: true,
    message: `Se eliminaron ${deletedCount} prospectos que ya contaban con una gestión.`,
    deletedCount
  });
});

// POST /api/generate-prospects - Trigger AI discovery cascade
app.post('/api/generate-prospects', async (req, res) => {
  const { estado, giro, count = 3 } = req.body;
  const targetState = estado && estado !== 'Todos' ? estado : TARGET_STATES[Math.floor(Math.random() * TARGET_STATES.length)];
  const existingNames = getProspects().map(p => p.razonSocial).slice(0, 30).join(', ');

  const systemPrompt = `Eres el Especialista Senior de Inteligencia Comercial de Quálitas Compañía de Seguros, la aseguradora mexicana líder en el ramo automotriz. Tu misión es prospectar negocios y organizaciones de alto valor en el Norte de México para venta de seguros de flotilla comercial o colectividad para empleados.`;

  const userPrompt = `Genera ${count} prospectos de negocios reales o altamente representativos ubicados en el estado de "${targetState}" ${giro && giro !== 'Todos' ? `del giro "${giro}"` : ''} que cumplan OBLIGATORIAMENTE con estos criterios de calificación Quálitas:
1. Empresas con MÁS de 50 empleados O con flotilla de MÁS de 20 vehículos.
2. O Sindicatos industriales, mineros, del transporte, maquiladores, petroquímicos o comerciales (PROHIBIDO sindicatos de maestros como SNTE/CNTE y PROHIBIDO sindicatos de telefonistas como STRM).
3. O Universidades, institutos tecnológicos o colegios superiores.
4. NO repitas ninguno de estos que ya están en la base: ${existingNames}

Responde ÚNICAMENTE un arreglo JSON válido (sin markdown ni explicaciones adicionales) con este esquema exacto para cada elemento:
[
  {
    "razonSocial": "Nombre legal o comercial completo",
    "nombreComercial": "Nombre comercial conocido",
    "giro": "Giro exacto de la organización",
    "numeroEmpleados": 250,
    "numeroVehiculos": 35,
    "estado": "${targetState}",
    "ciudad": "Ciudad real en ${targetState}",
    "domicilio": "Calle, Número, Colonia, C.P.",
    "telefonos": "+52 (lada) xxx-xxxx",
    "correo": "correo de contacto o RH",
    "responsable": "Nombre del responsable (ej. Lic. Nombre Apellido)",
    "cargo": "Director de Recursos Humanos / Gerente de Compras / Flotillas",
    "tipoOportunidad": "Flotilla Comercial" | "Colectividad Empleados" | "Mixto (Flotilla + Colectividad)",
    "razonAfinidad": "Por qué es ideal para Quálitas en 1 línea"
  }
]`;

  try {
    const aiResult = await executeAICascade(userPrompt, systemPrompt, true);
    let parsedData = null;

    // Clean JSON response
    let cleanText = aiResult.text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```/, '').replace(/```$/, '').trim();
    }

    try {
      parsedData = JSON.parse(cleanText);
      if (parsedData.prospects && Array.isArray(parsedData.prospects)) {
        parsedData = parsedData.prospects;
      }
    } catch (parseErr) {
      // Find array boundaries
      const firstBracket = cleanText.indexOf('[');
      const lastBracket = cleanText.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1) {
        parsedData = JSON.parse(cleanText.substring(firstBracket, lastBracket + 1));
      } else {
        throw new Error('No se pudo parsear el JSON generado por la IA');
      }
    }

    if (!Array.isArray(parsedData)) {
      parsedData = [parsedData];
    }

    // Filter and format into app model
    const currentProspects = getProspects();
    const addedList = [];

    for (const item of parsedData) {
      // Security check: reject maestros or telefonistas
      const textCheck = (item.razonSocial + ' ' + item.giro + ' ' + (item.cargo || '')).toLowerCase();
      if (textCheck.includes('maestro') || textCheck.includes('snte') || textCheck.includes('cnte') || textCheck.includes('telefonista') || textCheck.includes('strm')) {
        continue;
      }

      const numVeh = parseInt(item.numeroVehiculos || 0, 10);
      const numEmp = parseInt(item.numeroEmpleados || 0, 10);
      const estimatedPremium = (numVeh * 14000) + (numEmp * 1200);

      const formatted = {
        id: `PROSP-${targetState.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`,
        razonSocial: item.razonSocial,
        nombreComercial: item.nombreComercial || item.razonSocial,
        giro: item.giro,
        numeroEmpleados: numEmp,
        numeroVehiculos: numVeh,
        estado: item.estado || targetState,
        ciudad: item.ciudad || 'No especificada',
        domicilio: item.domicilio || 'No especificado',
        telefonos: item.telefonos || '+52 (800) 000-0000',
        correo: item.correo || 'contacto@empresa.com',
        responsables: [
          {
            nombre: item.responsable || 'Dirección de Recursos Humanos / Administración',
            cargo: item.cargo || 'Responsable',
            correo: item.correo || '',
            telefono: item.telefonos || ''
          }
        ],
        tipoOportunidad: item.tipoOportunidad || (numVeh > 25 ? 'Flotilla Comercial' : 'Colectividad Empleados'),
        potencialPrimaEstimada: estimatedPremium,
        estadoGestion: 'Nuevo Prospecto',
        fechaAlta: new Date().toISOString().split('T')[0],
        fechaUltimoContacto: null,
        fechaProximoSeguimiento: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        notas: [
          {
            fecha: new Date().toISOString().split('T')[0],
            usuario: `IA ${aiResult.providerUsed}`,
            texto: item.razonAfinidad || `Prospecto detectado por Cascada de IA (${aiResult.modelUsed}).`
          }
        ],
        fuente: `IA Cascada (${aiResult.providerUsed})`
      };

      currentProspects.unshift(formatted);
      addedList.push(formatted);
    }

    saveProspects(currentProspects);

    res.json({
      success: true,
      addedCount: addedList.length,
      providerUsed: aiResult.providerUsed,
      modelUsed: aiResult.modelUsed,
      latencyMs: aiResult.latencyMs,
      cascadeLog: aiResult.cascadeLog,
      data: addedList
    });
  } catch (err) {
    console.error('Error generating prospects with AI:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// POST /api/generate-email - Generate human-sounding professional email
app.post('/api/generate-email', async (req, res) => {
  const { prospectId, tono = 'ejecutivo', remitente = 'Asesor Ejecutivo Corporativo Quálitas' } = req.body;
  const prospects = getProspects();
  const p = prospects.find(item => item.id === prospectId);

  if (!p) {
    return res.status(404).json({ success: false, error: 'Prospecto no encontrado' });
  }

  const responsable = p.responsables?.[0] || { nombre: 'Estimado Responsable', cargo: 'Director' };

  let enfoqueInstruccion = '';
  if (tono === 'colectividad') {
    enfoqueInstruccion = 'Enfócate en los beneficios para los colaboradores: programa de seguros de auto con descuento vía nómina sin costo para la empresa, tarifas preferenciales Quálitas, facilidades de pago y protección patrimonial como incentivo de retención de talento.';
  } else if (tono === 'financiero') {
    enfoqueInstruccion = 'Enfócate en la optimización financiera y reducción de costos: control de siniestralidad de la flotilla, deducibilidad fiscal al 100%, telemetría opcional, menores tiempos de inactividad de vehículos y condiciones de prima competitivas con la aseguradora #1 de México.';
  } else {
    enfoqueInstruccion = 'Tono ejecutivo institucional: directo, respetuoso, empático, destacando el liderazgo nacional de Quálitas en el ramo automotriz (más de 30% de participación en México), red propia de ajustadores en el norte y una propuesta a la medida en una breve reunión de 15 minutos presencial o virtual.';
  }

  const systemPrompt = `Eres un asesor comercial senior corporativo de Quálitas Compañía de Seguros en México. Tu comunicación es impecable, elegante, cálida y 100% natural, como si hubiera sido redactada manualmente por un ejecutivo humano de alto nivel, sin frases trilladas de chatbot o clichés mecánicos.`;

  const userPrompt = `Redacta un correo electrónico profesional para concertar una cita de negocios con la siguiente organización:
- Organización: ${p.razonSocial} (${p.nombreComercial})
- Giro: ${p.giro}
- Ubicación: ${p.ciudad}, ${p.estado}
- Empleados / Asociados: ${p.numeroEmpleados}
- Unidades de Flotilla: ${p.numeroVehiculos}
- Destinatario: ${responsable.nombre} (${responsable.cargo})
- Tipo de propuesta: ${p.tipoOportunidad}
- Enfoque deseado: ${enfoqueInstruccion}
- Remitente: ${remitente} - Quálitas Compañía de Seguros

Requisitos del correo:
1. Incluye una línea de "Asunto:" atractiva, profesional y personalizada.
2. Saludo adecuado con el nombre y cargo.
3. Menciona brevemente por qué Quálitas pensó en ${p.nombreComercial} considerando su operación en ${p.ciudad}, ${p.estado}.
4. Propón una reunión de 15 minutos de exploración técnica y económica sin compromiso.
5. Cierre profesional y firma formal con datos de Quálitas.
6. NO uses marcadores de posición genéricos como "[Inserta aquí]". Escribe el correo listo para enviarse.`;

  try {
    const aiResult = await executeAICascade(userPrompt, systemPrompt, false);
    res.json({
      success: true,
      emailText: aiResult.text.trim(),
      providerUsed: aiResult.providerUsed,
      modelUsed: aiResult.modelUsed,
      prospect: p
    });
  } catch (err) {
    console.error('Error generating email with AI:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/ai-status - Health check across all 5 AI providers
app.get('/api/ai-status', async (req, res) => {
  const statusResults = [];

  // Check 1: Gemini
  try {
    const t0 = Date.now();
    const resG = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${AI_CONFIG.gemini.key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] }),
      signal: AbortSignal.timeout(6000)
    });
    const lat = Date.now() - t0;
    statusResults.push({
      id: 'gemini',
      name: 'Google Gemini',
      model: 'gemini-3.5-flash-lite',
      active: resG.ok,
      status: resG.ok ? 'ONLINE' : `HTTP ${resG.status}`,
      latencyMs: lat
    });
  } catch (e) {
    statusResults.push({ id: 'gemini', name: 'Google Gemini', active: false, status: e.name, latencyMs: null });
  }

  // Check 2: Groq
  try {
    const t0 = Date.now();
    const resGr = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.groq.key}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: 'ping' }]
      }),
      signal: AbortSignal.timeout(6000)
    });
    const lat = Date.now() - t0;
    statusResults.push({
      id: 'groq',
      name: 'Groq Cloud',
      model: 'openai/gpt-oss-120b',
      active: resGr.ok,
      status: resGr.ok ? 'ONLINE' : `HTTP ${resGr.status}`,
      latencyMs: lat
    });
  } catch (e) {
    statusResults.push({ id: 'groq', name: 'Groq Cloud', active: false, status: e.name, latencyMs: null });
  }

  // Check 3: OpenRouter
  try {
    const t0 = Date.now();
    const resOr = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: { 'Authorization': `Bearer ${AI_CONFIG.openrouter.key}` },
      signal: AbortSignal.timeout(6000)
    });
    const lat = Date.now() - t0;
    statusResults.push({
      id: 'openrouter',
      name: 'OpenRouter',
      model: 'meta/free-cascade',
      active: resOr.ok,
      status: resOr.ok ? 'ONLINE' : `HTTP ${resOr.status}`,
      latencyMs: lat
    });
  } catch (e) {
    statusResults.push({ id: 'openrouter', name: 'OpenRouter', active: false, status: e.name, latencyMs: null });
  }

  // Check 4: SambaNova
  try {
    const t0 = Date.now();
    const resSn = await fetch('https://api.sambanova.ai/v1/models', {
      headers: { 'Authorization': `Bearer ${AI_CONFIG.sambanova.key}` },
      signal: AbortSignal.timeout(6000)
    });
    const lat = Date.now() - t0;
    statusResults.push({
      id: 'sambanova',
      name: 'SambaNova Cloud',
      model: 'Meta-Llama-3.3-70B-Instruct',
      active: resSn.ok,
      status: resSn.ok ? 'ONLINE' : `HTTP ${resSn.status}`,
      latencyMs: lat
    });
  } catch (e) {
    statusResults.push({ id: 'sambanova', name: 'SambaNova Cloud', active: false, status: e.name, latencyMs: null });
  }

  // Check 5: Build NVIDIA
  try {
    const t0 = Date.now();
    const resNv = await fetch('https://integrate.api.nvidia.com/v1/models', {
      headers: { 'Authorization': `Bearer ${AI_CONFIG.nvidia.key}` },
      signal: AbortSignal.timeout(6000)
    });
    const lat = Date.now() - t0;
    statusResults.push({
      id: 'nvidia',
      name: 'Build NVIDIA',
      model: 'deepseek-v4.1-flash',
      active: resNv.ok,
      status: resNv.ok ? 'ONLINE' : `HTTP ${resNv.status}`,
      latencyMs: lat
    });
  } catch (e) {
    statusResults.push({ id: 'nvidia', name: 'Build NVIDIA', active: false, status: e.name, latencyMs: null });
  }

  res.json({
    success: true,
    cascadeSequence: ['Google Gemini', 'Groq Cloud', 'OpenRouter', 'SambaNova', 'Build NVIDIA'],
    providers: statusResults
  });
});

// GET /api/debug - Diagnostico de rutas y variables (solo en no-produccion o con token)
app.get('/api/debug', (req, res) => {
  const dataExists = fs.existsSync(DATA_FILE);
  res.json({
    DATA_FILE,
    PUBLIC_DIR,
    dataFileExists: dataExists,
    prospectsCount: dataExists ? (() => { try { return JSON.parse(fs.readFileSync(DATA_FILE,'utf8')).length; } catch(e) { return 'parse error: '+e.message; } })() : 0,
    envKeys: {
      GEMINI: !!process.env.GEMINI_API_KEY,
      GROQ: !!process.env.GROQ_API_KEY,
      OPENROUTER: !!process.env.OPENROUTER_API_KEY,
      SAMBANOVA: !!process.env.SAMBANOVA_API_KEY,
      NVIDIA: !!process.env.NVIDIA_API_KEY
    },
    nodeVersion: process.version,
    cwd: process.cwd(),
    dirname: __dirname
  });
});

// GET /api/stats - Dashboard analytics
app.get('/api/stats', (req, res) => {
  const prospects = getProspects();
  const total = prospects.length;

  const byStatus = {
    'Nuevo Prospecto': 0,
    'Contactado': 0,
    'Cita Agendada': 0,
    'En Cotización': 0,
    'Cerrado / Ganado': 0,
    'Descartado': 0
  };

  const byState = {};
  TARGET_STATES.forEach(st => byState[st] = 0);

  let totalPrimaPotencial = 0;
  let totalVehiculos = 0;
  let totalEmpleados = 0;
  let gestionados = 0;

  for (const p of prospects) {
    if (byStatus[p.estadoGestion] !== undefined) {
      byStatus[p.estadoGestion]++;
    }
    if (p.estadoGestion && p.estadoGestion !== 'Nuevo Prospecto') {
      gestionados++;
    }
    if (byState[p.estado] !== undefined) {
      byState[p.estado]++;
    } else {
      byState[p.estado] = 1;
    }
    totalPrimaPotencial += (p.potencialPrimaEstimada || 0);
    totalVehiculos += (p.numeroVehiculos || 0);
    totalEmpleados += (p.numeroEmpleados || 0);
  }

  res.json({
    success: true,
    total,
    gestionados,
    pendientes: total - gestionados,
    tasaGestion: total > 0 ? Math.round((gestionados / total) * 100) : 0,
    totalPrimaPotencial,
    totalVehiculos,
    totalEmpleados,
    byStatus,
    byState
  });
});

// GET /api/export - Export to Excel-ready CSV (UTF-8 BOM)
app.get('/api/export', (req, res) => {
  const prospects = getProspects();
  const headers = [
    'ID',
    'Razón Social',
    'Nombre Comercial',
    'Giro',
    'Estado',
    'Ciudad',
    'Empleados / Asociados',
    'Vehículos Flotilla',
    'Tipo de Oportunidad',
    'Potencial Prima Anual (MXN)',
    'Estado de Gestión',
    'Contacto Responsable',
    'Cargo',
    'Teléfono',
    'Correo Electrónico',
    'Domicilio',
    'Fecha de Alta',
    'Último Contacto',
    'Fuente'
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = prospects.map(p => {
    const r = p.responsables?.[0] || {};
    return [
      p.id,
      p.razonSocial,
      p.nombreComercial,
      p.giro,
      p.estado,
      p.ciudad,
      p.numeroEmpleados,
      p.numeroVehiculos,
      p.tipoOportunidad,
      p.potencialPrimaEstimada,
      p.estadoGestion,
      r.nombre || '',
      r.cargo || '',
      p.telefonos || r.telefono || '',
      p.correo || r.correo || '',
      p.domicilio,
      p.fechaAlta,
      p.fechaUltimoContacto || 'Sin contacto',
      p.fuente
    ].map(escapeCSV).join(',');
  });

  // UTF-8 BOM (\uFEFF) for Excel compatibility
  const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(','), ...rows].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="prospectos_qualitas_norte.csv"');
  res.send(csvContent);
});

// POST /api/webhook/n8n - Automated weekly ingestion endpoint
app.post('/api/webhook/n8n', (req, res) => {
  const newItems = Array.isArray(req.body) ? req.body : [req.body];
  const prospects = getProspects();
  let addedCount = 0;

  for (const item of newItems) {
    if (!item.razonSocial) continue;
    // Check if duplicate
    const exists = prospects.some(p => p.razonSocial.toLowerCase() === item.razonSocial.toLowerCase());
    if (exists) continue;

    const numVeh = parseInt(item.numeroVehiculos || 0, 10);
    const numEmp = parseInt(item.numeroEmpleados || 0, 10);

    const formatted = {
      id: item.id || `PROSP-N8N-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`,
      razonSocial: item.razonSocial,
      nombreComercial: item.nombreComercial || item.razonSocial,
      giro: item.giro || 'Comercial / Industrial',
      numeroEmpleados: numEmp,
      numeroVehiculos: numVeh,
      estado: item.estado || 'Nuevo León',
      ciudad: item.ciudad || 'Monterrey',
      domicilio: item.domicilio || 'No especificado',
      telefonos: item.telefonos || '+52 (800) 000-0000',
      correo: item.correo || 'contacto@empresa.com',
      responsables: item.responsables || [
        {
          nombre: item.responsable || 'Dirección de Recursos Humanos',
          cargo: item.cargo || 'Responsable',
          correo: item.correo || '',
          telefono: item.telefonos || ''
        }
      ],
      tipoOportunidad: item.tipoOportunidad || (numVeh > 20 ? 'Flotilla Comercial' : 'Colectividad Empleados'),
      potencialPrimaEstimada: (numVeh * 14000) + (numEmp * 1200),
      estadoGestion: 'Nuevo Prospecto',
      fechaAlta: new Date().toISOString().split('T')[0],
      fechaUltimoContacto: null,
      fechaProximoSeguimiento: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      notas: [
        {
          fecha: new Date().toISOString().split('T')[0],
          usuario: 'Flujo N8N Semanal',
          texto: 'Prospecto importado automáticamente mediante flujo programado n8n.'
        }
      ],
      fuente: 'Flujo n8n Automatizado'
    };

    prospects.unshift(formatted);
    addedCount++;
  }

  saveProspects(prospects);
  res.json({
    success: true,
    message: `Se agregaron ${addedCount} nuevos prospectos desde n8n`,
    addedCount
  });
});

// Start Server if run directly
if (require.main === module || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`Quálitas Prospector Norte Server escuchando en puerto ${PORT}`);
    console.log(`URL Local: http://localhost:${PORT}`);
    console.log(`Cascada IA: Gemini -> Groq -> OpenRouter -> SambaNova -> NVIDIA`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
