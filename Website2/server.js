import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.post("/api/suggestions", async (req, res) => {
  try {
    const { city, tempF, uv, weatherCond, wind } = req.body;

    if (!city) {
      return res.status(400).json({ error: "City is required." });
    }

    const prompt = `
You are helping a traveler plan their day.

Give exactly 5 practical and specific activity suggestions for ${city} based on this weather:
- Temperature: ${tempF}°F
- UV Index: ${uv}
- Condition: ${weatherCond}
- Wind: ${wind} mph

Requirements:
- Make the ideas realistic and varied
- Mention weather-aware advice when relevant
- Keep each suggestion concise
- Format as a numbered list
`.trim();

    const response = await client.responses.create({
      model,
      input: prompt
    });

    res.json({
      text: response.output_text?.trim() || "",
      source: "openai"
    });
  } catch (error) {
    console.error("OpenAI route error:", error);
    res.status(500).json({
      error: error?.message || "Failed to generate activity suggestions."
    });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
