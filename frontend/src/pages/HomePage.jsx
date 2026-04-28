import { useState } from "react";
import { useAuth }  from "../context/AuthContext";
import CodeModePage from "./CodeModePage";
import DataModePage from "./DataModePage";

export default function HomePage() {
  const { user, logout } = useAuth();
  const [mode, setMode]  = useState("data");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("groqApiKey") || "");

  const handleApiKeyChange = (e) => {
    const val = e.target.value;
    setApiKey(val);
    localStorage.setItem("groqApiKey", val);
  };

  return (
    <div style={s.container}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.logoRow}>
          <span style={s.logoIcon}>⬡</span>
          <span style={s.logoText}>CodeMind</span>
        </div>

        <nav style={s.nav}>
          <p style={s.navLabel}>Workspace</p>

          <button onClick={() => setMode("code")}
            style={{ ...s.navBtn, ...(mode === "code" ? s.navActive : {}) }}>
            <span style={s.navIcon}>💻</span>
            <div>
              <div style={s.navTitle}>Code Intelligence</div>
              <div style={s.navSub}>Review, debug & audit</div>
            </div>
            {mode === "code" && <span style={s.navDot} />}
          </button>

          <button onClick={() => setMode("data")}
            style={{ ...s.navBtn, ...(mode === "data" ? s.navActive : {}) }}>
            <span style={s.navIcon}>📊</span>
            <div>
              <div style={s.navTitle}>Data Intelligence</div>
              <div style={s.navSub}>Analyze & visualize</div>
            </div>
            {mode === "data" && <span style={s.navDot} />}
          </button>
        </nav>

        <div style={s.apiBox}>
          <div style={s.apiHeader}>
            <p style={{...s.navLabel, marginBottom: 0}}>API Key Settings</p>
            <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={s.apiLink}>
              Get Key ↗
            </a>
          </div>
          <div style={s.apiInputWrapper}>
            <input 
              type="password" 
              placeholder="Groq API Key (Required)" 
              value={apiKey} 
              onChange={handleApiKeyChange}
              style={{
                ...s.apiInput, 
                borderColor: apiKey ? "var(--success)" : "var(--danger)",
                boxShadow: apiKey ? "none" : "0 0 0 1px var(--danger)"
              }}
            />
          </div>
          {!apiKey && <p style={s.apiWarning}>API Key is mandatory to run analysis.</p>}
        </div>

        <div style={s.statusBox}>
          <div style={s.statusRow}>
            <span style={s.statusDot} />
            <span style={s.statusText}>Groq llama3-70b</span>
          </div>
          <div style={s.statusLabel}>{apiKey ? "Ready" : "Waiting for API Key"}</div>
        </div>

        <div style={s.userBox}>
          <div style={s.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
          <div style={s.userInfo}>
            <div style={s.userName}>{user?.name}</div>
            <div style={s.userEmail}>{user?.email}</div>
          </div>
          <button onClick={logout} title="Logout" style={s.logoutBtn}>↩</button>
        </div>
      </aside>

      {/* Main */}
      <main style={s.main}>
        {mode === "code" ? <CodeModePage apiKey={apiKey} /> : <DataModePage apiKey={apiKey} />}
      </main>
    </div>
  );
}

const s = {
  container:  { display:"flex", height:"100vh", background:"var(--bg)" },
  sidebar:    { width:260, background:"var(--bg2)", borderRight:"1px solid var(--border)",
                display:"flex", flexDirection:"column", flexShrink:0 },
  logoRow:    { display:"flex", alignItems:"center", gap:10,
                padding:"24px 20px 20px", borderBottom:"1px solid var(--border)" },
  logoIcon:   { fontSize:24, color:"var(--accent)" },
  logoText:   { fontSize:18, fontWeight:800, fontFamily:"'Syne', sans-serif", color:"var(--text)" },
  nav:        { flex:1, padding:"20px 12px", display:"flex", flexDirection:"column", gap:4 },
  navLabel:   { fontSize:10, color:"var(--text3)", textTransform:"uppercase",
                letterSpacing:1, padding:"0 8px", marginBottom:8 },
  navBtn:     { display:"flex", alignItems:"center", gap:12, padding:"12px 10px",
                background:"none", border:"1px solid transparent", color:"var(--text2)",
                borderRadius:10, cursor:"pointer", textAlign:"left",
                transition:"all 0.15s", position:"relative" },
  navActive:  { background:"rgba(108,99,255,0.1)", border:"1px solid rgba(108,99,255,0.25)",
                color:"var(--text)" },
  navIcon:    { fontSize:20, flexShrink:0 },
  navTitle:   { fontSize:13, fontWeight:600 },
  navSub:     { fontSize:11, color:"var(--text3)", marginTop:1 },
  navDot:     { position:"absolute", right:12, width:6, height:6,
                background:"var(--accent)", borderRadius:"50%" },
  apiBox:     { padding:"16px 12px", margin:"0 12px 12px", background:"rgba(255,77,109,0.03)", borderRadius:10, border:"1px solid rgba(255,77,109,0.15)" },
  apiHeader:  { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 },
  apiLink:    { fontSize:10, color:"var(--accent)", textDecoration:"none", fontWeight:600, paddingRight:8 },
  apiInputWrapper: { padding:"0 8px" },
  apiInput:   { width:"100%", padding:"10px", borderRadius:6, border:"1px solid var(--border)", 
                background:"var(--bg)", color:"var(--text)", fontSize:12, outline:"none", boxSizing:"border-box", transition:"all 0.2s" },
  apiWarning: { fontSize:10, color:"var(--danger)", marginTop:8, padding:"0 8px", fontWeight:500 },
  statusBox:  { margin:"0 12px 12px", background:"rgba(0,212,170,0.05)",
                border:"1px solid rgba(0,212,170,0.15)", borderRadius:10, padding:"10px 14px" },
  statusRow:  { display:"flex", alignItems:"center", gap:6, marginBottom:2 },
  statusDot:  { width:7, height:7, background:"var(--accent2)",
                borderRadius:"50%", animation:"pulse 2s infinite" },
  statusText: { fontSize:12, fontWeight:600, color:"var(--accent2)" },
  statusLabel:{ fontSize:11, color:"var(--text3)" },
  userBox:    { display:"flex", alignItems:"center", gap:10,
                padding:"14px 16px", borderTop:"1px solid var(--border)" },
  avatar:     { width:34, height:34,
                background:"linear-gradient(135deg, var(--accent), var(--accent2))",
                borderRadius:"50%", display:"flex", alignItems:"center",
                justifyContent:"center", fontWeight:700, fontSize:14,
                color:"white", flexShrink:0 },
  userInfo:   { flex:1, overflow:"hidden" },
  userName:   { fontSize:13, fontWeight:600, color:"var(--text)",
                whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  userEmail:  { fontSize:11, color:"var(--text3)",
                whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  logoutBtn:  { background:"none", border:"none", color:"var(--text3)",
                cursor:"pointer", fontSize:16, padding:4, flexShrink:0 },
  main:       { flex:1, overflowY:"auto" }
};