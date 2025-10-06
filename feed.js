import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://kpdgmbjdaynplyjacuxd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGdtYmpkYXlucGx5amFjdXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA3MjMsImV4cCI6MjA3NDczNjcyM30.ZJM2v_5VES_AlHAAV4lHaIID7v3IBEbFUgFEcs4yOYQ";
const supabase = createClient(supabaseUrl, supabaseKey);

// 🔐 Get current user
const { data: { user } } = await supabase.auth.getUser();
if (!user) window.location.href = "index.html";

// 🌈 Elements
const trendsList = document.getElementById("trendsList");
const changeAvatarBtn = document.getElementById("changeAvatarBtn");
const avatarInput = document.getElementById("avatarInput");
const toast = document.getElementById("toast");

// 🚀 Fetch all trends
async function loadTrends() {
  const { data, error } = await supabase.from("trends").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error(error);
    trendsList.innerHTML = `<p>⚠️ Error loading trends.</p>`;
    return;
  }

  if (!data.length) {
    trendsList.innerHTML = `<p>No trends yet. Be the first to post! 🚀</p>`;
    return;
  }

  trendsList.innerHTML = data.map(trend => `
    <div class="trend-card">
      <div class="trend-header">
        <img src="${trend.avatar || 'https://placehold.co/50x50'}" alt="avatar">
        <div>
          <h4>${trend.username}</h4>
          <span>${new Date(trend.created_at).toLocaleString()}</span>
        </div>
      </div>
      <div class="trend-body">
        <p>${trend.caption || ""}</p>
        ${trend.url ? `<img src="${trend.url}" alt="trend image">` : ""}
        ${trend.video_url ? `<video src="${trend.video_url}" controls></video>` : ""}
      </div>
    </div>
  `).join("");
}

loadTrends();

// 🧁 Toast Helper
function showToast(msg) {
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => toast.style.display = "none", 3000);
}

// 🧑‍🎤 Avatar Change
changeAvatarBtn.addEventListener("click", () => avatarInput.click());

avatarInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const path = `avatars/${user.id}-${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
  if (uploadError) return showToast("❌ Avatar upload failed!");

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const newUrl = data.publicUrl;

  // Update user metadata
  const { error: updateError } = await supabase.auth.updateUser({
    data: { avatar_url: newUrl }
  });

  if (updateError) {
    console.error(updateError);
    return showToast("⚠️ Failed to update avatar.");
  }

  showToast("✅ Avatar updated!");
});

// 🚪 Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "index.html";
});

// ➕ New Post
document.getElementById("createPostBtn").addEventListener("click", () => {
  window.location.href = "post.html";
});
