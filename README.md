# !! helloChat

A full-stack, real-time messaging application featuring 1-to-1 private chat routing, local profile management, and infinite-scrolling message history.

Designed with a modern, split-pane desktop UI and engineered for low-latency communication using WebSockets and MongoDB.

## ✨ Features

- **Real-Time Communication:** Instant, bi-directional message delivery powered by Socket.io.
- **Private 1-to-1 Routing:** Users are assigned unique 6-character IDs. Messages are routed securely to private socket rooms.
- **Infinite Scroll (Pagination):** Optimized database querying fetches chat history in chunks of 20 messages as the user scrolls, preventing browser overload on massive chat logs.
- **Local Address Book:** Users can customize their contacts with local nicknames and a selection of 9 animal avatars without requiring a centralized user database.
- **Unread Message Badges:** Background listeners track incoming messages and update UI notification counters in real-time.
- **Modern Desktop UI:** A responsive, dual-pane glassmorphism interface built purely with CSS, avoiding heavy component libraries.

## 🛠️ Tech Stack

**Frontend:**

- React.js (Vite)
- Socket.io-client
- Axios (for REST API requests)
- Custom CSS (Flexbox/Grid architecture)

**Backend:**

- Node.js & Express.js
- Socket.io (WebSocket engine)
- MongoDB & Mongoose (Data persistence)
- Cors & Dotenv

## 🚀 Getting Started

Follow these instructions to set up the project locally on your machine.

### Prerequisites

- [Node.js](https://nodejs.org/) installed on your machine
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally (default port 27017)

helloChat/
├── backend/
│ ├── models/
│ │ └── Message.js # Mongoose schema for chat persistence
│ ├── server.js # Express server and Socket.io room logic
│ └── .env # Environment configurations
│
└── frontend/
├── src/
│ ├── components/
│ │ ├── AddConnectionModal.jsx
│ │ ├── ChatWindow.jsx
│ │ ├── EditProfileModal.jsx
│ │ └── Sidebar.jsx
│ ├── App.jsx # Main application state and socket listeners
│ ├── App.css # Global styles and split-pane layout
│ └── main.jsx # React DOM entry point
└── index.html # HTML template with custom SVG favicon

### 1. Installation

Clone the repository and install dependencies for both the frontend and backend.

```bash
# Navigate to the backend and install dependencies
cd backend
npm install

# Navigate to the frontend and install dependencies
cd ../frontend
npm install
```
