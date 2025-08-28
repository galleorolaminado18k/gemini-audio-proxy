import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

app.post("/gemini-audio", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Falta el parámetro 'text'" });
    }

    const apiKey = process.env.GOOGLE_API_KEY;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/tts-1:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text }]
            }
          ]
        })
      }
    );

    const data = await response.json();
    console.log("Respuesta de Gemini:", JSON.stringify(data, null, 2));

    const audioBase64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioBase64) {
      return res.status(500).json({ error: "No se generó audio", raw: data });
    }

    res.status(200).json({
      audio: audioBase64,
      mimeType: "audio/wav"
    });

  } catch (error) {
    console.error("Error en /gemini-audio:", error);
    res.status(500).json({ error: "Error al procesar la petición" });
  }
});

app.listen(3000, () => console.log("Servidor corriendo en puerto 3000"));

