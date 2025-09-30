import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase config
const supabase = createClient(
  'https://kpdgmbjdaynplyjacuxd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGdtYmpkYXlucGx5amFjdXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA3MjMsImV4cCI6MjA3NDczNjcyM30.ZJM2v_5VES_AlHAAV4lHaIID7v3IBEbFUgFEcs4yOYQ'
)

// DOM
const openAuthBtn = document.getElementById("openAuthBtn")
const authModal = document.getElementById("authModal")
const closeAuthBtn = document.getElementById("closeAuthBtn")
const signUpBtn = document.getElementById("signUpBtn")
const signInBtn = document.getElementById("signInBtn")
const authEmail = document.getElementById("authEmail")
const authPassword = document.getElementById("authPassword")
const logoutBtn = document.getElementById("logoutBtn")
const avatar = document.getElementById("avatar")
const composerSection = document.getElementById("composerSection")
const trendForm = document.getElementById("trendForm")
const feed = document.getElementById("trendFeed")
const usernameInput = document.getElementById("usernameInput")
const avatarInput = document.getElementById("avatarInput")
const videoUrl = document.getElementById("videoUrl")
const startRecordingBtn = document.getElementById("startRecordingBtn")
const stopRecordingBtn = document.getElementById("stopRecordingBtn")
const recorderPreview = document.getElementById("recorderPreview")

// Auth modal
openAuthBtn.onclick = () => authModal.style.display = "flex"
closeAuthBtn.onclick = () => authModal.style.display = "none"

// Sign Up
signUpBtn.onclick = async () => {
  const email = authEmail.value.trim()
  const password = authPassword.value.trim()
  if (!email || !password) return alert("Enter email & password")
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) return alert("Sign Up Error: " + error.message)
  alert("Sign Up successful! Check your email for verification, it will be displayed as Superbase Auth")
  authModal.style.display = "none"
  handleAuth()
}

// Sign In
signInBtn.onclick = async () => {
  const email = authEmail.value.trim()
  const password = authPassword.value.trim()
  if (!email || !password) return alert("Enter email & password")
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return alert("Sign In Error: " + error.message)
  authModal.style.display = "none"
  handleAuth()
}

// Logout
logoutBtn.onclick = async () => {
  await supabase.auth.signOut()
  handleAuth()
}

// Handle session
async function handleAuth() {
  const { data } = await supabase.auth.getSession()
  const user = data.session?.user
  if (user) {
    avatar.style.display = "inline-block"
    avatar.src = user.user_metadata?.avatar_url || "https://placehold.co/36x36"
    logoutBtn.style.display = "inline-block"
    openAuthBtn.style.display = "none"
    composerSection.style.display = "block"
    await ensureProfile(user)
  } else {
    avatar.style.display = "none"
    logoutBtn.style.display = "none"
    openAuthBtn.style.display = "inline-block"
    composerSection.style.display = "none"
  }
}

// Ensure profile
async function ensureProfile(user) {
  const { data: existing } = await supabase.from("profiles").select().eq("id", user.id).single()
  if (!existing) {
    await supabase.from("profiles").insert([{
      id: user.id,
      username: usernameInput.value || "Anonymous",
      avatar_url: avatarInput.value || "https://placehold.co/40x40"
    }])
  } else {
    await supabase.from("profiles").update({
      username: usernameInput.value || existing.username,
      avatar_url: avatarInput.value || existing.avatar_url
    }).eq("id", user.id)
  }
}

// Post trend
trendForm.addEventListener("submit", async e => {
  e.preventDefault()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return alert("Sign in first")
  const text = document.getElementById("trendText").value.trim()
  const video = videoUrl.value.trim()
  await ensureProfile(user)
  const { error } = await supabase.from("trends").insert([{
    text,
    video_url: video || null,
    user_id: user.id
  }])
  if (error) alert("Error posting: " + error.message)
  else trendForm.reset(), loadTrends()
})

