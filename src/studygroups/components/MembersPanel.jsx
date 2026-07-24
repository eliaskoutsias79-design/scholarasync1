import { studyGroupsService } from "../services/studyGroupsService";

const roleLabel = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

export default function MembersPanel({
  groupId,
  members,
  isOwner,
  currentUserId,
  refreshMembers,
  refreshGroup,
  showError,
  onOwnershipTransferred,
}) {
  const run = async (operation, success) => {
    const { error } = await operation;
    if (error) showError("Could not update member: " + error.message);
    else {
      await Promise.all([refreshMembers(), refreshGroup()]);
      if (success) success();
    }
  };

  const setRole = (member, role) =>
    run(studyGroupsService.setMemberRole(groupId, member.user_id, role));

  const remove = (member) => {
    const name = member.profile?.full_name || member.profile?.email || "this member";
    if (!window.confirm(`Remove ${name} from this group?`)) return;
    run(studyGroupsService.removeMember(groupId, member.user_id));
  };

  const transfer = (member) => {
    const name = member.profile?.full_name || member.profile?.email || "this member";
    if (
      !window.confirm(
        `Transfer ownership to ${name}? You will become an admin.`
      )
    ) {
      return;
    }
    run(
      studyGroupsService.transferOwnership(groupId, member.user_id),
      onOwnershipTransferred
    );
  };

  return (
    <div className="study-group-panel">
      <div className="study-group-panel-heading">
        <div>
          <span>Community</span>
          <h3>Members</h3>
        </div>
        <strong>{members.length}</strong>
      </div>

      <div className="study-group-member-list">
        {members.map((member) => {
          const profile = member.profile || {};
          const initial = (profile.full_name || profile.email || "M")
            .charAt(0)
            .toUpperCase();
          const canEdit =
            isOwner &&
            member.user_id !== currentUserId &&
            member.role !== "owner";

          return (
            <div className="study-group-member" key={member.user_id}>
              <div className="study-group-member-avatar">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <div className="study-group-member-copy">
                <strong translate="no">{profile.full_name || profile.email || "Member"}</strong>
                <small translate="no">{profile.email}</small>
              </div>
              <span className={`study-group-role ${member.role}`}>
                {roleLabel[member.role]}
              </span>

              {canEdit && (
                <div className="study-group-member-actions">
                  <button
                    type="button"
                    onClick={() =>
                      setRole(member, member.role === "admin" ? "member" : "admin")
                    }
                  >
                    {member.role === "admin" ? "Remove admin" : "Make admin"}
                  </button>
                  <button type="button" onClick={() => transfer(member)}>
                    Transfer ownership
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => remove(member)}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
