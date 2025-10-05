import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
const supabase = createClient("https://kpdgmbjdaynplyjacuxd.supabase.co", "YOUR_SUPABASE_ANON_KEY");

const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get("id");

async function loadProfile() {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) {
    document.body.innerHTML = "<h2>User not found.</h2>";
    return;
  }

  document.getElementById("avatar").src = data.avatar;
  document.getElementById("username").innerText = data.username;
  document.getElementById("job").innerText = data.job || "";
  document.getElementById("bio").innerText = data.bio || "";
  document.getElementById("interests").innerHTML = data.interests
    ? data.interests.map((i) => `<span class='tag'>${i}</span>`).join(" ")
    : "";
}

loadProfile();
