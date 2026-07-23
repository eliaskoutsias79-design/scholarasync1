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
          materials.map((material) => (
            <div key={material.id} className="material-card">
              <div className="material-info">
                <strong>{material.title}</strong>
                <p>{material.subject} | {material.class_name}</p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <a
                  href={material.link}
                  target="_blank"
                  rel="noreferrer"
                  className="main-btn"
                  style={{
                    width: "auto",
                    padding: "5px 15px",
                    textDecoration: "none",
                  }}
                >
                  Open
                </a>
                {(profile?.role !== "student" || isAdmin) && (
                  <button
                    className="del-btn"
                    onClick={() => onDelete(material.id)}
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
