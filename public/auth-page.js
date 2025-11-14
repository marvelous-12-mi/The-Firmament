
import { supabase } from "./supabase.js";

const toggleBtn = document.getElementById("toggle");
const signin = document.getElementById("signin");
const signup = document.getElementById("signup");

toggleBtn.addEventListener("click", () => {
  const su = signup.classList.toggle("hidden");
  signin.classList.toggle("hidden");
  toggleBtn.textContent = su ? "Switch to Sign up" : "Switch to Sign in";
});

document.getElementById("login").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const status = document.getElementById("status");
  status.textContent = "Signing in...";
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) { status.textContent = "Error: " + error.message; return; }
  status.textContent = "Signed in!";
  window.location.href = "/index.html";
});

document.getElementById("magic").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const status = document.getElementById("status");
  status.textContent = "Sending magic link...";
  const { error } = await supabase.auth.signInWithOtp({ email });
  status.textContent = error ? "Error: " + error.message : "Check your email for the link.";
});

document.getElementById("register").addEventListener("click", async () => {
  const email = document.getElementById("su-email").value.trim();
  const password = document.getElementById("su-password").value.trim();
  const username = document.getElementById("su-username").value.trim();
  const status = document.getElementById("su-status");
  status.textContent = "Creating account...";

  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { username } }
  });
  if (error) { status.textContent = "Error: " + error.message; return; }

  // Create profile row after sign-up completes (user might need email confirm)
  const userId = data.user?.id;
  if (userId) {
    await supabase.from("profiles").insert({
      id: userId,
      username,
      display_name: email,
      bio: "",
      avatar_url: null,
    }).catch(() => {});
  }
  status.textContent = "Account created. Check your email to confirm.";
});

