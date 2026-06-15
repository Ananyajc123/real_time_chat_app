import React, { useState, useEffect, useRef, useCallback } from "react";
import { login, register, getRooms, getMessages, createDM, createGroup, searchUsers, getOnlineUsers, searchMessages, deleteMessage, updateProfile } from "./services/api";
import { connectWebSocket, subscribeToRoom, sendWebSocketMessage, sendTypingIndicator, disconnectWebSocket } from "./services/websocket";

/* ── Global styles ─────────────────────────────────────────────────────────── */
const injectStyles = () => {
  if (document.getElementById("nx2")) return;
  const s = document.createElement("style");
  s.id = "nx2";
  s.textContent = `
    @keyframes fadeUp   { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
    @keyframes slideIn  { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }
    @keyframes scaleIn  { from { opacity:0; transform:scale(.94); } to { opacity:1; transform:scale(1); } }
    @keyframes spin     { to { transform: rotate(360deg); } }
    @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0} }
    @keyframes pulse    { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
    @keyframes shimmer  { from{background-position:-200% 0} to{background-position:200% 0} }
    @keyframes dot1     { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }

    .fade-up   { animation: fadeUp  .28s cubic-bezier(.16,1,.3,1) forwards; }
    .fade-in   { animation: fadeIn  .2s ease forwards; }
    .scale-in  { animation: scaleIn .22s cubic-bezier(.16,1,.3,1) forwards; }
    .slide-in  { animation: slideIn .2s ease forwards; }

    .hover-bg:hover  { background: rgba(255,255,255,.04) !important; }
    .hover-bg2:hover { background: rgba(124,111,247,.1) !important; }
    .pressable:active { transform: scale(.97); }
    .pressable { transition: transform .1s; }

    .msg-bubble { transition: background .15s; position: relative; }
    .msg-bubble:hover { background: rgba(255,255,255,.025) !important; }
    .msg-bubble:hover .msg-actions { opacity:1 !important; }
    .msg-actions { opacity:0; transition: opacity .15s; }

    .room-row { transition: background .12s, border-color .12s; cursor:pointer; }
    .room-row:hover { background: rgba(255,255,255,.04) !important; }
    .room-row.active { background: rgba(124,111,247,.12) !important; border-left-color: #7c6ff7 !important; }

    .input-glow:focus-within { border-color: rgba(124,111,247,.5) !important; box-shadow: 0 0 0 3px rgba(124,111,247,.1); }

    .emoji-item:hover { transform:scale(1.3); background: rgba(255,255,255,.08); }
    .emoji-item { transition: transform .1s, background .1s; cursor:pointer; }

    .typing-dot:nth-child(1) { animation: dot1 1.4s ease .0s infinite; }
    .typing-dot:nth-child(2) { animation: dot1 1.4s ease .2s infinite; }
    .typing-dot:nth-child(3) { animation: dot1 1.4s ease .4s infinite; }

    .btn-primary { transition: all .15s; }
    .btn-primary:hover:not(:disabled) { background: #8d82f8 !important; transform: translateY(-1px); box-shadow: 0 4px 20px rgba(124,111,247,.35); }
    .btn-primary:active:not(:disabled) { transform: translateY(0); }

    .badge-pulse { animation: pulse 2s ease infinite; }

    .skeleton { background: linear-gradient(90deg, rgba(255,255,255,.04) 25%, rgba(255,255,255,.08) 50%, rgba(255,255,255,.04) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 6px; }
    
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: #13131e; border: 1px solid rgba(255,255,255,.1); border-radius: 16px; max-width: 500px; width: 90%; max-height: 80vh; overflow: hidden; }
  `;
  document.head.appendChild(s);
};
injectStyles();

/* ── Helpers ───────────────────────────────────────────────────────────────── */
const avatarColor = (s = "") => {
  const palette = ["#7c6ff7","#3dd68c","#f472b6","#fbbf24","#60a5fa","#f87171","#34d399","#a78bfa","#fb923c","#38bdf8"];
  let h = 0; for (const c of s) h = c.charCodeAt(0) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
};
const fmtTime = t => t ? new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
const fmtDate = t => {
  if (!t) return "";
  const d = new Date(t), n = new Date();
  if (d.toDateString() === n.toDateString()) return "Today";
  const y = new Date(n); y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday:"long", month:"short", day:"numeric" });
};

