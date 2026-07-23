import { AVAILABLE_CLASSES } from "../../constants/app";
import { parseCommaList } from "../../utils/classes";

function AssignmentModal({ app }) {
  if (!app.showAddModal) return null;
  const classOptions = parseCommaList(
    app.profile?.requested_classes || app.profile?.user_class
  );
  const subjectOptions = parseCommaList(
    app.profile?.requested_subjects || "General"
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Post Homework: {app.selectedDate}</h3>
        {app.isAdmin ? (
          <div className="class-selector">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <label
                style={{
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  color: "var(--text-muted)",
                }}
              >
                Select Classes
              </label>
              <button className="select-all-btn" onClick={app.selectAllClasses}>
                {app.selectedClasses.length === AVAILABLE_CLASSES.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>
            <div className="class-checkbox-grid">
              {AVAILABLE_CLASSES.map((className) => (
                <label
                  key={className}
                  className={`class-checkbox-item ${
                    app.selectedClasses.includes(className) ? "checked" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={app.selectedClasses.includes(className)}
                    onChange={() => app.toggleClass(className)}
                    style={{ display: "none" }}
                  />
                  {className}
                </label>
              ))}
            </div>
          </div>
        ) : (
          <select
            value={app.newHW.className}
            onChange={(event) =>
              app.setNewHW({ ...app.newHW, className: event.target.value })
            }
          >
            <option value="">-- Class --</option>
            {classOptions.map((className) => (
              <option key={className} value={className}>{className}</option>
            ))}
          </select>
        )}

        <select
          value={app.newHW.subject}
          onChange={(event) =>
            app.setNewHW({ ...app.newHW, subject: event.target.value })
          }
        >
          <option value="">-- Subject --</option>
          {subjectOptions.map((subject) => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>
        <input
          placeholder="Assignment Title"
          value={app.newHW.title}
          onChange={(event) =>
            app.setNewHW({ ...app.newHW, title: event.target.value })
          }
        />
        <button className="main-btn" onClick={app.handlePostHomework}>Post</button>
        <button
          className="secondary-btn"
          onClick={() => {
            app.setShowAddModal(false);
            app.setSelectedClasses([]);
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function MaterialModal({ app }) {
  if (!app.showMaterialModal) return null;
  const classOptions = parseCommaList(
    app.profile?.requested_classes || app.profile?.user_class
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Upload Material</h3>
        <select
          value={app.newMat.className}
          onChange={(event) =>
            app.setNewMat({ ...app.newMat, className: event.target.value })
          }
        >
          <option value="">-- Class --</option>
          {classOptions.map((className) => (
            <option key={className} value={className}>{className}</option>
          ))}
        </select>
        <input
          placeholder="Title"
          value={app.newMat.title}
          onChange={(event) =>
            app.setNewMat({ ...app.newMat, title: event.target.value })
          }
        />
        <input
          placeholder="Subject"
          value={app.newMat.subject}
          onChange={(event) =>
            app.setNewMat({ ...app.newMat, subject: event.target.value })
          }
        />
        <input
          placeholder="Link (Drive/PDF)"
          value={app.newMat.link}
          onChange={(event) =>
            app.setNewMat({ ...app.newMat, link: event.target.value })
          }
        />
        <button className="main-btn" onClick={app.handleCreateMaterial}>
          Upload
        </button>
        <button
          className="secondary-btn"
          onClick={() => app.setShowMaterialModal(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function AnnouncementModal({ app }) {
  if (!app.showAnnouncementModal) return null;
  const classOptions = parseCommaList(
    app.profile?.requested_classes || app.profile?.user_class
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>📣 Post Announcement</h3>
        {app.isAdmin ? (
          <div className="class-selector">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <label
                style={{
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  color: "var(--text-muted)",
                }}
              >
                Select Classes
              </label>
              <button className="select-all-btn" onClick={app.selectAllAnnClasses}>
                {app.annSelectedClasses.length === AVAILABLE_CLASSES.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>
            <div className="class-checkbox-grid">
              {AVAILABLE_CLASSES.map((className) => (
                <label
                  key={className}
                  className={`class-checkbox-item ${
                    app.annSelectedClasses.includes(className) ? "checked" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={app.annSelectedClasses.includes(className)}
                    onChange={() => app.toggleAnnClass(className)}
                    style={{ display: "none" }}
                  />
                  {className}
                </label>
              ))}
            </div>
          </div>
        ) : (
          <select
            value={app.newAnn.className}
            onChange={(event) =>
              app.setNewAnn({ ...app.newAnn, className: event.target.value })
            }
          >
            <option value="">-- Class --</option>
            {classOptions.map((className) => (
              <option key={className} value={className}>{className}</option>
            ))}
          </select>
        )}
        <input
          placeholder="Title"
          value={app.newAnn.title}
          onChange={(event) =>
            app.setNewAnn({ ...app.newAnn, title: event.target.value })
          }
        />
        <textarea
          placeholder="Write your announcement here..."
          rows={4}
          style={{
            width: "100%",
            padding: "14px",
            marginBottom: "16px",
            border: "2px solid #f1f5f9",
            borderRadius: "12px",
            background: "#f8fafc",
            fontSize: "1rem",
            color: "var(--text-main)",
            resize: "vertical",
          }}
          value={app.newAnn.content}
          onChange={(event) =>
            app.setNewAnn({ ...app.newAnn, content: event.target.value })
          }
        />
        <button className="main-btn" onClick={app.handlePostAnnouncement}>
          Post
        </button>
        <button
          className="secondary-btn"
          onClick={() => app.setShowAnnouncementModal(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function AssignmentDetailsModal({ app }) {
  if (!app.showViewModal) return null;

  return (
    <div
      className="modal-overlay"
      onClick={() => app.setShowViewModal(false)}
    >
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <h2>{app.selectedEvent?.rawTitle}</h2>
        <p><strong>Subject:</strong> {app.selectedEvent?.subject}</p>
        <p><strong>Class:</strong> {app.selectedEvent?.className}</p>
        <p><strong>Due:</strong> {app.selectedEvent?.date}</p>
        {(app.profile?.role !== "student" || app.isAdmin) && (
          <button
            className="del-btn"
            onClick={() => app.removeAssignment(app.selectedEvent.id)}
          >
            Delete
          </button>
        )}
        <button
          className="secondary-btn"
          onClick={() => app.setShowViewModal(false)}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function WorkspaceModals({ app }) {
  return (
    <>
      <AssignmentModal app={app} />
      <MaterialModal app={app} />
      <AnnouncementModal app={app} />
      <AssignmentDetailsModal app={app} />
    </>
  );
}
