
import { supabase } from "./supabase.js";
import { requireAuthOrRedirect, getMyProfile, uploadImage, signOut } from "./app.js";

document.getElementById("logout").addEventListener("click", signOut);
await requireAuthOrRedirect();

let me = await getMyProfile();
renderProfile();

async function renderProfile() {
  document.getElementById("avatar").src = me.avatar_url || "";
  document.getElementById("display_name").textContent = me.display_name || me.username;
  document.getElementById("username").textContent = me.username;
  document.getElementById("bio").textContent = me.bio || "";
  document.getElementById("dn-input").value = me.display_name || "";
  document.getElementById("bio-input").value = me.bio || "";
}

document.getElementById("save-profile").addEventListener("click", async () => {
  const dn = document.getElementById("dn-input").value.trim();
  const bio = document.getElementById("bio-input").value.trim();
  const status = document.getElementById("status");
  status.textContent = "Saving...";
  const { error } = await supabase.from("profiles").update({ display_name: dn, bio }).eq("id", me.id);
  status.textContent = error ? "Error: " + error.message : "Saved.";
  if (!error) me = await getMyProfile(), renderProfile();
});

document.getElementById("save-avatar").addEventListener("click", async () => {
  const file = document.getElementById("avatar-file").files?.[0];
  const status = document.getElementById("status");
  if (!file) return;
  status.textContent = "Uploading...";
  try {
    const url = await uploadImage(file, "avatars");
    const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", me.id);
    if (error) throw error;
    status.textContent = "Avatar updated.";
    me = await getMyProfile(); renderProfile();
  } catch (e) {
    status.textContent = "Error: " + e.message;
  }
});

// Search and follow
document.getElementById("search").addEventListener("input", async (e) => {
  const q = e.target.value.trim();
  const resultsEl = document.getElementById("results");
  if (!q) { resultsEl.innerHTML = ""; return; }
  const { data } = await supabase.from("profiles").select("id, username, display_name, avatar_url").ilike("username", `%${q}%`).limit(10);
  resultsEl.innerHTML = data.map(u => `
    <div class="row card">
      <img src="${u.avatar_url || ""}" class="avatar">
      <div style="flex:1">
        <strong>${u.display_name || u.username}</strong>
        <div class="meta">@${u.username}</div>
      </div>
      ${u.id === me.id ? `<span class="meta">You</span>` : `<button class="btn follow" data-id="${u.id}">Follow</button>`}
    </div>
  `).join("");

  [...resultsEl.querySelectorAll(".follow")].forEach(btn => {
    btn.addEventListener("click", async () => {
      const targetId = btn.dataset.id;
      await supabase.from("follows").insert({ follower_id: me.id, following_id: targetId });
      await supabase.from("notifications").insert({ user_id: targetId, type: "follow", data: { by: me.username } });
      btn.textContent = "Following";
      btn.disabled = true;
    });
  });
});
