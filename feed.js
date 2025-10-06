import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://kpdgmbjdaynplyjacuxd.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGdtYmpkYXlucGx5amFjdXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA3MjMsImV4cCI6MjA3NDczNjcyM30.ZJM2v_5VES_AlHAAV4lHaIID7v3IBEbFUgFEcs4yOYQ";
const supabase = createClient(supabaseUrl, supabaseKey);

const feed = document.getElementById("feed");
const loader = document.getElementById("loader");
const toast = document.getElementById("toast");
const userAvatar = document.getElementById("userAvatar");
const createPostBtn = document.getElementById("createPostBtn");

let { data: userData } = await supabase.auth.getUser();
let currentUser = userData?.user;

function showToast(msg, color = "#ff3fd8") {
  toast.innerText = msg;
  toast.style.background = color;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 3000);
}

createPostBtn.onclick = () => (window.location.href = "post.html");

if (currentUser) {
  userAvatar.src =
    currentUser.user_metadata?.avatar_url || "https://placehold.co/40x40";
  userAvatar.onclick = () =>
    window.location.href = `profile.html?user=${currentUser.id}`;
} else {
  userAvatar.onclick = () => (window.location.href = "index.html");
}

async function loadTrends() {
  const { data, error } = await supabase
    .from("trends")
    .select("*")
    .order("created_at", { ascending: false });

  loader.style.display = "none";

  if (error) {
    showToast("Failed to load feed", "#dc2626");
    return;
  }

  if (!data.length) {
    feed.innerHTML = `<p style="text-align:center;color:#777;">No trends yet — create one!</p>`;
    return;
  }

  feed.innerHTML = data
    .map((trend) => {
      let media = "";
      if (trend.type === "image") {
        media = `<img src="${trend.url}" alt="trend">`;
      } else if (trend.type === "video") {
        media = `<video src="${trend.video_url}" controls></video>`;
      } else if (trend.type === "youtube") {
        const videoId = trend.video_url.split("v=")[1];
        media = `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
      }

      return `
      <div class="post">
        <div class="post-header">
          <img src="${trend.avatar}" alt="${trend.username}" class="avatar" 
            onclick="window.location.href='profile.html?user=${trend.user_id}'" />
          <h3>${trend.username}</h3>
        </div>
        ${media}
        <div class="caption">${trend.caption}</div>
        <div class="post-footer">
          <button class="likeBtn">❤️ ${trend.likes}</button>
          <span>${new Date(trend.created_at).toLocaleString()}</span>
        </div>
      </div>`;
    })
    .join("");
}

loadTrends();
