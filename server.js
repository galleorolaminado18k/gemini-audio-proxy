const express = require("express");
const axios = require("axios");
const app = express();

const PORT = process.env.PORT || 3000;

// 👇 Reemplaza con tu API key real de Google o la que uses
const API_KEY = "AIzaSyC3895F5JKZSHKng1IVL_3DywImp4lwVyI";  

app.get("/audio", async (req, res) => {
  try {
    const texto = req.query.text || "Hola Karla, tu sistema ya responde en audio. 🎙️";

    const response = await axios.post(
      "https://texttospeech.googleapis.com/v1/text:synthesize?key=" + API_KEY,
      {
        input: { text: texto },
        voice: { languageCode: "es-ES", name: "es-ES-Standard-A" },
        audioConfig: { audioEncoding: "MP3" }
      }
    );

    const audioBase64 = response.data.audioContent;
    const audioBuffer = Buffer.from(audioBase64, "base64");

    res.setHeader("Content-Type", "audio/mpeg");
    res.send(audioBuffer);

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send("Error al generar el audio");
  }
});

app.listen(PORT, () => {
  console.log("Servidor de audio corriendo en puerto " + PORT);
});

