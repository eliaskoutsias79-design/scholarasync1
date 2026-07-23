export default function LoadingScreen() {
  return (
    <div className="auth-container">
      <div className="text-logo">
        Scholar<span>Async</span>
      </div>
      <p
        style={{
          color: "white",
          marginTop: "10px",
          fontSize: "0.8rem",
          opacity: 0.7,
        }}
      >
        INITIALIZING SECURE SESSION...
      </p>
    </div>
  );
}
