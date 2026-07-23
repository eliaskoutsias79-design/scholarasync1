import { useState } from "react";
import GroupCard from "./components/GroupCard";
import GroupWorkspace from "./components/GroupWorkspace";
import useStudyGroups from "./hooks/useStudyGroups";
import "./studygroups.css";

export default function StudyGroups({ session, showError }) {
  const userId = session?.user?.id;
  const groups = useStudyGroups(userId, showError);
  const [tab, setTab] = useState("mine");
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [joining, setJoining] = useState(null);
  const [form, setForm] = useState(groups.emptyForm);

  if (selectedGroupId) {
    return (
      <GroupWorkspace
        groupId={selectedGroupId}
        userId={userId}
        showError={showError}
        onBack={() => setSelectedGroupId(null)}
        onChanged={groups.refresh}
      />
    );
  }

  const updateForm = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));

  const create = async (event) => {
    event.preventDefault();
    const group = await groups.createGroup(form);
    if (!group) return;
    setForm(groups.emptyForm);
    setSelectedGroupId(group.id);
  };

  const join = async (groupId) => {
    setJoining(groupId);
    const joined = await groups.joinGroup(groupId);
    setJoining(null);
    if (joined) setSelectedGroupId(groupId);
  };

  return (
    <div className="study-groups-page">
      <div className="study-groups-tabs" role="tablist">
        <button
          className={tab === "mine" ? "active" : ""}
          onClick={() => setTab("mine")}
        >
          My Groups
        </button>
        <button
          className={tab === "discover" ? "active" : ""}
          onClick={() => setTab("discover")}
        >
          Discover Groups
        </button>
        <button
          className={tab === "create" ? "active" : ""}
          onClick={() => setTab("create")}
        >
          Create Group
        </button>
      </div>

      {groups.loading ? (
        <div className="study-group-loading">Loading study groups...</div>
      ) : (
        <>
          {tab === "mine" && (
            <div className="study-groups-section">
              {groups.invitations.length > 0 && (
                <section className="study-group-invitations">
                  <div className="study-group-section-heading">
                    <div>
                      <span>Invitations</span>
                      <h2>Pending invitations</h2>
                    </div>
                    <strong>{groups.invitations.length}</strong>
                  </div>
                  {groups.invitations.map((invitation) => (
                    <div className="study-group-invitation" key={invitation.id}>
                      <div>
                        <strong>{invitation.group?.name}</strong>
                        <p>
                          {invitation.group?.subject}
                          {invitation.inviter?.full_name
                            ? ` · invited by ${invitation.inviter.full_name}`
                            : ""}
                        </p>
                      </div>
                      <div>
                        <button
                          className="main-btn"
                          onClick={() =>
                            groups.respondToInvitation(invitation.id, true)
                          }
                        >
                          Accept
                        </button>
                        <button
                          className="secondary-btn"
                          onClick={() =>
                            groups.respondToInvitation(invitation.id, false)
                          }
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </section>
              )}

              <div className="study-group-section-heading">
                <div>
                  <span>Your spaces</span>
                  <h2>My Groups</h2>
                </div>
                <strong>{groups.myGroups.length}</strong>
              </div>

              {groups.myGroups.length === 0 ? (
                <div className="study-group-empty">
                  <span>🧠</span>
                  <strong>No study groups yet.</strong>
                  <p>Create a group or discover a public one to get started.</p>
                  <button className="main-btn" onClick={() => setTab("discover")}>
                    Discover Groups
                  </button>
                </div>
              ) : (
                <div className="study-groups-grid">
                  {groups.myGroups.map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      joined
                      onOpen={(item) => setSelectedGroupId(item.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "discover" && (
            <div className="study-groups-section">
              <div className="study-group-section-heading">
                <div>
                  <span>Public community</span>
                  <h2>Discover Groups</h2>
                </div>
                <strong>{groups.publicGroups.length}</strong>
              </div>

              {groups.publicGroups.length === 0 ? (
                <div className="study-group-empty">
                  <span>🌐</span>
                  <strong>No public groups found.</strong>
                  <p>You can create the first public study group.</p>
                </div>
              ) : (
                <div className="study-groups-grid">
                  {groups.publicGroups.map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      joined={groups.joinedIds.has(group.id)}
                      onOpen={(item) => setSelectedGroupId(item.id)}
                      onJoin={join}
                      joining={joining === group.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "create" && (
            <form className="study-group-create" onSubmit={create}>
              <div className="study-group-section-heading">
                <div>
                  <span>New collaboration space</span>
                  <h2>Create Group</h2>
                </div>
                <strong>＋</strong>
              </div>

              <div className="study-group-form-grid">
                <label className="study-group-field full">
                  <span>Group Name *</span>
                  <input
                    value={form.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    maxLength={100}
                    required
                  />
                </label>
                <label className="study-group-field full">
                  <span>Description *</span>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                    rows={5}
                    maxLength={1000}
                    required
                  />
                </label>
                <label className="study-group-field">
                  <span>Subject *</span>
                  <input
                    value={form.subject}
                    onChange={(event) => updateForm("subject", event.target.value)}
                    maxLength={100}
                    required
                  />
                </label>
                <label className="study-group-field">
                  <span>Privacy</span>
                  <select
                    value={form.privacy}
                    onChange={(event) => updateForm("privacy", event.target.value)}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </label>
                <label className="study-group-field">
                  <span>School</span>
                  <input
                    value={form.school}
                    onChange={(event) => updateForm("school", event.target.value)}
                    maxLength={160}
                  />
                </label>
                <label className="study-group-field">
                  <span>University</span>
                  <input
                    value={form.university}
                    onChange={(event) =>
                      updateForm("university", event.target.value)
                    }
                    maxLength={160}
                  />
                </label>
              </div>

              <button className="main-btn" type="submit" disabled={groups.saving}>
                {groups.saving ? "Creating..." : "Create Group"}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
