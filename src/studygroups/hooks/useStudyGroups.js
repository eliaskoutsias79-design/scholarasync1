import { useCallback, useEffect, useMemo, useState } from "react";
import { studyGroupsService } from "../services/studyGroupsService";

const EMPTY_FORM = {
  name: "",
  description: "",
  subject: "",
  school: "",
  university: "",
  privacy: "public",
};

export default function useStudyGroups(userId, showError) {
  const [myGroups, setMyGroups] = useState([]);
  const [publicGroups, setPublicGroups] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const [mine, publicResult, invitationResult] = await Promise.all([
      studyGroupsService.listMine(userId),
      studyGroupsService.listPublic(),
      studyGroupsService.listInvitations(userId),
    ]);

    const failure = mine.error || publicResult.error || invitationResult.error;
    if (failure) showError("Could not load study groups: " + failure.message);

    setMyGroups(
      (mine.data || [])
        .filter((membership) => membership.group)
        .map((membership) => ({
          ...membership.group,
          membershipRole: membership.role,
          joinedAt: membership.joined_at,
        }))
    );
    setPublicGroups(publicResult.data || []);
    setInvitations(invitationResult.data || []);
    setLoading(false);
  }, [showError, userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const joinedIds = useMemo(
    () => new Set(myGroups.map((group) => group.id)),
    [myGroups]
  );

  const createGroup = async (form) => {
    if (!form.name.trim() || !form.description.trim() || !form.subject.trim()) {
      showError("Group name, description and subject are required.");
      return null;
    }

    setSaving(true);
    const { data, error } = await studyGroupsService.create(userId, form);
    setSaving(false);
    if (error) {
      showError("Could not create group: " + error.message);
      return null;
    }
    await refresh();
    return data;
  };

  const joinGroup = async (groupId) => {
    const { error } = await studyGroupsService.join(groupId, userId);
    if (error) showError("Could not join group: " + error.message);
    else await refresh();
    return !error;
  };

  const respondToInvitation = async (invitationId, accept) => {
    const { error } = await studyGroupsService.respondToInvitation(
      invitationId,
      accept
    );
    if (error) showError("Could not update invitation: " + error.message);
    else await refresh();
  };

  return {
    myGroups,
    publicGroups,
    invitations,
    joinedIds,
    loading,
    saving,
    refresh,
    createGroup,
    joinGroup,
    respondToInvitation,
    emptyForm: EMPTY_FORM,
  };
}
