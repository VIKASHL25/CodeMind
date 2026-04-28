import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider }        from "./context/SocketContext";
import LoginPage                 from "./pages/LoginPage";
import HomePage                  from "./pages/HomePage";

function Main() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      height: "100vh", gap: 16, background: "var(--bg)"
    }}>
      <div style={{
        width: 44, height: 44,
        border: "3px solid var(--border)",
        borderTop: "3px solid var(--accent)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
      <p style={{ color: "var(--text2)", fontFamily: "'Syne', sans-serif", fontSize: 14 }}>
        Loading CodeMind...
      </p>
    </div>
  );

  return user ? <HomePage /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Main />
      </SocketProvider>
    </AuthProvider>
  );
}