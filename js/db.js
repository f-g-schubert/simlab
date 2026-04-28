// db.js - DEPRECATED - Use supabase.js instead
// 
// All database operations have been centralized in supabase.js.
// 
// Import the functions directly from supabase.js:
// import { getBlog, getProjects, getEvents } from "./supabase.js";
// import { getBlogById, getProjectById, getEventById } from "./supabase.js";
// import { likeBlogPost } from "./supabase.js";

import { supabase } from './supabase.js';

console.warn(
  "db.js is deprecated. Use functions from supabase.js instead."
);

// Legacy helper
function getGuestId() {
  let id = localStorage.getItem("guest_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("guest_id", id);
  }
  return id;
}

// Legacy exports for backward compatibility (these are now in supabase.js)
export async function likePost(postId) {
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from("likes").insert([{
    post_id: postId,
    user_id: user?.id || null,
    guest_id: user ? null : getGuestId()
  }]);

  await supabase.rpc("increment_likes", { post_id: postId });
}

export async function addComment(postId, text) {
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from("comments").insert([{
    post_id: postId,
    user_name: user ? user.user_metadata.firstName : "Gast",
    user_id: user?.id || null,
    text
  }]);
}
