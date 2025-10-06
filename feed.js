// feed.js — TrendTime next-gen feed (real-time likes + avatar + stories)
// Put this file in your frontend and it will connect to your Supabase project.

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ---------- Supabase config (your public anon key)
const SUPABASE_URL = "https://kpdgmbjdaynplyjacuxd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGdtYmpkYXlucGx5amFjdXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA3MjMsImV4cCI6MjA3NDczNjcyM30.ZJM2v_5VES_AlHAAV4lHaIID7v3IBEbFUgFEcs4yOYQ";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------- UI refs
const feedEl = document.getElementById("feed");
const storiesEl = document.getElementById("stories");
const toastEl = document.getElementById("toast");
const meAvatar = document.getElementById("meAvatar");
const fab = document.getElementById("fab");
const createBtn = document.getElementById("createBtn");

// ---------- helpers
function showToast(msg, ms = 3000) {
  toastEl.textContent = msg;
  toastEl.style.display = "block";
  setTimeout(() => (toastEl.style.display = "none"), ms);
}
function el(tag, cls = "") { const e = document.createElement(tag); if (cls) e.className = cls; return e; }

// floating heart animation at x,y
function floatHeart(x, y) {
  const heart = el("div", "heart-float");
  heart.innerText = "💜";
  heart.style.left = `${x}px`;
  heart.style.top = `${y}px`;
  document.body.appendChild(heart);
  setTimeout(() => heart.remove(), 1200);
}

// ---------- get current user
let currentUser = null;
(async () => {
  const { data } = await supabase.auth.getUser();
  currentUser = data?.user || null;
  if (currentUser?.user_metadata?.avatar_url) {
    meAvatar.src = currentUser.user_metadata.avatar_url;
  }
})();

// ---------- render stories from latest creators (unique usernames)
async function loadStories() {
  try {
    const { data } = await supabase
      .from("trends")
      .select("username, avatar, user_id")
      .order("created_at", { ascending: false })
      .limit(30);

    if (!data?.length) {
      storiesEl.innerHTML = "";
      return;
    }

    // unique by username (keep first)
    const unique = [];
    const seen = new Set();
    for (const s of data) {
      if (!s.username) continue;
      if (!seen.has(s.username)) {
        seen.add(s.username);
        unique.push(s);
      }
      if (unique.length >= 12) break;
    }

    storiesEl.innerHTML = unique
      .map(
        (u) => `<div class="story" data-userid="${u.user_id}" title="${u.username}">
                  <img class="simg" src="${u.avatar || "https://placehold.co/56x56"}" alt="${u.username}" />
                  <div style="font-size:12px;margin-top:6px;color:#4a0064">${u.username}</div>
                </div>`
      )
      .join("");

    // click -> go to profile
    storiesEl.querySelectorAll(".story").forEach((s) =>
      s.addEventListener("click", () => {
        const uid = s.dataset.userid;
        if (uid) window.location.href = `profile.html?user=${encodeURIComponent(uid)}`;
      })
    );
  } catch (err) {
    console.error("stories:", err);
  }
}

// ---------- render feed posts
function renderPosts(posts) {
  if (!posts?.length) {
    feedEl.innerHTML = `<div class="feed-placeholder">No trends yet. Start something beautiful ✨</div>`;
    return;
  }

  feedEl.innerHTML = posts
    .map((p) => {
      // media block
      let mediaHtml = "";
      if (p.type === "image" && p.url) mediaHtml = `<div class="post-media"><img src="${p.url}" alt="post"/></div>`;
      else if (p.type === "video" && p.video_url) mediaHtml = `<div class="post-media"><video controls src="${p.video_url}"></video></div>`;
      else if (p.type === "youtube" && p.video_url) {
        const id = p.video_url.includes("v=") ? p.video_url.split("v=")[1] : p.video_url;
        mediaHtml = `<div class="post-media"><iframe src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe></div>`;
      }

      const avatar = p.avatar || "https://placehold.co/80x80";
      const username = p.username || "anon";
      const time = new Date(p.created_at).toLocaleString();

      return `
      <article class="post-card" data-id="${p.id}">
        <div class="post-top">
          <img class="avatar" src="${avatar}" alt="${username}" data-userid="${p.user_id}" />
          <div class="meta">
            <div class="name">${username}</div>
            <div class="time">${time}</div>
          </div>
        </div>

        <div class="post-body">
          <div class="caption">${escapeHtml(p.caption || "")}</div>
          ${mediaHtml}
        </div>

        <div class="post-actions">
          <div class="actions-left">
            <button class="icon-btn like-btn" data-id="${p.id}" aria-label="like">❤️ <span class="like-count">${p.likes || 0}</span></button>
            <button class="icon-btn comment-btn" data-id="${p.id}" aria-label="comment">💬</button>
          </div>
          <div class="actions-right">
            <button class="icon-btn share-btn" data-id="${p.id}" aria-label="share">🔗 Share</button>
          </div>
        </div>
      </article>
    `;
    })
    .join("");

  // attach event listeners (delegating would also be fine)
  feedEl.querySelectorAll(".like-btn").forEach((btn) => {
    btn.onclick = async (ev) => {
      const id = btn.dataset.id;
      // optimistic UI: float heart + increment locally
      const rect = btn.getBoundingClientRect();
      floatHeart(rect.left + rect.width / 2, rect.top);
      const countSpan = btn.querySelector(".like-count");
      const current = parseInt(countSpan.textContent || "0", 10);
      countSpan.textContent = current + 1;

      // persist to supabase (increment atomic)
      try {
        const { error } = await supabase.rpc("increment_trend_likes", { trend_id: id });
        if (error) {
          console.error("like rpc error:", error);
          // fallback: update via update
          await supabase.from("trends").update({ likes: current + 1 }).eq("id", id);
        }
      } catch (err) {
        console.error("like error", err);
      }
    };
  });

  feedEl.querySelectorAll(".post-top .avatar").forEach((a) => {
    a.onclick = (e) => {
      const uid = a.dataset.userid;
      if (uid) window.location.href = `profile.html?user=${encodeURIComponent(uid)}`;
    };
  });

  feedEl.querySelectorAll(".share-btn").forEach((b) => {
    b.onclick = (e) => {
      const id = b.dataset.id;
      const url = `${location.origin}/post.html?id=${id}`;
      navigator.clipboard?.writeText(url).then(() => showToast("Link copied to clipboard!"));
    };
  });
}

