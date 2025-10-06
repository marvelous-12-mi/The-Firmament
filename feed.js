import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://kpdgmbjdaynplyjacuxd.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGdtYmpkYXlucGx5amFjdXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA3MjMsImV4cCI6MjA3NDczNjcyM30.ZJM2v_5VES_AlHAAV4lHaIID7v3IBEbFUgFEcs4yOYQ";
const supabase = createClient(supabaseUrl, supabaseKey);

const feed = document.getElementById("feed");
const toast = document.getElementById("toast");
const changeAvatarBtn = document.getElementById("changeAvatarBtn");
const avatarInput = document.getElementById("avatarInput");
const profileAvatar = document.getElementById("profileAvatar");
const userAvatar = document.getElementById("userAvatar");
const usernameDisplay = document.getElementById("usernameDisplay");

// Toast notification
function showToast(message, color = "#8a00ff") {
  toast.innerText = message;
  toast.style.background = color;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 3000);
}

// Load current user
const { data: userData, error: userError } = await supabase.auth.getUser();
const user = userData?.user;

if (userError || !user) {
  window.location.href = "index.html";
}

usernameDisplay.textContent = user.email.split("@")[0];
profileAvatar.src = user.user_metadata?.avatar_url || "https://placehold.co/100x100";
userAvatar.src = profileAvatar.src;

// Handle avatar upload
changeAvatarBtn.onclick = () => avatarInput.click();

avatarInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${user.id}/${fileName}`;

  // Ensure bucket exists: "avatars"
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    console.error(uploadError);
    return showToast("Upload failed 😢 (check Supabase bucket permissions)", "#e11d48");
  }

  // Get public URL
  const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(filePath);
  const publicUrl = publicData.publicUrl;

  // Update user metadata
  const { error: updateError } = await supabase.auth.updateUser({
    data: { avatar_url: publicUrl },
  });

  if (updateError) {
    console.error(updateError);
    return showToast("Error saving avatar", "#e11d48");
  }

  profileAvatar.src = publicUrl;
  userAvatar.src = publicUrl;
  showToast("✅ Avatar updated successfully!");
});

// Load feed posts
async function loadFeed() {
  const { data, error } = await supabase
    .from("trends")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return showToast("Failed to load trends", "#e11d48");
  }

  if (!data.length) {
    feed.innerHTML = `<p class="w3-center w3-text-grey">No trends yet. Create your first one!</p>`;
    return;
  }

  feed.innerHTML = data
    .map(
      (t) => `
      <div class="post-card">
        <div class="post-header">
          <img src="${t.avatar || "https://placehold.co/40x40"}" alt="${t.username}" />
          <h4>${t.username}</h4>
        </div>
        <div class="post-media">
          ${
            t.type === "image"
              ? `<img src="${t.url}" alt="Trend image">`
              : t.type === "video"
              ? `<video controls src="${t.video_url}"></video>`
              : ""
          }
        </div>
        <div class="post-caption">${t.caption || ""}</div>
        <div class="post-footer">
          <button><i class="fa fa-heart"></i> ${t.likes || 0}</button>
          <span>${new Date(t.created_at).toLocaleString()}</span>
        </div>
      </div>`
    )
    .join("");
}

loadFeed();
