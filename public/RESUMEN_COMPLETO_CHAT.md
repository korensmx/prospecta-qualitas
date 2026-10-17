# 📋 PROYECTO PROSPECTA QUÁLITAS — RESUMEN COMPLETO DE CONTEXTO Y CONTINUIDAD
> **Instrucción para el nuevo chat:** Copia y pega el contenido íntegro de este archivo en la nueva conversación. Le permitirá al nuevo asistente entender el 100% del sistema, su arquitectura, criterios de negocio, estado actual de despliegue y cómo continuar sin repetir trabajo.

---

## 🎯 1. VISIÓN GENERAL Y OBJETIVO DEL SISTEMA

**Prospecta Quálitas** es una plataforma web corporativa de inteligencia comercial y prospección B2B desarrollada para agentes y promotores de **Quálitas Compañía de Seguros**. Su objetivo es captar y gestionar prospectos empresariales e institucionales en los **8 estados de la zona norte de México**:

1. **Baja California** (Tijuana, Mexicali, Ensenada)
2. **Baja California Sur** (La Paz, Los Cabos)
3. **Sonora** (Hermosillo, Cd. Obregón, Nogales)
4. **Chihuahua** (Cd. Juárez, Chihuahua)
5. **Coahuila** (Saltillo, Torreón, Monclova, Ramos Arizpe)
6. **Durango** (Durango, Gómez Palacio)
7. **Nuevo León** (Monterrey, San Pedro, Apodaca, Guadalupe, Santa Catarina)
8. **Tamaulipas** (Reynosa, Matamoros, Tampico, Nuevo Laredo)

### 📌 Criterios de Suscripción Calificada
El sistema audita y filtra estrictamente prospectos bajo estas reglas:
- **Empresas e Industrias**: Más de 50 empleados/agremiados O flotillas vehiculares de más de 20 unidades.
- **Sindicatos Permitidos**: Mineros, metalúrgicos, transporte, maquiladores, petroquímicos y comerciales.
- ⛔ **EXCLUSIÓN ESTRICTA OBLIGATORIA**: Totalmente prohibidos sindicatos de maestros (SNTE, CNTE) y sindicatos de telefonistas (STRM).
- **Sector Educativo**: Universidades públicas, privadas, institutos tecnológicos y colegios de nivel superior.
- **Productos Quálitas Ofrecidos**:
  - **Flotilla Comercial**: Pólizas para equipo de transporte utilitario y pesado (deducibilidad fiscal, telemetría, red propia de ajustadores con arribo <30 mins).
  - **Colectividad de Autos para Empleados**: Beneficio laboral sin costo patronal con descuento vía nómina y tarifas corporativas preferenciales.
  - **Mixto**: Combinación de flotilla utilitaria + programa de colectividad.

---

## 🌐 2. ENLACES Y ACCESOS DEL PROYECTO

