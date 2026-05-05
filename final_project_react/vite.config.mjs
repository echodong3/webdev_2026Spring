import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const fallbackTasks = [
  {
    time: "5 min",
    title: "Warm-up",
    bullets: ["Review one idea from your previous session."],
  },
  {
    time: "15 min",
    title: "Focused Practice",
    bullets: ["Work on one exercise connected to your current milestone."],
  },
  {
    time: "10 min",
    title: "Apply It",
    bullets: ["Use the skill in a tiny example, sketch, prototype, or note."],
  },
  {
    time: "5 min",
    title: "Reflection",
    bullets: ["Write what felt easy, confusing, or worth repeating."],
  },
];

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

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
}

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
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

function normalizeBullets(task, fallback) {
  const source = Array.isArray(task.bullets)
    ? task.bullets
    : Array.isArray(task.description)
    ? task.description
    : [task.description || fallback?.description || fallback?.bullets?.[0]];

  return source
    .map((bullet) => String(bullet || "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

function normalizeTasks(tasks) {
  if (!Array.isArray(tasks)) return fallbackTasks;

  const cleaned = tasks
    .slice(0, 4)
    .map((task, index) => {
      const fallback = fallbackTasks[index];

      return {
        time: normalizeTime(task.time, fallback?.time),
        title: String(task.title || fallback?.title || `Task ${index + 1}`),
        bullets: normalizeBullets(task, fallback),
      };
    })
    .filter((task) => task.title.trim() && task.bullets.length);

  return cleaned.length ? cleaned : fallbackTasks;
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

function dailyPlanApiPlugin(env) {
  return {
    name: "daily-plan-api",
    configureServer(server) {
      server.middlewares.use("/api/daily-plan", async (req, res) => {
        if (req.method !== "POST") {
          sendJson(res, 405, { error: "Method not allowed" });
          return;
        }

        if (!env.OPENAI_API_KEY) {
          sendJson(res, 500, {
            error: "Missing OPENAI_API_KEY. Add it to final_project_react/.env and restart npm run dev.",
          });
          return;
        }

        try {
          const body = await readJsonBody(req);
          const skill = String(body.skill || "the selected skill").trim();
          const level = String(body.level || "Beginner").trim();
          const minutes = Number(body.minutes || 30);

          const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: env.OPENAI_MODEL || "gpt-5.2",
              input: [
                {
                  role: "developer",
                  content:
                    "Create practical daily learning plans. Return only valid JSON with a tasks array. Keep exactly 4 tasks. Each task needs time, title, and bullets. bullets must be an array of 1 to 3 short concrete action strings. Do not put markdown bullets inside the strings. The total time should match the user's available minutes. Bullet text should be concrete actions, not generic encouragement.",
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
      });

      server.middlewares.use("/api/resources", async (req, res) => {
        if (req.method !== "POST") {
          sendJson(res, 405, { error: "Method not allowed" });
          return;
        }

        if (!env.OPENAI_API_KEY) {
          sendJson(res, 500, {
            error: "Missing OPENAI_API_KEY. Add it to final_project_react/.env and restart npm run dev.",
          });
          return;
        }

        try {
          const body = await readJsonBody(req);
          const skill = String(body.skill || "the selected skill").trim();
          const level = String(body.level || "Beginner").trim();

          const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: env.OPENAI_MODEL || "gpt-5.2",
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
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), dailyPlanApiPlugin(env)],
  };
});
