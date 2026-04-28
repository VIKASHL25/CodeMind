import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";

const PALETTE = ["#6c63ff","#00d4aa","#ffd166","#ff4d6d","#4cc9f0","#f72585"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#1c1c2a", border:"1px solid #2a2a40",
                  borderRadius:8, padding:"8px 12px", fontSize:12 }}>
      {label && <p style={{ color:"#9999bb", marginBottom:4 }}>{label}</p>}
      {payload.map((p,i) => (
        <p key={i} style={{ color:p.color || "#e8e8f0" }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

function ChartCard({ chart, index }) {
  const color = PALETTE[index % PALETTE.length];
  const { chart_type, data, x_key, y_key } = chart;

  if (!data || data.length === 0) return (
    <div style={s.card}>
      <div style={{ textAlign:"center", color:"var(--text3)", padding:40 }}>No data available</div>
    </div>
  );

  const renderChart = () => {
    if (chart_type === "line") return (
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a40" />
        <XAxis dataKey={x_key} tick={{ fill:"#9999bb", fontSize:11 }} />
        <YAxis tick={{ fill:"#9999bb", fontSize:11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize:12, color:"#9999bb" }} />
        <Line type="monotone" dataKey={y_key} stroke={color} strokeWidth={2}
          dot={{ r:3, fill:color }} activeDot={{ r:5 }} />
      </LineChart>
    );
    if (chart_type === "bar") return (
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a40" />
        <XAxis dataKey={x_key} tick={{ fill:"#9999bb", fontSize:11 }} />
        <YAxis tick={{ fill:"#9999bb", fontSize:11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize:12, color:"#9999bb" }} />
        <Bar dataKey={y_key} fill={color} radius={[4,4,0,0]} />
      </BarChart>
    );
    if (chart_type === "pie") return (
      <PieChart>
        <Pie data={data} dataKey={y_key} nameKey={x_key}
          cx="50%" cy="50%" outerRadius={110}
          label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
          {data.map((_,i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize:12, color:"#9999bb" }} />
      </PieChart>
    );
    if (chart_type === "scatter") return (
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a40" />
        <XAxis dataKey={x_key} type="number" name={x_key} tick={{ fill:"#9999bb", fontSize:11 }} />
        <YAxis dataKey={y_key} type="number" name={y_key} tick={{ fill:"#9999bb", fontSize:11 }} />
        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray:"3 3" }} />
        <Scatter data={data} fill={color} />
      </ScatterChart>
    );
    return (
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a40" />
        <XAxis dataKey={x_key} tick={{ fill:"#9999bb", fontSize:11 }} />
        <YAxis tick={{ fill:"#9999bb", fontSize:11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey={y_key} fill={color} radius={[4,4,0,0]} />
      </BarChart>
    );
  };

  return (
    <div style={s.card} className="animate-slideUp">
      <div style={s.cardHeader}>
        <div>
          <div style={s.chartTitle}>{chart.title}</div>
          {chart.description && <div style={s.chartDesc}>{chart.description}</div>}
        </div>
        <span style={{ ...s.typeBadge,
          background:`${PALETTE[index % PALETTE.length]}20`,
          color:PALETTE[index % PALETTE.length] }}>
          {chart_type}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}

export default function ChartRenderer({ charts }) {
  if (!charts || charts.length === 0) return null;
  return (
    <div style={s.wrapper}>
      <div style={s.sectionHeader}>
        <span style={s.sectionIcon}>📈</span>
        <span style={s.sectionTitle}>Visual Analysis</span>
        <span style={s.chartCount}>{charts.length} chart{charts.length > 1 ? "s" : ""}</span>
      </div>
      <div style={s.grid}>
        {charts.map((chart,i) => <ChartCard key={i} chart={chart} index={i} />)}
      </div>
    </div>
  );
}

const s = {
  wrapper:      { marginBottom:24 },
  sectionHeader:{ display:"flex", alignItems:"center", gap:8, marginBottom:14 },
  sectionIcon:  { fontSize:20 },
  sectionTitle: { fontSize:16, fontWeight:700, fontFamily:"'Syne', sans-serif", color:"var(--text)" },
  chartCount:   { background:"rgba(108,99,255,0.1)", color:"var(--accent)",
                  padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:600, marginLeft:"auto" },
  grid:         { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(420px, 1fr))", gap:16 },
  card:         { background:"var(--card)", border:"1px solid var(--border)", borderRadius:12, padding:20 },
  cardHeader:   { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 },
  chartTitle:   { fontSize:14, fontWeight:700, color:"var(--text)", fontFamily:"'Syne', sans-serif" },
  chartDesc:    { fontSize:12, color:"var(--text3)", marginTop:3 },
  typeBadge:    { padding:"3px 10px", borderRadius:20, fontSize:10, fontWeight:700,
                  textTransform:"uppercase", letterSpacing:0.5, flexShrink:0 }
};