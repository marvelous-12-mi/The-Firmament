import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
const supabaseUrl = "https://kpdgmbjdaynplyjacuxd.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGdtYmpkYXlucGx5amFjdXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA3MjMsImV4cCI6MjA3NDczNjcyM30.ZJM2v_5VES_AlHAAV4lHaIID7v3IBEbFUgFEcs4yOYQ";
const supabase = createClient(supabaseUrl, supabaseKey);

const feed = document.getElementById("feed");
const loader = document.getElementById("loader");
const toast = document.getElementById("toast");
const currentUserAvatar = document.getElementById("currentUserAvatar");
const newPostBtn = document.getElementById("newPostBtn");

function showToast(msg, color = "#ff3fd8") {
  toast.innerText = msg;
  toast.style.background = color;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 3000);
}

// Fetch user
let { data: userData } = await supabase.auth.getUser();
let currentUser = userData?.user;
if (currentUser?.user_metadata?.avatar_url) {
  currentUserAvatar.src = currentUser.user_metadata.avatar_url;
}

currentUserAvatar.onclick = () => {
  window.location.href = `profile.html?user=${currentUser?.id}`;
};

newPostBtn.onclick = () => {
  window.location.href = "post.html";
};

// Load Feed
async function loadFeed() {
  const { data, error } = await supabase
    .from("trends")
    .select("*")
    .order("created_at", { ascending: false });
  loader.style.display = "none";
  if (error) return showToast(error.message, "#dc2626");
  renderFeed(data);
}

function renderFeed(posts) {
  feed.innerHTML = "";
  posts.forEach((post) => {
    const postEl = document.createElement("div");
    postEl.className = "post";
    postEl.innerHTML = `
      <div class="post-header">
        <img src="${post.avatar}" alt="${post.username}" data-user="${post.user_id}">
        <h3>${post.username}</h3>
      </div>
      ${post.type === "image" ? `<img src="${post.url}" alt="Trend image">` : ""}
      ${post.type === "video" ? `<video controls src="${post.video_url}"></video>` : ""}
      ${post.type === "youtube" ? `<iframe width="100%" height="315" src="${post.video_url.replace("watch?v=", "embed/")}" frameborder="0" allowfullscreen></iframe>` : ""}
      <div class="caption">${post.caption || ""}</div>
      <div class="post-footer">
        <button class="like-btn" data-id="${post.id}">
          <i class="fa fa-heart"></i> ${post.likes || 0}
        </button>
        <span>${new Date(post.created_at).toLocaleString()}</span>
      </div>
    `;
    feed.appendChild(postEl);
  });

  document.querySelectorAll(".like-btn").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const likes = parseInt(btn.innerText.split(" ")[1]) + 1;
      await supabase.from("trends").update({ likes }).eq("id", id);
      btn.innerHTML = `<i class="fa fa-heart"></i> ${likes}`;
    };
  });

  document.querySelectorAll(".post-header img").forEach((img) => {
    img.onclick = () => {
      const userId = img.dataset.user;
      window.location.href = `profile.html?user=${userId}`;
    };
  });
}

loadFeed();
