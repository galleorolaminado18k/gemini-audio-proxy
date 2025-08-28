import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI, Modality } from "@google/genai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("ERROR: define GEMINI_API_KEY en .env");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const MODEL = "gemini-2.5-flash-exp-native-audio-thinking-dialog";

app.post("/chat", async (req, res) => {
  try {
    const userText = (req.body?.text || "").toString();
    if (!userText) return res.status(400).json({ error: "Falta campo 'text' en el body" });

    const queue = [];
    const session = await ai.live.connect({
      model: MODEL,
      config: {
        responseModalities: [Modality.AUDIO],
        audioFormat: "MP3"
      },
      callbacks: {
        onmessage: (m) => queue.push(m),
        onerror: (e) => queue.push({ error: e?.message || String(e) })
      }
    });

    session.sendClientContent({
      turns: [{ role: "user", parts: [{ text: userText }] }],
      turnComplete: true
    });

    let audioBase64 = "";
    let finished = false;

    while (!finished) {
      const msg = await new Promise((resolve) => {
        const poll = () => {
          const m = queue.shift();
          if (m) resolve(m);
          else setTimeout(poll, 25);
        };
        poll();
      });

      if (msg?.error) throw new Error(msg.error);
      
      if (msg?.audio) {
        audioBase64 += msg.audio;
      } else if (msg?.serverContent?.parts) {
        for (const p of msg.serverContent.parts) {
          if (p.inlineData?.data) audioBase64 += p.inlineData.data;
        }
      }

      if (msg?.serverContent?.turnComplete) finished = true;
    }

    await session.close();

    if (!audioBase64) return res.status(500).json({ error: "No se recibió audio del modelo" });

    res.json({
      candidates: [
        {
          content: {
            role: "model",
            parts: [
              {
                inlineData: {
                  mimeType: "audio/mpeg",
                  data: audioBase64
                }
              }
            ]
          }
        }
      ]
    });
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ error: err?.message || String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy listo en http://localhost:${PORT}/chat`);
});
