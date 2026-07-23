import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function AdminPanel({ fetchProfile }) {
  const [users, setUsers] = useState([]);
  useEffect(() => { fetchUsers(); }, []);
  
  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("is_approved", { ascending: true });

    if (error) {
      console.error("Failed to load users:", error.message);
      return;
    }

    setUsers(data || []);
  };
  
  return (
    <div className="admin-panel">
      <h2>User Management</h2>
      <div className="task-grid">
        {users.map(u => (
          <div key={u.id} className="task-item">
            <div className="task-info">
              <strong>{u.full_name || u.email}</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</p>
              <p>{u.role} | {u.user_class || "No Class Assigned"}</p>
              <span className={`status-badge ${u.is_approved ? 'status-approved' : 'status-pending'}`}>{u.is_approved ? "Approved ✅" : "Pending ⏳"}</span>
            </div>
            <button className="main-btn" onClick={async () => {
              await supabase.from("profiles").update({ is_approved: !u.is_approved }).eq("id", u.id);
              fetchUsers(); fetchProfile();
            }}>{u.is_approved ? "Revoke Access" : "Approve User"}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
