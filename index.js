import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// --- Supabase Config ---
const supabaseUrl = "https://kpdgmbjdaynplyjacuxd.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZGdtYmpkYXlucGx5amFjdXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjA3MjMsImV4cCI6MjA3NDczNjcyM30.ZJM2v_5VES_AlHAAV4lHaIID7v3IBEbFUgFEcs4yOYQ";

const supabase = createClient(supabaseUrl, supabaseKey);

// --- DOM Elements ---
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signInBtn = document.getElementById("signInBtn");
const signUpBtn = document.getElementById("signUpBtn");
const logoutBtn = document.getElementById("logoutBtn");
const statusMsg = document.getElementById("status");
const loader = document.getElementById("loader");

// --- Helpers ---
function showStatus(msg, color = "#222") {
  statusMsg.innerText = msg;
  statusMsg.style.color = color;
  statusMsg.style.display = "block";
  setTimeout(() => (statusMsg.style.display = "none"), 4000);
}

function showLoader(show) {
  loader.style.display = show ? "block" : "none";
}

// --- Redirect if already logged in ---
async function checkSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    // Already logged in, go to feed
    window.location.href = "/feed.html";
  }
}

checkSession();

// --- Sign Up ---
signUpBtn.onclick = async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) return showStatus("Enter email and password", "red");

  showLoader(true);

  const { error } = await supabase.auth.signUp({ email, password });

  showLoader(false);

  if (error) {
    showStatus(error.message, "red");
  } else {
    showStatus("Signup successful! Check your inbox to confirm.", "green");
  }
};

// --- Sign In ---
signInBtn.onclick = async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) return showStatus("Enter email and password", "red");

  showLoader(true);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  showLoader(false);

  if (error) {
    showStatus("Login failed: " + error.message, "red");
  } else if (data?.user) {
    showStatus("Welcome back, redirecting...", "green");
    setTimeout(() => (window.location.href = "/feed.html"), 1200);
  }
};

// --- Sign Out ---
logoutBtn.onclick = async () => {
  const { error } = await supabase.auth.signOut();
  if (!error) {
    showStatus("Logged out!", "green");
    setTimeout(() => (window.location.href = "/index.html"), 1000);
  }
};
