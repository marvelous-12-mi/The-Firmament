import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🧩 Your Supabase credentials
const SUPABASE_URL = "https://kpdgmbjdaynplyjacuxd.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGdtYmpkYXlucGx5amFjdXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA3MjMsImV4cCI6MjA3NDczNjcyM30.ZJM2v_5VES_AlHAAV4lHaIID7v3IBEbFUgFEcs4yOYQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const feedContainer = document.getElementById("feed");
const postBtn = document.getElementById("postBtn");
const toast = document.getElementById("toast");
const headerAvatar = document.getElementById("headerAvatar");

// ⚡ Load feed when page opens
window.addEventListener("DOMContentLoaded", loadTrends);

// ➕ Go to create post page
postBtn.addEventListener("click", () => (window.location.href = "post.html"));

// 🔥 Fetch and display all trends
async function loadTrends() {
  try {
    feedContainer.innerHTML = `<div class="loading">✨ Fetching trends...</div>`;

    const { data: trends, error } = await supabase
      .from("trends")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!trends || trends.length === 0) {
      feedContainer.innerHTML = `<p class="empty">No trends yet — be the first to post! 🚀</p>`;
      return;
    }

    feedContainer.innerHTML = trends.map(renderTrend).join("");
  } catch (err) {
    console.error("Error loading feed:", err);
    showToast("⚠️ Unable to load feed.");
  }
}

// 🧱 Render one trend card
function renderTrend(trend) {
  const date = new Date(trend.created_at).toLocaleString();
  const isImage = trend.type === "image";
  const isVideo = trend.type === "video";
  const isYouTube = trend.type === "youtube";

  let media = "";
  if (isImage && trend.url)
    media = `<img src="${trend.url}" alt="trend image" class="post-img" />`;
  else if (isVideo && trend.video_url)
    media = `<video controls class="post-video"><source src="${trend.video_url}" type="video/webm"></video>`;
  else if (isYouTube && trend.video_url)
    media = `<iframe class="post-youtube" src="https://www.youtube.com/embed/${extractYouTubeID(
      trend.video_url
    )}" frameborder="0" allowfullscreen></iframe>`;

  return `
    <article class="trend-card">
      <div class="trend-header">
        <img src="${
          trend.avatar || "https://placehold.co/48x48"
        }" class="avatar" />
        <div class="info">
          <h3>${trend.username || "Anonymous"}</h3>
          <p class="timestamp">${date}</p>
        </div>
      </div>
      <p class="caption">${trend.caption || ""}</p>
      ${media || ""}
      <div class="trend-actions">
        <button class="like-btn" onclick="likeTrend(${trend.id})">❤️ ${
    trend.likes || 0
  }</button>
      </div>
    </article>
  `;
}

// 🎬 Extract YouTube video ID
function extractYouTubeID(url) {
  const match = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([^&#\s?]+)/);
  return match ? match[1] : null;
}

// ❤️ Like trend
window.likeTrend = async function (id) {
  try {
    const { data, error } = await supabase
      .from("trends")
      .update({ likes: supabase.rpc("increment_likes", { trend_id: id }) })
      .eq("id", id)
      .select();

    if (error) throw error;

    showToast("❤️ Trend liked!");
    loadTrends();
  } catch (err) {
    console.error("Like failed:", err);
    showToast("❌ Error liking trend.");
  }
};

// 🔔 Toast popup
function showToast(message, color = "#ff3fd8") {
  toast.textContent = message;
  toast.style.background = color;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 2500);
}
