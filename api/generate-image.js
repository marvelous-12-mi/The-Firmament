export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const deepAiKey = b3f46986\u002Da63f\u002D4594\u002Dacc0\u002Da48cf4632463;
    if (!deepAiKey) {
      return res.status(500).json({ error: "DeepAI API key not set" });
    }

    const response = await fetch("https://api.deepai.org/api/text2img", {
      method: "POST",
      headers: {
        "Api-Key": deepAiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ text: prompt }),
    });

    const data = await response.json();

    if (!response.ok || !data.output_url) {
      throw new Error(data.error || "Failed to generate image");
    }

    res.status(200).json({ imageUrl: data.output_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
