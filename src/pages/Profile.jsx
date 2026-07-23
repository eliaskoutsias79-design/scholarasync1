import React, { useRef, useState } from "react";
import { supabase } from "../supabaseClient";

export default function ProfileView({
  profile,
  session,
  profileDraft,
  setProfileDraft,
  savingProfile,
  onSave,
  avatarUrl,
  showError,
  language,
  setLanguage,
}) {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  const initial = (profileDraft.fullName || profile?.email || "S")
    .charAt(0)
    .toUpperCase();

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !session?.user?.id) return;

    if (!file.type.startsWith("image/")) {
      showError("Please choose an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError("Your profile picture must be smaller than 5 MB.");
      return;
    }

    setUploadingAvatar(true);

    try {
      const extension = (file.name.split(".").pop() || "jpg")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

      const filePath = `${session.user.id}/avatar-${Date.now()}.${extension || "jpg"}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      if (!data?.publicUrl) {
        throw new Error("Supabase did not return an image URL.");
      }

      setProfileDraft((current) => ({
        ...current,
        avatarUrl: data.publicUrl,
      }));
    } catch (error) {
      console.error("Avatar upload failed:", error);
      showError("Could not upload your picture: " + error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = () => {
    setProfileDraft((current) => ({
      ...current,
      avatarUrl: "",
    }));
  };

  return (
    <div className="profile-page">
      <div
        className="profile-language-switcher"
        role="group"
        aria-label="Language selector"
        style={{
          position: "fixed",
          top: "50%",
          right: "max(8px, env(safe-area-inset-right))",
          transform: "translateY(-50%)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          padding: "5px",
          borderRadius: "16px",
          background: "rgba(255, 255, 255, 0.94)",
          border: "1px solid rgba(124, 92, 246, 0.18)",
          boxShadow: "0 8px 24px rgba(31, 22, 72, 0.16)",
          backdropFilter: "blur(10px)",
        }}
      >
        <button
          type="button"
          aria-label="Switch to English"
          aria-pressed={language === "en"}
          title="English"
          onClick={() => setLanguage("en")}
          style={{
            width: "38px",
            height: "38px",
            padding: 0,
            margin: 0,
            borderRadius: "11px",
            border: language === "en" ? "2px solid #7c5cf6" : "2px solid transparent",
            background: language === "en" ? "#f0ecff" : "transparent",
            cursor: "pointer",
          }}
        >
          🇬🇧
        </button>
        <button
          type="button"
          aria-label="Αλλαγή στα Ελληνικά"
          aria-pressed={language === "el"}
          title="Ελληνικά"
          onClick={() => setLanguage("el")}
          style={{
            width: "38px",
            height: "38px",
            padding: 0,
            margin: 0,
            borderRadius: "11px",
            border: language === "el" ? "2px solid #7c5cf6" : "2px solid transparent",
            background: language === "el" ? "#f0ecff" : "transparent",
            cursor: "pointer",
          }}
        >
          🇬🇷
        </button>
      </div>
      <section className="profile-hero-card">
        <div className="profile-cover" />
        <div className="profile-identity">
          <div className="profile-avatar-large">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span>{initial}</span>
            )}
          </div>

          <div className="profile-identity-copy">
            <span className="profile-role-badge">
              {profile?.role || "Member"}
            </span>
            <h2>{profileDraft.fullName || "ScholarAsync User"}</h2>
            <p>{session?.user?.email}</p>
          </div>
        </div>
      </section>

      <div className="profile-settings-grid">
        <section className="profile-settings-card">
          <div className="profile-card-heading">
            <div>
              <span>Personal details</span>
              <h3>Edit your profile</h3>
            </div>
            <span className="profile-card-icon">✦</span>
          </div>

          <label className="profile-field">
            <span>Display name</span>
            <input
              value={profileDraft.fullName}
              onChange={(e) =>
                setProfileDraft((current) => ({
                  ...current,
                  fullName: e.target.value,
                }))
              }
              placeholder="Your name"
              maxLength={80}
            />
          </label>

          <div className="profile-field">
            <span>Profile picture</span>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleAvatarUpload}
              hidden
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <button
                type="button"
                className="main-btn"
                style={{ width: "auto", padding: "10px 16px" }}
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? "Uploading..." : "Upload image"}
              </button>

              {profileDraft.avatarUrl && (
                <button
                  type="button"
                  className="secondary-btn"
                  style={{ width: "auto", padding: "10px 16px", margin: 0 }}
                  onClick={removeAvatar}
                  disabled={uploadingAvatar}
                >
                  Remove image
                </button>
              )}
            </div>

            <small>
              PNG, JPG, WEBP or GIF, up to 5 MB. Click Save changes after uploading.
            </small>
          </div>

          <label className="profile-field">
            <span>Bio</span>
            <textarea
              rows={5}
              value={profileDraft.bio}
              onChange={(e) =>
                setProfileDraft((current) => ({
                  ...current,
                  bio: e.target.value,
                }))
              }
              placeholder="Write a short introduction..."
              maxLength={240}
            />
            <small>{profileDraft.bio.length}/240 characters</small>
          </label>

          <button
            type="button"
            className="main-btn profile-save-btn"
            onClick={onSave}
            disabled={savingProfile || uploadingAvatar}
          >
            {savingProfile
              ? "Saving..."
              : uploadingAvatar
                ? "Uploading image..."
                : "Save changes"}
          </button>
         <button
  type="button"
  className="secondary-btn"
  style={{
    width: "100%",
    marginTop: "12px",
    background: "#ef4444",
    color: "#fff",
    border: "none"
  }}
  onClick={async () => {
    await supabase.auth.signOut();
    window.location.reload();
  }}
>
  🚪 Sign Out
</button>
        </section>

        <aside className="profile-summary-card">
          <span className="profile-summary-label">Profile preview</span>

          <div className="profile-preview-avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span>{initial}</span>
            )}
          </div>

          <h3>{profileDraft.fullName || "ScholarAsync User"}</h3>
          <span className="profile-preview-role">{profile?.role || "Member"}</span>

          <p>
            {profileDraft.bio ||
              "Your bio will appear here once you add one."}
          </p>

          <div className="profile-detail-list">
            <div>
              <span>Email</span>
              <strong>{session?.user?.email}</strong>
            </div>

            <div>
              <span>Class</span>
              <strong>
                {profile?.user_class ||
                  profile?.requested_classes ||
                  "Not assigned"}
              </strong>
            </div>

            <div>
              <span>Account status</span>
              <strong className={profile?.is_approved ? "approved-text" : "pending-text"}>
                {profile?.is_approved ? "Approved" : "Pending"}
              </strong>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
