import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
const supabase = createClient("https://kpdgmbjdaynplyjacuxd.supabase.co", "import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
const supabase = createClient("https://kpdgmbjdaynplyjacuxd.supabase.co", "YOUR_SUPABASE_ANON_KEY");

const feedContainer = document.getElementById("feed");
const postBtn = document.getElementById("postBtn");
const headerAvatar = document.getElementById("headerAvatar");
const toast = document.getElementById("toast");

let currentUser = null;

function showToast(msg, color = "#a855f7") {
  toast.innerText = msg;
  toast.style.background = color;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 3000);
}

async function loadUser() {
  const { data } = await supabase.auth.getUser();
  currentUser = data.user;
  if (!currentUser) {
    window.location.href = "index.html";
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();

  if (profile?.avatar) headerAvatar.src = profile.avatar;
  headerAvatar.onclick = () => {
    window.location.href = `profile.html?id=${currentUser.id}`;
  };
}

async function loadFeed() {
  const { data: trends, error } = await supabase
    .from("trends")
    .select("*, profiles(username, avatar)")
    .order("created_at", { ascending: false });

  if (error) return showToast("Error loading feed!", "#dc2626");

  feedContainer.innerHTML = trends
    .map(
      (t) => `
    <article class="trend-card">
      <div class="trend-header">
        <img src="${t.profiles?.avatar || 'https://placehold.co/60x60'}" class="avatar" onclick="window.location.href='profile.html?id=${t.user_id}'"/>
        <div class="meta">
          <h4>${t.profiles?.username || "Unknown User"}</h4>
          <span>${new Date(t.created_at).toLocaleString()}</span>
        </div>
      </div>
      <p>${t.caption || ""}</p>
      ${t.url ? `<img src="${t.url}" class="trend-img" />` : ""}
      ${t.video_url ? `<video src="${t.video_url}" controls></video>` : ""}
    </article>
  `
    )
    .join("");
}

postBtn.onclick = () => {
  window.location.href = "post.html";
};

await loadUser();
await loadFeed();
");

const feedContainer = document.getElementById("feed");
const postBtn = document.getElementById("postBtn");
const headerAvatar = document.getElementById("headerAvatar");
const toast = document.getElementById("toast");

let currentUser = null;

function showToast(msg, color = "#a855f7") {
  toast.innerText = msg;
  toast.style.background = color;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 3000);
}

async function loadUser() {
  const { data } = await supabase.auth.getUser();
  currentUser = data.user;
  if (!currentUser) {
    window.location.href = "index.html";
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();

  if (profile?.avatar) headerAvatar.src = profile.avatar;
  headerAvatar.onclick = () => {
    window.location.href = `profile.html?id=${currentUser.id}`;
  };
}

async function loadFeed() {
  const { data: trends, error } = await supabase
    .from("trends")
    .select("*, profiles(username, avatar)")
    .order("created_at", { ascending: false });

  if (error) return showToast("Error loading feed!", "#dc2626");

  feedContainer.innerHTML = trends
    .map(
      (t) => `
    <article class="trend-card">
      <div class="trend-header">
        <img src="${t.profiles?.avatar || 'https://placehold.co/60x60'}" class="avatar" onclick="window.location.href='profile.html?id=${t.user_id}'"/>
        <div class="meta">
          <h4>${t.profiles?.username || "Unknown User"}</h4>
          <span>${new Date(t.created_at).toLocaleString()}</span>
        </div>
      </div>
      <p>${t.caption || ""}</p>
      ${t.url ? `<img src="${t.url}" class="trend-img" />` : ""}
      ${t.video_url ? `<video src="${t.video_url}" controls></video>` : ""}
    </article>
  `
    )
    .join("");
}

postBtn.onclick = () => {
  window.location.href = "post.html";
};

await loadUser();
await loadFeed();
