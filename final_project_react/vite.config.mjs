import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

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

function normalizeTasks(tasks) {
  if (!Array.isArray(tasks)) return fallbackTasks;

  const cleaned = tasks
    .slice(0, 4)
    .map((task, index) => ({
      time: String(task.time || fallbackTasks[index]?.time || "10 min"),
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
              model: env.OPENAI_MODEL || "gpt-5-mini",
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
