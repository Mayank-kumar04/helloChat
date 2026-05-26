export default function Sidebar({
  myId,
  connections,
  activeChat,
  setActiveChat,
  openModal,
  localProfiles,
  unreadCounts,
}) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="brand">
          <div className="logo">!!</div>
          <span className="app-name">helloChat</span>
        </div>
        <button className="add-btn" onClick={openModal}>
          + Add
        </button>
      </div>

      <div
        style={{ padding: "10px 20px", fontSize: "0.8rem", color: "#9CA3AF" }}
      >
        My ID: <span style={{ color: "white" }}>{myId}</span>
      </div>

      <div className="connections-list">
        {connections.map((conn) => {
          const profile = localProfiles[conn.id] || {
            nickname: `User ${conn.id}`,
            avatar: "👤",
          };
          const unread = unreadCounts[conn.id] || 0;

          return (
            <div
              key={conn.id}
              className={`connection-item ${activeChat === conn.id ? "active" : ""}`}
              onClick={() => setActiveChat(conn.id)}
            >
              <div
                style={{ fontSize: "24px", width: "40px", textAlign: "center" }}
              >
                {profile.avatar}
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", flex: 1 }}
              >
                <div style={{ fontWeight: "600" }}>{profile.nickname}</div>
                <div style={{ fontSize: "0.8rem", color: "#9CA3AF" }}>
                  Click to chat...
                </div>
              </div>

              {/* Unread Badge Logic */}
              {unread > 0 && (
                <div className="unread-badge">
                  {unread} {unread === 1 ? "New" : "New"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