// Load trends
async function loadTrends() {
  const { data: trends, error } = await supabase.from("trends").select("id,text,video_url,user_id").order("id", { ascending: false })
  if (error) return console.error(error)
  feed.innerHTML = ""
  for (const trend of trends) {
    let profile = { username: "Anonymous", avatar_url: "https://placehold.co/40x40" }
    const { data: profileData } = await supabase.from("profiles").select("username,avatar_url").eq("id", trend.user_id).single()
    if (profileData) profile = profileData
    renderTrend(trend, profile)
  }
}

// Render trend
function renderTrend(trend, profile) {
  const card = document.createElement("div"); card.className = "trend-card"
  const header = document.createElement("div"); header.className = "trend-header"
  const userAvatar = document.createElement("img"); userAvatar.src = profile.avatar_url
  header.appendChild(userAvatar)
  const userTag = document.createElement("div"); userTag.className = "trend-user"; userTag.textContent = profile.username
  header.appendChild(userTag); card.appendChild(header)
  const textEl = document.createElement("div"); textEl.className = "trend-text"; textEl.textContent = trend.text; card.appendChild(textEl)
  if (trend.video_url) {
    if (trend.video_url.includes("youtube.com") || trend.video_url.includes("youtu.be")) {
      let id = trend.video_url.includes("youtu.be") ? trend.video_url.split("/").pop() : new URL(trend.video_url).searchParams.get("v")
      const iframe = document.createElement("iframe")
      iframe.src = `https://www.youtube.com/embed/${id}`
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      iframe.allowFullscreen = true
      iframe.height = 300
      card.appendChild(iframe)
    } else {
      const video = document.createElement("video"); video.src = trend.video_url; video.controls = true; video.muted = true
      video.onmouseenter = () => video.play(); video.onmouseleave = () => video.pause()
      card.appendChild(video)
    }
  }
  feed.appendChild(card)
}

// Realtime updates
supabase.channel("realtime-trends").on("postgres_changes", { event: "INSERT", schema: "public", table: "trends" }, async payload => {
  const trend = payload.new
  let profile = { username: "Anonymous", avatar_url: "https://placehold.co/40x40" }
  const { data: profileData } = await supabase.from("profiles").select("username,avatar_url").eq("id", trend.user_id).single()
  if (profileData) profile = profileData
  renderTrend(trend, profile)
}).subscribe()

// Video recording
let mediaRecorder, recordedChunks = []
startRecordingBtn.onclick = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  recorderPreview.srcObject = stream
  recorderPreview.style.display = "block"
  recorderPreview.play()
  mediaRecorder = new MediaRecorder(stream)
  recordedChunks = []
  mediaRecorder.ondataavailable = e => recordedChunks.push(e.data)
  mediaRecorder.onstop = async () => {
    const blob = new Blob(recordedChunks, { type: "video/webm" })
    const fileName = `trend-${Date.now()}.webm`
    const { data, error } = await supabase.storage.from("videos").upload(fileName, blob, { contentType: "video/webm" })
    if (error) return alert("Upload error: " + error.message)
    const { data: fileInfo, error: urlError } = await supabase.storage
      .from("videos")
      .getPublicUrl(fileName)

    if (urlError) return alert("Error getting video URL: " + urlError.message)

    videoUrl.value = fileInfo.publicUrl
    recorderPreview.srcObject.getTracks().forEach(track => track.stop())
    recorderPreview.src = fileInfo.publicUrl
    recorderPreview.play()
    recorderPreview.style.display = "block"
    alert("✅ Video uploaded and ready to post!")
  }

  mediaRecorder.start()
  startRecordingBtn.style.display = "none"
  stopRecordingBtn.style.display = "inline-block"
}

stopRecordingBtn.onclick = () => {
  mediaRecorder.stop()
  startRecordingBtn.style.display = "inline-block"
  stopRecordingBtn.style.display = "none"
}
