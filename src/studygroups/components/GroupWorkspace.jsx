import { useMemo, useState } from "react";
import useStudyGroup from "../hooks/useStudyGroup";
import { studyGroupsService } from "../services/studyGroupsService";
import GroupChat from "./GroupChat";
import GroupSettings from "./GroupSettings";
import InviteMembers from "./InviteMembers";
import MembersPanel from "./MembersPanel";

const roleLabels = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

export default function GroupWorkspace({
  groupId,
  userId,
  showError,
  onBack,
  onChanged,
}) {
  const [tab, setTab] = useState("chat");
  const groupState = useStudyGroup(groupId, userId, showError);
  const memberIds = useMemo(
    () => new Set(groupState.members.map((member) => member.user_id)),
    [groupState.members]
  );

  if (groupState.loading || !groupState.group) {
    return <div className="study-group-loading">Loading group...</div>;
  }

  const leave = async () => {
    if (!window.confirm(`Leave "${groupState.group.name}"?`)) return;
    const { error } = await studyGroupsService.leave(groupId, userId);
    if (error) showError("Could not leave group: " + error.message);
    else {
      await onChanged();
      onBack();
    }
  };

  const tabs = [
    { id: "chat", label: "💬 Group Chat" },
    { id: "members", label: "👥 Members" },
    ...(groupState.canManage
      ? [{ id: "invite", label: "＋ Invite Members" }]
      : []),
    ...(groupState.isOwner
      ? [{ id: "settings", label: "⚙ Group Settings" }]
      : []),
  ];

  return (
    <div className="study-group-workspace">
      <button className="study-group-back" onClick={onBack}>
        ← Back to groups
      </button>

      <header className="study-group-hero">
        <div>
          <span className="study-group-subject">{groupState.group.subject}</span>
          <h2>{groupState.group.name}</h2>
          <p>{groupState.group.description}</p>
        </div>
        <div className="study-group-hero-meta">
          <span>{groupState.group.privacy === "public" ? "🌐 Public" : "🔒 Private"}</span>
          <span>{groupState.members.length} members</span>
          <span>{roleLabels[groupState.role] || groupState.role}</span>
        </div>
      </header>

      <div className="study-group-tabs" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.id}
            className={tab === item.id ? "active" : ""}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "chat" && (
        <GroupChat
          groupId={groupId}
          userId={userId}
          messages={groupState.messages}
          refreshMessages={groupState.refreshMessages}
          showError={showError}
        />
      )}
      {tab === "members" && (
        <MembersPanel
          groupId={groupId}
          members={groupState.members}
          isOwner={groupState.isOwner}
          currentUserId={userId}
          refreshMembers={groupState.refreshMembers}
          refreshGroup={groupState.refreshGroup}
          showError={showError}
          onOwnershipTransferred={() => setTab("members")}
        />
      )}
      {tab === "invite" && groupState.canManage && (
        <InviteMembers
          groupId={groupId}
          currentUserId={userId}
          memberIds={memberIds}
          showError={showError}
        />
      )}
      {tab === "settings" && groupState.isOwner && (
        <GroupSettings
          group={groupState.group}
          setGroup={groupState.setGroup}
          showError={showError}
          onDeleted={async () => {
            await onChanged();
            onBack();
          }}
        />
      )}

      {!groupState.isOwner && (
        <button className="study-group-leave" onClick={leave}>
          Leave Group
        </button>
      )}
    </div>
  );
}
