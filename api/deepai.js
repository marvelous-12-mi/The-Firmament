// api/deepai.js  (Vercel serverless)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST" });
  const { prompt, mode } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  const apiKey = process.env.DEEPAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "DEEP_API_KEY not configured" });

  try {
    if (mode === "image") {
      // DeepAI text2img
      const form = new FormData();
      form.append("text", prompt);
      const resp = await fetch("https://api.deepai.org/api/text2img", {
        method: "POST",
        headers: { "api-key": apiKey },
        body: form,
      });
      const json = await resp.json();
      return res.status(resp.status).json(json);
    } else {
      // DeepAI text generator (fallback to "text-generator")
      const form = new FormData();
      form.append("text", prompt);
      const resp = await fetch("https://api.deepai.org/api/text-generator", {
        method: "POST",
        headers: { "api-key": apiKey },
        body: form,
      });
      const json = await resp.json();
      return res.status(resp.status).json(json);
    }
  } catch (err) {
    console.error("deepai error", err);
    return res.status(500).json({ error: err.message || "DeepAI error" });
  }
}
