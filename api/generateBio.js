export default async function handler(req, res) {
  try {
    const { job, interests } = req.body;

    const prompt = `Write a short, warm and authentic social bio for someone who works as ${job} and enjoys ${interests}.`;

    const response = await fetch("https://api.deepai.org/api/text-generator", {
      method: "POST",
      headers: {
        "Api-Key": process.env.DEEP_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ text: prompt }),
    });

    const data = await response.json();

    res.status(200).json({ bio: data.output });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error generating bio" });
  }
}
