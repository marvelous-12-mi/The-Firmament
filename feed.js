import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://kpdgmbjdaynplyjacuxd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGdtYmpkYXlucGx5amFjdXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA3MjMsImV4cCI6MjA3NDczNjcyM30.ZJM2v_5VES_AlHAAV4lHaIID7v3IBEbFUgFEcs4yOYQ";
const supabase = createClient(supabaseUrl, supabaseKey);

// Elements
const feedContainer = document.getElementById("feed");
const toast = document.getElementById("toast");
const headerAvatar = document.getElementById("headerAvatar");
const sideAvatar = document.getElementById("sideAvatar");
const avatarUpload = document.getElementById("avatarUpload");
const changeAvatarBtn = document.getElementById("changeAvatarBtn");
const usernameDisplay = document.getElementById("usernameDisplay");
const trendingList = document.getElementById("trendingList");
const postBtn = document.getElementById("postBtn");

let currentUser = null;

// Toast helper
function showToast(msg, color = "#a855f7") {
  toast.innerText = msg;
  toast.style.background = color;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 3000);
}

// Load user
async function loadUser() {
  const { data } = await supabase.auth.getUser();
  currentUser = data?.user;

  if (currentUser) {
    usernameDisplay.textContent = currentUser.email.split("@")[0];
    const avatarUrl =
      currentUser.user_metadata?.avatar_url || "https://placehold.co/100x100";
    headerAvatar.src = avatarUrl;
    sideAvatar.src = avatarUrl;
  } else {
    showToast("You’re not signed in!", "#dc2626");
  }
}

// Avatar upload
changeAvatarBtn.onclick = () => avatarUpload.click();

avatarUpload.onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const filePath = `avatars/${currentUser.id}-${Date.now()}.png`;
  const { error } = await supabase.storage.from("avatars").upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) {
    showToast("Upload failed: " + error.message, "#dc2626");
    return;
  }

  const publicUrl = supabase.storage.from("avatars").getPublicUrl(filePath).data.publicUrl;

  // Update profile metadata
  const { error: updateErr } = await supabase.auth.updateUser({
    data: { avatar_url: publicUrl },
  });

  if (updateErr) return showToast(updateErr.message, "#dc2626");

  headerAvatar.src = publicUrl;
  sideAvatar.src = publicUrl;
  showToast("Avatar updated!");
};

// Click avatar → profile
feedContainer.addEventListener("click", (e) => {
  const avatar = e.target.closest(".trend-header img");
  if (avatar && avatar.dataset.username) {
    const username = avatar.dataset.username;
    window.location.href = `profile.html?user=${encodeURIComponent(username)}`;
  }
});

// Load feed
async function loadTrends() {
  const { data, error } = await supabase
    .from("trends")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    showToast("Error loading trends: " + error.message, "#dc2626");
    return;
  }

  feedContainer.innerHTML = "";

  if (!data.length) {
    feedContainer.innerHTML = `<p style="text-align:center;">No trends yet. Be the first to create one!</p>`;
    return;
  }

  data.forEach((trend) => {
    const card = document.createElement("div");
    card.className = "trend-card";
    card.innerHTML = `
      <div class="trend-header">
        <img src="${trend.avatar || "https://placehold.co/48x48"}" data-username="${trend.username}" />
        <div>
          <div><b>${trend.username}</b></div>
          <div class="trend-meta">${new Date(trend.created_at).toLocaleString()}</div>
        </div>
      </div>
      <div class="trend-caption">${trend.caption || ""}</div>
      ${trend.type === "image"
        ? `<img src="${trend.url}" alt="trend image">`
        : trend.type === "video"
        ? `<video src="${trend.video_url}" controls></video>`
        : trend.type === "youtube"
        ? `<iframe width="100%" height="315" src="${trend.video_url.replace(
            "watch?v=",
            "embed/"
          )}" frameborder="0" allowfullscreen></iframe>`
        : trend.text
        ? `<p>${trend.text}</p>`
        : ""}
      <div class="trend-actions">
        <button>❤️ ${trend.likes || 0}</button>
        <button>💬 Comment</button>
      </div>
    `;
    feedContainer.appendChild(card);
  });
}

// Trending creators
async function loadTrendingCreators() {
  const { data, error } = await supabase
    .from("trends")
    .select("username, avatar")
    .limit(5);

  if (error || !data) return;

  trendingList.innerHTML = data
    .map(
      (t) => `
      <li onclick="window.location.href='profile.html?user=${encodeURIComponent(
        t.username
      )}'">
        <img src="${t.avatar || "https://placehold.co/32x32"}" class="small-avatar">
        ${t.username}
      </li>
    `
    )
    .join("");
}

// Post button → go to post.html
postBtn.onclick = () => (window.location.href = "post.html");

// Init
await loadUser();
await loadTrends();
await loadTrendingCreators();
