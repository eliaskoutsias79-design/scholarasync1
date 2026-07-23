import { useCallback, useEffect, useState } from "react";
import { studyGroupsService } from "../services/studyGroupsService";

export default function useStudyGroup(groupId, userId, showError) {
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshGroup = useCallback(async () => {
    if (!groupId) return;
    const { data, error } = await studyGroupsService.getGroup(groupId);
    if (error) showError("Could not load group: " + error.message);
    else setGroup(data);
  }, [groupId, showError]);

  const refreshMembers = useCallback(async () => {
    if (!groupId) return;
    const { data, error } = await studyGroupsService.getMembers(groupId);
    if (error) showError("Could not load group members: " + error.message);
    else setMembers(data || []);
  }, [groupId, showError]);

  const refreshMessages = useCallback(async () => {
    if (!groupId) return;
    const { data, error } = await studyGroupsService.getMessages(groupId);
    if (error) showError("Could not load group messages: " + error.message);
    else setMessages(data || []);
  }, [groupId, showError]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([refreshGroup(), refreshMembers(), refreshMessages()]).finally(
      () => active && setLoading(false)
    );
    return () => {
      active = false;
    };
  }, [refreshGroup, refreshMembers, refreshMessages]);

  useEffect(() => {
    if (!groupId) return undefined;
    return studyGroupsService.subscribeToMessages(groupId, refreshMessages);
  }, [groupId, refreshMessages]);

  const membership = members.find((member) => member.user_id === userId);
  const role = membership?.role || null;

  return {
    group,
    setGroup,
    members,
    messages,
    loading,
    role,
    isOwner: role === "owner",
    canManage: role === "owner" || role === "admin",
    refreshGroup,
    refreshMembers,
    refreshMessages,
  };
}
