import { toSafeHttpUrl } from "../utils/urls";

export default function Materials({
  materials,
  profile,
  isAdmin,
  setShowMaterialModal,
  onDelete,
}) {
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
        <h2>📚 Study Materials</h2>
        {(profile?.role === "teacher" || isAdmin) && (
          <button
            className="main-btn"
            style={{ width: "auto", padding: "10px 20px" }}
            onClick={() => setShowMaterialModal(true)}
          >
            + Add Material
          </button>
        )}
      </div>

      <div className="materials-grid">
        {materials.length === 0 ? (
          <p>No materials uploaded yet.</p>
        ) : (
          materials.map((material) => {
            const safeLink = toSafeHttpUrl(material.link);
            return (
              <div key={material.id} className="material-card">
                <div className="material-info" translate="no">
                  <strong>{material.title}</strong>
                  <p>{material.subject} | {material.class_name}</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  {safeLink ? (
                    <a
                      href={safeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="main-btn"
                      style={{
                        width: "auto",
                        padding: "5px 15px",
                        textDecoration: "none",
                      }}
                    >
                      Open
                    </a>
                  ) : (
                    <span className="material-link-unavailable">
                      Invalid link
                    </span>
                  )}
                  {(profile?.role !== "student" || isAdmin) && (
                    <button
                      type="button"
                      className="del-btn"
                      aria-label={`Delete ${material.title}`}
                      onClick={() => onDelete(material.id)}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
