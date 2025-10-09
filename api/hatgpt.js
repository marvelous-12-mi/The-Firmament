// pages/api/hatgpt.js
export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Only POST requests allowed" });

  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY)
    return res.status(500).json({ error: "Missing OPENAI_API_KEY env var" });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are HatGPT, a creative, funny and helpful AI built into a social network. Always reply with personality and emojis when relevant." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || "⚠️ No response";

    res.status(200).json({ output: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ChatGPT request failed" });
  }
}
