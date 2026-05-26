import { useState, useRef, useEffect } from "react";

export default function ChatWindow({
  activeChat,
  messages,
  sendMessage,
  loadMore,
  hasMore,
  isLoadingHistory,
  localProfile,
  openEditProfile,
}) {
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!isLoadingHistory && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoadingHistory]);

  if (!activeChat) {
    return (
      <div className="main-window">
        <div className="empty-state">
          <div
            className="logo"
            style={{ color: "#EF4444", backgroundColor: "white" }}
          >
            !!
          </div>
          <h2 style={{ fontWeight: "600", marginBottom: "10px" }}>helloChat</h2>
          <p>Select a conversation or add a new connection</p>
        </div>
      </div>
    );
  }

  const chatMessages = messages[activeChat] || [];
  const displayName = localProfile?.nickname || `User ${activeChat}`;
  const displayAvatar = localProfile?.avatar || "👤";

  const handleSend = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendMessage(activeChat, inputText);
      setInputText("");
    }
  };

  const handleScroll = (e) => {
    if (e.target.scrollTop === 0 && hasMore && !isLoadingHistory) {
      loadMore(activeChat);
    }
  };

  return (
    <div className="main-window">
      {/* Updated Chat Header with Avatar and Edit Button */}
      <div
        style={{
          padding: "15px 20px",
          borderBottom: "1px solid #374151",
          backgroundColor: "#1F2937",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>{displayAvatar}</span>
          <div>
            <h3 style={{ fontSize: "1.1rem", margin: 0 }}>{displayName}</h3>
            <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
              ID: {activeChat}
            </span>
          </div>
        </div>
        <button
          className="add-btn"
          style={{ backgroundColor: "#374151" }}
          onClick={openEditProfile}
        >
          ✏️ Edit
        </button>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          padding: "20px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {isLoadingHistory && (
          <div
            style={{
              textAlign: "center",
              color: "#9CA3AF",
              fontSize: "0.8rem",
            }}
          >
            Loading older messages...
          </div>
        )}

        {chatMessages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.isMe ? "flex-end" : "flex-start",
              maxWidth: "70%",
            }}
          >
            <div
              style={{
                padding: "10px 15px",
                borderRadius: msg.isMe
                  ? "18px 18px 4px 18px"
                  : "18px 18px 18px 4px",
                backgroundColor: msg.isMe ? "#4F46E5" : "#374151",
                color: "white",
                fontSize: "0.95rem",
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={handleSend}
        style={{
          padding: "20px",
          backgroundColor: "#1F2937",
          display: "flex",
          gap: "10px",
        }}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: "12px 20px",
            borderRadius: "30px",
            border: "none",
            backgroundColor: "#111827",
            color: "white",
            outline: "none",
          }}
        />
        <button
          type="submit"
          className="add-btn"
          style={{ borderRadius: "50%", width: "45px", height: "45px" }}
        >
          ➤
        </button>
      </form>
    </div>
  );
}
