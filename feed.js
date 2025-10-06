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

function showToast(msg, color = "#8a00ff") {
  toast.innerText = msg;
  toast.style.background = color;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 3000);
}

// Load user
let { data: userData } = await supabase.auth.getUser();
let user = userData?.user;
if (user) {
  usernameDisplay.textContent = user.email.split("@")[0];
  profileAvatar.src = user.user_metadata?.avatar_url || "https://placehold.co/100x100";
  userAvatar.src = profileAvatar.src;
} else {
  window.location.href = "index.html";
}

// Avatar upload
changeAvatarBtn.onclick = () => avatarInput.click();
avatarInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const filePath = `avatars/${user.id}/${file.name}`;
  const { error } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });

  if (error) return showToast("Upload failed", "#dc2626");

  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
  const newUrl = data.publicUrl;

  await supabase.auth.updateUser({ data: { avatar_url: newUrl } });
  profileAvatar.src = newUrl;
  userAvatar.src = newUrl;
  showToast("Avatar updated!");
});

// Load posts
async function loadFeed() {
  const { data, error } = await supabase
    .from("trends")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return showToast("Error loading trends", "#dc2626");
  if (!data.length) {
    feed.innerHTML = `<p class="w3-center w3-text-grey">No trends yet. Create your first one!</p>`;
    return;
  }

  feed.innerHTML = data
    .map(
      (t) => `
      <div class="post-card">
        <div class="post-header">
          <img src="${t.avatar}" alt="${t.username}" />
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
        <div class="post-caption">${t.caption}</div>
        <div class="post-footer">
          <button><i class="fa fa-heart"></i> ${t.likes}</button>
          <span>${new Date(t.created_at).toLocaleString()}</span>
        </div>
      </div>`
    )
    .join("");
}

loadFeed();
