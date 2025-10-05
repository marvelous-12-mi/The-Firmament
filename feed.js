import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://kpdgmbjdaynplyjacuxd.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGdtYmpkYXlucGx5amFjdXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA3MjMsImV4cCI6MjA3NDczNjcyM30.ZJM2v_5VES_AlHAAV4lHaIID7v3IBEbFUgFEcs4yOYQ"
);

const feedContainer = document.getElementById("feed");
const toast = document.getElementById("toast");
const logoutBtn = document.getElementById("logoutBtn");
const profileEmail = document.getElementById("profileEmail");
const profileAvatar = document.getElementById("profileAvatar");
const avatarUpload = document.getElementById("avatarUpload");

function showToast(msg, color = "#a100ff") {
  toast.textContent = msg;
  toast.style.background = color;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 3000);
}

async function loadUser() {
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  if (!user) return (window.location.href = "index.html");

  profileEmail.textContent = user.email;
  profileAvatar.src = user.user_metadata?.avatar_url || "https://placehold.co/110x110";
}

// Avatar upload to Supabase Storage
avatarUpload.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return;

  const filePath = `${user.id}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) return showToast("Error uploading avatar", "#ff3fd8");

  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
  const avatarUrl = urlData.publicUrl;

  await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });

  profileAvatar.src = avatarUrl;
  showToast("💜 Avatar updated!");
});

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
    feedContainer.innerHTML = `<p class='w3-center'>No trends yet. Share your first post!</p>`;
    return;
  }

  feedContainer.innerHTML = data
    .map(
      (trend) => `
      <div class="trend-card">
        <div class="w3-row">
          <div class="w3-col s2">
            <img src="${trend.avatar || "https://placehold.co/60x60"}" class="w3-circle" style="width:60px;height:60px">
          </div>
          <div class="w3-col s10">
            <h5 class="trend-username">${trend.username}</h5>
            <p class="w3-opacity-small">${new Date(trend.created_at).toLocaleString()}</p>
          </div>
        </div>
        <p>${trend.caption || ""}</p>
        ${
          trend.type === "image"
            ? `<img src="${trend.url}" alt="Trend Image">`
            : trend.type === "video"
            ? `<video src="${trend.video_url}" controls></video>`
            : trend.type === "youtube"
            ? `<iframe width="100%" height="315" src="${trend.video_url.replace("watch?v=", "embed/")}" frameborder="0" allowfullscreen></iframe>`
            : ""
        }
        <button class="btn like-btn" data-id="${trend.id}">
          <i class="fa fa-heart"></i> Like (${trend.likes})
        </button>
      </div>`
    )
    .join("");

  document.querySelectorAll(".like-btn").forEach((btn) => {
    btn.addEventListener("click", () => handleLike(btn.dataset.id));
  });
}

async function handleLike(id) {
  const { data: trend } = await supabase.from("trends").select("likes").eq("id", id).single();
  const newLikes = (trend?.likes || 0) + 1;
  const { error } = await supabase.from("trends").update({ likes: newLikes }).eq("id", id);

  if (error) return showToast("Failed to like post", "#ff3fd8");

  showToast("❤️ Liked!");
  loadFeed();
}

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "index.html";
});

loadUser();
loadFeed();