- 🚀 **App en Producción (Vercel)**: [https://prospecta-qualitas.vercel.app](https://prospecta-qualitas.vercel.app)
- 🎓 **Video Tutorial Interactivo Online**: [https://prospecta-qualitas.vercel.app/tutorial.html](https://prospecta-qualitas.vercel.app/tutorial.html)
- 📥 **Descarga Directa del Video (.webm)**: [https://prospecta-qualitas.vercel.app/video_tutorial_qualitas.webm](https://prospecta-qualitas.vercel.app/video_tutorial_qualitas.webm)
- 💻 **Servidor Local**: `http://localhost:3300` (Directorio: `/Users/gdas/.gemini/antigravity/scratch/QUALITAS`)
- ❌ **Dominios Anteriores Eliminados**: `prospecta-norte.vercel.app` y `prospecta-korensmx-1715.vercel.app` (fueron desvinculados y borrados exitosamente).

---

## 🧠 3. MOTOR DE CASCADA MULTI-IA (5 PROVEEDORES GRATUITOS)

El backend cuenta con un sistema de tolerancia a fallos en cascada secuencial. Si el primer proveedor falla (por saturación, error HTTP, timeout o límite de cuota), el sistema salta automáticamente al siguiente:

```
[1. Google Gemini] ──(Falla)──> [2. Groq Cloud] ──(Falla)──> [3. OpenRouter] ──(Falla)──> [4. SambaNova] ──(Falla)──> [5. Build NVIDIA]
```

### Configuración de Proveedores:
1. **Google Gemini**:
   - Modelos: `gemini-2.5-flash`, `gemini-1.5-flash`
   - Clave API: `AQ.Ab8RN6LpCB5LmIB1wv1bbZ3zmXwJ1pvzaHPA9KsTHzZ0SgoUQg`
2. **Groq Cloud**:
   - Modelos: `llama-3.3-70b-versatile`, `mixtral-8x7b-32768`
   - Clave API: `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`
3. **OpenRouter**:
   - Modelos: `meta-llama/llama-3.3-70b-instruct:free`, `liquid/lfm-2.5-2.6b:free`
   - Clave API: `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`
4. **SambaNova**:
   - Modelos: `Meta-Llama-3.3-70B-Instruct`, `DeepSeek-R1-Distill-Llama-70B`
   - Clave API: `e32f78db-aa8c-4bcd-bc31-c996d04aa95c`
5. **Build NVIDIA**:
   - Modelos: `deepseek-ai/deepseek-v3`, `meta/llama-3.3-70b-instruct`
   - Clave API: `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`

---

## 🎨 4. BRANDING E IDENTIDAD VISUAL DE QUÁLITAS

La interfaz web fue diseñada siguiendo la identidad corporativa de Quálitas Compañía de Seguros:
- **Color Primario (Magenta Quálitas)**: `#8C1D6B`
- **Color Secundario (Cyan / Turquesa Quálitas)**: `#009FA9`
- **Color Neutro Oscuro (Texto y Títulos)**: `#2C2C2C`
- **Fondo General**: `#F8F9FA` y blanco `#FFFFFF`
- **Logotipo Corporativo**: Integrado en `public/logo-qualitas.png` con la tipografía y símbolo oficial de la Q.
- **Componentes**: Tarjetas con sombras suaves, badges de estado redondeados, filtros dinámicos, semáforo visual de latencia de las 5 IAs, vista dual (Tabla y Kanban).

---

## 📁 5. ESTRUCTURA COMPLETA DEL PROYECTO

Ruta base en disco: `/Users/gdas/.gemini/antigravity/scratch/QUALITAS`

```
QUALITAS/
├── api/
│   └── index.js                         # Adaptador Serverless para despliegues en Vercel
├── data/
│   └── prospects.json                   # Base de datos persistente (28 prospectos calificados del norte)
├── public/
│   ├── audio/                           # 7 pistas de audio narradas en español de México (M4A)
│   │   ├── ch_1.m4a ... ch_7.m4a
│   │   └── chapters.json                # Metadatos, tiempos y subtítulos por capítulo
│   ├── app.js                           # Lógica frontend: filtros, CRM, redactor IA, exportar Excel
│   ├── index.html                       # Página principal del Portal de Prospección Quálitas
│   ├── logo-qualitas.png                # Logotipo oficial de Quálitas Compañía de Seguros
│   ├── styles.css                       # Hojas de estilo con branding Quálitas
│   ├── tutorial.html                    # Reproductor interactivo del video tutorial con subtítulos
│   ├── tutorial.js                      # Motor Canvas 60 FPS con sincronización de audio/texto
│   └── video_tutorial_qualitas.webm     # Video tutorial renderizado (1080p, ~3 minutos)
├── scripts/
│   └── record_video.js                  # Script en Puppeteer para grabar la animación del tutorial
├── .env.local                           # Claves de las 5 IAs y configuración de entorno
├── .gitignore                           # Exclusiones de Git (node_modules, .vercel)
├── package.json                         # Dependencias (express, cors)
├── README.md                            # Documentación técnica del repositorio
├── server.js                            # Servidor Express, API REST, motor multi-IA y endpoints
├── vercel.json                          # Configuración de rutas y reescritura para Vercel
└── workflow_qualitas_prospeccion.json   # Flujo de N8N semanal listo para importar
```

---

## 🛠️ 6. FUNCIONALIDADES Y CARACTERÍSTICAS IMPLEMENTADAS

1. **Catálogo de 28 Prospectos Calificados**:
   - Empresas reales de gran escala en los 8 estados del norte (ej. Metalsa, Ternium, Grupo Bafar, Oxxo Gas, UANL, CETYS, Sindicato Minero de Cananea, etc.).
   - Datos completos: Razón Social, No. Empleados, Tamaño de Flotilla, Giro, Domicilio completo, Teléfono con enlace de llamada directa, Correo, Nombre y cargo del tomador de decisiones.

2. **Redactor de Correos Personalizados con IA**:
   - Genera propuestas comerciales con un solo clic adaptadas al giro de la empresa.
   - 3 enfoques seleccionables:
     - *Ejecutivo (Cita de 15 minutos)*.
     - *Financiero & Deducibilidad Fiscal (Flotilla Comercial)*.
     - *Prestación Laboral sin Costo Patronal (Colectividad de Empleados)*.
   - Enlaces automáticos para enviar por `mailto:` o por WhatsApp directo (`wa.me`) con un solo clic.

3. **Gestión CRM y Bitácora de Contacto**:
   - Estados: `Nuevo Prospecto`, `Contactado`, `Cita Agendada`, `En Cotización`, `Cerrado / Ganado`, `Descartado`.
   - Bitácora con fecha, hora y comentarios para registrar llamadas y avances.
   - Estado actual: **Todos los 28 prospectos fueron reseteados a "Nuevo Prospecto" (0% gestionado)** a solicitud del usuario para iniciar en limpio.

4. **Filtros Dinámicos Instantáneos**:
   - Filtro por Estado (8 opciones de la zona norte).
   - Filtro por Giro (Transporte, Manufactura, Sindicatos, Escuelas, Minería, etc.).
   - Filtro por Tipo de Oportunidad (Flotilla Comercial, Colectividad, Mixto).
   - Filtro por Estatus CRM y buscador en texto libre.

5. **Exportación a Excel / CSV**:
   - Descarga instantánea de la base de datos completa con formato UTF-8 BOM para abrirse en Microsoft Excel sin deformar acentos, eñes ni caracteres especiales.

6. **Flujo Automatizado Semanal en N8N (`workflow_qualitas_prospeccion.json`)**:
   - Se ejecuta automáticamente cada lunes a las 8:00 AM vía cron.
   - Rota los estados del norte e interactúa con el motor de IA para inyectar nuevos prospectos mediante el webhook `/api/webhook/n8n`.
   - Filtra y rechaza prospectos con <50 empleados, <20 autos o sindicatos de maestros y telefonistas.

7. **Video Tutorial de Capacitación para Personas Inexpertas**:
   - Duración: ~3.0 minutos.
   - Guion y locución en español neutro mexicano estructurado en 7 módulos pedagógicos:
     1. *Bienvenida e Introducción*
     2. *El Tablero Principal y Métricas*
     3. *Cómo Filtrar Negocios Fácilmente*
     4. *La Ficha del Prospecto y sus Datos*
     5. *El Redactor de Correos con IA*
     6. *Gestión y Registro de Bitácora*
     7. *Buscar Nuevos Prospectos con IA y Exportar a Excel*
   - Accesible desde el reproductor web interactivo con subtítulos (`/tutorial.html`) o como archivo de video descargable (`video_tutorial_qualitas.webm`).

---

## ⚡ 7. COMANDOS ÚTILES PARA EL ENTORNO DE TRABAJO

### Iniciar la App en Local:
```bash
cd /Users/gdas/.gemini/antigravity/scratch/QUALITAS
npm install
npm start
# Abrir en http://localhost:3300
```

### Desplegar Cambios a Vercel:
```bash
cd /Users/gdas/.gemini/antigravity/scratch/QUALITAS
npx vercel --prod
# Asegurar alias:
npx vercel alias set <NUEVO_DEPLOY_URL> prospecta-qualitas.vercel.app
```

### Limpiar / Resetear la Base de Datos a Cero Gestiones:
El archivo `data/prospects.json` contiene la lista completa con `status: "Nuevo Prospecto"` y `logs: []`. Se puede actualizar mediante la API:
`POST /api/prospects/reset` o editando directamente el JSON.

---

## 🚀 8. IDEAS O PASOS SUGERIDOS PARA CONTINUAR EN EL SIGUIENTE CHAT
- Conectar una base de datos PostgreSQL / Supabase o MongoDB si se requiere sincronización multiusuario simultánea en tiempo real.
- Agregar autenticación con contraseña o Google Workspace para agentes Quálitas autorizados.
- Integrar envío automático de correos vía API de SendGrid o Gmail API para no requerir abrir el cliente de correo local.
- Configurar el Webhook de N8N en un servidor N8N activo en la nube para automatizar la prospección 24/7 sin intervención humana.
