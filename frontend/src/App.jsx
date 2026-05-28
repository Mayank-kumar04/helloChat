import { useState, useEffect, useRef, useCallback } from "react";
import io from "socket.io-client";
import axios from "axios";
import "./App.css";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import AddConnectionModal from "./components/AddConnectionModal";
import EditProfileModal from "./components/EditProfileModal";

// 1. Check local storage BEFORE connecting to the socket
const getOrGenerateId = () => {
  let id = localStorage.getItem("helloChatId");
  if (!id) {
    id = Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem("helloChatId", id);
  }
  return id;
};

const myPersistentId = getOrGenerateId();

// 2. Pass the ID to the server during the initial handshake
const socket = io.connect("http://localhost:5000", {
  query: { userId: myPersistentId },
});

function App() {
  const [myId] = useState(myPersistentId);
  const [connections, setConnections] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set()); // Tracks green dots

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [localProfiles, setLocalProfiles] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [pages, setPages] = useState({});
  const [hasMore, setHasMore] = useState({});
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const activeChatRef = useRef(activeChat);

  // Load existing connections from localStorage on boot
  useEffect(() => {
    const loadSavedData = async () => {
      const savedConnections = JSON.parse(
        localStorage.getItem("helloChatConnections") || "[]",
      );
      const savedProfiles = JSON.parse(
        localStorage.getItem("helloChatProfiles") || "{}",
      );
      setConnections(savedConnections);
      setLocalProfiles(savedProfiles);
    };

    loadSavedData();
  }, []);

  // Save connections and profiles whenever they change
  useEffect(() => {
    localStorage.setItem("helloChatConnections", JSON.stringify(connections));
  }, [connections]);

  useEffect(() => {
    localStorage.setItem("helloChatProfiles", JSON.stringify(localProfiles));
  }, [localProfiles]);

  useEffect(() => {
    activeChatRef.current = activeChat;
    const clearUnread = async () => {
      if (activeChat) {
        setUnreadCounts((prev) => ({ ...prev, [activeChat]: 0 }));
      }
    };
    clearUnread();
  }, [activeChat]);

  useEffect(() => {
    // 3. Listen for the live list of online users from the server
    socket.on("active_users", (usersArray) => {
      setOnlineUsers(new Set(usersArray));
    });

    socket.on("receive_message", (data) => {
      const { senderId, text } = data;

      setConnections((prev) => {
        if (!prev.find((c) => c.id === senderId))
          return [...prev, { id: senderId }];
        return prev;
      });

      setMessages((prev) => ({
        ...prev,
        [senderId]: [...(prev[senderId] || []), { text, isMe: false }],
      }));

      if (activeChatRef.current !== senderId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1,
        }));
      }
    });

    return () => {
      socket.off("active_users");
      socket.off("receive_message");
    };
  }, []);

  // Handle Private Presence Subscriptions
  useEffect(() => {
    // 1. Extract just the IDs from your connections array
    const targetIds = connections.map((c) => c.id);

    if (targetIds.length > 0) {
      // 2. Tell the server who we want to watch, and get who is online right now
      socket.emit("subscribe_presence", targetIds, (currentlyOnline) => {
        setOnlineUsers(new Set(currentlyOnline));
      });
    }

    // 3. Listen for live updates when contacts open/close their tabs
    const handlePresenceUpdate = ({ userId, status }) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        if (status === "online") {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    };

    socket.on("presence_update", handlePresenceUpdate);

    return () => {
      socket.off("presence_update", handlePresenceUpdate);
    };
  }, [connections]); // Re-run this if we add a new connection!

  const fetchChatHistory = useCallback(
    async (targetId, page) => {
      setIsLoadingHistory(true);
      const roomId = [myId, targetId].sort().join("_");

      try {
        const response = await axios.get(
          `http://localhost:5000/api/messages/${roomId}?page=${page}`,
        );
        const history = response.data.map((msg) => ({
          text: msg.text,
          isMe: msg.senderId === myId,
        }));

        setMessages((prev) => {
          const existing = prev[targetId] || [];
          return { ...prev, [targetId]: [...history, ...existing] };
        });

        setPages((prev) => ({ ...prev, [targetId]: page }));
        setHasMore((prev) => ({ ...prev, [targetId]: history.length === 20 }));
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [myId],
  );

  useEffect(() => {
    const loadInitialChat = async () => {
      if (activeChat && !messages[activeChat]) {
        await fetchChatHistory(activeChat, 1);
      }
    };
    loadInitialChat();
  }, [activeChat, messages, fetchChatHistory]);

  const loadMore = (targetId) => {
    const nextPage = (pages[targetId] || 1) + 1;
    fetchChatHistory(targetId, nextPage);
  };

  const addConnection = (newId) => {
    if (newId === myId) return alert("You can't chat with yourself!");
    if (!connections.find((c) => c.id === newId)) {
      setConnections([...connections, { id: newId }]);
    }
    setActiveChat(newId);
  };

  const saveProfile = (id, nickname, avatar) => {
    setLocalProfiles((prev) => ({
      ...prev,
      [id]: { nickname, avatar },
    }));
  };

  const sendMessage = (targetId, text) => {
    const roomId = [myId, targetId].sort().join("_");
    socket.emit("send_private_message", {
      roomId,
      targetId,
      senderId: myId,
      text,
    });
    setMessages((prev) => ({
      ...prev,
      [targetId]: [...(prev[targetId] || []), { text, isMe: true }],
    }));
  };

  return (
    <div className="app-container">
      <Sidebar
        myId={myId}
        connections={connections}
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        openModal={() => setIsAddModalOpen(true)}
        localProfiles={localProfiles}
        unreadCounts={unreadCounts}
        onlineUsers={onlineUsers}
      />
      <ChatWindow
        activeChat={activeChat}
        messages={messages}
        sendMessage={sendMessage}
        loadMore={loadMore}
        hasMore={hasMore[activeChat]}
        isLoadingHistory={isLoadingHistory}
        localProfile={localProfiles[activeChat]}
        openEditProfile={() => setIsEditModalOpen(true)}
      />
      <AddConnectionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addConnection}
      />
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        targetId={activeChat}
        currentData={localProfiles[activeChat]}
        onSave={saveProfile}
      />
    </div>
  );
}

export default App;
