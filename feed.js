/**
 * feed.js — TrendVerse feed (addictive edition)
 * - Uses your Supabase project (trends table)
 * - Realtime updates
 * - Avatar upload to 'avatars' bucket (public)
 * - Infinite scroll (load more on scroll)
 *
 * IMPORTANT: ensure your Supabase 'avatars' storage bucket is public or has appropriate policies.
 */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://kpdgmbjdaynplyjacuxd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGdtYmpkYXlucGx5amFjdXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA3MjMsImV4cCI6MjA3NDczNjcyM30.ZJM2v_5VES_AlHAAV4lHaIID7v3IBEbFUgFEcs4yOYQ";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM refs
const feedEl = document.getElementById("feed");
const storiesEl = document.getElementById("stories");
const initialLoading = document.getElementById("initialLoading");
const toastEl = document.getElementById("toast");
const meAvatar = document.getElementById("meAvatar");
const fab = document.getElementById("fab");
const avatarInput = document.getElementById("avatarInput");
const modeToggle = document.getElementById("modeToggle");
const addStoryBtn = document.getElementById("addStory");

// local user
let currentUser = localStorage.getItem("trendverse_user");
let currentAvatar = localStorage.getItem("trendverse_avatar");

// paging
let page = 0;
const PAGE_SIZE = 8;
let loadingMore = false;
let reachedEnd = false;

// small helpers
function showToast(msg, ms = 2600) {
  toastEl.textContent = msg;
  toastEl.style.display = "block";
  setTimeout(() => (toastEl.style.display = "none"), ms);
}
function el(tag, cls = "") { const e = document.createElement(tag); if (cls) e.className = cls; return e; }

// ensure user exists locally
if (!currentUser) {
  currentUser = prompt("Welcome to TrendVerse — pick a username:") || `user${Date.now()}`; 
  localStorage.setItem("trendverse_user", currentUser);
}
if (!currentAvatar) {
  currentAvatar = `https://i.pravatar.cc/150?u=${encodeURIComponent(currentUser)}`;
  localStorage.setItem("trendverse_avatar", currentAvatar);
}
meAvatar.src = currentAvatar;

// theme toggle: remembers pref
const preferred = localStorage.getItem("trendverse_theme");
if (preferred === "dark") document.body.classList.add("dark");
modeToggle?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("trendverse_theme", document.body.classList.contains("dark") ? "dark" : "light");
  modeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});
modeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";

// avatar upload flow
meAvatar.addEventListener("click", () => avatarInput.click());
avatarInput.addEventListener("change", async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  showToast("Uploading avatar...");
  const path = `avatar-${currentUser}-${Date.now()}.${f.name.split('.').pop()}`;
  try {
    const { data: uploadData, error: upErr } = await supabase.storage.from("avatars").upload(path, f, { upsert: true });
    if (upErr) throw upErr;
    const publicUrl = supabase.storage.from("avatars").getPublicUrl(uploadData.path).data.publicUrl;
    // save locally
    currentAvatar = publicUrl;
    localStorage.setItem("trendverse_avatar", currentAvatar);
    meAvatar.src = currentAvatar;
    showToast("Avatar updated ✨");
  } catch (err) {
    console.error("avatar upload", err);
    showToast("Avatar upload failed 😢");
  }
});

// stories (rotate rings & shimmer)
function renderStories(list) {
  // preserve the add-story first node; clear the rest
  const base = storiesEl.querySelector(".add-story");
  storiesEl.innerHTML = "";
  if (base) storiesEl.appendChild(base);

  list.forEach(s => {
    const div = el("div", "story");
    const ring = el("div", "story-ring");
    const img = el("img", "simg");
    img.src = s.avatar || `https://i.pravatar.cc/100?u=${encodeURIComponent(s.username)}`;
    ring.appendChild(img);
    div.appendChild(ring);
    const label = el("div", "story-label");
    label.textContent = s.username || "anon";
    div.appendChild(label);
    // gently rotate ring
    ring.style.animation = `slowspin ${3 + Math.random()*3}s linear infinite`;
    // click
    div.addEventListener("click", () => {
      showToast(`${s.username}'s moment ✨`);
      // open story viewer — you can expand this
    });
    storiesEl.appendChild(div);
  });
}

