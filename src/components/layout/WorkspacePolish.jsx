export default function WorkspacePolish() {
  return <style>{`
    .dashboard-layout { background: radial-gradient(circle at 100% 0%, #eeeaff 0, transparent 32%), #f6f7fc; }
    .main-content { background: transparent; }
    .page-surface { border: 1px solid rgba(119,87,232,.10); box-shadow: 0 12px 34px rgba(31,22,72,.06); }
    .calendar-card, .materials-container, .admin-panel, .profile-shell, .messaging-container { border-radius: 20px; }
    .materials-container, .admin-panel { padding: clamp(16px, 3vw, 28px); }
    .materials-container h2, .admin-panel h2 { letter-spacing: -.025em; }
    .materials-grid, .announcements-list, .task-grid { gap: 14px; }
    .material-card, .announcement-card, .task-item { border: 1px solid #eceaf6; border-radius: 16px; box-shadow: 0 6px 18px rgba(31,22,72,.045); transition: transform .18s ease, box-shadow .18s ease; }
    .material-card:hover, .announcement-card:hover, .task-item:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(31,22,72,.08); }
    .calendar-card { overflow: hidden; border: 1px solid #eceaf6; box-shadow: 0 8px 24px rgba(31,22,72,.05); }
    .chat-layout, .dm-layout, .dm-split, .profile-page { border-radius: 18px; overflow: hidden; border: 1px solid #eceaf6; box-shadow: 0 8px 24px rgba(31,22,72,.05); }
    .msg-tabs { padding: 6px; gap: 6px; background: #f7f6fc; border-radius: 14px; }
    .msg-tabs button { border-radius: 10px; }
    .chat-messages, .dm-chat { background: linear-gradient(180deg, #fff 0%, #fafaff 100%); }
    .chat-input-row { padding: 12px; background: #fff; border-top: 1px solid #eceaf6; }
    .chat-input-row input { border-radius: 12px; }
    .profile-hero-card, .profile-settings-card, .profile-summary-card { border: 1px solid #eceaf6; border-radius: 18px; box-shadow: 0 8px 24px rgba(31,22,72,.05); }
    .fc .fc-toolbar { padding: 16px 16px 0; gap: 10px; flex-wrap: wrap; }
    .fc .fc-toolbar-title { font-size: clamp(1rem, 4.5vw, 1.25rem); }
    .fc .fc-button { border-radius: 9px !important; border: 0 !important; box-shadow: none !important; }
    .fc .fc-daygrid-day-frame { min-height: 84px; }
    @media (max-width: 720px) {
      .dashboard-layout, .main-content { width: 100%; min-width: 0; box-sizing: border-box; }
      .main-content { padding-bottom: 82px; overflow-x: hidden; }
      .dashboard-topbar { width: 100%; box-sizing: border-box; padding: 16px 12px 12px; }
      .page-heading h1 { font-size: 1.35rem; }
      .page-heading p { font-size: .82rem; line-height: 1.4; max-width: 280px; }
      .topbar-actions .today-pill, .topbar-actions .topbar-profile { display: none; }
      .topbar-actions { width: 100%; justify-content: flex-start; }
      .profile-language-switcher button { font-size: 1rem; }
      .page-surface { width: calc(100% - 20px); max-width: calc(100% - 20px); box-sizing: border-box; margin: 0 auto; border-radius: 20px; min-height: calc(100dvh - 230px); }
      .materials-container, .admin-panel { padding: 16px; }
      .materials-container > div:first-child { align-items: flex-start !important; }
      .materials-container > div:first-child .main-btn { width: 100% !important; }
      .material-card, .announcement-card, .task-item { padding: 15px; }
      .material-card { align-items: flex-start; flex-direction: column; gap: 12px; }
      .material-card > div:last-child { width: 100%; }
      .material-card > div:last-child .main-btn { flex: 1; text-align: center; padding: 9px 12px !important; }
      .announcement-header { align-items: flex-start; gap: 9px; }
      .chat-layout, .dm-layout, .dm-split { min-height: calc(100dvh - 280px); border-radius: 14px; }
      .dm-sidebar { max-height: 150px; }
      .msg-tabs { margin-bottom: 12px; }
      .msg-tabs button { font-size: .78rem; padding: 9px 8px; }
      .profile-page { border: 0; box-shadow: none; }
      .profile-settings-grid { grid-template-columns: 1fr; gap: 14px; }
      .fc .fc-toolbar { justify-content: center; padding: 12px 8px 0; }
      .fc .fc-toolbar-chunk { display: flex; justify-content: center; }
      .fc .fc-button { padding: .42em .6em !important; font-size: .78rem !important; }
      .fc .fc-daygrid-day-frame { min-height: 58px; }
      .fc .fc-daygrid-day-number { font-size: .78rem; }
      .fc .fc-event { font-size: .66rem; padding: 1px 2px; }
    }
  `}</style>;
}
