// /api/generate-image.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { prompt, size = "1024x1024" } = req.body || {};
  if (!prompt) {
    res.status(400).json({ error: "Missing prompt" });
    return;
  }

  try {
    const openaiResp = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, // ✅ use env var
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt, n: 1, size })
    });

    if (!openaiResp.ok) {
      const errText = await openaiResp.text();
      res.status(502).json({ error: "OpenAI error", details: errText });
      return;
    }

    const data = await openaiResp.json();
    const imageUrl = data?.data?.[0]?.url || null;
    res.status(200).json({ imageUrl });
  } catch (err) {
    res.status(500).json({ error: "Image generation failed", details: String(err.message || err) });
  }
}
