const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// ⚠️ IMPORTANTE: la API Key la pondrás en Render (no aquí en el código)
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Endpoint para pedir respuesta de voz
app.post("/gemini-audio", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Falta el texto en la petición" });
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-exp-native-audio-thinking-dialog:generateContent?key=${GOOGLE_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text }]
          }
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          audioConfig: {
            voiceConfig: {
              voiceName: "Puck"
            }
          }
        }
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const audioData =
      response.data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioData) {
      return res.status(500).json({ error: "No se recibió audio desde la API" });
    }

    const audioBuffer = Buffer.from(audioData, "base64");
    res.setHeader("Content-Type", "audio/wav");
    res.send(audioBuffer);
  } catch (error) {
    console.error("Error en /gemini-audio:", error.response?.data || error.message);
    res.status(500).json({ error: "Error al procesar la petición" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
