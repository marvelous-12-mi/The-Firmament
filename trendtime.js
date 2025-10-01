// === Import Supabase ===
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Replace with your Supabase project credentials
const supabaseUrl = "https://kpdgmbjdaynplyjacuxd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGdtYmpkYXlucGx5amFjdXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA3MjMsImV4cCI6MjA3NDczNjcyM30.ZJM2v_5VES_AlHAAV4lHaIID7v3IBEbFUgFEcs4yOYQ";
const supabase = createClient(supabaseUrl, supabaseKey);

// === Elements ===
const menuBtn = document.getElementById("menuBtn");
const sidePanel = document.getElementById("sidePanel");
const authBtn = document.getElementById("authBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userEmail = document.getElementById("userEmail");
const feed = document.querySelector(".feed");
const postBtn = document.getElementById("postBtn");
const postUrl = document.getElementById("postUrl");
const postCaption = document.getElementById("postCaption");
const postSubmit = document.getElementById("postSubmit");

// === Menu Panel Toggle ===
menuBtn.addEventListener("click", () => {
  sidePanel.classList.toggle("active");
});
document.addEventListener("click", (e) => {
  if (
    sidePanel.classList.contains("active") &&
    !sidePanel.contains(e.target) &&
    e.target !== menuBtn
  ) {
    sidePanel.classList.remove("active");
  }
});

// === Auth ===
authBtn.addEventListener("click", async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
  });
  if (error) console.error("Login error:", error.message);
});

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  updateUserUI(null);
});

// Update UI based on user session
async function updateUserUI(session) {
  if (session?.user) {
    userEmail.textContent = session.user.email;
    authBtn.style.display = "none";
    logoutBtn.style.display = "block";
  } else {
    userEmail.textContent = "Not logged in";
    authBtn.style.display = "block";
    logoutBtn.style.display = "none";
  }
}

supabase.auth.onAuthStateChange((_event, session) => {
  updateUserUI(session);
});

// === Feed Loader ===
async function loadFeed() {
  const { data, error } = await supabase
    .from("trends")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Feed load error:", error.message);
    return;
  }

  feed.innerHTML = "";
  data.forEach((post) => {
    const card = document.createElement("div");
    card.className = "trend-card";

    let media;
    if (post.type === "youtube") {
      media = document.createElement("iframe");
      media.src = post.url;
      media.setAttribute("allowfullscreen", true);
    } else {
      media = document.createElement("video");
      media.src = post.url;
      media.autoplay = true;
      media.loop = true;
      media.muted = true;
    }
    media.className = "trend-media";
    card.appendChild(media);

    const info = document.createElement("div");
    info.className = "trend-info";
    info.innerHTML = `<h2>@${post.username || "anon"}</h2><p>${post.caption || ""}</p>`;
    card.appendChild(info);

    const actions = document.createElement("div");
    actions.className = "trend-actions";
    actions.innerHTML = `
      <div class="action-btn">❤️</div>
      <div class="action-btn">💬</div>
      <div class="action-btn">🔗</div>
    `;
    card.appendChild(actions);

    feed.appendChild(card);
  });

  initVideoObserver();
}

// === Post Submit ===
postSubmit.addEventListener("click", async () => {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) {
    alert("You must be logged in to post!");
    return;
  }

  const url = postUrl.value.trim();
  const caption = postCaption.value.trim();
  if (!url) {
    alert("Please enter a video or YouTube URL");
    return;
  }

  const type = url.includes("youtube.com") ? "youtube" : "video";

  const { error } = await supabase.from("trends").insert([
    {
      url,
      caption,
      type,
      username: session.user.email.split("@")[0],
    },
  ]);

  if (error) {
    console.error("Post error:", error.message);
  } else {
    postUrl.value = "";
    postCaption.value = "";
    loadFeed();
  }
});

// === Video Auto Play ===
function initVideoObserver() {
  const videos = document.querySelectorAll(".trend-card video");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.play().catch(() => {});
        } else {
          entry.target.pause();
        }
      });
    },
    { threshold: 0.6 }
  );
  videos.forEach((video) => observer.observe(video));
}

// === Initialize ===
handleAuth()
loadFeed();