// add initial add-story click (opens file to upload story)
addStoryBtn?.addEventListener?.("click", async () => {
  // simple uploader for story (reuses avatars bucket for demo)
  const input = document.createElement("input");
  input.type = "file"; input.accept = "image/*,video/*";
  input.onchange = async () => {
    const file = input.files?.[0]; if (!file) return;
    showToast("Uploading story...");
    try {
      const path = `story-${currentUser}-${Date.now()}.${file.name.split('.').pop()}`;
      const { data: uploadData, error: upErr } = await supabase.storage.from("stories").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const publicUrl = supabase.storage.from("stories").getPublicUrl(uploadData.path).data.publicUrl;
      // insert minimal story row (if you have a stories table)
      // await supabase.from("stories").insert([{ user_id: null, username: currentUser, avatar: currentAvatar, media_url: publicUrl }]);
      showToast("Story uploaded — nice!");
    } catch (err) {
      console.error("story upload", err);
      showToast("Story upload failed");
    }
  };
  input.click();
});

// helper to create a post node
function createPostNode(p) {
  const node = el("article", "post-card");
  const top = el("div", "post-top");
  const avatar = el("img", "avatar");
  avatar.src = p.avatar || `https://i.pravatar.cc/150?u=${encodeURIComponent(p.username||'anon')}`;
  avatar.alt = p.username || "anon";
  avatar.addEventListener("click", () => window.location.href = `profile.html?user=${encodeURIComponent(p.user_id || p.username)}`);

  const meta = el("div", "meta");
  const name = el("div", "name"); name.textContent = p.username || "anon";
  const time = el("div", "time"); time.textContent = new Date(p.created_at).toLocaleString();
  meta.appendChild(name); meta.appendChild(time);
  top.appendChild(avatar); top.appendChild(meta);

  const body = el("div", "post-body");
  if (p.type === "image" && p.url) {
    const mediaWrap = el("div", "post-media");
    const img = el("img"); img.src = p.url; img.alt = "post media";
    mediaWrap.appendChild(img);
    body.appendChild(mediaWrap);
  } else if ((p.type === "video" || p.video_url) && p.video_url) {
    const mediaWrap = el("div", "post-media");
    const v = el("video"); v.src = p.video_url; v.controls = true;
    mediaWrap.appendChild(v);
    body.appendChild(mediaWrap);
  }
  const caption = el("div", "caption"); caption.textContent = p.caption || "";
  body.appendChild(caption);

  const actions = el("div", "post-actions");
  const left = el("div", "actions-left");
  const likeBtn = el("button", "action-btn like-btn");
  likeBtn.innerHTML = `❤️ <span class="like-count">${p.likes || 0}</span>`;
  const commentBtn = el("button", "action-btn"); commentBtn.textContent = "💬";
  left.appendChild(likeBtn); left.appendChild(commentBtn);

  const shareBtn = el("button", "action-btn"); shareBtn.textContent = "🔗";
  actions.appendChild(left); actions.appendChild(shareBtn);

  node.appendChild(top); node.appendChild(body); node.appendChild(actions);

  // animate in
  requestAnimationFrame(() => node.classList.add("visible"));

  // like behavior (optimistic)
  likeBtn.addEventListener("click", async (ev) => {
    // floating heart
    const r = ev.currentTarget.getBoundingClientRect();
    spawnHeart(r.left + r.width/2, r.top);
    // optimistic increment
    const span = likeBtn.querySelector(".like-count");
    const cur = parseInt(span.textContent || "0", 10);
    span.textContent = cur + 1;
    likeBtn.classList.add("liked");
    // persist: try RPC then fallback
    try {
      const { error } = await supabase.rpc("increment_trend_likes", { trend_id: p.id }).catch(()=>({ error: null }));
      if (error) throw error;
    } catch (e) {
      // fallback: update
      await supabase.from("trends").update({ likes: cur + 1 }).eq("id", p.id);
    }
  });

  return node;
}

