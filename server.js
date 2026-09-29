import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '60mb' }));

const SYSTEM_PROMPT = `Eres un editor profesional de transcripciones y corrector de estilo especializado en transformar lenguaje oral en texto pulido, claro y formal.

Tu tarea es refinar la transcripción original tomando como GUÍA Y ESTÁNDAR EXACTO el texto de ejemplo proporcionado.

REGLAS OBLIGATORIAS:
1. NO RESUMIR: Está estrictamente prohibido resumir, sintetizar o eliminar partes del discurso. Cada frase, idea, intervención y diálogo debe ser conservado en su totalidad de principio a fin.
2. ADAPTAR AL FORMATO DEL EJEMPLO:
   - Analiza el formato del texto de ejemplo: cómo se etiquetan los oradores (ej. "Orador 1:", "JUAN:", "[00:00] Nombre:"), el espaciado entre párrafos, el uso de negritas o mayúsculas.
   - Aplica exactamente esa misma convención a toda la transcripción.
   - Si el ejemplo no incluye oradores y es texto continuo, mantén el texto continuo con esa misma estructura de párrafos.
3. CORREGIR SINTAXIS Y ORTOGRAFÍA:
   - Corrige puntuación (comas, puntos seguidos, puntos aparte, signos de interrogación y exclamación).
   - Corrige concordancia de género, número y tiempos verbales.
   - Corrige errores de digitación o palabras mal transcritas por el reconocimiento de voz.
4. LIMPIEZA DE ORALIDAD Y COHERENCIA:
   - Elimina titubeos, tartamudeos y muletillas repetitivas ("eh", "este", "o sea", "mmm", "viste", "bueno", "ponele", "nada") integrándolas de forma natural y fluida en oraciones bien construidas.
   - Da coherencia sintáctica a las frases incompletas o fragmentadas típicas del habla oral sin alterar en absoluto el significado pretendido por los interlocutores.
5. SALIDA LIMPIA: Devuelve ÚNICAMENTE el texto refinado final. No agregues preámbulos, ni saludos, ni notas explicativas como "Aquí tienes el texto corregido:".`;

// POST /api/transcribe endpoint (Audio to text)
app.post('/api/transcribe', async (req, res) => {
  const { audioBase64, mimeType } = req.body;
  const apiKey = req.headers['x-api-key'] || req.body.apiKey || process.env.GEMINI_API_KEY;

  if (!audioBase64) {
    return res.status(400).json({ error: 'El archivo de audio es requerido.' });
  }

  if (!apiKey) {
    return res.status(401).json({
      needsApiKey: true,
      error: 'No se encontró GEMINI_API_KEY. Configúrala en la aplicación o en las variables de entorno.'
    });
  }

  try {
    const model = 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const promptText = `Por favor transcribe este audio completo de principio a fin, palabra por palabra, con máxima fidelidad.

INSTRUCCIONES CLAVE:
1. NO RESUMAS: Transcribe absolutamente todo lo que se dice sin omitir nada.
2. Identifica los cambios de orador si intervienen varias personas (utiliza etiquetas como "Orador 1:", "Orador 2:", etc.).
3. Transcribe el texto de forma fiel respetando la oralidad original.
4. Devuelve ÚNICAMENTE la transcripción completa, sin preámbulos ni notas adicionales.`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                inline_data: {
                  mime_type: mimeType || 'audio/mp3',
                  data: audioBase64
                }
              },
              { text: promptText }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      let errorMsg = `Error en Gemini API (${response.status})`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error && parsed.error.message) {
          errorMsg = parsed.error.message;
        }
      } catch (e) {}
      return res.status(response.status).json({ error: errorMsg });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(500).json({ error: 'No se obtuvo texto de la transcripción.' });
    }

    res.json({ text: text.trim() });
  } catch (err) {
    console.error('Error during audio transcription:', err);
    res.status(500).json({ error: err.message || 'Error interno al transcribir el audio' });
  }
});

// POST /api/refine endpoint
app.post('/api/refine', async (req, res) => {
  const { transcript, example } = req.body;
  const apiKey = req.headers['x-api-key'] || req.body.apiKey || process.env.GEMINI_API_KEY;

  if (!transcript || !transcript.trim()) {
    return res.status(400).json({ error: 'La transcripción es requerida.' });
  }

  if (!apiKey) {
    return res.status(401).json({
      needsApiKey: true,
      error: 'No se encontró GEMINI_API_KEY. Configúrala en la aplicación o en las variables de entorno.'
    });
  }

  try {
    const model = 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const userPrompt = `--- EJEMPLO DE FORMATO DE REFERENCIA ---
${example && example.trim() ? example.trim() : "(No se proporcionó ejemplo específico: usa formato de diálogo limpio con 'Orador 1:', 'Orador 2:' con ortografía impecable y párrafos ordenados)"}

--- TRANSCRIPCIÓN ORIGINAL A REFINAR (NO RESUMIR, CORREGIR SINTAXIS Y COHERENCIA) ---
${transcript.trim()}

RECUERDA: NO RESUMAS NADA. Mantén cada una de las intervenciones y oraciones. Corrige sintaxis, quita muletillas y aplica el formato del ejemplo. Devuelve únicamente el texto refinado.`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          topP: 0.95
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      let errorMsg = `Error en Gemini API (${response.status})`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error && parsed.error.message) {
          errorMsg = parsed.error.message;
        }
      } catch (e) {}
      return res.status(response.status).json({ error: errorMsg });
    }

    // Stream chunks back to client
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textChunk) {
              res.write(textChunk);
            }
          } catch (e) {}
        }
      }
    }

    res.end();
  } catch (err) {
    console.error('Error during refinement:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Error interno del servidor' });
    } else {
      res.end();
    }
  }
});

// Serve frontend in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Ruta no encontrada' });
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('API de Refinador de Transcripciones activa. Inicia Vite dev server o compila con npm run build.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Servidor de Refinador de Transcripciones corriendo en http://localhost:${PORT}`);
});
