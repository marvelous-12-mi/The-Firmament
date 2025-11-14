
import { supabase } from "./supabase.js";
import { requireAuthOrRedirect, getSession, fmtTime, signOut } from "./app.js";
document.getElementById("logout").addEventListener("click", signOut);

await requireAuthOrRedirect();
const session = await getSession();
const list = document.getElementById("list");

async function load() {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, data, read, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) { list.innerHTML = `<p class="meta">Error: ${error.message}</p>`; return; }

  list.innerHTML = data.map(n => `
    <div class="card">
      <div class="meta">${fmtTime(n.created_at)} • ${n.read ? "read" : "new"}</div>
      <div>${renderText(n)}</div>
      ${n.read ? "" : `<button class="btn secondary mark" data-id="${n.id}">Mark as read</button>`}
    </div>
  `).join("");

  [...document.querySelectorAll(".mark")].forEach(b => {
    b.addEventListener("click", async () => {
      await supabase.from("notifications").update({ read: true }).eq("id", Number(b.dataset.id));
      load();
    });
  });
}

function renderText(n) {
  if (n.type === "like") return `@${n.data?.by} liked your post #${n.data?.post_id}`;
  if (n.type === "comment") return `@${n.data?.by} commented on your post #${n.data?.post_id}`;
  if (n.type === "follow") return `@${n.data?.by} followed you`;
  return "Notification";
}

supabase
  .channel("notifs")
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${session.user.id}` }, load)
  .subscribe();

await load();
