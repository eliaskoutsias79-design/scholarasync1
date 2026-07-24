import { supabase } from "../supabaseClient";
import { removeAndroidNotificationToken } from "./androidNotifications";
import { disablePushNotifications } from "./pushNotifications";

export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

export const signInWithEmail = (email, password) =>
  supabase.auth.signInWithPassword({ email, password });

export const signUpWithEmail = (email, password, metadata) =>
  supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });

export const signInWithGoogle = () =>
  supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
      queryParams: { prompt: "select_account" },
    },
  });

export const sendPasswordResetEmail = (email) =>
  supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });

export const updatePassword = (password) =>
  supabase.auth.updateUser({ password });

export const signOut = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const cleanupResults = await Promise.allSettled([
    disablePushNotifications(),
    removeAndroidNotificationToken(session?.user?.id),
  ]);

  cleanupResults.forEach((result) => {
    if (result.status === "rejected") {
      console.warn("Notification cleanup during sign out failed:", result.reason);
    }
  });

  return supabase.auth.signOut();
};
