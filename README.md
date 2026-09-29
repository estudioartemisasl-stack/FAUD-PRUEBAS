# Refinador de Transcripciones con IA (Clon de Talk Tweak Shine)

Una aplicación web moderna, idéntica en estética y funcionalidad a [talk-tweak-shine.lovable.app](https://talk-tweak-shine.lovable.app), diseñada para refinar y formatear transcripciones orales basándose en un texto de ejemplo de referencia.

---

## Características Principales

1. **Entrada de Transcripción Original**:
   - Carga mediante texto pegado o subida de archivos (`.txt`, `.srt`, `.vtt`, `.docx`, `.pdf`).
   - Drag & drop interactivo.
   - Contador de palabras y caracteres en tiempo real.

2. **Entrada de Ejemplo del Formato Deseado**:
   - Carga de texto o subida de documentos guía (`.txt`, `.docx`, `.pdf`).
   - Botón para **Guardar como predeterminada** en `localStorage` (con distintivo *"Plantilla guardada"*).
   - Selector rápido de **Plantillas de Ejemplo** (Entrevista, Reunión formal, Marcas de tiempo, Narrativa).

3. **Motor de Refinamiento con IA (Google Gemini)**:
   - **NO RESUME**: Preserva el 100% del contenido, oraciones y diálogos sin omitir detalles.
   - **Corrección de Sintaxis y Coherencia**: Elimina titubeos, tartamudeos y muletillas orales (*"eh"*, *"o sea"*, *"este"*, *"bueno"*), estructurando frases fluidas y naturales.
   - **Adaptación al Formato de Ejemplo**: Aplica exactamente la misma nomenclatura de oradores (`Orador 1:`, `[00:00] Nombre:`, etc.) y espaciado del ejemplo.
   - **Streaming en Tiempo Real**: El texto refinado aparece progresivamente en pantalla conforme se genera.

4. **Apartado de Edición Interactiva (Editor de Texto)**:
   - Área de texto editable en tiempo real con tipografía monospace limpia.
   - **Deshacer (Undo)** (`Ctrl+Z`) y **Rehacer (Redo)** (`Ctrl+Y`).
   - Transformaciones de mayúsculas y minúsculas:
     - `AA` (MAYÚSCULAS)
     - `aa` (minúsculas)
     - `Aa` (Capitalizar Palabras)
   - **Limpiar espacios**: Normaliza espacios dobles, depura saltos de línea triples y limpia tabulaciones.
   - **Buscar y Reemplazar Todo**: Con campo de búsqueda, reemplazo y contador de coincidencias modificadas.

5. **Exportación Multiformato**:
   - 📋 **Copiar al Portapapeles**: Con feedback visual instantáneo.
   - 📄 **Descargar TXT**: Archivo plano con codificación UTF-8.
   - 📑 **Descargar PDF Estilizado** con 5 plantillas profesionales:
     - *Simple*: Texto limpio sin encabezados.
     - *Formal*: Título, fecha y cuerpo justificado.
     - *Jurídico*: Encabezado con acta formal y numeración de líneas al margen.
     - *Entrevista*: Título destacado y oradores resaltados en negrita.
     - *Acta / Minuta*: Encabezado con sesión, fecha, asistentes y cuerpo.
   - 📝 **Descargar DOCX**: Documento compatible con Microsoft Word y LibreOffice.

---

## Cómo Iniciar la Aplicación

La aplicación ya está compilada y corriendo localmente en:
👉 **[http://localhost:3001](http://localhost:3001)**

### Comandos de desarrollo:

```bash
# Iniciar servidor de producción y API
node server.js

# O ejecutar el entorno de desarrollo Vite con Hot Reload
npm.cmd run dev
```

### Configuración de Gemini API:
- Puedes configurar tu clave directamente en la interfaz haciendo clic en el botón superior **"Configurar Gemini"** (se guarda de forma privada en tu navegador).
- O puedes colocar tu clave en un archivo `.env`:
  ```env
  GEMINI_API_KEY=tu_clave_de_google_ai_studio
  ```
  *(Puedes generar una clave gratuita en [Google AI Studio](https://aistudio.google.com/app/apikey)).*
