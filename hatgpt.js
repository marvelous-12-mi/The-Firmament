// hatgpt.js
const chatbox = document.getElementById("chatbox");
const promptInput = document.getElementById("prompt");
const sendBtn = document.getElementById("sendBtn");

function addMessage(text, cls) {
  const div = document.createElement("div");
  div.className = `message ${cls}`;
  div.innerHTML = text;
  chatbox.appendChild(div);
  chatbox.scrollTop = chatbox.scrollHeight;
}

async function sendMessage() {
  const prompt = promptInput.value.trim();
  if (!prompt) return;
  addMessage(prompt, "user");
  promptInput.value = "";

  addMessage("⏳ Thinking...", "ai");

  try {
    const res = await fetch("/api/hatgpt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    chatbox.lastChild.textContent = data.output;
  } catch (err) {
    chatbox.lastChild.textContent = "⚠️ Error connecting to HatGPT.";
  }
}

sendBtn.addEventListener("click", sendMessage);
promptInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
