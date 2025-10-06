import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://kpdgmbjdaynplyjacuxd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGdtYmpkYXlucGx5amFjdXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA3MjMsImV4cCI6MjA3NDczNjcyM30.ZJM2v_5VES_AlHAAV4lHaIID7v3IBEbFUgFEcs4yOYQ";
const supabase = createClient(supabaseUrl, supabaseKey);

const { data: { user } } = await supabase.auth.getUser();
if (!user) window.location.href = "index.html";

const trendsList = document.getElementById("trendsList");
const toast = document.getElementById("toast");
const avatarInput = document.getElementById("avatarInput");
const changeAvatarBtn = document.getElementById("changeAvatarBtn");

function showToast(msg) {
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 3000);
}

// 🔄 Load trends
async function loadTrends() {
  const { data, error } = await supabase.from("trends").select("*").order("created_at", { ascending: false });
  if (error) return (trendsList.innerHTML = `<p>⚠️ Failed to load trends.</p>`);

  if (!data.length) {
    trendsList.innerHTML = `<p>No posts yet. Be the first to trend! 🚀</p>`;
    return;
  }

  trendsList.innerHTML = data.map(post => `
    <div class="trend-card">
      <div class="trend-header">
        <img src="${post.avatar || 'https://placehold.co/50x50'}" alt="Avatar">
        <div class="info">
          <h4>${post.username}</h4>
          <span>${new Date(post.created_at).toLocaleString()}</span>
        </div>
      </div>
      <div class="trend-body">
        <p>${post.caption || ""}</p>
        ${post.url ? `<img src="${post.url}" alt="Post Image">` : ""}
        ${post.video_url ? `<video src="${post.video_url}" controls></video>` : ""}
      </div>
    </div>
  `).join("");
}
loadTrends();

// 🧑‍🎤 Change Avatar
changeAvatarBtn.addEventListener("click", () => avatarInput.click());

avatarInput.addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  const path = `avatars/${user.id}-${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
  if (uploadError) return showToast("❌ Avatar upload failed");

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = data.publicUrl;

  const { error: updateError } = await supabase.auth.updateUser({
    data: { avatar_url: avatarUrl },
  });
  if (updateError) return showToast("⚠️ Couldn't update avatar");

  showToast("✅ Avatar updated!");
});

// ➕ Post button
document.getElementById("createPostBtn").onclick = () => window.location.href = "post.html";
// 🚪 Logout
document.getElementById("logoutBtn").onclick = async () => {
  await supabase.auth.signOut();
  window.location.href = "index.html";
};
