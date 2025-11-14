
import { supabase } from "./supabase.js";
import { requireAuthOrRedirect, getMyProfile, uploadImage, fmtTime, signOut } from "./app.js";

const feedEl = document.getElementById("feed");
const publishBtn = document.getElementById("publish");
const contentEl = document.getElementById("post-content");
const imageEl = document.getElementById("post-image");
const statusEl = document.getElementById("compose-status");
document.getElementById("logout").addEventListener("click", signOut);

await requireAuthOrRedirect();
const me = await getMyProfile();

publishBtn.addEventListener("click", async () => {
  try {
    publishBtn.disabled = true;
    statusEl.textContent = "Posting...";
    let image_url = null;
    const file = imageEl.files?.[0];
    if (file) image_url = await uploadImage(file, "posts");
    const { error } = await supabase.from("posts").insert({
      author_id: me.id,
      content: contentEl.value.trim(),
      image_url,
    });
    if (error) throw error;
    contentEl.value = "";
    imageEl.value = "";
    statusEl.textContent = "Posted!";
    setTimeout(() => (statusEl.textContent = ""), 1000);
  } catch (e) {
    statusEl.textContent = "Error: " + e.message;
  } finally {
    publishBtn.disabled = false;
  }
});

async function renderFeed() {
  const { data, error } = await supabase
    .from("posts")
    .select("id, author_id, content, image_url, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) { feedEl.innerHTML = `<p class="meta">Error: ${error.message}</p>`; return; }

  const authorIds = [...new Set(data.map(p => p.author_id))];
  const { data: authors } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", authorIds);

  const byId = Object.fromEntries(authors.map(a => [a.id, a]));
  feedEl.innerHTML = data.map(p => postCard(p, byId[p.author_id])).join("");
  attachPostActions();
}

function postCard(p, author) {
  const avatar = author?.avatar_url ? `<img src="${author.avatar_url}" class="avatar">` : `<div class="avatar"></div>`;
  return `
    <article class="card post" data-post="${p.id}">
      <div class="row">
        ${avatar}
        <div>
          <strong>${author?.display_name ?? author?.username ?? "Unknown"}</strong>
          <div class="meta">@${author?.username ?? "unknown"} • ${fmtTime(p.created_at)}</div>
        </div>
      </div>
      <div>${escapeHTML(p.content)}</div>
      ${p.image_url ? `<img src="${p.image_url}" alt="post image">` : ""}
      <div class="actions">
        <button class="btn secondary like-btn">Like</button>
        <button class="btn secondary comment-toggle">Comment</button>
      </div>
      <div class="hidden comment-box">
        <textarea rows="2" placeholder="Write a comment..."></textarea>
        <button class="btn comment-send">Send</button>
      </div>
      <div class="meta" data-likes></div>
      <div data-comments></div>
    </article>
  `;
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function attachPostActions() {
  const posts = [...document.querySelectorAll("[data-post]")];
  for (const el of posts) {
    const postId = Number(el.dataset.post);

    // Likes count
    updateLikes(el, postId);

    el.querySelector(".like-btn").addEventListener("click", async () => {
      const { data } = await supabase
        .from("post_likes")
        .select("*")
        .eq("post_id", postId)
        .eq("user_id", me.id)
        .maybeSingle();

      if (data) {
        await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", me.id);
      } else {
        await supabase.from("post_likes").insert({ post_id: postId, user_id: me.id });
        // Optional: notify author
        const { data: post } = await supabase.from("posts").select("author_id").eq("id", postId).single();
        if (post && post.author_id !== me.id) {
          await supabase.from("notifications").insert({
            user_id: post.author_id,
            type: "like",
            data: { post_id: postId, by: me.username },
          });
        }
      }
      updateLikes(el, postId);
    });

    // Comments
    const toggle = el.querySelector(".comment-toggle");
    const box = el.querySelector(".comment-box");
    const send = el.querySelector(".comment-send");
    const textarea = el.querySelector("textarea");
    const commentsEl = el.querySelector("[data-comments]");

    toggle.addEventListener("click", () => box.classList.toggle("hidden"));
    send.addEventListener("click", async () => {
      const content = textarea.value.trim();
      if (!content) return;
      await supabase.from("comments").insert({ post_id: postId, author_id: me.id, content });
      textarea.value = "";
      // Optional: notify author
      const { data: post } = await supabase.from("posts").select("author_id").eq("id", postId).single();
      if (post && post.author_id !== me.id) {
        await supabase.from("notifications").insert({
          user_id: post.author_id,
          type: "comment",
          data: { post_id: postId, by: me.username },
        });
      }
      renderComments(commentsEl, postId);
    });

    renderComments(commentsEl, postId);
  }
}

async function updateLikes(el, postId) {
  const { count } = await supabase.from("post_likes").select("*", { count: "exact", head: true }).eq("post_id", postId);
  const likesEl = el.querySelector("[data-likes]");
  likesEl.textContent = `${count ?? 0} likes`;
}

async function renderComments(container, postId) {
  const { data, error } = await supabase
    .from("comments")
    .select("id, author_id, content, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) { container.innerHTML = `<div class="meta">Error loading comments</div>`; return; }

  const authorIds = [...new Set(data.map(c => c.author_id))];
  const { data: authors } = await supabase.from("profiles").select("id, username, display_name").in("id", authorIds);
  const byId = Object.fromEntries(authors.map(a => [a.id, a]));
  container.innerHTML = data.map(c => `
    <div class="meta"><strong>${byId[c.author_id]?.display_name ?? byId[c.author_id]?.username ?? "User"}</strong>: ${escapeHTML(c.content)} • ${fmtTime(c.created_at)}</div>
  `).join("");
}

// Realtime: new posts
supabase
  .channel("posts-feed")
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, renderFeed)
  .subscribe();

await renderFeed();

