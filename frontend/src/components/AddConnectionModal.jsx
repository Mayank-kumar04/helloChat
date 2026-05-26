export default function AddConnectionModal({ isOpen, onClose, onAdd }) {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const id = e.target.elements.newId.value.trim();
    if (id) {
      onAdd(id);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          name="newId"
          placeholder="Enter unique ID..."
          autoFocus
        />
        <button type="submit" className="add-btn">
          Add
        </button>
      </form>
    </div>
  );
}
