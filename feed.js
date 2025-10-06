import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://kpdgmbjdaynplyjacuxd.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGdtYmpkYXlucGx5amFjdXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA3MjMsImV4cCI6MjA3NDczNjcyM30.ZJM2v_5VES_AlHAAV4lHaIID7v3IBEbFUgFEcs4yOYQ";
const supabase = createClient(supabaseUrl, supabaseKey);

const feed = document.getElementById("feed");
const toast = document.getElementById("toast");
const fab = document.getElementById("fab");
const stories = document.getElementById("stories");
const meAvatar = document.getElementById("meAvatar");

async function loadFeed() {
  feed.innerHTML = `
    <div class="loading">
      <span class="spinner"></span>
      <p>Fetching your feed...</p>
    </div>
  `;

  const { data: trends, error } = await supabase
    .from("trends")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Supabase error:", error);
    showToast("Error loading feed 😢");
    feed.innerHTML = `<p class="empty">Couldn't load feed. Check console for details.</p>`;
    return;
  }

  if (!trends || trends.length === 0) {
    feed.innerHTML = `<p class="empty">No trends yet — be the first to post ✨</p>`;
    return;
  }

  feed.innerHTML = "";
  trends.forEach((trend) => feed.appendChild(renderTrend(trend)));
}

function renderTrend(trend) {
  const div = document.createElement("div");
  div.className = "post-card";

  const avatar = trend.avatar || "https://placehold.co/60x60";
  const media = trend.url
    ? `<img src="${trend.url}" alt="Post Image">`
    : trend.video_url
    ? `<video src="${trend.video_url}" controls></video>`
    : "";

  div.innerHTML = `
    <div class="post-top">
      <img class="avatar" src="${avatar}" alt="${trend.username}" />
      <div>
        <p class="name">${trend.username || "Unknown"}</p>
        <p class="time">${new Date(trend.created_at).toLocaleString()}</p>
      </div>
    </div>
    <div class="post-body">
      ${media}
      <p class="caption">${trend.caption || ""}</p>
    </div>
    <div class="post-actions">
      <button class="icon-btn">❤️</button>
      <button class="icon-btn">💬</button>
      <button class="icon-btn">🔁</button>
    </div>
  `;
  return div;
}

function showToast(msg) {
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 3000);
}

function loadStories() {
  const users = [
    { name: "Jean", img: "https://i.pravatar.cc/100?img=5" },
    { name: "Lia", img: "https://i.pravatar.cc/100?img=6" },
    { name: "Sam", img: "https://i.pravatar.cc/100?img=7" },
    { name: "Mia", img: "https://i.pravatar.cc/100?img=8" },
  ];
  users.forEach((u) => {
    const s = document.createElement("div");
    s.className = "story";
    s.innerHTML = `
      <img src="${u.img}" alt="${u.name}">
      <p>${u.name}</p>
    `;
    stories.appendChild(s);
  });
}

// Floating add button — posts a trend
fab.addEventListener("click", async () => {
  const caption = prompt("What's trending in your world?");
  if (!caption) return;

  const username = "sonofjean2";
  const avatar = meAvatar.src;

  const { error } = await supabase.from("trends").insert([
    {
      username,
      caption,
      avatar,
      type: "text",
    },
  ]);

  if (error) {
    console.error(error);
    showToast("Upload failed 😢");
  } else {
    showToast("Posted 🎉");
    loadFeed();
  }
});

loadStories();
loadFeed();
