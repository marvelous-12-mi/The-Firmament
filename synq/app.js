import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Replace with your own values
const SUPABASE_URL = "https://qpfjchiucjhfvyohqhih.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZmpjaGl1Y2poZnZ5b2hxaGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDczMjksImV4cCI6MjA3NTQ4MzMyOX0.kcx9Sr7qGbWudJdf155tXg0gWWX6P1RYavo-lKCoQkU";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const messagesEl = document.getElementById("messages");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const emailInput = document.getElementById("emailInput");
const signInBtn = document.getElementById("signInBtn");
const signOutBtn = document.getElementById("signOutBtn");
const authSignedOut = document.getElementById("authSignedOut");
const authSignedIn = document.getElementById("authSignedIn");
const userEmail = document.getElementById("userEmail");
let currentUser = null;
let userColor = localStorage.getItem("synqColor") || "purple";

// --- THEME SWITCHER ---
document.querySelectorAll(".color").forEach((c) => {
  c.addEventListener("click", () => {
    userColor = c.dataset.color;
    localStorage.setItem("synqColor", userColor);
    document.documentElement.style.setProperty("--accent", getColorValue(userColor));
  });
});

function getColorValue(c) {
  const map = {
    purple: "#7c3aed",
    blue: "#2563eb",
    pink: "#db2777",
    green: "#22c55e",
    orange: "#f97316",
  };
  return map[c] || "#7c3aed";
}
document.documentElement.style.setProperty("--accent", getColorValue(userColor));

// --- AUTH ---
signInBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  if (!email) return alert("Enter your email");
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) return alert(error.message);
  alert("Check your email for the login link!");
});

signOutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  location.reload();
});

supabase.auth.onAuthStateChange((event, session) => {
  currentUser = session?.user || null;
  if (currentUser) {
    authSignedIn.style.display = "block";
    authSignedOut.style.display = "none";
    userEmail.textContent = currentUser.email;
    loadMessages();
    subscribeMessages();
  } else {
    authSignedIn.style.display = "none";
    authSignedOut.style.display = "block";
  }
});

// --- LOAD & DISPLAY MESSAGES ---
async function loadMessages() {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return console.error(error);
  messagesEl.innerHTML = "";
  data.forEach(addMessage);
}

function addMessage(msg) {
  const el = document.createElement("div");
  el.className = "message" + (msg.user_id === currentUser?.id ? " you" : "");
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = msg.content;
  bubble.style.background = msg.user_id === currentUser?.id
    ? `var(--accent)`
    : "var(--panel)";
  el.appendChild(bubble);
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// --- SEND MESSAGE ---
sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

async function sendMessage() {
  const text = input.value.trim();
  if (!text || !currentUser) return;
  const { error } = await supabase.from("messages").insert({
    user_id: currentUser.id,
    username: currentUser.email,
    content: text,
    color: userColor,
  });
  if (error) console.error(error);
  input.value = "";
}

// --- REALTIME UPDATES ---
function subscribeMessages() {
  supabase
    .channel("public:messages")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
      addMessage(payload.new);
    })
    .subscribe();
}

// Restore session on page load
(async () => {
  const { data } = await supabase.auth.getSession();
  currentUser = data.session?.user || null;
  if (currentUser) {
    authSignedIn.style.display = "block";
    authSignedOut.style.display = "none";
    userEmail.textContent = currentUser.email;
    loadMessages();
    subscribeMessages();
  }
})();
