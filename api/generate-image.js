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
    const googleResp = await fetch(
      "https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT_ID/locations/us-central1/publishers/google/models/imagegeneration:predict",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GOOGLE_AI_API_KEY}`, // ✅ use env var
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { imageSize: size }
        })
      }
    );

    if (!googleResp.ok) {
      const errText = await googleResp.text();
      res.status(502).json({ error: "Google AI error", details: errText });
      return;
    }

    const data = await googleResp.json();
    const imageUrl = data?.predictions?.[0]?.bytesBase64Encoded || null;
    res.status(200).json({ imageUrl });
  } catch (err) {
    res.status(500).json({ error: "Image generation failed", details: String(err.message || err) });
  }
}