/* ── Avatar ────────────────────────────────────────────────────────────────── */
function Av({ name = "?", size = 36, color, online, showRing }) {
  const c = color || avatarColor(name);
  return (
    <div style={{ position:"relative", flexShrink:0, width:size, height:size }}>
      <div style={{
        width:size, height:size, borderRadius:"50%",
        background:`${c}18`,
        border:`1.5px solid ${c}40`,
        display:"flex", alignItems:"center", justifyContent:"center",
        color:c, fontWeight:600, fontSize:size*.38,
        letterSpacing:"-.02em",
        ...(showRing && { boxShadow:`0 0 0 2px #0a0a0f, 0 0 0 4px ${c}60` }),
      }}>
        {name[0]?.toUpperCase()}
      </div>
      {online !== undefined && (
        <span style={{
          position:"absolute", bottom:0, right:0,
          width:size>28?10:8, height:size>28?10:8,
          borderRadius:"50%", border:"2px solid #0a0a0f",
          background: online ? "#3dd68c" : "#50506a",
        }}/>
      )}
    </div>
  );
}

/* ── Spinner ───────────────────────────────────────────────────────────────── */
const Spin = ({ size=16 }) => (
  <div style={{ width:size, height:size, borderRadius:"50%", border:`2px solid rgba(124,111,247,.25)`, borderTopColor:"#7c6ff7", animation:"spin .65s linear infinite", flexShrink:0 }} />
);

/* ── Toast ─────────────────────────────────────────────────────────────────── */
function Toast({ items, onClose }) {
  return (
    <div style={{ position:"fixed", bottom:20, right:20, zIndex:9999, display:"flex", flexDirection:"column", gap:8 }}>
      {items.map(t => (
        <div key={t.id} className="scale-in" style={{
          background:"#1a1a28", border:"1px solid rgba(255,255,255,.1)",
          borderRadius:10, padding:"11px 16px", fontSize:13, color:"#eeeef5",
          display:"flex", alignItems:"center", gap:10,
          boxShadow:"0 8px 32px rgba(0,0,0,.6)",
          borderLeft:`3px solid ${t.type==="error"?"#f87171":t.type==="success"?"#3dd68c":"#7c6ff7"}`,
        }}>
          <span>{t.type==="error"?"✕":t.type==="success"?"✓":"·"}</span>
          {t.msg}
          <button onClick={() => onClose(t.id)} style={{ marginLeft:"auto", background:"none", border:"none", color:"#50506a", cursor:"pointer", fontSize:16 }}>×</button>
        </div>
      ))}
    </div>
  );
}

