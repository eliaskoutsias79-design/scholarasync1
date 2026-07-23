import { supabase } from "../supabaseClient";

export const getProfile = (userId) =>
  supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

export const upsertProfile = (profile) =>
  supabase.from("profiles").upsert(profile, { onConflict: "id" });

export const updateProfile = (userId, updates) =>
  supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();
