import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";

export default function MessagingView({ profile, session, isAdmin, showError }) {
  const [activeTab, setActiveTab] = useState("class");
  const [classMessages, setClassMessages] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMsg, setNewMsg] = useState("");
  const [newDM, setNewDM] = useState("");
  const bottomRef = useRef(null);
  const dmBottomRef = useRef(null);

  const myClass = profile?.user_class;
  const myClasses = (profile?.requested_classes || "").split(",").map(c => c.trim()).filter(Boolean);
  const [selectedClass, setSelectedClass] = useState(myClass || myClasses[0] || "");

  useEffect(() => {
    if (activeTab === "class" && selectedClass) fetchClassMessages(selectedClass);
  }, [activeTab, selectedClass]);

  useEffect(() => {
    if (activeTab === "direct") fetchStudents();
  }, [activeTab]);

  useEffect(() => {
    if (selectedStudent) fetchDMs(selectedStudent.id);
  }, [selectedStudent]);

  useEffect(() => {
    if (!selectedClass) return;
    const channel = supabase
      .channel("class-chat-" + selectedClass)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          if (payload.new.class_name === selectedClass && payload.new.is_class_chat) {
            fetchClassMessages(selectedClass);
          }
        }
      ).subscribe();
    return () => supabase.removeChannel(channel);
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedStudent) return;
    const channel = supabase
      .channel(`dm-${session.user.id}-${selectedStudent.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new;
          const isRelevant =
            (msg.sender_id === session.user.id && msg.receiver_id === selectedStudent.id) ||
            (msg.sender_id === selectedStudent.id && msg.receiver_id === session.user.id);
          if (isRelevant && !msg.is_class_chat) {
             setDirectMessages(prev => [...prev, msg]);
          }
        }
      ).subscribe();
    return () => supabase.removeChannel(channel);
  }, [selectedStudent, session?.user?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [classMessages]);
  useEffect(() => { dmBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [directMessages]);

  const fetchClassMessages = async (cls) => {
    const { data, error } = await supabase
      .from("messages").select("*, sender:profiles(full_name, role)")
      .eq("class_name", cls).eq("is_class_chat", true).order("created_at");
    if (error) showError("Failed to load messages.");
    else setClassMessages(data || []);
  };

  const fetchStudents = async () => {
    let query = supabase.from("profiles").select("*").eq("role", "student");
    if (!isAdmin && myClasses.length > 0) query = query.in("user_class", myClasses);
    const { data } = await query;
    setStudents(data || []);
  };

  const fetchDMs = async (otherId) => {
    if (!otherId || !session?.user?.id) return;
    const { data, error } = await supabase
      .from("messages")
      .select("*") 
      .eq("is_class_chat", false)
      .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${session.user.id})`)
      .order("created_at");

    if (error) {
      console.error("DM Error:", error.message);
      showError("DM Fetch Failed: " + error.message);
    } else {
      setDirectMessages(data || []);
    }
  };

  const sendClassMessage = async () => {
    if (!newMsg.trim()) return;
    const { error } = await supabase.from("messages").insert([{
      sender_id: session.user.id, 
      class_name: selectedClass,
      content: newMsg.trim(), 
      is_class_chat: true,
    }]);
    if (error) {
      showError("Send failed: " + error.message);
      return;
    }
    setNewMsg("");
  };

  const sendDM = async () => {
    if (!newDM.trim() || !selectedStudent) return;
    const { error } = await supabase.from("messages").insert([{
      sender_id: session.user.id, 
      receiver_id: selectedStudent.id,
      content: newDM.trim(), 
      is_class_chat: false,
    }]);
    if (error) {
      showError("Send failed: " + error.message);
      return;
    }
    setNewDM("");
  };

  const filteredStudents = students.filter(s =>
    (s.full_name || s.email).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canClassChat = profile?.role === "teacher" || profile?.role === "student" || isAdmin;
  const canDM = profile?.role === "teacher" || isAdmin;

  return (
    <div className="messaging-container">
      <div className="msg-tabs">
        <button className={activeTab === "class" ? "msg-tab active" : "msg-tab"} onClick={() => setActiveTab("class")}>🏫 Class Chat</button>
        {(canDM || profile?.role === "student") && (
          <button className={activeTab === "direct" ? "msg-tab active" : "msg-tab"} onClick={() => setActiveTab("direct")}>✉️ Direct Messages</button>
        )}
      </div>

      {activeTab === "class" && (
        <div className="chat-layout">
          {(profile?.role === "teacher" || isAdmin) && myClasses.length > 1 && (
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ marginBottom: '16px', padding: '10px', borderRadius: '10px', border: '2px solid #e2e8f0', width: '100%' }}>
              {myClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <div className="chat-messages">
            {classMessages.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>No messages yet. Say hello! 👋</p>}
            {classMessages.map(m => (
              <div key={m.id} className={`chat-bubble ${m.sender_id === session.user.id ? "mine" : "theirs"}`}>
                <span className="bubble-name">{m.sender?.full_name || "Unknown"} {m.sender?.role === "teacher" ? "👩‍🏫" : m.sender?.role === "student" ? "🎓" : "🛡️"}</span>
                <div className="bubble-text">{m.content}</div>
                <span className="bubble-time">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          {canClassChat && (
            <div className="chat-input-row">
              <input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message..." onKeyDown={e => e.key === "Enter" && sendClassMessage()} />
              <button className="main-btn" style={{ width: 'auto', padding: '12px 20px' }} onClick={sendClassMessage}>Send</button>
            </div>
          )}
        </div>
      )}

      {activeTab === "direct" && (
        <div className="dm-layout">
          {profile?.role === "student" ? (
             <StudentDMView profile={profile} session={session} showError={showError} />
          ) : (
            <div className="dm-split">
              <div className="dm-sidebar">
                <input
                  placeholder="🔍 Search students..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '2px solid #e2e8f0', marginBottom: '12px', fontSize: '0.9rem' }}
                />
                <div className="student-list">
                  {filteredStudents.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>No students found.</p>}
                  {filteredStudents.map(s => (
                    <div key={s.id} className={`student-item ${selectedStudent?.id === s.id ? "selected" : ""}`} onClick={() => setSelectedStudent(s)}>
                      <strong>{s.full_name || s.email}</strong>
                      <small>{s.user_class}</small>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dm-chat">
                {!selectedStudent ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                    ← Select a student to start chatting
                  </div>
                ) : (
                  <>
                    <div className="dm-header">
                      <strong>{selectedStudent.full_name || selectedStudent.email}</strong>
                      <small>{selectedStudent.user_class}</small>
                    </div>
                    <div className="chat-messages">
                      {directMessages.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>No messages yet.</p>}
                      {directMessages.map(m => (
                        <div key={m.id} className={`chat-bubble ${m.sender_id === session.user.id ? "mine" : "theirs"}`}>
                          <div className="bubble-text">{m.content}</div>
                          <span className="bubble-time">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ))}
                      <div ref={dmBottomRef} />
                    </div>
                    <div className="chat-input-row">
                      <input value={newDM} onChange={e => setNewDM(e.target.value)} placeholder={`Message ${selectedStudent.full_name || "student"}...`} onKeyDown={e => e.key === "Enter" && sendDM()} />
                      <button className="main-btn" style={{ width: 'auto', padding: '12px 20px' }} onClick={sendDM}>Send</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StudentDMView({ profile, session, showError }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => { fetchConversations(); }, []);
  useEffect(() => { if (selectedConvo) fetchMessages(selectedConvo.id); }, [selectedConvo]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const channel = supabase.channel("student-dm-global")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new;
        if (selectedConvo) {
          const isRelevant =
            (msg.sender_id === session.user.id && msg.receiver_id === selectedConvo.id) ||
            (msg.sender_id === selectedConvo.id && msg.receiver_id === session.user.id);
          if (isRelevant && !msg.is_class_chat) setMessages(prev => [...prev, msg]);
        }
        if (msg.receiver_id === session.user.id) {
          fetchConversations();
        }
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [selectedConvo]);

  const fetchConversations = async () => {
    const { data } = await supabase
      .from("messages")
      .select("sender_id, receiver_id")
      .eq("is_class_chat", false)
      .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`);

    if (!data) {
      setConversations([]);
      return;
    }

    const otherIds = [...new Set(
      data.map(m => m.sender_id === session.user.id ? m.receiver_id : m.sender_id)
    )].filter(Boolean);

    if (otherIds.length === 0) {
      setConversations([]);
      return;
    }

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .in("id", otherIds)
      .neq("role", "student");

    if (error) {
      showError("Failed to load conversations.");
      return;
    }

    setConversations(profiles || []);
  };

  const fetchMessages = async (otherId) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("is_class_chat", false)
      .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${session.user.id})`)
      .order("created_at");
    if (error) showError("Failed to load messages.");
    else setMessages(data || []);
  };

  const sendMsg = async () => {
    if (!newMsg.trim() || !selectedConvo) return;
    const { error } = await supabase.from("messages").insert([{ 
      sender_id: session.user.id, 
      receiver_id: selectedConvo.id, 
      content: newMsg.trim(), 
      is_class_chat: false 
    }]);

    if (error) {
      showError("Send failed: " + error.message);
      return;
    }

    setNewMsg("");
  };

  return (
    <div className="dm-split">
      <div className="dm-sidebar">
        <p style={{ fontWeight: 700, marginBottom: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>YOUR TEACHERS</p>
        {conversations.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No conversations yet.</p>}
        {conversations.map(c => (
          <div key={c.id} className={`student-item ${selectedConvo?.id === c.id ? "selected" : ""}`} onClick={() => setSelectedConvo(c)}>
            <strong>{c.full_name || c.email}</strong>
            <small>{c.role}</small>
          </div>
        ))}
      </div>
      <div className="dm-chat">
        {!selectedConvo ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>← Select a conversation</div>
        ) : (
          <>
            <div className="dm-header"><strong>{selectedConvo.full_name || selectedConvo.email}</strong><small>{selectedConvo.role}</small></div>
            <div className="chat-messages">
              {messages.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>No messages yet.</p>}
              {messages.map(m => (
                <div key={m.id} className={`chat-bubble ${m.sender_id === session.user.id ? "mine" : "theirs"}`}>
                  <div className="bubble-text">{m.content}</div>
                  <span className="bubble-time">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="chat-input-row">
              <input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Reply..." onKeyDown={e => e.key === "Enter" && sendMsg()} />
              <button className="main-btn" style={{ width: 'auto', padding: '12px 20px' }} onClick={sendMsg}>Send</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// AUXILIARY COMPONENTS & TOASTS
// ============================================================