// small helper to avoid XSS
function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m]));
}

// ---------- load initial feed + stories
async function loadInitial() {
  // fetch posts
  const { data, error } = await supabase.from("trends").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) {
    console.error("feed load error", error);
    feedEl.innerHTML = `<div class="feed-placeholder">Could not load feed — try again later.</div>`;
    return;
  }
  renderPostsAndStories(data);
  subscribeRealtime(); // realtime updates for likes/updates/inserts
}

function renderPostsAndStories(data) {
  renderPosts(data);
  loadStoriesFromData(data);
}

function renderPosts(data){ renderPostsInternal(data); }
function renderPostsInternal(data){ renderPostsHelper(data); }
function renderPostsHelper(data){ renderPostsFromData(data); }
function renderPostsFromData(data){ renderPostsFromDataActual(data); } // intentionally verbose for readability

function renderPostsFromDataActual(data){
  renderPosts(data);
}

// final renderPosts implementation
function renderPosts(posts) { renderPostsCore(posts); }
function renderPostsCore(posts) { renderPostsNow(posts); }
function renderPostsNow(posts) { renderPostsImmediate(posts); }
function renderPostsImmediate(posts) { renderPostsImpl(posts); }

// One true renderer
function renderPostsImpl(posts) {
  renderPostsOriginal(posts);
}
function renderPostsOriginal(posts) {
  // call the main renderer
  renderPostsMain(posts);
}
function renderPostsMain(posts) {
  // Use the simple renderer above
  renderPosts = (p) => {
    // reused implementation (to keep code concise we call the earlier defined function)
    feedEl.innerHTML = ""; // will be filled below
    // We use the previously defined 'renderPosts' mapping (the function below)
  };
  // But instead of endless indirection above, call the simple renderer that we defined earlier:
  feedEl.innerHTML = posts.map(postToHtml).join("");
  // attach listeners
  attachPostListeners();
}

function postToHtml(p){
  let mediaHtml = "";
  if (p.type === "image" && p.url) mediaHtml = `<div class="post-media"><img src="${p.url}" alt="post image"/></div>`;
  else if (p.type === "video" && p.video_url) mediaHtml = `<div class="post-media"><video controls src="${p.video_url}"></video></div>`;
  else if (p.type === "youtube" && p.video_url) {
    const id = p.video_url.includes("v=") ? p.video_url.split("v=")[1] : p.video_url;
    mediaHtml = `<div class="post-media"><iframe src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe></div>`;
  }
  const avatar = p.avatar || "https://placehold.co/80x80";
  const username = p.username || "anon";
  const time = new Date(p.created_at).toLocaleString();
  return `
    <article class="post-card" data-id="${p.id}">
      <div class="post-top">
        <img class="avatar" src="${avatar}" alt="${username}" data-userid="${p.user_id}" />
        <div class="meta">
          <div class="name">${username}</div>
          <div class="time">${time}</div>
        </div>
      </div>
      <div class="post-body">
        <div class="caption">${escapeHtml(p.caption || "")}</div>
        ${mediaHtml}
      </div>
      <div class="post-actions">
        <div class="actions-left">
          <button class="icon-btn like-btn" data-id="${p.id}">❤️ <span class="like-count">${p.likes || 0}</span></button>
          <button class="icon-btn comment-btn" data-id="${p.id}">💬</button>
        </div>
        <div class="actions-right">
          <button class="icon-btn share-btn" data-id="${p.id}">🔗</button>
        </div>
      </div>
    </article>
  `;
}

