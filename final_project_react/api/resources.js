const fallbackResourceCategories = [
  {
    name: "Books",
    items: [
      {
        title: "Begin with a highly rated beginner book",
        description: "Look for a recent book that matches your experience level and includes exercises.",
        link: "Search your library or bookstore",
      },
    ],
  },
  {
    name: "YouTube",
    items: [
      {
        title: "Follow a structured crash course",
        description: "Choose one playlist and complete it in order instead of hopping between videos.",
        link: "Search YouTube",
      },
    ],
  },
  {
    name: "Communities",
    items: [
      {
        title: "Join a beginner-friendly discussion space",
        description: "Use it to ask focused questions and read how other learners solve similar problems.",
        link: "Search Reddit or Discord",
      },
    ],
  },
];

function sendJson(res, status, data) {
  res.status(status).json(data);
}

function extractJson(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse(fenced ? fenced[1] : trimmed);
}

function normalizeResourceCategories(categories) {
  if (!Array.isArray(categories)) return fallbackResourceCategories;

  const allowedCategories = new Set(["books", "youtube videos", "reddit/community"]);
  const cleaned = categories
    .filter((category) => allowedCategories.has(String(category.name || "").toLowerCase()))
    .slice(0, 3)
    .map((category) => ({
      name: String(category.name || "Resources"),
      items: Array.isArray(category.items)
        ? category.items.slice(0, 3).map((item) => ({
            title: String(item.title || "Recommended resource"),
            description: String(item.description || "Use this to support today's practice."),
            link: String(item.link || ""),
          }))
        : [],
    }))
    .filter((category) => category.name.trim() && category.items.length);

  return cleaned.length ? cleaned : fallbackResourceCategories;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    sendJson(res, 500, {
      error: "Missing OPENAI_API_KEY. Add it in Vercel Project Settings > Environment Variables.",
    });
    return;
  }

  try {
    const skill = String(req.body?.skill || "the selected skill").trim();
    const level = String(req.body?.level || "Beginner").trim();

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.2",
        input: [
          {
            role: "developer",
            content:
              "Recommend learning resources. Return only valid JSON with a categories array. Include exactly 3 categories named Books, YouTube Videos, and Reddit/Community. Do not include practice projects. Each category needs 2 or 3 items. Each item needs title, description, and link. Links may be official websites, search phrases, subreddit names, or channel/search recommendations. Keep recommendations practical and level-appropriate.",
          },
          {
            role: "user",
            content: `Skill: ${skill}\nExperience level: ${level}`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      sendJson(res, response.status, {
        error: data.error?.message || "OpenAI request failed.",
      });
      return;
    }

    const text = data.output_text || data.output?.[0]?.content?.[0]?.text || "";
    const resources = extractJson(text);

    sendJson(res, 200, {
      categories: normalizeResourceCategories(resources.categories),
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error.message || "Could not generate resources.",
    });
  }
};
