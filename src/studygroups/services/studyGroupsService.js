import { supabase } from "../../supabaseClient";

export const studyGroupsService = {
  listMine(userId) {
    return supabase
      .from("study_group_members")
      .select("role, joined_at, group:study_groups(*)")
      .eq("user_id", userId)
      .order("joined_at", { ascending: false });
  },

  listPublic() {
    return supabase
      .from("study_groups")
      .select("*")
      .eq("privacy", "public")
      .order("created_at", { ascending: false });
  },

  listInvitations(userId) {
    return supabase
      .from("study_group_invites")
      .select(
        "*, group:study_groups(*), inviter:profiles!study_group_invites_invited_by_fkey(id, full_name, email)"
      )
      .eq("invited_user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
  },

  create(ownerId, input) {
    return supabase
      .from("study_groups")
      .insert([
        {
          owner_id: ownerId,
          name: input.name.trim(),
          description: input.description.trim(),
          subject: input.subject.trim(),
          school: input.school.trim() || null,
          university: input.university.trim() || null,
          privacy: input.privacy,
        },
      ])
      .select()
      .single();
  },

  join(groupId, userId) {
    return supabase.from("study_group_members").insert([
      { group_id: groupId, user_id: userId, role: "member" },
    ]);
  },

  leave(groupId, userId) {
    return supabase
      .from("study_group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);
  },

  getGroup(groupId) {
    return supabase
      .from("study_groups")
      .select("*")
      .eq("id", groupId)
      .single();
  },

  getMembers(groupId) {
    return supabase
      .from("study_group_members")
      .select(
        "group_id, user_id, role, joined_at, profile:profiles!study_group_members_user_id_fkey(id, full_name, email, avatar_url, role)"
      )
      .eq("group_id", groupId)
      .order("joined_at");
  },

  getMessages(groupId) {
    return supabase
      .from("study_group_messages")
      .select(
        "*, sender:profiles!study_group_messages_sender_id_fkey(id, full_name, avatar_url, role)"
      )
      .eq("group_id", groupId)
      .order("created_at");
  },

  sendMessage(groupId, senderId, content) {
    return supabase.from("study_group_messages").insert([
      {
        group_id: groupId,
        sender_id: senderId,
        content: content.trim(),
      },
    ]);
  },

  subscribeToMessages(groupId, onMessage) {
    const channel = supabase
      .channel(`study-group-chat-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "study_group_messages",
          filter: `group_id=eq.${groupId}`,
        },
        onMessage
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  },

  searchProfiles(query, currentUserId) {
    const escaped = query.replace(/[%_,]/g, "");
    return supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, role")
      .neq("id", currentUserId)
      .or(`full_name.ilike.%${escaped}%,email.ilike.%${escaped}%`)
      .limit(12);
  },

  invite(groupId, invitedUserId, invitedBy) {
    return supabase.from("study_group_invites").upsert(
      [
        {
          group_id: groupId,
          invited_user_id: invitedUserId,
          invited_by: invitedBy,
          status: "pending",
          responded_at: null,
        },
      ],
      { onConflict: "group_id,invited_user_id" }
    );
  },

  respondToInvitation(invitationId, accept) {
    return supabase.rpc("respond_to_study_group_invite", {
      p_invite_id: invitationId,
      p_accept: accept,
    });
  },

  updateGroup(groupId, updates) {
    return supabase
      .from("study_groups")
      .update({
        name: updates.name.trim(),
        description: updates.description.trim(),
        subject: updates.subject.trim(),
        school: updates.school.trim() || null,
        university: updates.university.trim() || null,
        privacy: updates.privacy,
      })
      .eq("id", groupId)
      .select()
      .single();
  },

  deleteGroup(groupId) {
    return supabase.from("study_groups").delete().eq("id", groupId);
  },

  setMemberRole(groupId, userId, role) {
    return supabase
      .from("study_group_members")
      .update({ role })
      .eq("group_id", groupId)
      .eq("user_id", userId);
  },

  removeMember(groupId, userId) {
    return supabase
      .from("study_group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);
  },

  transferOwnership(groupId, newOwnerId) {
    return supabase.rpc("transfer_study_group_ownership", {
      p_group_id: groupId,
      p_new_owner_id: newOwnerId,
    });
  },
};
