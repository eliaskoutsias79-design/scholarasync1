import { signOut } from "../../services/authService";

export default function ApprovalPending() {
  const handleLogout = async () => {
    await signOut();
    window.location.reload();
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="text-logo" style={{ fontSize: "1.5rem" }}>
          Scholar<span>Async</span>
        </div>
        <div className="approval-status" style={{ marginTop: "20px" }}>
          <h2>⏳ Approval Pending</h2>
          <p>Contact your administrator to verify your account.</p>
        </div>
        <button className="main-btn" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}
