import React, { useState, useEffect, useRef, useCallback } from "react";
import { login, register, getRooms, getMessages, createDM, searchUsers, getOnlineUsers } from "./services/api";
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
    @keyframes dot2     { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
    @keyframes dot3     { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }

    .fade-up   { animation: fadeUp  .28s cubic-bezier(.16,1,.3,1) forwards; }
    .fade-in   { animation: fadeIn  .2s ease forwards; }
    .scale-in  { animation: scaleIn .22s cubic-bezier(.16,1,.3,1) forwards; }
    .slide-in  { animation: slideIn .2s ease forwards; }

    .hover-bg:hover  { background: rgba(255,255,255,.04) !important; }
    .hover-bg2:hover { background: rgba(124,111,247,.1) !important; }
    .pressable:active { transform: scale(.97); }
    .pressable { transition: transform .1s; }

    .msg-bubble { transition: background .15s; }
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
      {/* bg glow */}
      <div style={{ position:"absolute", width:700, height:700, borderRadius:"50%", background:"radial-gradient(circle, rgba(124,111,247,.07) 0%, transparent 65%)", top:"50%", left:"50%", transform:"translate(-50%,-50%)", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, backgroundImage:"radial-gradient(rgba(255,255,255,.03) 1px, transparent 1px)", backgroundSize:"32px 32px", pointerEvents:"none" }}/>

      <div style={{ width:420, position:"relative", zIndex:1 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ display:"inline-flex", width:56, height:56, borderRadius:16, background:"rgba(124,111,247,.15)", border:"1px solid rgba(124,111,247,.3)", alignItems:"center", justifyContent:"center", marginBottom:20, fontSize:24 }}>✦</div>
          <h1 style={{ fontFamily:"'Instrument Serif', serif", fontSize:34, fontWeight:400, color:"#eeeef5", letterSpacing:"-.02em", marginBottom:6 }}>
            {mode === "login" ? "Welcome back" : "Join Nexus"}
          </h1>
          <p style={{ color:"#9090b0", fontSize:14 }}>
            {mode === "login" ? "Sign in to continue chatting" : "Create your account to get started"}
          </p>
        </div>

        {/* Toggle */}
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
              {showPw ? "◉" : "○"}
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

/* ── Emoji Picker ──────────────────────────────────────────────────────────── */
const EMOJI_GROUPS = {
  "😊":["😀","😂","🥹","😍","🤔","😎","🥳","😭","🤯","😤","🫡","🥸","😈","👻","💀"],
  "👋":["👍","👎","👏","🙏","✌️","🤝","💪","🫶","❤️","🔥","✨","💯","🎉","⚡","🚀"],
  "🌿":["🌊","🌙","⭐","🌈","🎯","💎","🎸","🍕","☕","🌸","🦋","🐉","🌴","🍀","🎨"],
};

function EmojiPicker({ onPick, onClose }) {
  const [tab, setTab] = useState("😊");
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  return (
    <div ref={ref} className="scale-in" style={{ position:"absolute", bottom:"calc(100% + 8px)", right:0, background:"#13131e", border:"1px solid rgba(255,255,255,.1)", borderRadius:14, padding:12, width:272, zIndex:100, boxShadow:"0 20px 60px rgba(0,0,0,.8)" }}>
      <div style={{ display:"flex", gap:4, marginBottom:10 }}>
        {Object.keys(EMOJI_GROUPS).map(g => (
          <button key={g} onClick={() => setTab(g)} style={{ flex:1, background:tab===g?"rgba(124,111,247,.2)":"transparent", border:`1px solid ${tab===g?"rgba(124,111,247,.4)":"transparent"}`, borderRadius:8, padding:"5px 0", fontSize:16, cursor:"pointer" }}>{g}</button>
        ))}
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:2 }}>
        {EMOJI_GROUPS[tab].map(e => (
          <span key={e} className="emoji-item" onClick={() => { onPick(e); onClose(); }}
            style={{ fontSize:22, padding:"5px 6px", borderRadius:7, display:"inline-block" }}>{e}</span>
        ))}
      </div>
    </div>
  );
}

/* ── Typing Indicator ──────────────────────────────────────────────────────── */
function Typing({ who }) {
  return (
    <div className="fade-in" style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 0" }}>
      <div style={{ display:"flex", gap:4, alignItems:"center" }}>
        {[0,1,2].map(i => <div key={i} className="typing-dot" style={{ width:7, height:7, borderRadius:"50%", background:"#7c6ff7", transformOrigin:"center" }}/>)}
      </div>
      <span style={{ fontSize:12, color:"#9090b0", fontStyle:"italic" }}>{who} is typing…</span>
    </div>
  );
}

