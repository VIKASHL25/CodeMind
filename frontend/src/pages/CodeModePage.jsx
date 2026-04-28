import { useState }    from "react";
import CodeEditor      from "../components/CodeEditor";
import AgentPanel      from "../components/AgentPanel";
import { useSocket }   from "../context/SocketContext";
import ReactMarkdown   from "react-markdown";
import remarkGfm       from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/atom-one-dark.css";

const QUICK_QUESTIONS = [
  "Find all bugs and fix them",
  "Review code quality and suggest improvements",
  "Find security vulnerabilities",
  "Generate documentation for all functions",
  "Review everything — bugs, security, quality, docs"
];

export default function CodeModePage({ apiKey }) {
  const { connectAndAnalyze }           = useSocket();
  const [code,          setCode]         = useState("");
  const [language,      setLanguage]     = useState("python");
  const [question,      setQuestion]     = useState("");
  const [agentStreams,  setAgentStreams]  = useState({});
  const [routingInfo,   setRoutingInfo]  = useState(null);
  const [finalResponse, setFinalResponse]= useState("");
  const [status,        setStatus]       = useState("idle");
  const [errorMsg,      setErrorMsg]     = useState("");

  const handleAnalyze = () => {
    if (!apiKey || !apiKey.trim()) { setErrorMsg("Please enter your Groq API Key in the Settings panel."); return; }
    if (!code.trim())     { setErrorMsg("Please enter some code first"); return; }
    if (!question.trim()) { setErrorMsg("Please enter a question"); return; }
    setStatus("analyzing"); setErrorMsg("");
    setAgentStreams({}); setRoutingInfo(null); setFinalResponse("");

    connectAndAnalyze(
      { mode:"code", question, code, language, api_key: apiKey },
      {
        onRouting: (data) => {
          setRoutingInfo({ reason: data.reason });
          const streams = {};
          data.agents.forEach(a => { streams[a] = { status:"streaming", content:"", timestamp:"" }; });
          setAgentStreams(streams);
        },
        onAgentComplete: (data) => {
          setAgentStreams(prev => ({
            ...prev,
            [data.agent]: { status:"complete", content:data.content, timestamp:data.timestamp }
          }));
        },
        onFinal:  (r)   => setFinalResponse(r),
        onDone:   ()    => setStatus("done"),
        onError:  (msg) => { setStatus("error"); setErrorMsg(msg); }
      }
    );
  };

  const reset = () => {
    setStatus("idle"); setAgentStreams({}); setRoutingInfo(null);
    setFinalResponse(""); setErrorMsg(""); setQuestion("");
  };

  return (
    <div style={s.page}>
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>💻 Code Intelligence</h1>
          <p style={s.pageSub}>Paste your code — agents will review, debug, audit & document it</p>
        </div>
        {status !== "idle" && (
          <button onClick={reset} style={s.resetBtn}>↺ New Analysis</button>
        )}
      </div>

      {errorMsg && <div style={s.errorBanner}>⚠ {errorMsg}</div>}

      <div style={s.layout}>
        {/* Left */}
        <div style={s.leftCol}>
          <CodeEditor code={code} onChange={setCode}
            language={language} onLanguageChange={setLanguage} />

          <div style={s.questionCard}>
            <label style={s.questionLabel}>What do you want to know?</label>
            <textarea
              placeholder="e.g. Find all bugs and security vulnerabilities..."
              value={question} onChange={e => setQuestion(e.target.value)}
              style={s.questionInput} rows={2} />
            <div style={s.quickRow}>
              {QUICK_QUESTIONS.map((q,i) => (
                <button key={i} onClick={() => setQuestion(q)} style={s.quickBtn}>{q}</button>
              ))}
            </div>
            <button onClick={handleAnalyze} disabled={status === "analyzing"}
              style={{ ...s.analyzeBtn, opacity: status === "analyzing" ? 0.7 : 1 }}>
              {status === "analyzing" ? (
                <span style={s.btnInner}><span style={s.btnSpinner} /> Agents working...</span>
              ) : "🚀 Analyze Code"}
            </button>
          </div>
        </div>

        {/* Right */}
        <div style={s.rightCol}>
          {status === "idle" && (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>🤖</div>
              <div style={s.emptyTitle}>Ready to analyze</div>
              <p style={s.emptyText}>
                Paste your code on the left, ask a question, and watch AI agents collaborate in real time
              </p>
              <div style={s.emptyFeatures}>
                {[["🐛","Bug Detection"],["👁️","Code Review"],["🔐","Security Audit"],["📝","Docs Generator"]].map(([icon,label]) => (
                  <div key={label} style={s.emptyFeature}><span>{icon}</span> {label}</div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(agentStreams).length > 0 && (
            <AgentPanel agentStreams={agentStreams} routingInfo={routingInfo} />
          )}
        </div>
      </div>

      {finalResponse && (
        <div style={s.reportFullWidth} className="animate-slideUp">
          <div style={s.reportHeader}>
            <span>🧠</span>
            <span style={s.reportTitle}>Final Analysis Report</span>
            <button onClick={() => navigator.clipboard.writeText(finalResponse)} style={s.copyBtn}>
              ⎘ Copy
            </button>
          </div>
          <div style={s.reportBodyFull}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                p: ({node, ...props}) => <p style={{margin: '0 0 14px 0', lineHeight: 1.8}} {...props} />,
                h1: ({node, ...props}) => <h1 style={{fontSize: '1.6em', marginTop: '24px', marginBottom: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '6px', color: 'var(--accent)'}} {...props} />,
                h2: ({node, ...props}) => <h2 style={{fontSize: '1.4em', marginTop: '24px', marginBottom: '14px', color: 'var(--text)'}} {...props} />,
                h3: ({node, ...props}) => <h3 style={{fontSize: '1.2em', marginTop: '20px', marginBottom: '12px'}} {...props} />,
                ul: ({node, ...props}) => <ul style={{marginTop: '0', marginBottom: '16px', paddingLeft: '24px'}} {...props} />,
                ol: ({node, ...props}) => <ol style={{marginTop: '0', marginBottom: '16px', paddingLeft: '24px'}} {...props} />,
                li: ({node, ...props}) => <li style={{marginBottom: '6px'}} {...props} />,
                pre: ({node, ...props}) => <pre style={{background: '#1e1e1e', padding: '16px', borderRadius: '8px', overflowX: 'auto', margin: '16px 0', border: '1px solid #333', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'}} {...props} />,
                code: ({node, inline, ...props}) => inline ? <code style={{background: 'var(--bg2)', padding: '3px 6px', borderRadius: '4px', color: '#ff7b72', border: '1px solid var(--border)'}} {...props} /> : <code {...props} />
              }}
            >
              {finalResponse}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page:          { padding:"28px 28px 40px", minHeight:"100vh" },
  pageHeader:    { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 },
  pageTitle:     { fontSize:22, fontWeight:800, fontFamily:"'Syne', sans-serif", color:"var(--text)", marginBottom:4 },
  pageSub:       { fontSize:13, color:"var(--text3)" },
  resetBtn:      { background:"var(--card)", border:"1px solid var(--border)",
                   color:"var(--text2)", borderRadius:8, padding:"8px 16px", cursor:"pointer", fontSize:13 },
  errorBanner:   { background:"rgba(255,77,109,0.1)", border:"1px solid rgba(255,77,109,0.3)",
                   color:"#ff4d6d", padding:"10px 16px", borderRadius:8, marginBottom:16, fontSize:13 },
  layout:        { display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, alignItems:"start" },
  leftCol:       { display:"flex", flexDirection:"column", gap:16 },
  rightCol:      { display:"flex", flexDirection:"column", gap:16 },
  questionCard:  { background:"var(--card)", border:"1px solid var(--border)", borderRadius:12, padding:16 },
  questionLabel: { display:"block", fontSize:11, color:"var(--text3)",
                   textTransform:"uppercase", letterSpacing:0.8, marginBottom:8 },
  questionInput: { width:"100%", background:"var(--bg2)", border:"1px solid var(--border)",
                   borderRadius:8, padding:"10px 12px", color:"var(--text)", fontSize:14,
                   resize:"vertical", fontFamily:"inherit", outline:"none",
                   marginBottom:10, boxSizing:"border-box" },
  quickRow:      { display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 },
  quickBtn:      { background:"var(--bg2)", border:"1px solid var(--border)",
                   color:"var(--text3)", borderRadius:20, padding:"4px 10px", fontSize:11, cursor:"pointer" },
  analyzeBtn:    { width:"100%", padding:"12px", background:"var(--accent)", color:"white",
                   border:"none", borderRadius:8, fontSize:14, fontWeight:700, cursor:"pointer",
                   fontFamily:"'Syne', sans-serif", boxShadow:"0 4px 16px rgba(108,99,255,0.35)" },
  btnInner:      { display:"flex", alignItems:"center", gap:8, justifyContent:"center" },
  btnSpinner:    { width:14, height:14, border:"2px solid rgba(255,255,255,0.3)",
                   borderTop:"2px solid white", borderRadius:"50%",
                   display:"inline-block", animation:"spin 0.7s linear infinite" },
  emptyState:    { background:"var(--card)", border:"1px solid var(--border)",
                   borderRadius:12, padding:"48px 32px", textAlign:"center" },
  emptyIcon:     { fontSize:52, marginBottom:14 },
  emptyTitle:    { fontSize:17, fontWeight:700, fontFamily:"'Syne', sans-serif",
                   color:"var(--text)", marginBottom:8 },
  emptyText:     { fontSize:13, color:"var(--text3)", lineHeight:1.6, marginBottom:20 },
  emptyFeatures: { display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center" },
  emptyFeature:  { background:"var(--bg2)", border:"1px solid var(--border)",
                   color:"var(--text2)", padding:"5px 12px", borderRadius:20, fontSize:12 },
  reportFullWidth: { marginTop: 24, background:"var(--card)", border:"1px solid var(--border)",
                   borderRadius:12, overflow:"hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" },
  reportCard:    { background:"var(--card)", border:"1px solid var(--border)",
                   borderRadius:12, overflow:"hidden" },
  reportHeader:  { display:"flex", alignItems:"center", gap:10, padding:"16px 20px",
                   borderBottom:"1px solid var(--border)", background:"var(--bg2)" },
  reportTitle:   { flex:1, fontSize:15, fontWeight:700, fontFamily:"'Syne', sans-serif", color:"var(--text)" },
  copyBtn:       { background:"var(--bg3)", border:"1px solid var(--border)",
                   color:"var(--text3)", borderRadius:6, padding:"4px 12px", fontSize:11, cursor:"pointer" },
  reportBody:    { padding:18, whiteSpace:"normal", fontSize:13, lineHeight:1.8,
                   color:"var(--text2)", fontFamily:"'Inter', sans-serif",
                   maxHeight:500, overflowY:"auto" },
  reportBodyFull:{ padding: "24px 32px", whiteSpace:"normal", fontSize:14, lineHeight:1.8,
                   color:"var(--text2)", fontFamily:"'Inter', sans-serif" }
};