// /api/generate-image.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  try {
    const resp = await fetch("https://api.deepai.org/api/text2img", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.DEEPAI_API_KEY, // ✅ stored in Vercel Environment Variable
      },
      body: JSON.stringify({ text: prompt }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data?.error || `DeepAI error: ${resp.status}`);
    }

    if (!data.output_url) {
      throw new Error("No image URL returned from DeepAI");
    }

    return res.status(200).json({ imageUrl: data.output_url });
  } catch (err) {
    console.error("❌ DeepAI generation failed:", err.message);
    res.status(500).json({ error: err.message });
  }
}
