import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ✅ Supabase connection (your key + project URL)
const supabase = createClient(
  "https://kpdgmbjdaynplyjacuxd.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGdtYmpkYXlucGx5amFjdXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA3MjMsImV4cCI6MjA3NDczNjcyM30.ZJM2v_5VES_AlHAAV4lHaIID7v3IBEbFUgFEcs4yOYQ"
);

const feed = document.getElementById("feed");
const postBtn = document.getElementById("postBtn");
const headerAvatar = document.getElementById("headerAvatar");
const toast = document.getElementById("toast");

// Get the logged-in user
let { data: userData } = await supabase.auth.getUser();
let currentUser = userData?.user;

// Redirect to login if no user
if (!currentUser) {
  window.location.href = "index.html";
}

headerAvatar.src = currentUser.user_metadata?.avatar_url || "https://placehold.co/48x48";

// Show toast
function showToast(msg, color = "#ff3fd8") {
  toast.innerText = msg;
  toast.style.background = color;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 3000);
}

// Redirect to post page
postBtn.onclick = () => {
  window.location.href = "post.html";
};

// Fetch all trends
async function loadFeed() {
  const { data, error } = await supabase
    .from("trends")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    feed.innerHTML = `<p class="error">Failed to load trends 😢</p>`;
    console.error(error);
    return;
  }

  if (!data.length) {
    feed.innerHTML = `<p class="empty">No trends yet. Be the first to post!</p>`;
    return;
  }

  feed.innerHTML = data
    .map(
      (t) => `
      <div class="trend-card">
        <div class="user-info">
          <img src="${t.avatar || "https://placehold.co/48x48"}" class="avatar-sm" />
          <div>
            <p class="username">@${t.username}</p>
            <p class="time">${new Date(t.created_at).toLocaleString()}</p>
          </div>
        </div>
        <p class="caption">${t.caption || ""}</p>
        ${
          t.type === "image"
            ? `<img src="${t.url}" class="media">`
            : t.type === "video"
            ? `<video src="${t.video_url}" controls class="media"></video>`
            : t.type === "youtube"
            ? `<iframe class="media" src="https://www.youtube.com/embed/${
                t.video_url.split("v=")[1]
              }" frameborder="0" allowfullscreen></iframe>`
            : ""
        }
        <div class="trend-actions">
          <button class="like-btn" data-id="${t.id}">❤️ ${t.likes || 0}</button>
        </div>
      </div>
    `
    )
    .join("");

  // Like buttons
  document.querySelectorAll(".like-btn").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.getAttribute("data-id");
      const currentLikes = parseInt(btn.innerText.split(" ")[1]) || 0;
      const { error } = await supabase
        .from("trends")
        .update({ likes: currentLikes + 1 })
        .eq("id", id);
      if (!error) {
        btn.innerText = `❤️ ${currentLikes + 1}`;
      } else {
        showToast("Error liking post", "#dc2626");
      }
    };
  });
}

// Load the feed
loadFeed();
