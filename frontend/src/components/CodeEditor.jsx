import Editor from "@monaco-editor/react";

const SAMPLES = {
  python: `def calculate_discount(price, discount_percent):
    discount = price * discount_percent / 100
    final_price = price - discount
    return final_price

def process_order(items, user_id):
    total = 0
    for item in items:
        total = total + calculate_discount(item['price'], item['discount'])

    # Security issue here!
    query = f"SELECT * FROM users WHERE id = {user_id}"
    return {"total": total, "query": query}`,

  javascript: `function fetchUserData(userId) {
  const query = "SELECT * FROM users WHERE id = " + userId;
  fetch('/api/data')
    .then(response => response.json())
    .then(data => {
      document.innerHTML = data.html;
      console.log(data)
    })
}

function calculateTotal(items) {
  let total;
  for (let i = 0; i <= items.length; i++) {
    total += items[i].price;
  }
  return total;
}`,


  java: `public class OrderProcessor {
    private String dbUrl = "jdbc:mysql://localhost/orders";
    private String password = "admin123"; // hardcoded!

    public double calculateTotal(List<Item> items) {
        double total = 0;
        for (int i = 0; i <= items.size(); i++) { // off-by-one!
            total += items.get(i).getPrice();
        }
        return total;
    }

    public User findUser(String userId) {
        String query = "SELECT * FROM users WHERE id = " + userId;
        return db.execute(query); // SQL injection!
    }
}`,

  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sample Page</title>
</head>
<body>
  <h1>Welcome to CodeMind</h1>
  <p>This is a sample HTML file.</p>
  <script>
    // XSS Vulnerability Example
    const params = new URLSearchParams(window.location.search);
    document.body.innerHTML += params.get("user_input");
  </script>
</body>
</html>`,

  react: `import React, { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  // Missing dependency in a hypothetical useEffect would be a common bug
  // Unsafe innerHTML usage
  const createMarkup = (html) => ({ __html: html });

  return (
    <div className="p-4 border rounded">
      <h2 className="text-lg font-bold">Counter: {count}</h2>
      <button 
        onClick={() => setCount(count + 1)}
        className="px-4 py-2 mt-2 bg-blue-500 text-white rounded"
      >
        Increment
      </button>
      <div dangerouslySetInnerHTML={createMarkup(window.location.hash)} />
    </div>
  );
}`,

  cpp: `#include <iostream>
#include <string>

using namespace std;

void processUserData(const char* input) {
    char buffer[50];
    // Buffer overflow vulnerability!
    strcpy(buffer, input);
    cout << "Processed: " << buffer << endl;
}

int main() {
    int numbers[5] = {1, 2, 3, 4, 5};
    int sum = 0;
    
    // Off-by-one error leading to out-of-bounds memory access!
    for (int i = 0; i <= 5; i++) {
        sum += numbers[i];
    }
    
    cout << "Total sum: " << sum << endl;
    return 0;
}`,

  c: `#include <stdio.h>
#include <string.h>

void authenticate(const char* password) {
    char db_password[20] = "secret123";
    char buffer[20];
    
    // Classic buffer overflow vulnerability
    strcpy(buffer, password);
    
    if (strcmp(buffer, db_password) == 0) {
        printf("Access Granted!\\n");
    } else {
        printf("Access Denied.\\n");
    }
}

int main() {
    int arr[3] = {10, 20, 30};
    // Use of uninitialized variable
    int uninit_val;
    
    printf("Value: %d\\n", arr[uninit_val]);
    return 0;
}`
};

const LANG_EXT = { 
  python:"py", javascript:"js", java:"java", html:"html", 
  react:"jsx", cpp:"cpp", c:"c" 
};

export default function CodeEditor({ code, onChange, language, onLanguageChange }) {
  const handleLangChange = (e) => {
    const lang = e.target.value;
    onLanguageChange(lang);
    onChange(SAMPLES[lang] || "");
  };

  // Map "react" to "javascript" for Monaco editor language support, "c" to "c", "cpp" to "cpp"
  const monacoLanguage = language === "react" ? "javascript" : language;

  return (
    <div style={s.wrapper}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={{ ...s.dot, background:"#ff5f57" }} />
          <div style={{ ...s.dot, background:"#ffbd2e" }} />
          <div style={{ ...s.dot, background:"#28c840" }} />
          <div style={s.divider} />
          <span style={s.filename}>main.{LANG_EXT[language]}</span>
        </div>
        <div style={s.headerRight}>
          <select value={language} onChange={handleLangChange} style={s.langSelect}>
            <option value="python">🐍 Python</option>
            <option value="javascript">🟨 JavaScript</option>
            <option value="java">☕ Java</option>
            <option value="html">🌐 HTML</option>
            <option value="react">⚛️ React</option>
            <option value="cpp">⚙️ C++</option>
            <option value="c">💻 C</option>
          </select>
          <button onClick={() => onChange(SAMPLES[language] || "")} style={s.actionBtn}>
            📋 Sample
          </button>
          <button onClick={() => navigator.clipboard.writeText(code)} style={s.actionBtn}>
            ⎘ Copy
          </button>
          <button onClick={() => onChange("")} style={{ ...s.actionBtn, color:"#ff4d6d" }}>
            ✕ Clear
          </button>
        </div>
      </div>

      {/* Monaco */}
      <Editor
        height="400px"
        language={monacoLanguage}
        value={code}
        onChange={val => onChange(val || "")}
        theme="vs-dark"
        options={{
          fontSize:                14,
          fontFamily:              "'JetBrains Mono', monospace",
          minimap:                 { enabled: false },
          scrollBeyondLastLine:    false,
          padding:                 { top: 14, bottom: 14 },
          lineNumbers:             "on",
          renderLineHighlight:     "line",
          bracketPairColorization: { enabled: true },
          formatOnPaste:           true,
          wordWrap:                "on",
          smoothScrolling:         true,
          cursorBlinking:          "smooth"
        }}
      />

      {/* Footer */}
      <div style={s.footer}>
        <span style={s.footerItem}>
          <span style={{ color:"var(--accent2)" }}>●</span> {language}
        </span>
        <span style={s.footerItem}>Ln {code.split("\n").length}</span>
        <span style={s.footerItem}>{code.length} chars</span>
        <span style={{ ...s.footerItem, marginLeft:"auto", color:"#28c840" }}>● Ready</span>
      </div>
    </div>
  );
}

const s = {
  wrapper:     { borderRadius:12, overflow:"hidden", border:"1px solid var(--border)",
                 boxShadow:"0 8px 32px rgba(0,0,0,0.4)" },
  header:      { display:"flex", justifyContent:"space-between", alignItems:"center",
                 padding:"10px 16px", background:"#1e1e1e", borderBottom:"1px solid #333" },
  headerLeft:  { display:"flex", alignItems:"center", gap:6 },
  headerRight: { display:"flex", alignItems:"center", gap:6 },
  dot:         { width:12, height:12, borderRadius:"50%", flexShrink:0 },
  divider:     { width:1, height:16, background:"#444", margin:"0 6px" },
  filename:    { color:"#888", fontSize:12, fontFamily:"'JetBrains Mono', monospace" },
  langSelect:  { background:"#2d2d2d", color:"#ccc", border:"1px solid #444",
                 borderRadius:6, padding:"3px 8px", fontSize:11, cursor:"pointer" },
  actionBtn:   { background:"#2d2d2d", color:"#aaa", border:"1px solid #444",
                 borderRadius:6, padding:"3px 10px", fontSize:11, cursor:"pointer" },
  footer:      { display:"flex", alignItems:"center", gap:16, padding:"5px 16px",
                 background:"#007acc", color:"rgba(255,255,255,0.8)", fontSize:11,
                 fontFamily:"'JetBrains Mono', monospace" },
  footerItem:  { display:"flex", alignItems:"center", gap:4 }
};