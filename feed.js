import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://kpdgmbjdaynplyjacuxd.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGdtYmpkYXlucGx5amFjdXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA3MjMsImV4cCI6MjA3NDczNjcyM30.ZJM2v_5VES_AlHAAV4lHaIID7v3IBEbFUgFEcs4yOYQ";

const supabase = createClient(supabaseUrl, supabaseKey);

const feed = document.getElementById("feed");
const toast = document.getElementById("toast");
const headerAvatar = document.getElementById("headerAvatar");
const createBtn = document.getElementById("createBtn");
const floatingPostBtn = document.getElementById("floatingPostBtn");

function showToast(msg, color = "#9b00ff") {
  toast.textContent = msg;
  toast.style.background = color;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 3000);
}

// check auth
const { data: userData } = await supabase.auth.getUser();
const currentUser = userData?.user;

if (currentUser?.user_metadata?.avatar_url) {
  headerAvatar.src = currentUser.user_metadata.avatar_url;
}

createBtn.onclick = () => (window.location.href = "post.html");
floatingPostBtn.onclick = () => (window.location.href = "post.html");

headerAvatar.onclick = () => {
  if (currentUser) window.location.href = `profile.html?u=${currentUser.id}`;
  else window.location.href = "index.html";
};

// Load feed
async function loadFeed() {
  const { data: trends, error } = await supabase
    .from("trends")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return showToast("⚠️ Failed to load feed");
  }

  if (!trends.length) {
    feed.innerHTML = `<div class="empty">🌎 No trends yet. Be the first!</div>`;
    return;
  }

  feed.innerHTML = trends
    .map(
      (t) => `
      <article class="post-card">
        <div class="post-header">
          <img src="${t.avatar || "https://placehold.co/50x50"}" class="avatar" />
          <div class="user-info">
            <strong>${t.username}</strong>
            <span>${new Date(t.created_at).toLocaleString()}</span>
          </div>
        </div>

        <p class="caption">${t.caption || ""}</p>

        ${
          t.url
            ? `<img src="${t.url}" class="post-media">`
            : t.video_url
            ? (t.type === "youtube"
                ? `<iframe src="https://www.youtube.com/embed/${t.video_url.split("v=")[1]}" frameborder="0" allowfullscreen class="post-media"></iframe>`
                : `<video controls src="${t.video_url}" class="post-media"></video>`)
            : ""
        }

        <div class="post-actions">
          <button class="like-btn">❤️ ${t.likes || 0}</button>
          <button class="comment-btn">💬 Comment</button>
          <button class="share-btn">🔗 Share</button>
        </div>
      </article>`
    )
    .join("");
}

loadFeed();
