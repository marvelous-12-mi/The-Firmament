// hatgpt.js
const modeSelect = document.getElementById("mode");
const promptEl = document.getElementById("prompt");
const generateBtn = document.getElementById("generate");
const resultEl = document.getElementById("result");
const surpriseBtn = document.getElementById("surprise");
const clearBtn = document.getElementById("clear");

surpriseBtn.onclick = () => {
  const ideas = [
    "A neon portrait of a thoughtful woman in cubist style, swirling lines",
    "Aerial view of a futuristic city at dusk, glowing purple canals",
    "A minimal continuous-line face made of golden thread",
    "A cute orange fox astronaut exploring a pink planet",
    "Write a punchy 20-word campaign slogan about creativity and connection"
  ];
  promptEl.value = ideas[Math.floor(Math.random()*ideas.length)];
};

clearBtn.onclick = () => { promptEl.value = ""; resultEl.innerHTML = ""; };

generateBtn.onclick = async () => {
  const prompt = promptEl.value.trim();
  const mode = modeSelect.value;
  if (!prompt) return alert("Type a prompt or press Surprise Me.");

  generateBtn.disabled = true;
  generateBtn.textContent = "Generating…";
  resultEl.innerHTML = `<div style="opacity:.7">Working… this can take a few seconds</div>`;

  try {
    const res = await fetch("/api/deepai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, mode }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "AI error");

    resultEl.innerHTML = "";

    if (mode === "image") {
      // deepai text2img returns an output_url or array — show it
      const url = json.output_url || json.output || json.output_urls?.[0] || json.image_url;
      if (url) {
        const img = document.createElement("img");
        img.src = url;
        resultEl.appendChild(img);
      } else {
        resultEl.textContent = "No image returned.";
      }
    } else {
      // text mode: show assistant text
      const assistant = json.output || json.text || json.result || JSON.stringify(json);
      const p = document.createElement("div");
      p.style.whiteSpace = "pre-wrap";
      p.textContent = assistant;
      resultEl.appendChild(p);
    }
  } catch (err) {
    console.error(err);
    resultEl.textContent = "Error: " + (err.message || "unknown");
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "Generate";
  }
};
