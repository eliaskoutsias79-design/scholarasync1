import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function AdminPanel({ fetchProfile, showError }) {
  const [users, setUsers] = useState([]);
  const [savingId, setSavingId] = useState("");
  
  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("is_approved", { ascending: true });

    if (error) {
      console.error("Failed to load users:", error.message);
      showError("Failed to load users: " + error.message);
      return;
    }

    setUsers(data || []);
  }, [showError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleApproval = async (user) => {
    setSavingId(user.id);
    const { error } = await supabase
      .from("profiles")
      .update({ is_approved: !user.is_approved })
      .eq("id", user.id);
    setSavingId("");

    if (error) {
      showError("Could not update user access: " + error.message);
      return;
    }

    await Promise.all([fetchUsers(), fetchProfile()]);
  };
  
  return (
    <div className="admin-panel">
      <h2>User Management</h2>
      <div className="task-grid">
        {users.map(u => (
          <div key={u.id} className="task-item">
            <div className="task-info">
              <strong translate="no">{u.full_name || u.email}</strong>
              <p translate="no" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</p>
              <p><span translate="no">{u.role}</span> | <span translate="no">{u.user_class || "No Class Assigned"}</span></p>
              <span className={`status-badge ${u.is_approved ? 'status-approved' : 'status-pending'}`}>{u.is_approved ? "Approved ✅" : "Pending ⏳"}</span>
            </div>
            <button
              type="button"
              className="main-btn"
              disabled={savingId === u.id}
              onClick={() => toggleApproval(u)}
            >
              {savingId === u.id
                ? "Saving..."
                : u.is_approved
                  ? "Revoke Access"
                  : "Approve User"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