// floating heart
function spawnHeart(x, y) {
  const h = el("div", "heart-float");
  h.textContent = "💜";
  h.style.left = `${x}px`;
  h.style.top = `${y}px`;
  document.body.appendChild(h);
  setTimeout(()=> h.remove(), 1100);
}

// fetch initial page
async function fetchPage() {
  if (loadingMore || reachedEnd) return;
  loadingMore = true;
  page++;
  if (page === 1) { feedEl.innerHTML = ''; initialLoading?.remove(); }

  const start = (page - 1) * PAGE_SIZE;
  const { data, error } = await supabase
    .from("trends")
    .select("*")
    .order("created_at", { ascending: false })
    .range(start, start + PAGE_SIZE - 1);

  if (error) {
    console.error("load page error", error);
    showToast("Could not load feed");
    loadingMore = false;
    return;
  }
  if (!data || data.length === 0) {
    reachedEnd = true;
    if (page === 1) feedEl.innerHTML = `<div class="loading"><div class="loading-text">No trends yet — be the first ✨</div></div>`;
    loadingMore = false;
    return;
  }

  // render posts with slight stagger
  for (let i = 0; i < data.length; i++) {
    const node = createPostNode(data[i]);
    node.style.transitionDelay = `${i * 50}ms`;
    feedEl.appendChild(node);
  }

  loadingMore = false;
}

// infinite scroll
window.addEventListener("scroll", () => {
  if (loadingMore || reachedEnd) return;
  const nearBottom = window.innerHeight + window.scrollY > document.body.offsetHeight - 600;
  if (nearBottom) fetchPage();
});

// initial stories fetch (use trends owners)
async function loadStoriesFromTrends() {
  const { data, error } = await supabase
    .from("trends")
    .select("username, avatar, user_id")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.warn("stories load error", error);
    // fallback to defaults
    renderStoriesFallback();
    return;
  }

  const seen = new Set();
  const list = [];
  for (const r of data) {
    if (!r.username) continue;
    if (seen.has(r.username)) continue;
    seen.add(r.username);
    list.push({ username: r.username, avatar: r.avatar, user_id: r.user_id });
    if (list.length >= 12) break;
  }
  renderStories(list);
}
function renderStoriesFallback(){
  const demo = ["Nova","Jean","Mia","Sam","Ari"].map((u,i)=>({username:u, avatar:`https://i.pravatar.cc/100?img=${10+i}`}));
  renderStories(demo);
}

// realtime subscription: if new row inserted or updated, refresh top or update like count
function subscribeRealtime() {
  try {
    supabase
      .channel('public:trends')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trends' }, (payload) => {
        const type = payload.eventType || payload.event;
        if (type === 'INSERT') {
          const row = payload.new || payload.record;
          // prepend new post
          const node = createPostNode(row);
          feedEl.prepend(node);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (type === 'UPDATE') {
          const row = payload.new || payload.record;
          // update like count if present
          const card = feedEl.querySelector(`.post-card[data-id="${row.id}"]`);
          if (card) {
            const span = card.querySelector(".like-count");
            if (span) span.textContent = row.likes ?? span.textContent;
          } else {
            // not in DOM — optionally fetch
            fetchPage();
          }
        } else if (type === 'DELETE') {
          const row = payload.old || payload.record;
          const card = feedEl.querySelector(`.post-card[data-id="${row.id}"]`);
          if (card) card.remove();
        }
      })
      .subscribe()
      .then(() => console.log("Realtime subscribed"))
      .catch(e => console.warn("subscribe error", e));
  } catch (err) {
    console.warn("realtime error", err);
  }
}

// go to post.html for create
fab.addEventListener("click", () => window.location.href = "post.html");

// initial load
(async function init(){
  // show local avatar quickly
  meAvatar.src = currentAvatar;

  // load stories & first page
  await loadStoriesFromTrends();
  await fetchPage();
  subscribeRealtime();
})();

/* CSS animation helper */
const style = document.createElement('style');
style.textContent = `
@keyframes slowspin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
`;
document.head.appendChild(style);
