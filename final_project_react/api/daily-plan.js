const fallbackTasks = [
  {
    time: "5 min",
    title: "Warm-up",
    description: "Review one idea from your previous session.",
  },
  {
    time: "15 min",
    title: "Focused Practice",
    description: "Work on one exercise connected to your current milestone.",
  },
  {
    time: "10 min",
    title: "Apply It",
    description: "Use the skill in a tiny example, sketch, prototype, or note.",
  },
  {
    time: "5 min",
    title: "Reflection",
    description: "Write what felt easy, confusing, or worth repeating.",
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

function normalizeTime(value, fallback) {
  const time = String(value || fallback || "10 min").trim();
  return /^\d+$/.test(time) ? `${time} min` : time;
}

function normalizeTasks(tasks) {
  if (!Array.isArray(tasks)) return fallbackTasks;

  const cleaned = tasks
    .slice(0, 4)
    .map((task, index) => ({
      time: normalizeTime(task.time, fallbackTasks[index]?.time),
      title: String(task.title || fallbackTasks[index]?.title || `Task ${index + 1}`),
      description: String(
        task.description ||
          fallbackTasks[index]?.description ||
          "Complete one practical step for your skill."
      ),
    }))
    .filter((task) => task.title.trim() && task.description.trim());

  return cleaned.length ? cleaned : fallbackTasks;
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
    const minutes = Number(req.body?.minutes || 30);

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
              "Create practical daily learning plans. Return only valid JSON with a tasks array. Each task needs time, title, and description. Keep exactly 4 tasks. The total time should match the user's available minutes. Descriptions should be concrete actions, not generic encouragement.",
          },
          {
            role: "user",
            content: `Skill: ${skill}\nExperience level: ${level}\nAvailable time today: ${minutes} minutes`,
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
    const plan = extractJson(text);

    sendJson(res, 200, { tasks: normalizeTasks(plan.tasks) });
  } catch (error) {
    sendJson(res, 500, {
      error: error.message || "Could not generate a daily plan.",
    });
  }
};
