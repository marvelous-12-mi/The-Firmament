import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://kpdgmbjdaynplyjacuxd.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGdtYmpkYXlucGx5amFjdXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA3MjMsImV4cCI6MjA3NDczNjcyM30.ZJM2v_5VES_AlHAAV4lHaIID7v3IBEbFUgFEcs4yOYQ";

const supabase = createClient(supabaseUrl, supabaseKey);

// Elements
const feed = document.getElementById("feed");
const createBtn = document.getElementById("createBtn");
const avatarInput = document.getElementById("avatarInput");
const userAvatar = document.getElementById("userAvatar");
const toast = document.getElementById("toast");
const themeToggle = document.getElementById("themeToggle");
const storyTrack = document.getElementById("storyTrack");

let username = localStorage.getItem("username") || "You";
let avatarUrl = localStorage.getItem("avatar") || "https://i.pravatar.cc/100?u=default";

/* ------------------ UI Helpers ------------------ */
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

function randomHeart(x, y) {
  const heart = document.createElement("div");
  heart.className = "heart";
  heart.style.left = x + "px";
  heart.style.top = y + "px";
  heart.textContent = "❤️";
  document.body.appendChild(heart);
  setTimeout(() => heart.remove(), 2000);
}

/* ------------------ Theme Toggle ------------------ */
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  themeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
});

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "☀️";
}

/* ------------------ Avatar Upload ------------------ */
userAvatar.addEventListener("click", () => avatarInput.click());
avatarInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const fileName = `${username}-${Date.now()}`;
  const { error } = await supabase.storage.from("avatars").upload(fileName, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) return showToast("Avatar upload failed 😢");

  const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
  localStorage.setItem("avatar", data.publicUrl);
  userAvatar.src = data.publicUrl;
  showToast("Avatar updated 💫");
});

/* ------------------ Load Stories ------------------ */
function loadStories() {
  const fakeUsers = [
    { name: "Ava", img: "https://i.pravatar.cc/60?u=ava" },
    { name: "Leo", img: "https://i.pravatar.cc/60?u=leo" },
    { name: "Mia", img: "https://i.pravatar.cc/60?u=mia" },
    { name: "Noah", img: "https://i.pravatar.cc/60?u=noah" },
    { name: "Ella", img: "https://i.pravatar.cc/60?u=ella" },
  ];

  storyTrack.innerHTML = fakeUsers
    .map(
      (u) => `
      <div class="story">
        <img src="${u.img}" alt="${u.name}" />
        <p>${u.name}</p>
      </div>
    `
    )
    .join("");
}

/* ------------------ Fetch Posts ------------------ */
async function loadFeed() {
  const { data, error } = await supabase
    .from("trends")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    feed.innerHTML = "<p>⚠️ Failed to load feed.</p>";
    return;
  }

  if (!data || data.length === 0) {
    feed.innerHTML = "<p>No trends yet. Be the first to post 🚀</p>";
    return;
  }

  feed.innerHTML = data
    .map((post) => {
      return `
      <div class="post-card">
        <div class="post-top">
          <img class="avatar" src="${post.avatar || "https://i.pravatar.cc/100"}" alt="${post.username}" />
          <div>
            <strong>${post.username}</strong><br/>
            <small>${new Date(post.created_at).toLocaleString()}</small>
          </div>
        </div>
        <div class="post-body">
          ${post.url ? `<img src="${post.url}" class="post-img" alt="Post image" />` : ""}
          ${post.video_url ? `<video src="${post.video_url}" class="post-vid" controls></video>` : ""}
          <p>${post.caption || ""}</p>
        </div>
        <div class="post-actions">
          <button class="like-btn">❤️</button>
          <button>💬</button>
          <button>🔁</button>
        </div>
      </div>`;
    })
    .join("");

  // Like buttons
  document.querySelectorAll(".like-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const x = e.clientX;
      const y = e.clientY;
      randomHeart(x, y);
      showToast("You liked this 💖");
    });
  });
}

/* ------------------ Real-Time Updates ------------------ */
supabase
  .channel("realtime-trends")
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "trends" }, (payload) => {
    loadFeed();
    showToast("✨ New trend added!");
  })
  .subscribe();

/* ------------------ Floating Create Button ------------------ */
createBtn.addEventListener("click", () => {
  window.location.href = "post.html";
});

/* ------------------ Init ------------------ */
loadStories();
loadFeed();
userAvatar.src = avatarUrl;
