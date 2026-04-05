import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { city, tempF, uv, weatherCond, wind } = req.body || {};

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
      input: prompt,
    });

    return res.status(200).json({
      text: response.output_text?.trim() || "",
      source: "openai",
    });
  } catch (error) {
    console.error("OpenAI route error:", error);

    return res.status(500).json({
      error: error?.message || "Failed to generate activity suggestions.",
    });
  }
}
