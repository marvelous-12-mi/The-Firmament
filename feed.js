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

// Fetch posts
async function loadFeed() {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    showToast("Error loading feed 😢");
    return;
  }

  if (!posts || posts.length === 0) {
    feed.innerHTML = `<p class="empty">No posts yet 😅</p>`;
    return;
  }

  feed.innerHTML = "";
  posts.forEach((post) => feed.appendChild(renderPost(post)));
}

// Render a single post
function renderPost(post) {
  const div = document.createElement("div");
  div.className = "post-card";

  const avatar = post.avatar_url || "https://placehold.co/60x60";
  const media = post.image_url
    ? `<img src="${post.image_url}" alt="Post Image">`
    : "";

  div.innerHTML = `
    <div class="post-top">
      <img class="avatar" src="${avatar}" alt="${post.username}" />
      <div>
        <p class="name">${post.username}</p>
        <p class="time">${new Date(post.created_at).toLocaleString()}</p>
      </div>
    </div>
    <div class="post-body">
      ${media}
      <p class="caption">${post.caption || ""}</p>
    </div>
    <div class="post-actions">
      <button class="icon-btn">❤️</button>
      <button class="icon-btn">💬</button>
      <button class="icon-btn">🔁</button>
    </div>
  `;

  return div;
}

// Show toast
function showToast(msg) {
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 3000);
}

// Load user profile avatar
async function loadUserAvatar() {
  const { data } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("username", "sonofjean2")
    .single();

  if (data && data.avatar_url) {
    meAvatar.src = data.avatar_url;
  }
}

// Add story (temporary demo)
function loadStories() {
  const users = [
    { name: "Jean", img: "https://i.pravatar.cc/100?img=1" },
    { name: "Lia", img: "https://i.pravatar.cc/100?img=2" },
    { name: "Sam", img: "https://i.pravatar.cc/100?img=3" },
    { name: "Mia", img: "https://i.pravatar.cc/100?img=4" },
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

// Floating button for uploading new post
fab.addEventListener("click", async () => {
  const caption = prompt("Write something cool ✨");
  if (!caption) return;

  const username = "sonofjean2";
  const avatar_url = meAvatar.src;

  const { error } = await supabase.from("posts").insert([
    {
      username,
      caption,
      avatar_url,
      image_url: null,
    },
  ]);

  if (error) {
    showToast("Upload failed 😢");
  } else {
    showToast("Posted 🎉");
    loadFeed();
  }
});

loadUserAvatar();
loadStories();
loadFeed();
