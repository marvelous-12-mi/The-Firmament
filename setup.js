import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://kpdgmbjdaynplyjacuxd.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGdtYmpkYXlucGx5amFjdXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA3MjMsImV4cCI6MjA3NDczNjcyM30.ZJM2v_5VES_AlHAAV4lHaIID7v3IBEbFUgFEcs4yOYQ"
);

const username = document.getElementById("username");
const job = document.getElementById("job");
const interests = document.getElementById("interests");
const bioPrompt = document.getElementById("bioPrompt");
const avatarInput = document.getElementById("avatarInput");
const saveBtn = document.getElementById("saveProfile");
const status = document.getElementById("status");

saveBtn.onclick = async () => {
  status.innerText = "Saving...";
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    alert("Please sign in first.");
    window.location.href = "index.html";
    return;
  }

  let avatarUrl = null;
  const file = avatarInput.files[0];
  if (file) {
    const filePath = `avatars/${user.id}-${Date.now()}.png`;
    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });
    if (uploadErr) return (status.innerText = uploadErr.message);
    avatarUrl = supabase.storage.from("avatars").getPublicUrl(filePath).data.publicUrl;
  }

  // Generate AI bio (securely via Vercel backend)
  let bio = bioPrompt.value.trim();
  if (bio === "") {
    const response = await fetch("/api/generateBio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job: job.value,
        interests: interests.value,
      }),
    });
    const data = await response.json();
    bio = data.bio || "Excited to share trends with the world!";
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    username: username.value.trim() || user.email.split("@")[0],
    job: job.value,
    interests: interests.value.split(",").map((x) => x.trim()),
    bio,
    avatar: avatarUrl || "https://placehold.co/100x100",
  });

  if (error) return (status.innerText = error.message);

  status.innerText = "Profile created! Redirecting...";
  setTimeout(() => (window.location.href = "feed.html"), 1500);
};
