# Quálitas Compañía de Seguros • Portal de Prospección Comercial Zona Norte

Sistema integral de inteligencia comercial y prospección automatizada para la colocación de pólizas de **Flotilla Comercial** y programas de **Colectividad de Autos para Empleados / Agremiados**, enfocado en los 8 estados de la zona norte de México:

- **Baja California**
- **Baja California Sur**
- **Sonora**
- **Chihuahua**
- **Coahuila**
- **Durango**
- **Nuevo León**
- **Tamaulipas**

---

## 🌐 URL de Producción en Vercel
La aplicación se encuentra desplegada y disponible públicamente en la nube en su dominio oficial:
- 🚀 **Dominio Oficial Quálitas**: [https://prospecta-qualitas.vercel.app](https://prospecta-qualitas.vercel.app)
- 💻 **Despliegue Local**: [http://localhost:3300](http://localhost:3300)

---

## 🎯 Criterios y Reglas de Suscripción Calificada
La aplicación filtra y audita prospectos bajo las siguientes reglas de negocio:
1. **Empresas e Industrias**: Más de 50 empleados o agremiados O flotillas vehiculares de más de 20 unidades.
2. **Sindicatos Permitidos**: Sindicatos mineros, metalúrgicos, del transporte, siderúrgicos, maquiladores, petroquímicos y comerciales.
   - ⚠️ **EXCLUSIÓN ESTRICTA**: Prohibidos sindicatos de maestros (SNTE, CNTE) y sindicatos de telefonistas (STRM).
3. **Sector Educativo**: Universidades públicas, privadas, tecnológicos y colegios de educación superior.
4. **Propuesta Quálitas**: Identificación del tipo de producto óptimo:
   - *Flotilla Comercial*: Deducibilidad 100%, telemetría, red propia de ajustadores en el norte, tiempos de arribo <30 mins.
   - *Colectividad para Empleados*: Beneficio laboral sin costo patronal con descuento vía nómina y tarifas preferenciales.
   - *Mixto*: Flotilla utilitaria corporativa + programa de colectividad para el personal.

---

## 🧠 Motor de Cascada Multi-IA (5 Proveedores Gratuitos con Fallback)
El sistema implementa una arquitectura de tolerancia a fallos en cascada estricta:
```
[1. Google Gemini] ──(Si falla / timeout / quota)──> [2. Groq Cloud] ──(Si falla)──> [3. OpenRouter] ──(Si falla)──> [4. SambaNova] ──(Si falla)──> [5. Build NVIDIA]
```

- **Gemini**: `AQ.Ab8...` (Modelos: `gemini-3.5-flash-lite`, `gemini-3.5-flash`)
- **Groq Cloud**: `gsk_tbr...` (Modelos: `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b`)
- **OpenRouter**: `sk-or-v1...` (Modelos gratuitos: `liquid/lfm-2.5-2.6b:free`, `nvidia/nemotron-3.5-lightning:free`)
- **SambaNova**: `e32f78...` (Modelos: `Meta-Llama-3.3-70B-Instruct`, `DeepSeek-V3.2`)
- **Build NVIDIA**: `nvapi-Tbg...` (Modelos: `deepseek-ai/deepseek-v4.1-flash`, `ai21labs/jamba-1.5-large-instruct`)

---

## 🚀 Características y Áreas de Oportunidad Mejoradas
1. **Redactor de Correos Personalizados con IA**: Redacta cartas ejecutivas con estilo 100% humano (sin sonar a bot) con 3 enfoques seleccionables: *Ejecutivo/Cita (15 mins)*, *Financiero & Deducibilidad*, y *Prestación Laboral / Colectividad*.
2. **Contactabilidad Directa**: Botones con enlaces automáticos a `mailto:` (con asunto y cuerpo formateados) y WhatsApp directo (`wa.me`) con mensaje adaptado al responsable.
3. **Embudo Comercial Dual**: Alterna con un clic entre **Vista de Tabla Detallada** y **Vista Tablero Kanban** por etapas (*Nuevo Prospecto*, *Contactado*, *Cita Agendada*, *En Cotización*, *Cerrado / Ganado*).
4. **Calculadora de Prima Potencial**: Estimación financiera automática del valor de pólizas anuales para dimensionar oportunidades.
5. **Filtros Dinámicos**: Filtrado simultáneo e instantáneo por Estado, Ciudad, Giro, Tipo de Oportunidad, Fase de Gestión y Búsqueda en texto libre.
6. **Bitácora de Gestión**: Registro de notas con fecha y usuario para cada interacción o llamada telefónica.
7. **Exportación a Excel**: Descarga de base completa en CSV con codificación **UTF-8 BOM** para visualización limpia en Excel sin problemas de tildes o caracteres especiales.
8. **Consola de Estado de IAs**: Semáforo visual en tiempo real de latencia y estado de los 5 proveedores.

---

## ⚡ Flujo de Automatización Semanal en N8N
Ubicación del archivo listo para importar:
📁 `workflow_qualitas_prospeccion.json`

### Cómo funciona el flujo:
1. **Disparador Semanal (Cron)**: Se ejecuta todos los lunes a las 8:00 AM.
2. **Configurador de Criterios**: Rota los 8 estados del norte y los giros estratégicos semana a semana.
3. **Consulta Cascada Multi-IA**: Lanza la búsqueda de prospectos a la app / modelos de IA.
4. **Auditoría de Suscripción**: Filtra y valida que cumplan >50 empleados o >20 flotillas, y rechaza maestros/telefonistas.
5. **Inyección Automática**: Alimenta el webhook `/api/webhook/n8n` para incorporar los prospectos semanalmente al CRM.

---

## 💻 Ejecución del Proyecto
```bash
cd /Users/gdas/.gemini/antigravity/scratch/QUALITAS

# Instalar dependencias (Express, Cors)
npm install

# Iniciar servidor
npm start
```
Abrir en el navegador:
👉 **`http://localhost:3300`**