/* ── Modal ─────────────────────────────────────────────────────────────────── */
function Modal({ title, children, onClose, width = 500 }) {
  return (
    <div className="modal-overlay fade-in" onClick={onClose}>
      <div className="modal scale-in" style={{ width }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:"18px 20px", borderBottom:"1px solid rgba(255,255,255,.06)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <h3 style={{ fontSize:16, fontWeight:600, color:"#eeeef5" }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#50506a", cursor:"pointer", fontSize:20, lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:20, maxHeight:"calc(80vh - 70px)", overflowY:"auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── Auth Screen ───────────────────────────────────────────────────────────── */
function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username:"", email:"", password:"" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const submit = async e => {
    e.preventDefault(); setLoading(true); setErr("");
    try {
      const res = mode === "login" ? await login(form) : await register(form);
      const d = res.data;
      localStorage.setItem("token", d.token);
      localStorage.setItem("user", JSON.stringify({ id:d.userId, username:d.username, email:d.email, avatarColor:d.avatarColor }));
      onLogin();
    } catch(ex) { setErr(ex.response?.data?.message || ex.response?.data || "Something went wrong"); }
    finally { setLoading(false); }
  };

  const field = (placeholder, key, type="text") => (
    <input
      className="input-glow"
      style={{ width:"100%", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.09)", borderRadius:10, padding:"13px 15px", color:"#eeeef5", fontSize:14, outline:"none", transition:"border-color .2s, box-shadow .2s" }}
      placeholder={placeholder} type={type} value={form[key]}
      onChange={e => setForm({...form, [key]:e.target.value})} required
    />
  );

  return (
    <div className="fade-in" style={{ minHeight:"100vh", background:"#0a0a0f", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", width:700, height:700, borderRadius:"50%", background:"radial-gradient(circle, rgba(124,111,247,.07) 0%, transparent 65%)", top:"50%", left:"50%", transform:"translate(-50%,-50%)", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, backgroundImage:"radial-gradient(rgba(255,255,255,.03) 1px, transparent 1px)", backgroundSize:"32px 32px", pointerEvents:"none" }}/>

      <div style={{ width:420, position:"relative", zIndex:1 }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ display:"inline-flex", width:56, height:56, borderRadius:16, background:"rgba(124,111,247,.15)", border:"1px solid rgba(124,111,247,.3)", alignItems:"center", justifyContent:"center", marginBottom:20, fontSize:24 }}>✦</div>
          <h1 style={{ fontFamily:"'Instrument Serif', serif", fontSize:34, fontWeight:400, color:"#eeeef5", letterSpacing:"-.02em", marginBottom:6 }}>
            {mode === "login" ? "Welcome back" : "Join Nexus Chat"}
          </h1>
          <p style={{ color:"#9090b0", fontSize:14 }}>
            {mode === "login" ? "Sign in to continue chatting" : "Create your account to get started"}
          </p>
        </div>

        <div style={{ display:"flex", background:"rgba(255,255,255,.04)", borderRadius:11, padding:4, marginBottom:22, border:"1px solid rgba(255,255,255,.07)" }}>
          {[["login","Sign in"],["register","Register"]].map(([v,l]) => (
            <button key={v} onClick={() => { setMode(v); setErr(""); }}
              style={{ flex:1, padding:"9px", border:"none", cursor:"pointer", fontSize:13, fontWeight:500, borderRadius:8, transition:"all .18s", background:mode===v?"rgba(124,111,247,.2)":"transparent", color:mode===v?"#a89cf7":"#9090b0", boxShadow:mode===v?"0 0 0 1px rgba(124,111,247,.3)":"none" }}>
              {l}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {mode==="register" && field("Username","username")}
          {field("Email address","email","email")}
          <div style={{ position:"relative" }}>
            <input
              className="input-glow"
              style={{ width:"100%", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.09)", borderRadius:10, padding:"13px 44px 13px 15px", color:"#eeeef5", fontSize:14, outline:"none", transition:"border-color .2s, box-shadow .2s" }}
              placeholder="Password" type={showPw?"text":"password"} value={form.password}
              onChange={e => setForm({...form, password:e.target.value})} required />
            <button type="button" onClick={() => setShowPw(p=>!p)}
              style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#50506a", cursor:"pointer", fontSize:15, padding:4 }}>
              {showPw ? "👁" : "👁‍🗨"}
            </button>
          </div>

          {err && <div style={{ background:"rgba(248,113,113,.08)", border:"1px solid rgba(248,113,113,.2)", borderRadius:8, padding:"10px 14px", color:"#f87171", fontSize:13 }}>{err}</div>}

          <button type="submit" disabled={loading} className="btn-primary pressable"
            style={{ padding:"14px", borderRadius:10, background:"#7c6ff7", color:"white", border:"none", cursor:loading?"default":"pointer", fontWeight:600, fontSize:14, marginTop:2, display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity:loading?.7:1 }}>
            {loading ? <><Spin size={15}/> Please wait…</> : mode==="login" ? "Sign in →" : "Create account →"}
          </button>
        </form>

        <div style={{ marginTop:18, padding:"12px 15px", background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.05)", borderRadius:9, textAlign:"center" }}>
          <span style={{ fontFamily:"'Geist Mono',monospace", fontSize:11, color:"#50506a", letterSpacing:".06em" }}>DEMO · alice@demo.com / demo123</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    const handleStorage = () => setIsLoggedIn(!!localStorage.getItem("token"));
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
  };

  return isLoggedIn ? <ChatApp onLogout={handleLogout} /> : <Auth onLogin={handleLogin} />;
}

// Continued in next part...
