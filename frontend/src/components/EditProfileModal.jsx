import { useState, useEffect } from "react";

const ANIMAL_AVATARS = ["🐶", "🐱", "🦊", "🐻", "🐼", "🐨", "🦁", "🐯", "🐸"];

export default function EditProfileModal({
  isOpen,
  onClose,
  targetId,
  currentData,
  onSave,
}) {
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("");

  // Pre-fill the form when it opens
  useEffect(() => {
    const initializeForm = async () => {
      if (isOpen) {
        setNickname(currentData?.nickname || `User ${targetId}`);
        setAvatar(currentData?.avatar || "👤");
      }
    };

    initializeForm();
  }, [isOpen, currentData, targetId]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(targetId, nickname, avatar);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{ flexDirection: "column", width: "300px" }}
      >
        <h3 style={{ marginBottom: "10px" }}>Edit Contact</h3>

        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Enter nickname..."
          maxLength={20}
        />

        <div className="avatar-grid">
          {ANIMAL_AVATARS.map((emoji) => (
            <div
              key={emoji}
              className={`avatar-option ${avatar === emoji ? "selected" : ""}`}
              onClick={() => setAvatar(emoji)}
            >
              {emoji}
            </div>
          ))}
        </div>

        <button type="submit" className="add-btn" style={{ width: "100%" }}>
          Save Changes
        </button>
      </form>
    </div>
  );
}
