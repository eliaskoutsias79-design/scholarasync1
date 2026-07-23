import { useEffect, useState } from "react";
import { studyGroupsService } from "../services/studyGroupsService";

export default function GroupSettings({
  group,
  setGroup,
  showError,
  onDeleted,
}) {
  const [form, setForm] = useState(group);
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(group), [group]);
  if (!form) return null;

  const update = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));

  const save = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.description.trim() || !form.subject.trim()) {
      showError("Group name, description and subject are required.");
      return;
    }

    setSaving(true);
    const { data, error } = await studyGroupsService.updateGroup(group.id, form);
    setSaving(false);
    if (error) showError("Could not save group: " + error.message);
    else setGroup(data);
  };

  const remove = async () => {
    if (
      !window.confirm(
        `Delete "${group.name}" permanently? Messages and memberships will also be deleted.`
      )
    ) {
      return;
    }
    const { error } = await studyGroupsService.deleteGroup(group.id);
    if (error) showError("Could not delete group: " + error.message);
    else onDeleted();
  };

  return (
    <form className="study-group-panel study-group-settings" onSubmit={save}>
      <div className="study-group-panel-heading">
        <div>
          <span>Owner controls</span>
          <h3>Group Settings</h3>
        </div>
        <strong>⚙</strong>
      </div>

      <label className="study-group-field">
        <span>Group Name</span>
        <input
          value={form.name}
          onChange={(event) => update("name", event.target.value)}
          maxLength={100}
        />
      </label>
      <label className="study-group-field">
        <span>Description</span>
        <textarea
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
          rows={4}
          maxLength={1000}
        />
      </label>
      <div className="study-group-form-grid">
        <label className="study-group-field">
          <span>Subject</span>
          <input
            value={form.subject}
            onChange={(event) => update("subject", event.target.value)}
            maxLength={100}
          />
        </label>
        <label className="study-group-field">
          <span>Privacy</span>
          <select
            value={form.privacy}
            onChange={(event) => update("privacy", event.target.value)}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </label>
        <label className="study-group-field">
          <span>School</span>
          <input
            value={form.school || ""}
            onChange={(event) => update("school", event.target.value)}
            maxLength={160}
          />
        </label>
        <label className="study-group-field">
          <span>University</span>
          <input
            value={form.university || ""}
            onChange={(event) => update("university", event.target.value)}
            maxLength={160}
          />
        </label>
      </div>

      <button className="main-btn" type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save settings"}
      </button>

      <div className="study-group-danger-zone">
        <div>
          <strong>Delete group</strong>
          <p>This permanently removes the group, chat and memberships.</p>
        </div>
        <button type="button" className="del-btn" onClick={remove}>
          Delete group
        </button>
      </div>
    </form>
  );
}
