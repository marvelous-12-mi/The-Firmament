// A minimal serverless-compatible handler for generating images via OpenAI.
// Works in environments like Vercel (export default), Netlify (exports.handler), or Supabase Edge Functions (adapt fetch/Response).

// If your platform expects ESM default export:
export default async function handler(req, res) {
  try {
    // Parse JSON body
    const chunks = [];
    await new Promise((resolve) => {
      req.on("data", (c) => chunks.push(c));
      req.on("end", resolve);
    });
    const bodyStr = Buffer.concat(chunks).toString("utf-8");
    const { prompt, size = "1024x1024" } = JSON.parse(bodyStr || "{}");

    if (!prompt || typeof prompt !== "string") {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ error: "Missing prompt" }));
    }

    // Call OpenAI Images API
    const openaiResp = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.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}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        n: 1,
        size
      })
    });

    if (!openaiResp.ok) {
      const errText = await openaiResp.text();
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ error: "OpenAI error", details: errText }));
    }

    const data = await openaiResp.json();
    const imageUrl = data?.data?.[0]?.url || null;

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ imageUrl }));
  } catch (err) {
    console.error("Handler error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Image generation failed", details: String(err?.message || err) }));
  }
}

// If your platform expects a CommonJS-style export (e.g., Netlify):
// exports.handler = async (event) => {
//   try {
//     const { prompt, size = "1024x1024" } = JSON.parse(event.body || "{}");
//     if (!prompt) return { statusCode: 400, body: JSON.stringify({ error: "Missing prompt" }) };
//     const openaiResp = await fetch("https://api.openai.com/v1/images/generations", {
//       method: "POST",
//       headers: {
//         "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({ prompt, n: 1, size })
//     });
//     if (!openaiResp.ok) {
//       const errText = await openaiResp.text();
//       return { statusCode: 502, body: JSON.stringify({ error: "OpenAI error", details: errText }) };
//     }
//     const data = await openaiResp.json();
//     const imageUrl = data?.data?.[0]?.url || null;
//     return { statusCode: 200, body: JSON.stringify({ imageUrl }) };
//   } catch (err) {
//     return { statusCode: 500, body: JSON.stringify({ error: "Image generation failed", details: String(err?.message || err) }) };
//   }
// };
