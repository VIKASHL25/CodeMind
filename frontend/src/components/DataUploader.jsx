import { useState, useRef } from "react";

export default function DataUploader({ file, onFileChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview,    setPreview]    = useState(null);
  const [error,      setError]      = useState("");
  const inputRef = useRef(null);

  const parsePreview = (text) => {
    const lines   = text.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
    const rows    = lines.slice(1, 6).map(line =>
      line.split(",").map(cell => cell.trim().replace(/^"|"$/g, ""))
    );
    return { headers, rows, totalRows: lines.length - 1, totalCols: headers.length };
  };

  const processFile = (f) => {
    setError("");
    if (!f) return;
    if (!f.name.endsWith(".csv")) { setError("Only CSV files are supported"); return; }
    if (f.size > 10 * 1024 * 1024) { setError("File too large — max 10MB"); return; }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parsePreview(e.target.result);
        setPreview(parsed);
        onFileChange(f, e.target.result);
      } catch {
        setError("Could not parse this CSV. Please check the file format.");
      }
    };
    reader.readAsText(f);
  };

  const onDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const onDrop      = (e) => { e.preventDefault(); setIsDragging(false); processFile(e.dataTransfer.files[0]); };

  const removeFile = () => {
    setPreview(null); setError("");
    onFileChange(null, null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div style={s.wrapper}>
      <input ref={inputRef} type="file" accept=".csv"
        style={{ display:"none" }} onChange={e => processFile(e.target.files[0])} />

      {/* Drop Zone */}
      {!file && (
        <div style={{ ...s.dropZone, ...(isDragging ? s.dropActive : {}) }}
          onDragOver={onDragOver} onDragLeave={onDragLeave}
          onDrop={onDrop} onClick={() => inputRef.current?.click()}>
          <div style={s.dropIcon}>{isDragging ? "📂" : "📊"}</div>
          <p style={s.dropTitle}>{isDragging ? "Release to upload" : "Drop your CSV here"}</p>
          <p style={s.dropSub}>or <span style={s.browseLink}>browse files</span></p>
          <div style={s.dropHints}>
            <span style={s.hintPill}>📋 .csv only</span>
            <span style={s.hintPill}>📦 Max 10MB</span>
            <span style={s.hintPill}>🔢 Any size</span>
          </div>
        </div>
      )}

      {error && <div style={s.errorBox}><span>⚠</span> {error}</div>}

      {/* File loaded */}
      {file && preview && (
        <div style={s.fileCard} className="animate-fadeIn">
          <div style={s.fileHeader}>
            <div style={s.fileIconWrap}>📄</div>
            <div style={s.fileMeta}>
              <div style={s.fileName}>{file.name}</div>
              <div style={s.fileStats}>
                <span style={s.statBadge}>{(file.size/1024).toFixed(1)} KB</span>
                <span style={s.statBadge}>{preview.totalRows} rows</span>
                <span style={s.statBadge}>{preview.totalCols} cols</span>
              </div>
            </div>
            <button onClick={removeFile} style={s.removeBtn}>✕</button>
          </div>

          {/* Table preview */}
          <div style={s.tableSection}>
            <div style={s.tableLabel}>
              <span style={{ color:"var(--accent2)" }}>▸</span> Preview — first 5 rows
            </div>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>{preview.headers.map((h,i) => <th key={i} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {preview.rows.map((row,i) => (
                    <tr key={i}>
                      {row.map((cell,j) => <td key={j} style={s.td}>{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Column pills */}
          <div style={s.colSection}>
            <div style={s.tableLabel}>
              <span style={{ color:"var(--accent)" }}>▸</span> Columns detected
            </div>
            <div style={s.colPills}>
              {preview.headers.map((h,i) => <span key={i} style={s.colPill}>{h}</span>)}
            </div>
          </div>

          <button onClick={() => inputRef.current?.click()} style={s.replaceBtn}>
            🔄 Replace file
          </button>
        </div>
      )}
    </div>
  );
}

const s = {
  wrapper:      { width:"100%" },
  dropZone:     { border:"2px dashed var(--border)", borderRadius:12, padding:"40px 24px",
                  textAlign:"center", cursor:"pointer", background:"var(--bg2)", transition:"all 0.2s" },
  dropActive:   { border:"2px dashed var(--accent)", background:"rgba(108,99,255,0.05)", transform:"scale(1.01)" },
  dropIcon:     { fontSize:48, marginBottom:12 },
  dropTitle:    { fontSize:16, fontWeight:700, fontFamily:"'Syne', sans-serif",
                  color:"var(--text)", marginBottom:6 },
  dropSub:      { fontSize:13, color:"var(--text2)", marginBottom:16 },
  browseLink:   { color:"var(--accent)", fontWeight:600, cursor:"pointer" },
  dropHints:    { display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" },
  hintPill:     { background:"var(--bg3)", border:"1px solid var(--border)",
                  color:"var(--text3)", padding:"3px 10px", borderRadius:20, fontSize:11 },
  errorBox:     { background:"rgba(255,77,109,0.1)", border:"1px solid rgba(255,77,109,0.3)",
                  color:"#ff4d6d", padding:"10px 14px", borderRadius:8,
                  fontSize:13, marginTop:8, display:"flex", gap:8 },
  fileCard:     { border:"1px solid var(--border)", borderRadius:12,
                  overflow:"hidden", background:"var(--card)" },
  fileHeader:   { display:"flex", alignItems:"center", gap:12,
                  padding:"14px 16px", borderBottom:"1px solid var(--border)" },
  fileIconWrap: { fontSize:26, flexShrink:0 },
  fileMeta:     { flex:1 },
  fileName:     { fontSize:14, fontWeight:600, color:"var(--text)", marginBottom:4 },
  fileStats:    { display:"flex", gap:6 },
  statBadge:    { background:"rgba(108,99,255,0.1)", color:"var(--accent)",
                  padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:500 },
  removeBtn:    { background:"rgba(255,77,109,0.1)", color:"#ff4d6d",
                  border:"1px solid rgba(255,77,109,0.2)", borderRadius:6,
                  width:28, height:28, cursor:"pointer", fontSize:12, fontWeight:700 },
  tableSection: { padding:"12px 16px 0" },
  tableLabel:   { fontSize:11, color:"var(--text3)", textTransform:"uppercase",
                  letterSpacing:0.8, marginBottom:8, display:"flex", alignItems:"center", gap:4 },
  tableWrap:    { overflowX:"auto", borderRadius:8, border:"1px solid var(--border)", marginBottom:12 },
  table:        { width:"100%", borderCollapse:"collapse", fontSize:12 },
  th:           { background:"var(--bg3)", padding:"8px 12px", textAlign:"left",
                  fontWeight:600, color:"var(--text2)", whiteSpace:"nowrap",
                  borderBottom:"1px solid var(--border)",
                  fontFamily:"'JetBrains Mono', monospace" },
  td:           { padding:"7px 12px", color:"var(--text2)", whiteSpace:"nowrap",
                  maxWidth:140, overflow:"hidden", textOverflow:"ellipsis",
                  borderBottom:"1px solid rgba(255,255,255,0.04)",
                  fontFamily:"'JetBrains Mono', monospace", fontSize:11 },
  colSection:   { padding:"0 16px 12px" },
  colPills:     { display:"flex", flexWrap:"wrap", gap:6 },
  colPill:      { background:"var(--bg2)", border:"1px solid var(--border)",
                  color:"var(--accent)", padding:"3px 10px", borderRadius:20, fontSize:11 },
  replaceBtn:   { display:"block", width:"calc(100% - 32px)", margin:"0 16px 14px",
                  padding:"8px", background:"var(--bg2)", border:"1px solid var(--border)",
                  borderRadius:8, cursor:"pointer", fontSize:12, color:"var(--text2)" }
};