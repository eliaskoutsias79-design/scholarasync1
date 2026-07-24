export default function GroupCard({
  group,
  joined,
  onOpen,
  onJoin,
  joining,
}) {
  return (
    <article className="study-group-card">
      <div className="study-group-card-top">
        <span className="study-group-subject" translate="no">{group.subject}</span>
        <span className={`study-group-privacy ${group.privacy}`}>
          {group.privacy === "public" ? "🌐 Public" : "🔒 Private"}
        </span>
      </div>
      <h3 translate="no">{group.name}</h3>
      <p translate="no">{group.description}</p>
      <div className="study-group-location" translate="no">
        {[group.school, group.university].filter(Boolean).join(" · ") ||
          "ScholarAsync community"}
      </div>
      <div className="study-group-card-actions">
        {joined ? (
          <button className="main-btn" onClick={() => onOpen(group)}>
            Open Group
          </button>
        ) : (
          <button
            className="main-btn"
            onClick={() => onJoin(group.id)}
            disabled={joining}
          >
            Join Group
          </button>
        )}
      </div>
    </article>
  );
}
