import { useEffect, useRef, useState } from "react";
import { studyGroupsService } from "../services/studyGroupsService";

export default function GroupChat({
  groupId,
  userId,
  messages,
  refreshMessages,
  showError,
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    const { error } = await studyGroupsService.sendMessage(
      groupId,
      userId,
      message
    );
    setSending(false);
    if (error) {
      showError("Could not send message: " + error.message);
      return;
    }
    setMessage("");
    await refreshMessages();
  };

  return (
    <div className="study-group-chat chat-layout">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="study-group-empty compact">
            <span>💬</span>
            <strong>No messages yet.</strong>
            <p>Start the first study conversation.</p>
          </div>
        )}
        {messages.map((item) => (
          <div
            key={item.id}
            className={`chat-bubble ${
              item.sender_id === userId ? "mine" : "theirs"
            }`}
          >
            <span className="bubble-name">
              {item.sender?.full_name || "Member"}
            </span>
            <div className="bubble-text">{item.content}</div>
            <span className="bubble-time">
              {new Date(item.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input-row">
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Type a message..."
          maxLength={4000}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) send();
          }}
        />
        <button
          className="main-btn"
          style={{ width: "auto", padding: "12px 20px" }}
          onClick={send}
          disabled={sending}
        >
          Send
        </button>
      </div>
    </div>
  );
}
