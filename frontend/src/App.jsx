import { useState, useEffect, useRef, useCallback } from "react";
import io from "socket.io-client";
import axios from "axios";
import "./App.css";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import AddConnectionModal from "./components/AddConnectionModal";
import EditProfileModal from "./components/EditProfileModal";

const socket = io.connect("http://localhost:5000");

function App() {
  const [myId, setMyId] = useState("");
  const [connections, setConnections] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState({});

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // New State Features
  const [localProfiles, setLocalProfiles] = useState({}); // { id: { nickname: '', avatar: '' } }
  const [unreadCounts, setUnreadCounts] = useState({}); // { id: count }

  const [pages, setPages] = useState({});
  const [hasMore, setHasMore] = useState({});
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Use a ref for active chat so the socket listener always knows exactly where you are
  const activeChatRef = useRef(activeChat);

  useEffect(() => {
    activeChatRef.current = activeChat;

    // Clear unread count when you open a chat (wrapped in async for the linter)
    const clearUnread = async () => {
      if (activeChat) {
        setUnreadCounts((prev) => ({ ...prev, [activeChat]: 0 }));
      }
    };

    clearUnread();
  }, [activeChat]);

  useEffect(() => {
    socket.on("your_id", (id) => setMyId(id));

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

      // If we are NOT currently looking at this chat, increment unread badge
      if (activeChatRef.current !== senderId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1,
        }));
      }
    });

    return () => {
      socket.off("your_id");
      socket.off("receive_message");
    };
  }, []);

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
  ); // The function now legally depends on myId

  // 2. Use an inner async function to prevent synchronous state updates
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
