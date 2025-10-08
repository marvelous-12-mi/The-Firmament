// feed.js — TrendTime feed with HatGPT link
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://kpdgmbjdaynplyjacuxd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGdtYmpkYXlucGx5amFjdXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA3MjMsImV4cCI6MjA3NDczNjcyM30.ZJM2v_5VES_AlHAAV4lHaIID7v3IBEbFUgFEcs4yOYQ";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM
const feedEl = document.getElementById("feed");
const storyTrack = document.getElementById("storyTrack");
const avatarEl = document.getElementById("avatar");
const avatarInput = document.getElementById("avatarInput");
const toastEl = document.getElementById("toast");
const createBtn = document.getElementById("createBtn");
const themeToggle = document.getElementById("themeToggle");

// local user
let currentUser = localStorage.getItem("trendUser") || `guest${Date.now()}`;
let currentAvatar = localStorage.getItem("trendAvatar") || `https://i.pravatar.cc/150?u=${encodeURIComponent(currentUser)}`;
localStorage.setItem("trendUser", currentUser);
localStorage.setItem("trendAvatar", currentAvatar);

// UI helpers
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 2500);
}
function el(tag, cls = "") { const e = document.createElement(tag); if (cls) e.className = cls; return e; }

avatarEl.src = currentAvatar;

// THEME
if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark");
themeToggle.onclick = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
  themeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
};

// AVATAR UPLOAD -> uploads to bucket 'avatars' (must exist & be public)
avatarEl.addEventListener("click", () => avatarInput.click());
avatarInput.addEventListener("change", async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  showToast("Uploading avatar...");
  const path = `avatars/${currentUser}-${Date.now()}.${f.name.split(".").pop()}`;
  const { data, error } = await supabase.storage.from("avatars").upload(path, f, { upsert: true });
  if (error) { console.error(error); showToast("Upload failed"); return; }
  const url = supabase.storage.from("avatars").getPublicUrl(data.path).data.publicUrl;
  currentAvatar = url;
  localStorage.setItem("trendAvatar", currentAvatar);
  avatarEl.src = currentAvatar;
  showToast("Avatar updated ✨");
  // optionally update profiles table if you use it
});

// STORIES (demo/populated from recent authors)
async function loadStories() {
  try {
    const { data } = await supabase.from("trends").select("username, avatar, user_id").order("created_at", { ascending: false }).limit(20);
    const seen = new Set();
    const list = [];
    for (const r of (data || [])) {
      if (!r.username) continue;
      if (!seen.has(r.username)) {
        seen.add(r.username);
        list.push({ username: r.username, avatar: r.avatar });
      }
      if (list.length >= 12) break;
    }
    // fallback demo stories
    if (list.length === 0) {
      const demo = ["Nova","Mia","Jean","Ari","Sam"].map((n,i)=>({ username:n, avatar:`https://i.pravatar.cc/100?img=${11+i}` }));
      renderStories(demo);
      return;
    }
    renderStories(list);
  } catch (err) { console.error("stories", err); }
}
function renderStories(list) {
  storyTrack.innerHTML = "";
  // add "You" first
  const you = el("div","story");
  you.innerHTML = `<img src="${currentAvatar}" alt="You"><small>You</small>`;
  you.addEventListener("click", ()=> showToast("That's you ✨"));
  storyTrack.appendChild(you);
  list.forEach(u => {
    const d = el("div","story");
    d.innerHTML = `<img src="${u.avatar || 'https://i.pravatar.cc/100'}" alt="${u.username}"><small>${u.username}</small>`;
    d.addEventListener("click", ()=> window.location.href = `profile.html?user=${encodeURIComponent(u.username)}`);
    storyTrack.appendChild(d);
  });
}

// FEED
async function loadFeed() {
  feedEl.innerHTML = `<div class="loading"><div class="spinner"></div><p>Fetching your feed...</p></div>`;
  const { data, error } = await supabase.from("trends").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) {
    console.error(error);
    feedEl.innerHTML = `<div class="loading"><p>Failed to load feed</p></div>`;
    return;
  }
  if (!data || data.length === 0) {
    feedEl.innerHTML = `<div class="loading"><p>No trends yet — be the first ✨</p></div>`;
    return;
  }

  feedEl.innerHTML = "";
  data.forEach(post => feedEl.appendChild(renderPost(post)));
  attachLikeListeners();
}
function renderPost(p) {
  const card = el("article","post-card");
  const avatar = p.avatar || currentAvatar || `https://i.pravatar.cc/150?u=${encodeURIComponent(p.username||'anon')}`;
  const media = p.url ? `<img class="post-img" src="${p.url}" alt="media">` : (p.video_url ? `<video class="post-vid" src="${p.video_url}" controls></video>` : "");
  card.innerHTML = `
    <div class="post-top">
      <img class="avatar" src="${avatar}" alt="${p.username}" />
      <div class="meta"><strong>${p.username || "anon"}</strong><small>${new Date(p.created_at).toLocaleString()}</small></div>
    </div>
    <div class="post-body">${media}<p>${(p.caption||"").replace(/</g,"&lt;")}</p></div>
    <div class="post-actions"><button class="like-btn" data-id="${p.id}">❤️ <span>${p.likes||0}</span></button><button class="comment-btn">💬</button><button class="share-btn">🔗</button></div>
  `;
  return card;
}

function attachLikeListeners() {
  feedEl.querySelectorAll(".like-btn").forEach(btn => {
    btn.onclick = async (e) => {
      const id = btn.dataset.id;
      const span = btn.querySelector("span");
      const current = parseInt(span.textContent || "0",10);
      span.textContent = current + 1;
      spawnHeart(e.pageX, e.pageY);
      // update DB (non-atomic fallback)
      const { error } = await supabase.from("trends").update({ likes: current + 1 }).eq("id", id);
      if (error) console.error("like error", error);
    };
  });
}

function spawnHeart(x,y) {
  const h = el("div","heart-float");
  h.textContent = "💜";
  h.style.left = `${x}px`;
  h.style.top = `${y}px`;
  document.body.appendChild(h);
  setTimeout(()=> h.remove(), 1200);
}

// Realtime subscription (insert)
supabase
  .channel('realtime:trends')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'trends' }, payload => {
    if (payload.eventType === 'INSERT' || payload.event === 'INSERT') {
      const row = payload.new || payload.record;
      if (row) {
        const node = renderPost(row);
        feedEl.prepend(node);
        spawnHeart(window.innerWidth/2, window.innerHeight/2);
      }
    }
    if (payload.eventType === 'UPDATE' || payload.event === 'UPDATE') {
      const row = payload.new || payload.record;
      if (row) {
        const card = feedEl.querySelector(`.post-card [data-id="${row.id}"]`);
        // reload or update like count — simpler: reload feed
        loadFeed();
      }
    }
  })
  .subscribe()
  .catch(e => console.warn("subscribe error", e));

// FAB => post page
createBtn.onclick = () => window.location.href = "post.html";

// run
loadStories();
loadFeed();
