import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://kpdgmbjdaynplyjacuxd.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGdtYmpkYXlucGx5amFjdXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA3MjMsImV4cCI6MjA3NDczNjcyM30.ZJM2v_5VES_AlHAAV4lHaIID7v3IBEbFUgFEcs4yOYQ";
const supabase = createClient(supabaseUrl, supabaseKey);

const feed = document.getElementById("feed");
const fab = document.getElementById("fab");
const toast = document.getElementById("toast");
const stories = document.getElementById("stories");
const meAvatar = document.getElementById("meAvatar");
const meName = document.getElementById("meName");
const modal = document.getElementById("postModal");
const captionInput = document.getElementById("captionInput");
const submitPost = document.getElementById("submitPost");
const closeModal = document.getElementById("closeModal");

// 👤 Simulate login
let currentUser = localStorage.getItem("trendUser");
if (!currentUser) {
  currentUser = prompt("Choose your TrendTime username:");
  localStorage.setItem("trendUser", currentUser);
}
meName.textContent = currentUser;

// Toast
function showToast(msg) {
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 2500);
}

// Load stories
function loadStories() {
  const users = [
    { name: "Jean", img: "https://i.pravatar.cc/100?img=11" },
    { name: "Mia", img: "https://i.pravatar.cc/100?img=22" },
    { name: "Noah", img: "https://i.pravatar.cc/100?img=33" },
    { name: "Liam", img: "https://i.pravatar.cc/100?img=44" },
    { name: "Ava", img: "https://i.pravatar.cc/100?img=55" },
  ];
  users.forEach((u) => {
    const s = document.createElement("div");
    s.className = "story";
    s.innerHTML = `<img src="${u.img}" alt="${u.name}"><p>${u.name}</p>`;
    s.addEventListener("click", () => {
      showToast(`${u.name}'s story 🔥`);
    });
    stories.appendChild(s);
  });
}

// Render posts
function renderPost(p) {
  const div = document.createElement("div");
  div.className = "post-card";
  const avatar = p.avatar || "https://i.pravatar.cc/60";
  const media = p.url
    ? `<img src="${p.url}" alt="Post image">`
    : "";

  div.innerHTML = `
    <div class="post-top">
      <img class="avatar" src="${avatar}" alt="${p.username}">
      <div>
        <p class="name">${p.username}</p>
        <p class="time">${new Date(p.created_at).toLocaleString()}</p>
      </div>
    </div>
    <div class="post-body">
      ${media}
      <p class="caption">${p.caption || ""}</p>
    </div>
    <div class="post-actions">
      <button class="icon-btn like">❤️ ${p.likes || 0}</button>
      <button class="icon-btn">💬</button>
      <button class="icon-btn">🔗</button>
    </div>
  `;

  const likeBtn = div.querySelector(".like");
  likeBtn.addEventListener("click", async () => {
    likeBtn.classList.toggle("liked");
    let newLikes = (p.likes || 0) + 1;
    likeBtn.innerHTML = `❤️ ${newLikes}`;
    await supabase.from("trends").update({ likes: newLikes }).eq("id", p.id);
  });

  return div;
}

// Load feed
async function loadFeed() {
  const { data, error } = await supabase
    .from("trends")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    feed.innerHTML = `<p class="empty">Could not load feed 😢</p>`;
    return;
  }

  feed.innerHTML = "";
  data.forEach((p) => feed.appendChild(renderPost(p)));
}

// Real-time updates
supabase
  .channel("trends")
  .on("postgres_changes", { event: "*", schema: "public", table: "trends" }, (payload) => {
    loadFeed();
  })
  .subscribe();

// Add post
fab.addEventListener("click", () => modal.classList.remove("hidden"));
closeModal.addEventListener("click", () => modal.classList.add("hidden"));

submitPost.addEventListener("click", async () => {
  const caption = captionInput.value.trim();
  if (!caption) return showToast("Type something first!");

  const { error } = await supabase.from("trends").insert([
    {
      username: currentUser,
      caption,
      avatar: meAvatar.src,
      likes: 0,
    },
  ]);

  captionInput.value = "";
  modal.classList.add("hidden");

  if (error) {
    showToast("Failed to post 😢");
  } else {
    showToast("Posted 🎉");
    loadFeed();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

loadStories();
loadFeed();
