import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase config
const supabase = createClient(
  'https://kpdgmbjdaynplyjacuxd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGdtYmpkYXlucGx5amFjdXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA3MjMsImV4cCI6MjA3NDczNjcyM30.ZJM2v_5VES_AlHAAV4lHaIID7v3IBEbFUgFEcs4yOYQ'
)

// DOM elements
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
openAuthBtn.onclick = () => (authModal.style.display = "flex")
closeAuthBtn.onclick = () => (authModal.style.display = "none")

// Sign Up
signUpBtn.onclick = async () => {
  const email = authEmail.value.trim()
  const password = authPassword.value.trim()
  if (!email || !password) return alert("Enter email & password")
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) return alert("Sign Up Error: " + error.message)
  alert("Sign Up successful! Check your email for verification.")
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
  const { data: existing } = await supabase
    .from("profiles")
    .select()
    .eq("id", user.id)
    .single()

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
  else trendForm.reset()
})

// Load trends
async function loadTrends() {
  const { data: trends, error } = await supabase
    .from("trends")
    .select("id,text,video_url,user_id")
    .order("id", { ascending: false })

  if (error) {
    console.error("Load trends error:", error.message)
    return
  }

  feed.innerHTML = ""
  for (const trend of trends) {
    let profile = { username: "Anonymous", avatar_url: "https://placehold.co/40x40" }
    const { data: profileData } = await supabase
      .from("profiles")
      .select("username,avatar_url")
      .eq("id", trend.user_id)
      .single()
    if (profileData) profile = profileData
    await renderTrend(trend, profile)
  }
}

// Render trend
async function renderTrend(trend, profile) {
  const card = document.createElement("div")
  card.className = "trend-card"

  const header = document.createElement("div")
  header.className = "trend-header"
  const userAvatar = document.createElement("img")
  userAvatar.src = profile.avatar_url
  header.appendChild(userAvatar)
  const userTag = document.createElement("div")
  userTag.className = "trend-user"
  userTag.textContent = profile.username
  header.appendChild(userTag)
  card.appendChild(header)

  const textEl = document.createElement("div")
  textEl.className = "trend-text"
  textEl.textContent = trend.text
  card.appendChild(textEl)

  if (trend.video_url) {
    const video = document.createElement("video")
    video.src = trend.video_url
    video.controls = true
    video.muted = true
    video.onmouseenter = () => video.play()
    video.onmouseleave = () => video.pause()
    card.appendChild(video)
  }

  // Likes
  const likeBtn = document.createElement("button")
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  const { count } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("trend_id", trend.id)
  likeBtn.textContent = `❤️ Like (${count})`
  likeBtn.onclick = async () => {
    if (!user) return alert("Sign in first")
    const { data: existing } = await supabase
      .from("likes")
      .select()
      .eq("trend_id", trend.id)
      .eq("user_id", user.id)
      .single()
    if (existing) {
      await supabase.from("likes").delete().eq("id", existing.id)
    } else {
      await supabase.from("likes").insert([{ trend_id: trend.id, user_id: user.id }])
    }
    loadTrends()
  }

  // Comments
  const commentInput = document.createElement("input")
  commentInput.placeholder = "💬 Add a comment"
  const commentBtn = document.createElement("button")
  commentBtn.textContent = "Post"
  commentBtn.onclick = async () => {
    if (!user) return alert("Sign in first")
    const text = commentInput.value.trim()
    if (!text) return
    await supabase.from("comments").insert([{ trend_id: trend.id, user_id: user.id, text }])
    commentInput.value = ""
    loadTrends()
  }

  const commentSection = document.createElement("div")
  const { data: comments } = await supabase
    .from("comments")
    .select("text,user_id")
    .eq("trend_id", trend.id)
    .order("id", { ascending: true })

  for (const comment of comments) {
    const { data: commenter } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", comment.user_id)
      .single()
    const commentEl = document.createElement("div")
    commentEl.textContent = `${commenter?.username || "User"}: ${comment.text}`
    commentSection.appendChild(commentEl)
  }

  const actions = document.createElement("div")
  actions.className = "trend-actions"
  actions.appendChild(likeBtn)
  card.appendChild(actions)

  const commentBox = document.createElement("div")
  commentBox.style.marginTop = "1rem"
  commentBox.appendChild(commentInput)
  commentBox.appendChild(commentBtn)
  card.appendChild(commentBox)

  const commentList = document.createElement("div")
  commentList.style.marginTop = "0.5rem"
  commentList.appendChild(commentSection)
  card.appendChild(commentList)

  feed.appendChild(card)
}

// Realtime subscription
supabase
  .channel("realtime-trends")
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "trends" },
    async payload => {
      const trend = payload.new
      let profile = { username: "Anonymous", avatar_url: "https://placehold.co/40x40" }
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username,avatar_url")
        .eq("id", trend.user_id)
        .single()
      if (profileData) profile = profileData
      await renderTrend(trend, profile)
    }
  )
  .subscribe()

// Video recording
let mediaRecorder, recordedChunks = []
startRecordingBtn.onclick = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    recorderPreview.srcObject = stream
    recorderPreview.style.display = "block"
    recorderPreview.play()

    const mimeType = MediaRecorder.isTypeSupported("video/mp4")
      ? "video/mp4"
      : "video/webm"
    mediaRecorder = new MediaRecorder(stream, { mimeType })
    recordedChunks = []
    mediaRecorder.ondataavailable = e => recordedChunks.push(e.data)

    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType })
      const fileName = `trend-${Date.now()}.${mimeType.split("/")[1]}`
      const { error: uploadError } = await supabase
        .storage
        .from("videos")
        .upload(fileName, blob, { contentType: mediaRecorder.mimeType })
      if (uploadError) return alert("Upload error: " + uploadError.message)

      const { data, error: urlError } = supabase.storage.from("videos").getPublicUrl(fileName)
      if (urlError) return alert("Error getting video URL: " + urlError.message)

      videoUrl.value = data.publicUrl
      recorderPreview.srcObject.getTracks().forEach(track => track.stop())
      recorderPreview.srcObject = null
      recorderPreview.src = data.publicUrl
      recorderPreview.play()
      recorderPreview.style.display = "block"
      alert("✅ Video uploaded and ready to post!")
    }

    mediaRecorder.start()
    startRecordingBtn.style.display = "none"
    stopRecordingBtn.style.display = "inline-block"
  } catch (err) {
    console.error("Recording error:", err)
    alert("🎥 Unable to access camera/mic. Make sure you're on HTTPS and permissions are granted.")
  }
}

stopRecordingBtn.onclick = () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop()
    startRecordingBtn.style.display = "inline-block"
    stopRecordingBtn.style.display = "none"
  }
}

handleAuth()
loadTrends()
