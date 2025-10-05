import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
const supabase = createClient("https://kpdgmbjdaynplyjacuxd.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGdtYmpkYXlucGx5amFjdXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA3MjMsImV4cCI6MjA3NDczNjcyM30.ZJM2v_5VES_AlHAAV4lHaIID7v3IBEbFUgFEcs4yOYQ");

const captionInput = document.getElementById("captionInput");
const youtubeInput = document.getElementById("youtubeInput");
const imagePrompt = document.getElementById("imagePrompt");
const generateImageBtn = document.getElementById("generateImageBtn");
const recordVideoBtn = document.getElementById("recordVideoBtn");
const postTrendBtn = document.getElementById("postTrendBtn");
const preview = document.getElementById("preview");
const toast = document.getElementById("toast");

let { data: userData } = await supabase.auth.getUser();
let currentUser = userData?.user;
let generatedImage = null;
let recordedVideoBlob = null;

function showToast(msg, color = "#ff3fd8") {
  toast.innerText = msg;
  toast.style.background = color;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 3000);
}

generateImageBtn.onclick = async () => {
  const prompt = imagePrompt.value.trim();
  if (!prompt) return showToast("Enter an image idea!");
  generateImageBtn.innerText = "Generating...";
  try {
    const resp = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const { imageUrl } = await resp.json();
    generatedImage = imageUrl;
    preview.innerHTML = `<img src="${generatedImage}">`;
    showToast("Image ready!");
  } catch (err) {
    showToast("Failed: " + err.message, "#dc2626");
  }
  generateImageBtn.innerText = "🎨 Generate Image";
};

recordVideoBtn.onclick = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    preview.innerHTML = `<video autoplay muted></video>`;
    const videoEl = preview.querySelector("video");
    videoEl.srcObject = stream;

    const recorder = new MediaRecorder(stream);
    let chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.start();
    setTimeout(() => recorder.stop(), 5000);
    recorder.onstop = () => {
      recordedVideoBlob = new Blob(chunks, { type: "video/webm" });
      videoEl.srcObject = null;
      videoEl.src = URL.createObjectURL(recordedVideoBlob);
      videoEl.controls = true;
    };
  } catch {
    showToast("Allow camera/mic access!", "#dc2626");
  }
};

postTrendBtn.onclick = async () => {
  if (!currentUser) return showToast("Please sign in first.");

  const caption = captionInput.value.trim();
  const youtubeLink = youtubeInput.value.trim();
  let url = null, video_url = null, type = "text";

  if (generatedImage) {
    const blob = await (await fetch(generatedImage)).blob();
    const filePath = `image-${Date.now()}.png`;
    const { error } = await supabase.storage.from("videos").upload(filePath, blob, { upsert: true });
    if (error) return showToast(error.message, "#dc2626");
    url = supabase.storage.from("videos").getPublicUrl(filePath).data.publicUrl;
    type = "image";
  }

  if (recordedVideoBlob) {
    const filePath = `video-${Date.now()}.webm`;
    const { error } = await supabase.storage.from("videos").upload(filePath, recordedVideoBlob, { upsert: true });
    if (error) return showToast(error.message, "#dc2626");
    video_url = supabase.storage.from("videos").getPublicUrl(filePath).data.publicUrl;
    type = "video";
  }

  if (youtubeLink) {
    type = "youtube";
    video_url = youtubeLink;
  }

  const { error } = await supabase.from("trends").insert([{
    user_id: currentUser.id,
    caption,
    url,
    video_url,
    type,
    username: currentUser.email.split("@")[0],
    avatar: currentUser.user_metadata?.avatar_url || "https://placehold.co/64x64",
    likes: 0,
  }]);

  if (error) return showToast(error.message, "#dc2626");
  showToast("Trend posted!");
  setTimeout(() => (window.location.href = "feed.html"), 2000);
};
