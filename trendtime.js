// trentime.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// --- Supabase Config ---
const supabaseUrl = "https://kpdgmbjdaynplyjacuxd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGdtYmpkYXlucGx5amFjdXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA3MjMsImV4cCI6MjA3NDczNjcyM30.ZJM2v_5VES_AlHAAV4lHaIID7v3IBEbFUgFEcs4yOYQ"; // paste your anon key here
const supabase = createClient(supabaseUrl, supabaseKey);

// --- DOM Elements ---
const authBtn = document.getElementById("authBtn");
const headerAvatar = document.getElementById("headerAvatar");
const postBtn = document.getElementById("postBtn");
const authModal = document.getElementById("authModal");
const postModal = document.getElementById("postModal");
const closeAuth = document.getElementById("closeAuth");
const closePost = document.getElementById("closePost");
const signInBtn = document.getElementById("signInBtn");
const signUpBtn = document.getElementById("signUpBtn");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const captionInput = document.getElementById("captionInput");
const youtubeInput = document.getElementById("youtubeInput");
const imagePrompt = document.getElementById("imagePrompt");
const generateImageBtn = document.getElementById("generateImageBtn");
const recordVideoBtn = document.getElementById("recordVideoBtn");
const postTrendBtn = document.getElementById("postTrendBtn");
const preview = document.getElementById("preview");
const feed = document.getElementById("feed");
const toast = document.getElementById("toast");

let currentUser = null;
let generatedImage = null;
let recordedVideoBlob = null;
let mediaRecorder, recordedBlobs = [];

// --- Toast Helper ---
function showToast(msg, color="#111") {
  toast.innerText = msg;
  toast.style.background = color;
  toast.style.display = "block";
  setTimeout(()=>toast.style.display="none", 3000);
}

// --- Modal Toggles ---
authBtn.onclick = ()=>authModal.style.display="flex";
closeAuth.onclick = ()=>authModal.style.display="none";
postBtn.onclick = ()=>postModal.style.display="flex";
closePost.onclick = ()=>postModal.style.display="none";

// --- Auth ---
signUpBtn.onclick = async ()=>{
  const { error } = await supabase.auth.signUp({
    email: emailInput.value,
    password: passwordInput.value
  });
  if(error) return showToast(error.message,"#dc2626");
  showToast("Signed up! Now sign in.", "#16a34a");
};
signInBtn.onclick = async ()=>{
  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailInput.value,
    password: passwordInput.value
  });
  if(error) return showToast(error.message,"#dc2626");
  currentUser = data.user;
  authModal.style.display="none";
  authBtn.style.display="none";
  headerAvatar.src = currentUser.user_metadata?.avatar_url || "https://placehold.co/64x64";
  showToast("Signed in!", "#16a34a");
};

// --- AI Image (Pollinations) ---
generateImageBtn.onclick = ()=>{
  const prompt = imagePrompt.value.trim();
  if(!prompt) return showToast("Enter a prompt","#dc2626");
  generatedImage = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
  preview.innerHTML = `<img src="${generatedImage}" style="width:100%;border-radius:12px;">`;
};

// --- TensorFlow Surprise: Caption Suggestion ---
async function suggestCaption(imageUrl){
  // Placeholder: in real use, load a TF model and run inference
  return "🔥 This trend is about to blow up!";
}

// --- Record Video ---
recordVideoBtn.onclick = async ()=>{
  try {
    const stream = await navigator.mediaDevices.getUserMedia({video:true,audio:true});
    preview.innerHTML = `<video autoplay muted></video>`;
    const videoEl = preview.querySelector("video");
    videoEl.srcObject = stream;
    recordedBlobs=[];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = e=>{ if(e.data.size>0) recordedBlobs.push(e.data); };
    mediaRecorder.start();
    setTimeout(()=>mediaRecorder.stop(),5000);
    mediaRecorder.onstop = ()=>{
      recordedVideoBlob = new Blob(recordedBlobs,{type:"video/webm"});
      videoEl.srcObject=null;
      videoEl.src = URL.createObjectURL(recordedVideoBlob);
      videoEl.controls=true;
    };
  } catch(err){ showToast("Camera/mic access required!","#dc2626"); }
};

