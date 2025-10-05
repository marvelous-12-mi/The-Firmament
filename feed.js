import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
const supabase = createClient("https://kpdgmbjdaynplyjacuxd.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGdtYmpkYXlucGx5amFjdXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA3MjMsImV4cCI6MjA3NDczNjcyM30.ZJM2v_5VES_AlHAAV4lHaIID7v3IBEbFUgFEcs4yOYQ");

const feed = document.getElementById("feed");
const postBtn = document.getElementById("postBtn");
const toast = document.getElementById("toast");

postBtn.onclick = () => (window.location.href = "post.html");

function showToast(msg) {
  toast.innerText = msg;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 3000);
}

async function loadFeed() {
  const { data, error } = await supabase.from("trends").select("*").order("created_at", { ascending: false });
  if (error) return showToast(error.message);
  feed.innerHTML = "";

  data.forEach(trend => {
    const card = document.createElement("div");
    card.className = "trend-card";
    card.innerHTML = `
      <div class="trend-header">
        <img src="${trend.avatar || "https://placehold.co/40x40"}">
        <span>@${trend.username || "anon"}</span>
      </div>
      <div class="trend-text">${trend.caption || ""}</div>
    `;

    if (trend.type === "image" && trend.url)
      card.innerHTML += `<div class="trend-media"><img src="${trend.url}" loading="lazy"></div>`;
    else if (trend.type === "video" && trend.video_url)
      card.innerHTML += `<div class="trend-media"><video src="${trend.video_url}" controls></video>`;
    else if (trend.type === "youtube" && trend.video_url)
      card.innerHTML += `<div class="trend-media"><iframe src="${trend.video_url.replace("watch?v=", "embed/")}" allowfullscreen></iframe></div>`;

    const likeBtn = document.createElement("button");
    likeBtn.className = "btn like";
    likeBtn.innerText = `❤️ ${trend.likes || 0}`;
    likeBtn.onclick = async () => {
      const { error } = await supabase.from("trends").update({ likes: trend.likes + 1 }).eq("id", trend.id);
      if (error) return showToast(error.message);
      loadFeed();
    };

    card.appendChild(likeBtn);
    feed.appendChild(card);
  });
}

loadFeed();
