import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// --- Supabase Config ---
const supabase = createClient(
  "https://kpdgmbjdaynplyjacuxd.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGdtYmpkYXlucGx5amFjdXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA3MjMsImV4cCI6MjA3NDczNjcyM30.ZJM2v_5VES_AlHAAV4lHaIID7v3IBEbFUgFEcs4yOYQ"
);

const feedContainer = document.getElementById("feed");
const toast = document.getElementById("toast");
const logoutBtn = document.getElementById("logoutBtn");
const profileEmail = document.getElementById("profileEmail");
const profileAvatar = document.getElementById("profileAvatar");

// --- Toast Helper ---
function showToast(msg, color = "#0078d7") {
  toast.textContent = msg;
  toast.style.background = color;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 3000);
}

// --- Load Current User ---
async function loadUser() {
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  if (user) {
    profileEmail.textContent = user.email;
    profileAvatar.src = user.user_metadata?.avatar_url || "https://placehold.co/100x100";
  } else {
    window.location.href = "index.html";
  }
}

// --- Fetch Feed from Supabase ---
async function loadFeed() {
  const { data, error } = await supabase
    .from("trends")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    feedContainer.innerHTML = `<p class='w3-center w3-text-red'>Error loading feed: ${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    feedContainer.innerHTML = `<p class='w3-center'>No trends yet. Be the first to post!</p>`;
    return;
  }

  feedContainer.innerHTML = data
    .map(
      (trend) => `
      <div class="w3-container w3-card w3-white w3-round w3-margin trend-card">
        <br>
        <img src="${trend.avatar || "https://placehold.co/60x60"}" alt="Avatar"
             class="w3-left w3-circle w3-margin-right" style="width:60px">
        <span class="w3-right w3-opacity">${new Date(trend.created_at).toLocaleString()}</span>
        <h4 class="trend-username">${trend.username}</h4><br>
        <hr class="w3-clear">
        <p>${trend.caption || ""}</p>
        <div class="trend-content">
          ${
            trend.type === "image"
              ? `<img src="${trend.url}" alt="Trend Image">`
              : trend.type === "video"
              ? `<video src="${trend.video_url}" controls></video>`
              : trend.type === "youtube"
              ? `<iframe width="100%" height="315" src="${trend.video_url.replace("watch?v=", "embed/")}" frameborder="0" allowfullscreen></iframe>`
              : ""
          }
        </div>
        <button class="w3-button w3-theme-d1 w3-margin-bottom like-btn" data-id="${trend.id}">
          <i class="fa fa-thumbs-up"></i> Like (${trend.likes})
        </button>
      </div>`
    )
    .join("");

  document.querySelectorAll(".like-btn").forEach((btn) => {
    btn.addEventListener("click", () => handleLike(btn.dataset.id));
  });
}

// --- Like Handler ---
async function handleLike(id) {
  const { data: trend } = await supabase.from("trends").select("likes").eq("id", id).single();
  const newLikes = (trend?.likes || 0) + 1;

  const { error } = await supabase.from("trends").update({ likes: newLikes }).eq("id", id);
  if (error) return showToast("Failed to like trend", "red");

  showToast("Liked!");
  loadFeed();
}

// --- Logout ---
logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "index.html";
});

// --- Init ---
loadUser();
loadFeed();
