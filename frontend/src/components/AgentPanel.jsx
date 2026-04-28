const STATUS = {
  idle:      { color:"var(--text3)",  icon:"○", label:"Waiting"  },
  streaming: { color:"var(--warning)",icon:"◌", label:"Thinking" },
  complete:  { color:"var(--success)",icon:"●", label:"Done"      },
  error:     { color:"var(--danger)", icon:"✕", label:"Error"     }
};

const AGENT_INFO = {
  bug_hunter:      { emoji:"🐛", label:"Bug Hunter",       desc:"Finds & fixes bugs"         },
  code_reviewer:   { emoji:"👁️", label:"Code Reviewer",    desc:"Reviews quality & patterns" },
  security_auditor:{ emoji:"🔐", label:"Security Auditor", desc:"Scans vulnerabilities"       },
  doc_writer:      { emoji:"📝", label:"Doc Writer",        desc:"Generates documentation"    },
  data_profiler:   { emoji:"📊", label:"Data Profiler",     desc:"Analyzes shape & types"     },
  stats_analyst:   { emoji:"📈", label:"Stats Analyst",     desc:"Finds distributions"        },
  insight_agent:   { emoji:"💡", label:"Insight Agent",     desc:"Business intelligence"      },
  viz_suggester:   { emoji:"🎨", label:"Viz Suggester",     desc:"Creates chart configs"      }
};

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function AgentPanel({ agentStreams, routingInfo }) {
  if (!agentStreams || Object.keys(agentStreams).length === 0) return null;

  const entries   = Object.entries(agentStreams);
  const doneCount = entries.filter(([,d]) => d.status === "complete").length;
  const total     = entries.length;

  return (
    <div style={s.panel} className="animate-slideUp">
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.panelIcon}>🤖</span>
          <div>
            <div style={s.panelTitle}>Agent Team</div>
            {routingInfo?.reason && <div style={s.reason}>{routingInfo.reason}</div>}
          </div>
        </div>
        <div style={s.progress}>
          <div style={s.progressTrack}>
            <div style={{ ...s.progressFill, width:`${total > 0 ? (doneCount/total)*100 : 0}%` }} />
          </div>
          <span style={s.progressText}>{doneCount}/{total}</span>
        </div>
      </div>

      <div style={s.grid}>
        {entries.map(([name, data]) => {
          const info   = AGENT_INFO[name] || { emoji:"🤖", label:name, desc:"" };
          const status = STATUS[data.status] || STATUS.idle;
          return (
            <div key={name} style={{
              ...s.card,
              borderColor: data.status === "streaming" ? "rgba(255,209,102,0.3)"
                         : data.status === "complete"  ? "rgba(6,214,160,0.3)"
                         : "var(--border)"
            }}>
              <div style={s.cardHeader}>
                <span style={s.agentEmoji}>{info.emoji}</span>
                <div style={s.agentInfo}>
                  <div style={s.agentName}>{info.label}</div>
                  <div style={s.agentDesc}>{info.desc}</div>
                </div>
                <span style={{ ...s.statusChip, color:status.color }}>
                  {status.icon} {status.label}
                </span>
              </div>
              {data.status === "streaming" && (
                <div style={s.shimmerTrack}><div style={s.shimmerBar} /></div>
              )}
              {data.content && (
                <div style={s.contentPreview}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({node, ...props}) => <p style={{margin: '0 0 6px 0'}} {...props} />,
                      pre: ({node, ...props}) => <pre style={{background: 'var(--bg)', padding: '6px', borderRadius: '4px', overflowX: 'auto', margin: '6px 0', fontSize: '10px'}} {...props} />,
                      code: ({node, inline, ...props}) => inline ? <code style={{background: 'var(--bg)', padding: '2px 4px', borderRadius: '3px'}} {...props} /> : <code {...props} />
                    }}
                  >
                    {data.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  panel:         { background:"var(--card)", border:"1px solid var(--border)",
                   borderRadius:12, padding:20, marginBottom:20 },
  header:        { display:"flex", justifyContent:"space-between",
                   alignItems:"flex-start", marginBottom:16 },
  headerLeft:    { display:"flex", gap:10, alignItems:"flex-start" },
  panelIcon:     { fontSize:22, flexShrink:0, marginTop:1 },
  panelTitle:    { fontSize:15, fontWeight:700, fontFamily:"'Syne', sans-serif", color:"var(--text)" },
  reason:        { fontSize:11, color:"var(--text3)", marginTop:3, maxWidth:380 },
  progress:      { display:"flex", alignItems:"center", gap:8, flexShrink:0 },
  progressTrack: { width:80, height:4, background:"var(--bg2)", borderRadius:2, overflow:"hidden" },
  progressFill:  { height:"100%", background:"var(--success)", borderRadius:2, transition:"width 0.4s ease" },
  progressText:  { fontSize:12, color:"var(--text3)", fontFamily:"'JetBrains Mono', monospace" },
  grid:          { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:10 },
  card:          { background:"var(--bg2)", border:"1px solid var(--border)",
                   borderRadius:10, padding:12, transition:"border-color 0.3s" },
  cardHeader:    { display:"flex", alignItems:"center", gap:8, marginBottom:4 },
  agentEmoji:    { fontSize:18, flexShrink:0 },
  agentInfo:     { flex:1 },
  agentName:     { fontSize:12, fontWeight:600, color:"var(--text)" },
  agentDesc:     { fontSize:10, color:"var(--text3)" },
  statusChip:    { fontSize:10, fontWeight:600, whiteSpace:"nowrap",
                   fontFamily:"'JetBrains Mono', monospace" },
  shimmerTrack:  { height:2, background:"var(--bg3)", borderRadius:1, overflow:"hidden", margin:"6px 0" },
  shimmerBar:    { height:"100%", width:"40%", background:"var(--warning)",
                   borderRadius:1, animation:"shimmer 1.2s infinite" },
  contentPreview:{ fontSize:11, color:"var(--text3)", lineHeight:1.5,
                   marginTop:6, fontFamily:"'JetBrains Mono', monospace",
                   maxHeight: "300px", overflowY: "auto", paddingRight: "4px" }
};