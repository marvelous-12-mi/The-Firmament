
import { supabase } from "./supabase.js";

/** Auth helpers **/
export async function requireAuthOrRedirect() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) window.location.href = "/auth.html";
  return session;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = "/auth.html";
}

/** Profile helpers **/
export async function getMyProfile() {
  const session = await getSession();
  if (!session) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();
  if (error && error.code === "PGRST116") {
    // create profile stub
    await supabase.from("profiles").insert({
      id: session.user.id,
      username: "user_" + session.user.id.slice(0, 8),
      display_name: session.user.email,
      bio: "",
      avatar_url: null,
    });
    return getMyProfile();
  }
  return data;
}

export async function getProfileById(id) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

/** Storage helpers **/
export async function uploadImage(file, pathPrefix = "posts") {
  const session = await getSession();
  if (!session || !file) return null;
  const ext = file.name.split(".").pop();
  const path = `${pathPrefix}/${session.user.id}/${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage.from("synq-media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data: pub } = supabase.storage.from("synq-media").getPublicUrl(path);
  return pub.publicUrl;
}

/** UI helpers **/
export function fmtTime(ts) {
  return new Date(ts).toLocaleString();
}

