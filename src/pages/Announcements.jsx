export default function Announcements({
  announcements,
  profile,
  isAdmin,
  setShowAnnouncementModal,
  setAnnSelectedClasses,
  setNewAnn,
  onDelete,
}) {
  const openComposer = () => {
    setShowAnnouncementModal(true);
    setAnnSelectedClasses([]);
    setNewAnn({ title: "", content: "", className: "" });
  };

  return (
    <div className="materials-container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2>📣 Announcements</h2>
        {(profile?.role === "teacher" || isAdmin) && (
          <button
            className="main-btn"
            style={{ width: "auto", padding: "10px 20px" }}
            onClick={openComposer}
          >
            + Post
          </button>
        )}
      </div>

      <div className="announcements-list">
        {announcements.length === 0 ? (
          <p>No announcements yet.</p>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.id} className="announcement-card">
              <div className="announcement-header">
                <strong>{announcement.title}</strong>
                <span className="ann-class-badge">
                  {announcement.class_name}
                </span>
              </div>
              <p className="announcement-content">{announcement.content}</p>
              <div className="announcement-footer">
                <small>
                  {new Date(announcement.created_at).toLocaleDateString()}
                </small>
                {(profile?.role !== "student" || isAdmin) && (
                  <button
                    className="del-btn"
                    onClick={() => onDelete(announcement.id)}
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
