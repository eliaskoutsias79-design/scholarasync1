import { supabase } from "../supabaseClient";
import { ADMIN_EMAIL } from "../constants/app";

export const getAssignments = async (profile, userId, userEmail) => {
  let query = supabase.from("assignments").select("*");
  if (profile.role === "student") query = query.eq("class_name", profile.user_class);
  else if (userEmail !== ADMIN_EMAIL) query = query.eq("teacher_id", userId);
  return query;
};

export const getMaterials = async (profile) => {
  let query = supabase.from("materials").select("*");
  if (profile.role === "student") query = query.eq("class_name", profile.user_class);
  return query;
};

export const getAnnouncements = async (profile) => {
  let query = supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  if (profile.role === "student") query = query.eq("class_name", profile.user_class);
  return query;
};

export const createAssignments = (assignments) =>
  supabase.from("assignments").insert(assignments);

export const createAnnouncement = (announcements) =>
  supabase.from("announcements").insert(announcements);

export const createMaterial = (material) =>
  supabase.from("materials").insert([material]);

export const deleteAssignment = (id) =>
  supabase.from("assignments").delete().eq("id", id);

export const deleteAnnouncement = (id) =>
  supabase.from("announcements").delete().eq("id", id);

export const deleteMaterial = (id) =>
  supabase.from("materials").delete().eq("id", id);
