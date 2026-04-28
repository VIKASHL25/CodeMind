import { useState } from "react";
import { login, signup } from "../api";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form,    setForm]    = useState({ name: "", email: "", password: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const { saveAuth }          = useAuth();

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    if (!form.email || !form.password) { setError("Please fill all fields"); return; }
    if (!isLogin && !form.name)        { setError("Please enter your name"); return; }
    setLoading(true);
    setError("");
    try {
      const res = isLogin
        ? await login({ email: form.email, password: form.password })
        : await signup(form);
      saveAuth(res.data.access_token, res.data.user);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.grid} />
      <div style={s.orb1} />
      <div style={s.orb2} />

      <div style={s.card} className="animate-slideUp">
        <div style={s.logoRow}>
          <div style={s.logoIcon}>⬡</div>
          <span style={s.logoText}>CodeMind</span>
        </div>

        <h1 style={s.headline}>{isLogin ? "Welcome back" : "Get started"}</h1>
        <p style={s.tagline}>AI-powered code review & data intelligence</p>

        {error && (
          <div style={s.errorBox}><span>⚠</span> {error}</div>
        )}

        <div style={s.form}>
          {!isLogin && (
            <div style={s.field}>
              <label style={s.label}>Full Name</label>
              <input name="name" placeholder="Vikas Kumar"
                value={form.name} onChange={handle} style={s.input} />
            </div>
          )}
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input name="email" type="email" placeholder="you@example.com"
              value={form.email} onChange={handle} style={s.input} />
          </div>
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input name="password" type="password" placeholder="••••••••"
              value={form.password} onChange={handle} style={s.input}
              onKeyDown={e => e.key === "Enter" && submit()} />
          </div>
        </div>

        <button onClick={submit} disabled={loading} style={s.btn}>
          {loading ? (
            <span style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"center" }}>
              <span style={s.btnSpinner} /> Please wait...
            </span>
          ) : (isLogin ? "Login →" : "Create Account →")}
        </button>

        <p style={s.switchText}>
          {isLogin ? "No account yet? " : "Already have an account? "}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(""); setForm({ name:"", email:"", password:"" }); }}
            style={s.switchBtn}>
            {isLogin ? "Sign up free" : "Login"}
          </button>
        </p>

        <div style={s.features}>
          {["🐛 Bug Detection","📊 Data Analysis","🔐 Security Audit","📈 Visual Charts"].map(f => (
            <div key={f} style={s.featurePill}>{f}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  page:       { position:"relative", display:"flex", alignItems:"center",
                justifyContent:"center", minHeight:"100vh",
                background:"var(--bg)", overflow:"hidden", padding:16 },
  grid:       { position:"absolute", inset:0,
                backgroundImage:"linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
                backgroundSize:"40px 40px", opacity:0.3 },
  orb1:       { position:"absolute", width:400, height:400, borderRadius:"50%",
                background:"radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)",
                top:-100, left:-100, pointerEvents:"none" },
  orb2:       { position:"absolute", width:300, height:300, borderRadius:"50%",
                background:"radial-gradient(circle, rgba(0,212,170,0.1) 0%, transparent 70%)",
                bottom:-80, right:-80, pointerEvents:"none" },
  card:       { position:"relative", background:"var(--card)", border:"1px solid var(--border)",
                borderRadius:20, padding:"40px 36px", width:"100%", maxWidth:420,
                boxShadow:"0 24px 80px rgba(0,0,0,0.5)" },
  logoRow:    { display:"flex", alignItems:"center", gap:10, marginBottom:28 },
  logoIcon:   { fontSize:28, color:"var(--accent)", fontFamily:"'Syne', sans-serif" },
  logoText:   { fontSize:20, fontWeight:800, fontFamily:"'Syne', sans-serif",
                color:"var(--text)", letterSpacing:-0.5 },
  headline:   { fontSize:28, fontWeight:800, fontFamily:"'Syne', sans-serif",
                color:"var(--text)", marginBottom:6, letterSpacing:-0.5 },
  tagline:    { fontSize:13, color:"var(--text2)", marginBottom:24 },
  errorBox:   { background:"rgba(255,77,109,0.1)", border:"1px solid rgba(255,77,109,0.3)",
                color:"#ff4d6d", padding:"10px 14px", borderRadius:8,
                fontSize:13, marginBottom:16, display:"flex", gap:8, alignItems:"center" },
  form:       { display:"flex", flexDirection:"column", gap:14, marginBottom:20 },
  field:      { display:"flex", flexDirection:"column", gap:6 },
  label:      { fontSize:12, color:"var(--text2)", fontWeight:500,
                textTransform:"uppercase", letterSpacing:0.5 },
  input:      { background:"var(--bg2)", border:"1px solid var(--border)",
                borderRadius:10, padding:"11px 14px", color:"var(--text)",
                fontSize:14, outline:"none", fontFamily:"inherit" },
  btn:        { width:"100%", padding:"13px", background:"var(--accent)",
                color:"white", border:"none", borderRadius:10, fontSize:15,
                fontWeight:700, fontFamily:"'Syne', sans-serif",
                cursor:"pointer", marginBottom:16,
                boxShadow:"0 4px 20px rgba(108,99,255,0.4)" },
  btnSpinner: { width:16, height:16, border:"2px solid rgba(255,255,255,0.3)",
                borderTop:"2px solid white", borderRadius:"50%",
                display:"inline-block", animation:"spin 0.7s linear infinite" },
  switchText: { textAlign:"center", fontSize:13, color:"var(--text2)", marginBottom:24 },
  switchBtn:  { background:"none", border:"none", color:"var(--accent)",
                cursor:"pointer", fontWeight:600, fontSize:13 },
  features:   { display:"flex", flexWrap:"wrap", gap:6 },
  featurePill:{ background:"var(--bg2)", border:"1px solid var(--border)",
                color:"var(--text2)", padding:"4px 10px", borderRadius:20, fontSize:11 }
};