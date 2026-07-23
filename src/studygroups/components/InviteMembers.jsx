import { useEffect, useState } from "react";
import { studyGroupsService } from "../services/studyGroupsService";

export default function InviteMembers({
  groupId,
  currentUserId,
  memberIds,
  showError,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);
      const { data, error } = await studyGroupsService.searchProfiles(
        query.trim(),
        currentUserId
      );
      setSearching(false);
      if (error) showError("Could not search users: " + error.message);
      else setResults((data || []).filter((profile) => !memberIds.has(profile.id)));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [currentUserId, memberIds, query, showError]);

  const invite = async (profile) => {
    setInviting(profile.id);
    const { error } = await studyGroupsService.invite(
      groupId,
      profile.id,
      currentUserId
    );
    setInviting(null);
    if (error) showError("Could not send invitation: " + error.message);
    else {
      setResults((current) => current.filter((item) => item.id !== profile.id));
      setQuery("");
    }
  };

  return (
    <div className="study-group-panel">
      <div className="study-group-panel-heading">
        <div>
          <span>Grow the group</span>
          <h3>Invite Members</h3>
        </div>
        <strong>＋</strong>
      </div>

      <label className="study-group-field">
        <span>Find a ScholarAsync user</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search people..."
        />
      </label>

      <div className="study-group-search-results">
        {searching && <p>Searching...</p>}
        {!searching && query.trim().length >= 2 && results.length === 0 && (
          <p>No matching users found.</p>
        )}
        {results.map((profile) => (
          <div className="study-group-search-result" key={profile.id}>
            <div>
              <strong>{profile.full_name || profile.email}</strong>
              <small>{profile.email} · {profile.role}</small>
            </div>
            <button
              className="main-btn"
              onClick={() => invite(profile)}
              disabled={inviting === profile.id}
            >
              Invite
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
