export default function ErrorToast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="error-toast">
      <span>⚠️ {message}</span>
      <button onClick={onClose} className="error-toast-close">✕</button>
    </div>
  );
}