// --- Post Trend ---
postTrendBtn.onclick = async ()=>{
  if(!currentUser) return showToast("Sign in first","#dc2626");
  let caption = captionInput.value.trim();
  const youtubeLink = youtubeInput.value.trim();
  let url=null, video_url=null, type="text";

  if(!caption && generatedImage){
    caption = await suggestCaption(generatedImage);
  }

  if(generatedImage){
    const resp = await fetch(generatedImage);
    const blob = await resp.blob();
    const filePath = `image-${Date.now()}.png`;
    const { error } = await supabase.storage.from("videos").upload(filePath, blob, {upsert:true});
    if(error) return showToast(error.message,"#dc2626");
    url = supabase.storage.from("videos").getPublicUrl(filePath).data.publicUrl;
    type="image"; generatedImage=null;
  }

  if(recordedVideoBlob){
    const filePath = `video-${Date.now()}.webm`;
    const { error } = await supabase.storage.from("videos").upload(filePath, recordedVideoBlob, {upsert:true});
    if(error) return showToast(error.message,"#dc2626");
    video_url = supabase.storage.from("videos").getPublicUrl(filePath).data.publicUrl;
    type="video"; recordedVideoBlob=null;
  }

  if(youtubeLink){ type="youtube"; video_url=youtubeLink; }

  const { error } = await supabase.from("trends").insert([{
    user_id: currentUser.id,
    caption: caption||null,
    url,
    video_url,
    type,
    username: currentUser.email.split("@")[0]||"anon",
    avatar: currentUser.user_metadata?.avatar_url||null,
    text: caption||null,
    likes: 0
  }]);
  if(error) return showToast("Insert Error: "+error.message,"#dc2626");
  captionInput.value=""; youtubeInput.value=""; imagePrompt.value=""; preview.innerHTML="";
  postModal.style.display="none";
  showToast("Trend posted!","#16a34a");
  loadFeed();
};

// --- Like Button Handler ---
async function likeTrend(id, currentLikes){
  const { error } = await supabase.from("trends").update({likes: currentLikes+1}).eq("id",id);
  if(error) return showToast("Like error","#dc2626");
  loadFeed();
}

// --- Load Feed ---
async function loadFeed(){
  const { data, error } = await supabase.from("trends").select("*").order("created_at",{ascending:false});
  if(error){ console.error(error); return; }
  feed.innerHTML="";
  data.forEach(trend=>{
    const card=document.createElement("div"); card.className="trend-card";
    const info=document.createElement("div"); info.className="trend-header";
    info.innerHTML=`<img src="${trend.avatar||'https://placehold.co/40x40'}"><span class="handle">@${trend.username||'anon'}</span>`;
    card.appendChild(info);

    if(trend.caption){
      const textDiv=document.createElement("div"); textDiv.className="trend-text"; textDiv.innerText=trend.caption;
      card.appendChild(textDiv);
    }

    if(trend.type==="image" && trend.url){
      card.innerHTML+=`<div class="trend-media"><img src="${trend.url}"></div>`;
    } else if(trend.type==="video" && trend.video_url){
      card.innerHTML+=`<div class="trend-media"><video src="${trend.video_url}" controls></video></div>`;
    } else if(trend.type==="youtube" && trend.video_url){
      let vid = trend.video_url.replace("watch?v=","embed/");
      card.innerHTML+=`<div class="trend-media"><iframe src="${vid}" frameborder="0" allowfullscreen style="width:100%;height:300px;"></iframe></div>`;
    }

    // Like button
    const likeBtn=document.createElement("button");
    likeBtn.className="btn";
    likeBtn.innerText=`❤️ ${trend.likes||0}`;
    likeBtn.onclick=()=>likeTrend(trend.id, trend.likes||0);
    card.appendChild(likeBtn);

    feed.appendChild(card);
  });
}
loadFeed();