/* ── Date Separator ────────────────────────────────────────────────────────── */
function DateSep({ label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, margin:"18px 0 10px" }}>
      <div style={{ flex:1, height:1, background:"rgba(255,255,255,.06)" }}/>
      <span style={{ fontSize:11, color:"#50506a", fontFamily:"'Geist Mono',monospace", letterSpacing:".08em", textTransform:"uppercase" }}>{label}</span>
      <div style={{ flex:1, height:1, background:"rgba(255,255,255,.06)" }}/>
    </div>
  );
}

/* ── Message ───────────────────────────────────────────────────────────────── */
function Msg({ msg, isMe, compact, onReact }) {
  const [localReacts, setLocalReacts] = useState({});
  const allReacts = { ...localReacts };
  const reactEntries = Object.entries(allReacts);

  return (
    <div className="msg-bubble fade-up" style={{ display:"flex", flexDirection:isMe?"row-reverse":"row", gap:9, alignItems:"flex-end", marginBottom:compact?2:10, padding:"2px 16px", borderRadius:8, position:"relative" }}>
      {!isMe && (
        <div style={{ opacity:compact?0:1 }}>
          <Av name={msg.senderUsername} color={msg.senderAvatarColor} size={32}/>
        </div>
      )}
      <div style={{ maxWidth:"66%" }}>
        {!isMe && !compact && (
          <p style={{ fontSize:12, color:"#9090b0", marginBottom:3, fontWeight:500 }}>{msg.senderUsername}</p>
        )}
        <div style={{ position:"relative" }}>
          <div style={{
            background: isMe ? "rgba(124,111,247,.2)" : "rgba(255,255,255,.05)",
            border: `1px solid ${isMe?"rgba(124,111,247,.3)":"rgba(255,255,255,.07)"}`,
            borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            padding:"10px 14px", color:"#eeeef5", fontSize:14, lineHeight:1.65, wordBreak:"break-word",
          }}>
            {msg.content}
          </div>

          {/* Quick react bar */}
          <div className="msg-actions" style={{ position:"absolute", top:-16, [isMe?"left":"right"]:0, display:"flex", gap:2, background:"#1a1a28", border:"1px solid rgba(255,255,255,.1)", borderRadius:20, padding:"3px 7px", zIndex:10 }}>
            {["❤️","😂","👍","🔥","😮"].map(e => (
              <span key={e} className="emoji-item" onClick={() => setLocalReacts(r => ({...r,[e]:(r[e]||0)+1}))}
                style={{ fontSize:14, padding:"2px 3px", borderRadius:4 }}>{e}</span>
            ))}
          </div>
        </div>

        {reactEntries.length > 0 && (
          <div style={{ display:"flex", gap:4, marginTop:4, flexDirection:isMe?"row-reverse":"row", flexWrap:"wrap" }}>
            {reactEntries.map(([e,n]) => (
              <span key={e} onClick={() => setLocalReacts(r => ({...r,[e]:(r[e]||0)+1}))}
                style={{ background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.1)", borderRadius:20, padding:"2px 8px", fontSize:12, cursor:"pointer", userSelect:"none" }}>{e} {n}</span>
            ))}
          </div>
        )}

        <div style={{ display:"flex", gap:5, alignItems:"center", marginTop:3, justifyContent:isMe?"flex-end":"flex-start" }}>
          <span style={{ fontSize:10, color:"#50506a", fontFamily:"'Geist Mono',monospace" }}>{fmtTime(msg.sentAt)}</span>
          {isMe && (
            <span style={{ fontSize:11, color: msg.readStatus==="READ"?"#7c6ff7": msg.readStatus==="DELIVERED"?"#9090b0":"#50506a" }}>
              {msg.readStatus==="READ"?"✓✓": msg.readStatus==="DELIVERED"?"✓✓":"✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Room Row ──────────────────────────────────────────────────────────────── */
function RoomRow({ room, active, onClick, me, online }) {
  const isGroup = room.type === "GROUP";
  const other = !isGroup ? room.members?.find(m => m.id !== me.id) : null;
  const isOnline = online || other?.status === "ONLINE";
  const color = isGroup ? "#7c6ff7" : (other?.avatarColor || avatarColor(room.name));

  return (
    <div className={`room-row ${active?"active":""}`} onClick={onClick}
      style={{ display:"flex", alignItems:"center", gap:11, padding:"10px 14px", borderLeft:"2px solid transparent", position:"relative" }}>
      <Av name={room.name || "?"} color={color} size={38} online={!isGroup ? isOnline : undefined}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:6 }}>
          <span style={{ fontWeight:600, fontSize:13, color:"#eeeef5", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {isGroup ? "# " : ""}{room.name}
          </span>
          {room.unreadCount > 0 && (
            <span className="badge-pulse" style={{ background:"#7c6ff7", color:"white", fontSize:10, borderRadius:99, padding:"2px 6px", flexShrink:0, fontFamily:"'Geist Mono',monospace", fontWeight:500 }}>
              {room.unreadCount > 9 ? "9+" : room.unreadCount}
            </span>
          )}
        </div>
        <p style={{ fontSize:12, color:"#9090b0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginTop:1 }}>
          {room.lastMessage || "No messages yet"}
        </p>
      </div>
    </div>
  );
}

/* ── Info Panel ────────────────────────────────────────────────────────────── */
function InfoPanel({ room, me, onlineUsers, onClose }) {
  const isGroup = room?.type === "GROUP";
  const other = !isGroup ? room?.members?.find(m => m.id !== me.id) : null;
  const color = isGroup ? "#7c6ff7" : (other?.avatarColor || avatarColor(room?.name));

  if (!room) return null;
  return (
    <div className="slide-in" style={{ width:260, background:"#0f0f17", borderLeft:"1px solid rgba(255,255,255,.06)", display:"flex", flexDirection:"column", flexShrink:0, overflow:"hidden" }}>
      <div style={{ padding:"16px", borderBottom:"1px solid rgba(255,255,255,.06)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:13, fontWeight:600, color:"#eeeef5" }}>Details</span>
        <button onClick={onClose} style={{ background:"none", border:"none", color:"#50506a", cursor:"pointer", fontSize:18, lineHeight:1 }}>×</button>
      </div>
      <div style={{ padding:20, display:"flex", flexDirection:"column", alignItems:"center", gap:12, borderBottom:"1px solid rgba(255,255,255,.06)" }}>
        <Av name={room.name} color={color} size={64} showRing online={!isGroup ? (onlineUsers[other?.id]==="ONLINE" || other?.status==="ONLINE") : undefined}/>
        <div style={{ textAlign:"center" }}>
          <p style={{ fontWeight:600, fontSize:16, color:"#eeeef5", marginBottom:3 }}>{isGroup?"# ":""}{room.name}</p>
          <p style={{ fontSize:12, color: (!isGroup && (onlineUsers[other?.id]==="ONLINE" || other?.status==="ONLINE")) ? "#3dd68c" : "#50506a" }}>
            {isGroup ? `${room.members?.length||0} members` : (onlineUsers[other?.id]==="ONLINE"||other?.status==="ONLINE") ? "● Active now" : "○ Offline"}
          </p>
        </div>
      </div>
      {isGroup && room.members?.length > 0 && (
        <div style={{ padding:"14px 16px", flex:1, overflowY:"auto" }}>
          <p style={{ fontSize:11, color:"#50506a", fontFamily:"'Geist Mono',monospace", letterSpacing:".08em", textTransform:"uppercase", marginBottom:10 }}>Members</p>
          {room.members.map(m => (
            <div key={m.id} style={{ display:"flex", alignItems:"center", gap:9, marginBottom:10 }}>
              <Av name={m.username} color={m.avatarColor||avatarColor(m.username)} size={30} online={onlineUsers[m.id]==="ONLINE"||m.status==="ONLINE"}/>
              <div>
                <p style={{ fontSize:13, fontWeight:500, color:"#eeeef5" }}>{m.username}{m.id===me.id&&<span style={{color:"#50506a"}}> (you)</span>}</p>
                <p style={{ fontSize:11, color:"#50506a" }}>{m.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ padding:"14px 16px", borderTop:"1px solid rgba(255,255,255,.06)" }}>
        <div style={{ background:"rgba(255,255,255,.03)", borderRadius:10, padding:"12px 14px" }}>
          <p style={{ fontSize:11, color:"#50506a", fontFamily:"'Geist Mono',monospace", letterSpacing:".06em", marginBottom:6 }}>ROOM TYPE</p>
          <p style={{ fontSize:13, color:"#9090b0" }}>{isGroup ? "Group Channel" : "Direct Message"}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Main App ──────────────────────────────────────────────────────────────── */
function ChatApp({ onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typingUser, setTypingUser] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [sideTab, setSideTab] = useState("chats");
  const [roomFilter, setRoomFilter] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const bottomRef = useRef();
  const inputRef = useRef();
  const typingTimer = useRef();
  const me = JSON.parse(localStorage.getItem("user") || "{}");

  const toast = useCallback((msg, type="info") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const removeToast = id => setToasts(t => t.filter(x => x.id !== id));

  const loadRooms = useCallback(async () => {
    try { const r = await getRooms(); setRooms(r.data || []); }
    catch(e) { console.error(e); }
  }, []);

  useEffect(() => {
    loadRooms();
    connectWebSocket(localStorage.getItem("token"), null, null, su => {
      setOnlineUsers(p => ({ ...p, [su.userId]: su.status }));
    });

    const pollOnline = async () => {
      try {
        const r = await getOnlineUsers();
        const map = {};
        (r.data || []).forEach(u => { map[u.id] = "ONLINE"; });
        setOnlineUsers(map);
      } catch(e) {}
    };
    pollOnline();
    const interval = setInterval(pollOnline, 5000);

    return () => { disconnectWebSocket(); clearInterval(interval); };
  }, [loadRooms]);

  useEffect(() => {
    if (!activeRoom) return;
    setLoading(true);
    getMessages(activeRoom.id)
      .then(r => { setMessages(r.data || []); loadRooms(); })
      .catch(console.error)
      .finally(() => setLoading(false));

    subscribeToRoom(activeRoom.id,
      msg => setMessages(p => [...p, msg]),
      t => { if (t.username !== me.username) setTypingUser(t.isTyping ? t.username : ""); }
    );
  }, [activeRoom?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const sendMsg = e => {
    e.preventDefault();
    if (!input.trim() || !activeRoom) return;
    sendWebSocketMessage(activeRoom.id, input.trim());
    setInput("");
    sendTypingIndicator(activeRoom.id, false);
    inputRef.current?.focus();
  };

  const handleInput = e => {
    setInput(e.target.value);
    if (!activeRoom) return;
    sendTypingIndicator(activeRoom.id, true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => sendTypingIndicator(activeRoom.id, false), 2000);
  };

  const handleSearch = async q => {
    setSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    try { const r = await searchUsers(q); setSearchResults((r.data||[]).filter(u => u.id !== me.id)); }
    catch(e) { console.error(e); }
    finally { setSearchLoading(false); }
  };

  const startDM = async (userId, username) => {
    try {
      const r = await createDM(userId);
      setSearch(""); setSearchResults([]); setSideTab("chats");
      await loadRooms();
      setActiveRoom(r.data);
      toast(`Opened DM with ${username}`, "success");
    } catch(e) { toast("Failed to start DM", "error"); }
  };

  // Group messages with date separators
  const grouped = [];
  let lastDate = null;
  (messages || []).forEach((m, i) => {
    const d = fmtDate(m.sentAt);
    if (d !== lastDate) { grouped.push({ type:"date", label:d, key:`d${i}` }); lastDate = d; }
    const prev = messages[i-1];
    grouped.push({ type:"msg", msg:m, compact: prev && prev.senderId===m.senderId, key:m.id||`m${i}` });
  });

  const filteredRooms = rooms.filter(r => !roomFilter || r.name?.toLowerCase().includes(roomFilter.toLowerCase()));

  const activeOther = activeRoom?.type==="DIRECT" ? activeRoom.members?.find(m=>m.id!==me.id) : null;
  const isOtherOnline = activeOther && (onlineUsers[activeOther.id]==="ONLINE" || activeOther.status==="ONLINE");

  const SIDEBAR_W = 280;

  return (
    <div style={{ display:"flex", height:"100vh", background:"#0a0a0f", overflow:"hidden" }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div style={{ width:SIDEBAR_W, background:"#0f0f17", display:"flex", flexDirection:"column", borderRight:"1px solid rgba(255,255,255,.06)", flexShrink:0 }}>

        {/* User row */}
        <div style={{ padding:"14px 14px 12px", borderBottom:"1px solid rgba(255,255,255,.06)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
            <Av name={me.username||"?"} color={me.avatarColor||avatarColor(me.username)} size={36} online/>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontWeight:600, fontSize:13, color:"#eeeef5", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{me.username}</p>
              <p style={{ fontSize:11, color:"#3dd68c", fontFamily:"'Geist Mono',monospace" }}>● online</p>
            </div>
            <div style={{ display:"flex", gap:4 }}>
              <button className="hover-bg pressable" onClick={() => { loadRooms(); toast("Refreshed"); }}
                style={{ width:28, height:28, border:"1px solid rgba(255,255,255,.08)", borderRadius:7, background:"transparent", color:"#9090b0", cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center" }} title="Refresh">↺</button>
              <button className="hover-bg pressable" onClick={() => { disconnectWebSocket(); onLogout(); }}
                style={{ width:28, height:28, border:"1px solid rgba(255,255,255,.08)", borderRadius:7, background:"transparent", color:"#9090b0", cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" }} title="Logout">⏻</button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:3 }}>
            {[["chats","Chats"],["search","New DM"]].map(([v,l]) => (
              <button key={v} onClick={() => setSideTab(v)}
                style={{ flex:1, padding:"7px 8px", border:`1px solid ${sideTab===v?"rgba(124,111,247,.4)":"rgba(255,255,255,.07)"}`, borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:sideTab===v?600:400, background:sideTab===v?"rgba(124,111,247,.15)":"transparent", color:sideTab===v?"#a89cf7":"#9090b0", transition:"all .18s" }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Chats tab */}
        {sideTab === "chats" && <>
          <div style={{ padding:"8px 10px 4px" }}>
            <div className="input-glow" style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", borderRadius:9, padding:"8px 11px", transition:"border-color .2s, box-shadow .2s" }}>
              <span style={{ color:"#50506a", fontSize:13 }}>⊙</span>
              <input style={{ flex:1, background:"none", border:"none", outline:"none", color:"#eeeef5", fontSize:12 }} placeholder="Filter…" value={roomFilter} onChange={e => setRoomFilter(e.target.value)}/>
              {roomFilter && <button onClick={() => setRoomFilter("")} style={{ background:"none", border:"none", color:"#50506a", cursor:"pointer", fontSize:14 }}>×</button>}
            </div>
          </div>
          <div style={{ padding:"6px 14px 2px" }}>
            <span style={{ fontSize:10, color:"#50506a", fontFamily:"'Geist Mono',monospace", letterSpacing:".1em", textTransform:"uppercase" }}>{filteredRooms.length} conversations</span>
          </div>
          <div style={{ flex:1, overflowY:"auto" }}>
            {filteredRooms.length === 0 && (
              <div style={{ padding:"30px 16px", textAlign:"center" }}>
                <p style={{ color:"#50506a", fontSize:13 }}>No conversations yet</p>
                <p style={{ color:"#50506a", fontSize:12, marginTop:6 }}>Use "New DM" to start chatting</p>
              </div>
            )}
            {filteredRooms.map(r => (
              <RoomRow key={r.id} room={r} active={activeRoom?.id===r.id} me={me}
                online={r.members?.some(m => m.id!==me.id && (onlineUsers[m.id]==="ONLINE"||m.status==="ONLINE"))}
                onClick={() => { setActiveRoom(r); setShowInfo(false); }}/>
            ))}
          </div>
        </>}

        {/* Search tab */}
        {sideTab === "search" && (
          <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"10px 12px", overflow:"hidden" }}>
            <div className="input-glow" style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", borderRadius:9, padding:"9px 12px", marginBottom:10, transition:"border-color .2s, box-shadow .2s" }}>
              <span style={{ color:"#50506a" }}>⊙</span>
              <input style={{ flex:1, background:"none", border:"none", outline:"none", color:"#eeeef5", fontSize:13 }} placeholder="Search by username…" value={search} onChange={e => handleSearch(e.target.value)} autoFocus/>
              {searchLoading && <Spin size={13}/>}
            </div>
            {search.length < 2 && <p style={{ color:"#50506a", fontSize:12, textAlign:"center", marginTop:20 }}>Type 2+ characters to search</p>}
            <div style={{ flex:1, overflowY:"auto" }}>
              {searchResults.map(u => (
                <div key={u.id} className="hover-bg2 pressable" onClick={() => startDM(u.id, u.username)}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 10px", borderRadius:10, cursor:"pointer", transition:"background .15s", marginBottom:2 }}>
                  <Av name={u.username} color={u.avatarColor||avatarColor(u.username)} size={36} online={onlineUsers[u.id]==="ONLINE"||u.status==="ONLINE"}/>
                  <div style={{ flex:1 }}>
                    <p style={{ fontWeight:600, fontSize:13, color:"#eeeef5" }}>{u.username}</p>
                    <p style={{ fontSize:11, color:"#9090b0" }}>{u.email}</p>
                  </div>
                  <span style={{ color:"#7c6ff7", fontSize:16 }}>→</span>
                </div>
              ))}
              {search.length >= 2 && searchResults.length === 0 && !searchLoading && (
                <p style={{ color:"#50506a", fontSize:13, textAlign:"center", marginTop:20 }}>No users found</p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding:"10px 14px", borderTop:"1px solid rgba(255,255,255,.06)", display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontFamily:"'Geist Mono',monospace", fontSize:10, color:"#50506a", letterSpacing:".08em" }}>NEXUS</span>
          <span style={{ fontFamily:"'Geist Mono',monospace", fontSize:10, color:"#50506a" }}>v2.0</span>
        </div>
      </div>

      {/* ── Chat Area ───────────────────────────────────────────────────── */}
      {activeRoom ? (
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>

          {/* Header */}
          <div style={{ padding:"13px 20px", borderBottom:"1px solid rgba(255,255,255,.06)", display:"flex", alignItems:"center", gap:12, background:"#0a0a0f", flexShrink:0 }}>
            <Av name={activeRoom.name} color={activeRoom.type==="GROUP"?"#7c6ff7":avatarColor(activeRoom.name)} size={36}
              online={activeRoom.type==="DIRECT" ? isOtherOnline : undefined}/>
            <div style={{ flex:1, minWidth:0 }}>
              <h3 style={{ fontWeight:600, fontSize:14, color:"#eeeef5", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {activeRoom.type==="GROUP"?"# ":""}{activeRoom.name}
              </h3>
              <p style={{ margin:0, fontSize:12, color: activeRoom.type==="DIRECT" && isOtherOnline ? "#3dd68c" : "#50506a", fontFamily:"'Geist Mono',monospace" }}>
                {activeRoom.type==="GROUP" ? `${activeRoom.members?.length||0} members` : isOtherOnline ? "● active now" : "○ offline"}
              </p>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              <button className="hover-bg pressable" onClick={() => toast("Search in chat — coming soon!", "info")}
                style={{ width:32, height:32, border:"1px solid rgba(255,255,255,.08)", borderRadius:8, background:"transparent", color:"#9090b0", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }} title="Search">⊙</button>
              <button className="hover-bg pressable" onClick={() => setShowInfo(p=>!p)}
                style={{ width:32, height:32, border:`1px solid ${showInfo?"rgba(124,111,247,.4)":"rgba(255,255,255,.08)"}`, borderRadius:8, background:showInfo?"rgba(124,111,247,.12)":"transparent", color:showInfo?"#a89cf7":"#9090b0", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }} title="Info">ⓘ</button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:"auto", padding:"8px 0" }}>
            {loading && (
              <div style={{ display:"flex", justifyContent:"center", padding:20 }}><Spin size={20}/></div>
            )}
            {!loading && grouped.length === 0 && (
              <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"60px 20px" }}>
                <div style={{ width:52, height:52, borderRadius:14, background:"rgba(124,111,247,.12)", border:"1px solid rgba(124,111,247,.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, marginBottom:14 }}>✦</div>
                <p style={{ color:"#9090b0", fontSize:14, marginBottom:4 }}>This is the beginning of your conversation</p>
                <p style={{ color:"#50506a", fontSize:13 }}>with <strong style={{color:"#eeeef5"}}>{activeRoom.name}</strong></p>
              </div>
            )}
            {grouped.map(item =>
              item.type === "date"
                ? <DateSep key={item.key} label={item.label}/>
                : <Msg key={item.key} msg={item.msg} isMe={item.msg.senderId===me.id} compact={item.compact}/>
            )}
            {typingUser && <div style={{ padding:"4px 16px" }}><Typing who={typingUser}/></div>}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div style={{ padding:"10px 16px 14px", borderTop:"1px solid rgba(255,255,255,.06)", background:"#0a0a0f", flexShrink:0 }}>
            <form onSubmit={sendMsg}>
              <div className="input-glow" style={{ display:"flex", alignItems:"flex-end", gap:8, background:"rgba(255,255,255,.04)", border:`1px solid ${inputFocused?"rgba(124,111,247,.4)":"rgba(255,255,255,.08)"}`, borderRadius:14, padding:"10px 12px", transition:"border-color .2s, box-shadow .2s", position:"relative" }}>
                <textarea ref={inputRef} value={input} onChange={handleInput} onFocus={()=>setInputFocused(true)} onBlur={()=>setInputFocused(false)}
                  onKeyDown={e => { if(e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(e); } }}
                  rows={1} placeholder="Message…"
                  style={{ flex:1, background:"none", border:"none", outline:"none", color:"#eeeef5", fontSize:14, resize:"none", lineHeight:1.6, maxHeight:120, overflowY:"auto", fontFamily:"inherit" }}/>
                <div style={{ display:"flex", gap:4, alignItems:"center", flexShrink:0, position:"relative" }}>
                  <button type="button" className="hover-bg pressable" onClick={() => setShowEmoji(p=>!p)}
                    style={{ width:30, height:30, border:"none", borderRadius:8, background:"transparent", color:showEmoji?"#a89cf7":"#50506a", cursor:"pointer", fontSize:17, display:"flex", alignItems:"center", justifyContent:"center", transition:"color .15s" }}>◎</button>
                  {showEmoji && <EmojiPicker onPick={e=>setInput(p=>p+e)} onClose={()=>setShowEmoji(false)}/>}
                </div>
                <button type="submit" className="pressable" disabled={!input.trim()}
                  style={{ width:34, height:34, borderRadius:10, flexShrink:0, background:input.trim()?"#7c6ff7":"rgba(255,255,255,.05)", color:input.trim()?"white":"#50506a", border:"none", cursor:input.trim()?"pointer":"default", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s" }}>➤</button>
              </div>
            </form>
            <p style={{ fontSize:10, color:"#50506a", textAlign:"center", marginTop:5, fontFamily:"'Geist Mono',monospace", letterSpacing:".04em" }}>ENTER send · SHIFT+ENTER newline</p>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="fade-in" style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(rgba(124,111,247,.04) 1px, transparent 1px)", backgroundSize:"28px 28px", pointerEvents:"none" }}/>
          <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle, rgba(124,111,247,.05) 0%, transparent 60%)", pointerEvents:"none" }}/>
          <div style={{ zIndex:1, textAlign:"center" }}>
            <div style={{ width:64, height:64, borderRadius:18, background:"rgba(124,111,247,.12)", border:"1px solid rgba(124,111,247,.22)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, margin:"0 auto 20px" }}>✦</div>
            <h2 style={{ fontFamily:"'Instrument Serif',serif", fontSize:28, fontWeight:400, color:"#eeeef5", letterSpacing:"-.02em", marginBottom:8 }}>Nexus Chat</h2>
            <p style={{ color:"#9090b0", fontSize:14, maxWidth:280, lineHeight:1.6, margin:"0 auto 28px" }}>Select a conversation from the sidebar or start a new direct message</p>
            <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
              {[["⚡","Real-time","WebSocket"],["🔐","Secure","JWT Auth"],["📡","Scalable","Redis Pub/Sub"]].map(([icon,title,sub]) => (
                <div key={title} style={{ padding:"14px 18px", background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)", borderRadius:12, textAlign:"center", minWidth:110 }}>
                  <div style={{ fontSize:20, marginBottom:6 }}>{icon}</div>
                  <p style={{ fontWeight:600, fontSize:13, color:"#eeeef5", marginBottom:2 }}>{title}</p>
                  <p style={{ fontSize:11, color:"#50506a", fontFamily:"'Geist Mono',monospace" }}>{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Info Panel ───────────────────────────────────────────────── */}
      {showInfo && activeRoom && (
        <InfoPanel room={activeRoom} me={me} onlineUsers={onlineUsers} onClose={()=>setShowInfo(false)}/>
      )}

      <Toast items={toasts} onClose={removeToast}/>
    </div>
  );
}

/* ── Root ──────────────────────────────────────────────────────────────────── */
export default function App() {
  const [auth, setAuth] = useState(!!localStorage.getItem("token"));
  return auth
    ? <ChatApp onLogout={() => { localStorage.clear(); setAuth(false); }}/>
    : <Auth onLogin={() => setAuth(true)}/>;
}