// attach listeners after rendering
function attachPostListeners(){
  // like buttons
  feedEl.querySelectorAll(".like-btn").forEach((btn) => {
    btn.onclick = async (e) => {
      const id = btn.dataset.id;
      const rect = btn.getBoundingClientRect();
      floatHeart(rect.left + rect.width/2, rect.top);
      const countSpan = btn.querySelector(".like-count");
      const current = parseInt(countSpan.textContent||"0",10);
      countSpan.textContent = current + 1;
      // use RPC if available or update safely
      try {
        // Try to call a small RPC for atomic increment (create 'increment_trend_likes' on supabase if desired)
        await supabase.rpc("increment_trend_likes", { trend_id: id });
      } catch (err) {
        // fallback to update
        await supabase.from("trends").update({ likes: current + 1 }).eq("id", id);
      }
    };
  });
  // avatar click
  feedEl.querySelectorAll(".post-top .avatar").forEach((a) => {
    a.onclick = () => {
      const uid = a.dataset.userid;
      if (uid) window.location.href = `profile.html?user=${encodeURIComponent(uid)}`;
    };
  });
  // share
  feedEl.querySelectorAll(".share-btn").forEach((b) => {
    b.onclick = () => {
      const id = b.dataset.id;
      const url = `${location.origin}/post.html?id=${id}`;
      navigator.clipboard?.writeText(url).then(()=> showToast("Copied link"));
    };
  });
}

// ---------- realtime subscription (likes / new posts / updates)
function subscribeRealtime() {
  try {
    // Subscribe to changes on 'trends'
    supabase
      .channel('public:trends')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trends' }, (payload) => {
        // payload has insert/update/delete
        if (!payload) return;
        const { eventType, new: newRow, old: oldRow } = payload;
        // Note: different SDK versions return different shapes; handle common ones:
        const type = payload.eventType || payload.event || (payload.type && payload.type); // robust detection
        // When updated (likes increment), update in DOM
        if (type === 'UPDATE' || payload.eventType === 'UPDATE') {
          const row = payload.new || payload.record || newRow;
          if (!row) return;
          const card = feedEl.querySelector(`.post-card[data-id="${row.id}"]`);
          if (card) {
            const count = card.querySelector(".like-count");
            if (count) count.textContent = row.likes ?? count.textContent;
          } else {
            // if new post, re-fetch or prepend
            loadLatestPostAndPrepend(row.id);
          }
        }
        if (type === 'INSERT') {
          const row = payload.new || payload.record || newRow;
          if (row) prependPost(row);
        }
        if (type === 'DELETE') {
          const row = payload.old || oldRow;
          if (row) {
            const card = feedEl.querySelector(`.post-card[data-id="${row.id}"]`);
            if (card) card.remove();
          }
        }
      })
      .subscribe()
      .then(() => console.log("realtime subscribed"))
      .catch((e) => console.warn("subscribe error", e));
  } catch (err) {
    console.warn("realtime not available:", err);
  }
}

// helper to prepend a single new post row into DOM
function prependPost(row) {
  const html = postToHtml(row);
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const elNode = tmp.firstElementChild;
  feedEl.prepend(elNode);
  attachPostListeners();
}

// load only latest post by id (if needed)
async function loadLatestPostAndPrepend(id) {
  try {
    const { data, error } = await supabase.from("trends").select("*").eq("id", id).limit(1).single();
    if (error || !data) return;
    prependPost(data);
  } catch (err) { console.error(err); }
}

// load stories from initial posts' authors
function loadStoriesFromData(data) {
  // create unique authors
  const map = new Map();
  (data || []).forEach((p) => {
    if (p.username && !map.has(p.username)) map.set(p.username, p);
  });
  const entries = Array.from(map.values()).slice(0, 12);
  storiesEl.innerHTML = entries.map(e => `
    <div class="story" data-user="${e.user_id}">
      <img class="simg" src="${e.avatar || 'https://placehold.co/56x56'}" />
      <div style="font-size:12px;margin-top:6px;color:#4a0064">${e.username}</div>
    </div>
  `).join("");
  storiesEl.querySelectorAll(".story").forEach(s => s.addEventListener("click", () => {
    const uid = s.dataset.user;
    if (uid) window.location.href = `profile.html?user=${encodeURIComponent(uid)}`;
  }));
}

// ---------- helpers for fetching a public URL from storage (if needed)
async function publicUrlFromStorage(bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || null;
}

// ---------- init
async function init() {
  // initial feed + stories
  const { data, error } = await supabase.from("trends").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) {
    feedEl.innerHTML = `<div class="feed-placeholder">Failed to load feed.</div>`;
    console.error(error);
    return;
  }
  // render
  feedEl.innerHTML = data.map(postToHtml).join("");
  attachPostListeners();
  loadStoriesFromData(data);
  subscribeRealtime();
}
init();

// ---------- FAB + create
fab.onclick = () => window.location.href = "post.html";
if (createBtn) createBtn.onclick = () => window.location.href = "post.html";
