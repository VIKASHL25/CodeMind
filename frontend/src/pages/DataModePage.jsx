import { useState }   from "react";
import DataUploader   from "../components/DataUploader";
import AgentPanel     from "../components/AgentPanel";
import ChartRenderer  from "../components/ChartRenderer";
import { useSocket }  from "../context/SocketContext";
import ReactMarkdown   from "react-markdown";
import remarkGfm       from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

const QUICK_QUESTIONS = [
  "Show me overall trends and key patterns",
  "Find outliers and anomalies in the data",
  "What are the top performing categories?",
  "Show correlations between numeric columns",
  "Give me a complete statistical analysis"
];

export default function DataModePage({ apiKey }) {
  const { connectAndAnalyze }             = useSocket();
  const [file,          setFile]           = useState(null);
  const [csvText,       setCsvText]        = useState("");
  const [question,      setQuestion]       = useState("");
  const [agentStreams,  setAgentStreams]    = useState({});
  const [routingInfo,   setRoutingInfo]    = useState(null);
  const [charts,        setCharts]         = useState([]);
  const [pandasCode,    setPandasCode]     = useState("");
  const [finalResponse, setFinalResponse]  = useState("");
  const [status,        setStatus]         = useState("idle");
  const [errorMsg,      setErrorMsg]       = useState("");
  const [showCode,      setShowCode]       = useState(false);

  const handleFileChange = (selectedFile, text) => {
    setFile(selectedFile);
    setCsvText(text || "");
  };

  const handleAnalyze = () => {
    if (!apiKey || !apiKey.trim()) { setErrorMsg("Please enter your Groq API Key in the Settings panel."); return; }
    if (!file)            { setErrorMsg("Please upload a CSV file first"); return; }
    if (!question.trim()) { setErrorMsg("Please enter a question"); return; }
    setStatus("analyzing"); setErrorMsg("");
    setAgentStreams({}); setRoutingInfo(null);
    setCharts([]); setPandasCode(""); setFinalResponse("");

    connectAndAnalyze(
      { mode:"data", question, csv_data:csvText, filename:file.name, api_key: apiKey },
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
        onCharts:  (data) => { setCharts(data.chart_configs || []); setPandasCode(data.pandas_code || ""); },
        onFinal:   (r)    => setFinalResponse(r),
        onDone:    ()     => setStatus("done"),
        onError:   (msg)  => { setStatus("error"); setErrorMsg(msg); }
      }
    );
  };

  const reset = () => {
    setStatus("idle"); setFile(null); setCsvText("");
    setAgentStreams({}); setRoutingInfo(null);
    setCharts([]); setPandasCode(""); setFinalResponse("");
    setErrorMsg(""); setQuestion("");
  };

  return (
    <div style={s.page}>
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>📊 Data Intelligence</h1>
          <p style={s.pageSub}>Upload any CSV — agents analyze, find insights & generate visual charts</p>
        </div>
        {status !== "idle" && (
          <button onClick={reset} style={s.resetBtn}>↺ New Analysis</button>
        )}
      </div>

      {errorMsg && <div style={s.errorBanner}>⚠ {errorMsg}</div>}

      {/* Input grid */}
      <div style={s.inputGrid}>
        <div style={s.inputCard}>
          <div style={s.cardLabel}><span style={{ color:"var(--accent2)" }}>①</span> Upload Dataset</div>
          <DataUploader file={file} onFileChange={handleFileChange} />
        </div>

        <div style={s.inputCard}>
          <div style={s.cardLabel}><span style={{ color:"var(--accent)" }}>②</span> Ask a Question</div>
          <textarea
            placeholder="e.g. Show me sales trends by month and find top performing products..."
            value={question} onChange={e => setQuestion(e.target.value)}
            style={s.questionInput} rows={4} />
          <div style={s.quickRow}>
            {QUICK_QUESTIONS.map((q,i) => (
              <button key={i} onClick={() => setQuestion(q)} style={s.quickBtn}>{q}</button>
            ))}
          </div>
          <button onClick={handleAnalyze}
            disabled={status === "analyzing" || !file}
            style={{ ...s.analyzeBtn, opacity:(status === "analyzing" || !file) ? 0.6 : 1 }}>
            {status === "analyzing" ? (
              <span style={s.btnInner}><span style={s.btnSpinner} /> Agents analyzing...</span>
            ) : "🚀 Analyze Data"}
          </button>
        </div>
      </div>

      {/* Results */}
      {(Object.keys(agentStreams).length > 0 || charts.length > 0 || finalResponse) && (
        <div style={s.results}>
          {Object.keys(agentStreams).length > 0 && (
            <AgentPanel agentStreams={agentStreams} routingInfo={routingInfo} />
          )}

          {charts.length > 0 && <ChartRenderer charts={charts} />}

          {/* Pandas code */}
          {pandasCode && (
            <div style={s.codeCard} className="animate-slideUp">
              <div style={s.codeHeader}>
                <span>🐍</span>
                <span style={s.codeTitle}>Pandas Code</span>
                <button onClick={() => setShowCode(!showCode)} style={s.toggleBtn}>
                  {showCode ? "▲ Hide" : "▼ Show"}
                </button>
                <button onClick={() => navigator.clipboard.writeText(pandasCode)} style={s.copyBtn}>
                  ⎘ Copy
                </button>
              </div>
              {showCode && (
                <pre style={s.codeBlock}>{pandasCode}</pre>
              )}
            </div>
          )}

          {/* Summary */}
          {finalResponse && (
            <div style={s.summaryCard} className="animate-slideUp">
              <div style={s.summaryHeader}>
                <span>🧠</span>
                <span style={s.summaryTitle}>Analysis Summary</span>
                <button onClick={() => navigator.clipboard.writeText(finalResponse)} style={s.copyBtn}>
                  ⎘ Copy
                </button>
              </div>
              <div style={s.summaryBody}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    p: ({node, ...props}) => <p style={{margin: '0 0 12px 0'}} {...props} />,
                    h1: ({node, ...props}) => <h1 style={{fontSize: '1.5em', marginTop: '16px', marginBottom: '12px'}} {...props} />,
                    h2: ({node, ...props}) => <h2 style={{fontSize: '1.3em', marginTop: '16px', marginBottom: '12px'}} {...props} />,
                    h3: ({node, ...props}) => <h3 style={{fontSize: '1.1em', marginTop: '16px', marginBottom: '12px'}} {...props} />,
                    ul: ({node, ...props}) => <ul style={{marginTop: '0', marginBottom: '12px', paddingLeft: '20px'}} {...props} />,
                    ol: ({node, ...props}) => <ol style={{marginTop: '0', marginBottom: '12px', paddingLeft: '20px'}} {...props} />,
                    li: ({node, ...props}) => <li style={{marginBottom: '4px'}} {...props} />,
                    pre: ({node, ...props}) => <pre style={{background: '#282c34', padding: '12px', borderRadius: '8px', overflowX: 'auto', margin: '12px 0'}} {...props} />,
                    code: ({node, inline, ...props}) => inline ? <code style={{background: 'var(--bg)', padding: '2px 4px', borderRadius: '3px', color: '#e06c75'}} {...props} /> : <code {...props} />
                  }}
                >
                  {finalResponse}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {status === "idle" && (
        <div style={s.emptyGrid}>
          {[
            ["📊","Data Profiler",  "Analyzes shape, types, missing values"],
            ["📈","Stats Analyst",  "Distributions, outliers, correlations"],
            ["💡","Insight Agent",  "Business intelligence & recommendations"],
            ["🎨","Viz Suggester",  "Generates interactive charts + pandas code"]
          ].map(([icon,title,desc]) => (
            <div key={title} style={s.featureCard}>
              <span style={s.featureIcon}>{icon}</span>
              <div style={s.featureTitle}>{title}</div>
              <div style={s.featureDesc}>{desc}</div>
            </div>
          ))}
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
  inputGrid:     { display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:24 },
  inputCard:     { background:"var(--card)", border:"1px solid var(--border)", borderRadius:12, padding:20 },
  cardLabel:     { fontSize:12, fontWeight:700, color:"var(--text2)", marginBottom:14,
                   display:"flex", alignItems:"center", gap:6, fontFamily:"'Syne', sans-serif" },
  questionInput: { width:"100%", background:"var(--bg2)", border:"1px solid var(--border)",
                   borderRadius:8, padding:"10px 12px", color:"var(--text)", fontSize:14,
                   resize:"vertical", fontFamily:"inherit", outline:"none",
                   marginBottom:10, boxSizing:"border-box" },
  quickRow:      { display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 },
  quickBtn:      { background:"var(--bg2)", border:"1px solid var(--border)",
                   color:"var(--text3)", borderRadius:20, padding:"4px 10px", fontSize:11, cursor:"pointer" },
  analyzeBtn:    { width:"100%", padding:"12px", background:"var(--accent2)",
                   color:"var(--bg)", border:"none", borderRadius:8, fontSize:14,
                   fontWeight:800, cursor:"pointer", fontFamily:"'Syne', sans-serif",
                   boxShadow:"0 4px 16px rgba(0,212,170,0.3)" },
  btnInner:      { display:"flex", alignItems:"center", gap:8, justifyContent:"center" },
  btnSpinner:    { width:14, height:14, border:"2px solid rgba(0,0,0,0.2)",
                   borderTop:"2px solid var(--bg)", borderRadius:"50%",
                   display:"inline-block", animation:"spin 0.7s linear infinite" },
  results:       { display:"flex", flexDirection:"column", gap:20 },
  codeCard:      { background:"var(--card)", border:"1px solid var(--border)", borderRadius:12, overflow:"hidden" },
  codeHeader:    { display:"flex", alignItems:"center", gap:8, padding:"12px 18px",
                   borderBottom:"1px solid var(--border)", background:"var(--bg2)" },
  codeTitle:     { flex:1, fontSize:14, fontWeight:700, fontFamily:"'Syne', sans-serif", color:"var(--text)" },
  toggleBtn:     { background:"var(--bg3)", border:"1px solid var(--border)",
                   color:"var(--text3)", borderRadius:6, padding:"3px 10px", fontSize:11, cursor:"pointer" },
  copyBtn:       { background:"var(--bg3)", border:"1px solid var(--border)",
                   color:"var(--text3)", borderRadius:6, padding:"3px 10px", fontSize:11, cursor:"pointer" },
  codeBlock:     { padding:20, overflowX:"auto", fontSize:12, lineHeight:1.7,
                   color:"var(--text2)", fontFamily:"'JetBrains Mono', monospace",
                   background:"var(--bg)", maxHeight:360, overflowY:"auto", margin:0 },
  summaryCard:   { background:"var(--card)", border:"1px solid var(--border)", borderRadius:12, overflow:"hidden" },
  summaryHeader: { display:"flex", alignItems:"center", gap:8, padding:"12px 18px",
                   borderBottom:"1px solid var(--border)", background:"var(--bg2)" },
  summaryTitle:  { flex:1, fontSize:14, fontWeight:700, fontFamily:"'Syne', sans-serif", color:"var(--text)" },
  summaryBody:   { padding:20, whiteSpace:"normal", fontSize:13, lineHeight:1.8,
                   color:"var(--text2)", fontFamily:"'Inter', sans-serif", maxHeight:500, overflowY:"auto" },
  emptyGrid:     { display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:14, marginTop:8 },
  featureCard:   { background:"var(--card)", border:"1px solid var(--border)",
                   borderRadius:12, padding:"20px 16px", textAlign:"center" },
  featureIcon:   { fontSize:32, display:"block", marginBottom:10 },
  featureTitle:  { fontSize:13, fontWeight:700, color:"var(--text)",
                   marginBottom:6, fontFamily:"'Syne', sans-serif" },
  featureDesc:   { fontSize:11, color:"var(--text3)", lineHeight:1.5 }
};