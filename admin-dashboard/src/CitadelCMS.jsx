import { useState, useEffect, useRef, Fragment } from "react";
import { requestForToken, onMessageListener } from "./firebase-config";
import API_URLS from "./api";
import churchLogo from "./assets/logo.jpg";

const INITIAL_STATE = {
  users: [],
  admins: [],
  attendance: [],
  messages: [],
  reminders: [],
  financial: [],
  financialSections: [],
  salaries: [],
  fundRequests: [],
  formFields: {
    first_timer: [],
    member_worker: [],
  },
};

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const icons = {
    dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    users: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    forms: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    admins: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    attendance: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    messages: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
    logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
    plus: "M12 4v16m8-8H4",
    trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    check: "M5 13l4 4L19 7",
    x: "M6 18L18 6M6 6l12 12",
    send: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
    eye: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
    church: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
    bell: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    filter: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z",
    stats: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    settings: "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
    print: "M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-2 4H8v-6h8v6z",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={icons[name] || icons.check} />
    </svg>
  );
};

// ─── TOAST ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: type === "error" ? "#ef4444" : type === "warning" ? "#f59e0b" : "#10b981",
      color: "#fff", padding: "12px 20px", borderRadius: 10,
      boxShadow: "0 8px 32px rgba(0,0,0,0.18)", fontFamily: "'DM Sans', sans-serif",
      fontWeight: 500, fontSize: 14, display: "flex", alignItems: "center", gap: 10,
      animation: "slideUp .25s ease",
    }}>
      {msg}
      <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", marginLeft: 4 }}>✕</button>
    </div>
  );
};

// ─── MODAL ────────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => {
  useEffect(() => {
    const scrollY = window.scrollY;
    const originalStyle = window.getComputedStyle(document.body).position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.position = originalStyle;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9998,
      background: "rgba(11,31,59,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "80px 16px 40px", overflowY: "auto"
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 520,
        boxShadow: "0 24px 80px rgba(0,0,0,0.18)", overflow: "hidden",
        animation: "scaleIn .2s ease",
        display: "flex", flexDirection: "column", maxHeight: "80vh",
        margin: "0 auto", flexShrink: 0
      }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 17, color: "#0B1F3B" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#6b7280" }}>✕</button>
        </div>
        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
};

// ─── VALIDATION HELPERS ───────────────────────────────────────────────────────
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const isValidPhone = (v) => /^[+]?[0-9][\d\s\-().]{6,19}$/.test(v.trim());

// ─── FORM INPUT ───────────────────────────────────────────────────────────────
const Input = ({ id, label, value, onChange, type = "text", placeholder, required, options, small, ...rest }) => {
  const [touched, setTouched] = useState(false);
  let validationError = null;
  if (touched && value) {
    if (type === "email" && !isValidEmail(value)) validationError = "Enter a valid email address (e.g. john@example.com)";
    if (type === "tel" && !isValidPhone(value)) validationError = "Enter a valid phone number (e.g. +2348012345678)";
  }
  return (
    <div style={{ marginBottom: small ? 12 : 16 }}>
      {label && <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{label}{required && <span style={{ color: "#ef4444" }}> *</span>}</label>}
      {type === "dropdown" ? (
        <select id={id} value={value} onChange={e => onChange && onChange(e.target.value)} style={inputStyle} {...rest}>
          <option value="">Select...</option>
          {(options || []).map(o => {
            const val = typeof o === "object" ? o.value : o;
            const lbl = typeof o === "object" ? o.label : o;
            return <option key={val} value={val}>{lbl}</option>;
          })}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onBlur={() => setTouched(true)}
          onChange={e => { onChange && onChange(e.target.value); }}
          placeholder={placeholder}
          style={{
            ...inputStyle,
            ...(type === "date" ? dateInputStyle : {}),
            ...(validationError ? { borderColor: "#ef4444", background: "#fff5f5" } : {}),
          }}
          {...rest}
        />
      )}
      {validationError && (
        <span style={{ display: "block", marginTop: 4, fontSize: 12, color: "#ef4444", fontFamily: "'DM Sans', sans-serif" }}>
          ⚠ {validationError}
        </span>
      )}
    </div>
  );
};

const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "10px 14px",
  border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14,
  fontFamily: "'DM Sans', sans-serif", color: "#111827",
  background: "#fafafa", outline: "none", transition: "border .2s",
  lineHeight: "1.5", minHeight: 42,
};

const dateInputStyle = {
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  cursor: "pointer",
};

const thStyle = { padding: "12px 18px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6b7280", fontFamily: "'DM Sans', sans-serif", borderBottom: "1px solid #e5e7eb" };
const tdStyle = { padding: "13px 18px", fontSize: 14, color: "#111827", fontFamily: "'DM Sans', sans-serif" };

const Btn = ({ children, onClick, variant = "primary", small, disabled, type = "button", style }) => {
  const styles = {
    primary: { background: "#0B1F3B", color: "#fff" },
    accent: { background: "#F4C430", color: "#0B1F3B" },
    danger: { background: "#fee2e2", color: "#ef4444" },
    ghost: { background: "#f3f4f6", color: "#374151" },
    success: { background: "#d1fae5", color: "#059669" },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      ...styles[variant], border: "none", borderRadius: 10,
      padding: small ? "7px 14px" : "10px 20px",
      fontSize: small ? 13 : 14, fontWeight: 600,
      fontFamily: "'DM Sans', sans-serif", cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1, transition: "all .15s",
      display: "inline-flex", alignItems: "center", gap: 7,
      flexShrink: 0,
      ...style,
    }}>
      {children}
    </button>
  );
};

// ─── SEARCH INPUT ─────────────────────────────────────────────────────────────
const SearchInput = ({ value, onChange, placeholder = "Search..." }) => (
  <div style={{ position: "relative", width: "100%", maxWidth: 300, marginBottom: 16 }}>
    <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#6b7280", pointerEvents: "none" }}>
      <Icon name="search" size={16} />
    </div>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        ...inputStyle,
        paddingLeft: 36,
        marginBottom: 0,
        borderRadius: 20,
        background: "#fff",
        borderColor: "#e5e7eb"
      }}
    />
  </div>
);

// ─── BADGE ────────────────────────────────────────────────────────────────────
const Badge = ({ label, color }) => {
  const colors = {
    first_timer: { bg: "#fef3c7", text: "#92400e" },
    member: { bg: "#dbeafe", text: "#1e40af" },
    worker: { bg: "#d1fae5", text: "#065f46" },
    active: { bg: "#d1fae5", text: "#065f46" },
    disabled: { bg: "#fee2e2", text: "#991b1b" },
    invited: { bg: "#fef3c7", text: "#92400e" },
    present: { bg: "#d1fae5", text: "#065f46" },
    absent: { bg: "#fee2e2", text: "#991b1b" },
    media_admin: { bg: "#ede9fe", text: "#5b21b6" },
    usher_admin: { bg: "#dbeafe", text: "#1e40af" },
    leader: { bg: "#fef3c7", text: "#92400e" },
    pending: { bg: "#fee2e2", text: "#b91c1c" },
    finance_admin: { bg: "#fef3c7", text: "#b45309" },
    income: { bg: "#d1fae5", text: "#065f46" },
    expense: { bg: "#fee2e2", text: "#991b1b" },
  };
  const c = colors[label] || colors[color] || { bg: "#f3f4f6", text: "#374151" };
  return (
    <span style={{
      background: c.bg, color: c.text, padding: "3px 10px",
      borderRadius: 20, fontSize: 12, fontWeight: 600,
      fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
    }}>{(label || "").replace(/_/g, " ")}</span>
  );
};

// ─── STAT CARD ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, accent, onClick }) => (
  <div className="stat-card" onClick={onClick} style={{
    background: accent ? "#0B1F3B" : "#fff", borderRadius: 14,
    padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 160,
    cursor: onClick ? "pointer" : "default"
  }}>
    <div style={{
      background: accent ? "rgba(244,196,48,0.15)" : "#f0f4ff",
      color: accent ? "#F4C430" : "#0B1F3B",
      borderRadius: 12, padding: 12, display: "flex",
    }}>
      <Icon name={icon} size={22} />
    </div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 800, color: accent ? "#fff" : "#0B1F3B", fontFamily: "'DM Sans', sans-serif" }}>{value}</div>
      <div style={{ fontSize: 12, color: accent ? "rgba(255,255,255,0.6)" : "#6b7280", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const Sidebar = ({ nav, active, setActive, role, onLogout, adminName }) => {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 768 : false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const roleLabels = { cms: "CMS Root", media_admin: "Media Admin", usher_admin: "Usher Admin", leader: "Leader", finance_admin: "Finance Admin", quality_control: "Quality Control" };

  const handleNavClick = (key) => {
    setActive(key);
    setMenuOpen(false);
  };

  const sidebarContent = (
    <aside style={{
      width: 240, background: "#0B1F3B", height: "100vh", display: "flex",
      flexDirection: "column", position: "fixed", left: isMobile ? (menuOpen ? 0 : -240) : 0, top: 0, zIndex: 1100,
      transition: "left 0.3s ease-in-out",
      boxShadow: isMobile && menuOpen ? "0 0 40px rgba(0,0,0,0.5)" : "none"
    }}>
      <div style={{ padding: "28px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <img src={churchLogo} alt="Logo" style={{ width: 36, height: 36, objectFit: "contain" }} />
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, fontFamily: "'DM Sans', sans-serif" }}>Citadel</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>Management System</div>
          </div>
        </div>
        <div style={{
          background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "8px 12px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>{adminName || roleLabels[role] || role}</span>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
        {nav.map(item => (
          <button key={item.key} onClick={() => handleNavClick(item.key)} style={{
            width: "100%", background: active === item.key ? "rgba(244,196,48,0.12)" : "none",
            border: "none", cursor: "pointer",
            padding: "11px 20px", display: "flex", alignItems: "center", gap: 12,
            color: active === item.key ? "#F4C430" : "rgba(255,255,255,0.55)",
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: active === item.key ? 700 : 500,
            textAlign: "left", borderLeft: active === item.key ? "3px solid #F4C430" : "3px solid transparent",
            transition: "all .15s",
          }}>
            <Icon name={item.icon} size={17} />
            {item.label}
          </button>
        ))}
      </nav>
      <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={onLogout} style={{
          width: "100%", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 10, padding: "10px 16px", cursor: "pointer",
          color: "#f87171", display: "flex", alignItems: "center", gap: 10,
          fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
        }}>
          <Icon name="logout" size={16} /> Logout
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {isMobile && (
        <>
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, height: 60,
            background: "#0B1F3B", borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", padding: "0 16px", justifyContent: "space-between",
            zIndex: 1000, boxShadow: "0 2px 10px rgba(0,0,0,0.15)"
          }}>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{
              background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer",
              borderRadius: 8, padding: 8, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              {menuOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img src={churchLogo} alt="Logo" style={{ width: 28, height: 28, objectFit: "contain" }} />
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 15, fontFamily: "'DM Sans', sans-serif" }}>Citadel</span>
            </div>
            <div style={{ width: 36 }} />
          </div>
          {menuOpen && (
            <div onClick={() => setMenuOpen(false)} style={{
              position: "fixed", inset: 0, background: "rgba(11,31,59,0.5)",
              backdropFilter: "blur(2px)", zIndex: 1050
            }} />
          )}
        </>
      )}
      {sidebarContent}
    </>
  );
};

// ─── PAGE WRAPPER ─────────────────────────────────────────────────────────────
const Page = ({ title, subtitle, actions, children }) => (
  <div className="page-container" style={{ padding: "32px 32px 48px", position: "relative" }}>
    <div className="page-watermark">
      <img src={churchLogo} alt="" />
    </div>
    <div style={{ position: "relative", zIndex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 26, color: "#0B1F3B" }}>{title}</h1>
          {subtitle && <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>{subtitle}</p>}
        </div>
        {actions && <div style={{ display: "flex", gap: 10 }}>{actions}</div>}
      </div>
      {children}
    </div>
  </div>
);


// ─── TABLE ────────────────────────────────────────────────────────────────────
const TableRow = ({ row, index, onClick, isClickable }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => isClickable && setHovered(true)}
      onMouseLeave={() => isClickable && setHovered(false)}
      style={{
        borderBottom: "1px solid #f3f4f6",
        transition: "background .1s",
        cursor: isClickable ? "pointer" : "default",
        background: isClickable && hovered ? "#f8fafc" : "transparent"
      }}
    >
      {row.map((cell, j) => (
        <td key={j} style={{ padding: "13px 18px", fontSize: 14, color: "#111827", fontFamily: "'DM Sans', sans-serif" }}>{cell}</td>
      ))}
    </tr>
  );
};

const Table = ({ headers, rows, onRowClick }) => (
  <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflowX: "auto", width: "100%", maxWidth: "100%" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
      <thead>
        <tr style={{ background: "#f8fafc" }}>
          {headers.map(h => (
            <th key={h} style={{ padding: "12px 18px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6b7280", fontFamily: "'DM Sans', sans-serif", borderBottom: "1px solid #e5e7eb", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={headers.length} style={{ padding: "40px", textAlign: "center", color: "#9ca3af", fontFamily: "'DM Sans', sans-serif" }}>No records found</td></tr>
        ) : rows.map((row, i) => (
          <TableRow key={i} row={row} index={i} isClickable={!!onRowClick} onClick={(e) => onRowClick && onRowClick(i, e)} />
        ))}
      </tbody>
    </table>
  </div>
);

// ─── USER DETAILS MODAL ──────────────────────────────────────────────────────
const UserDetailsModal = ({ user, onClose, onEdit }) => {
  if (!user) return null;
  return (
    <Modal title="User Details" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid #e5e7eb", paddingBottom: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%", background: "#0B1F3B", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 700, fontFamily: "'DM Sans', sans-serif"
          }}>
            {user.full_name ? user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?"}
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0B1F3B", fontFamily: "'DM Sans', sans-serif" }}>{user.full_name}</h4>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <Badge label={user.tag} />
              {user.department && <Badge label={user.department} />}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
          <div>
            <span style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Email Address</span>
            <span style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#111827", fontFamily: "'DM Sans', sans-serif" }}>{user.email || "—"}</span>
          </div>
          <div>
            <span style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Phone Number</span>
            <span style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#111827", fontFamily: "'DM Sans', sans-serif" }}>{user.phone || "—"}</span>
          </div>
          <div>
            <span style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Date of Birth</span>
            <span style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#111827", fontFamily: "'DM Sans', sans-serif" }}>
              {(() => {
                // Look in top-level field first, then search extra_fields for any DOB-like key
                const dobVal = user.date_of_birth ||
                  (user.extra_fields && Object.entries(user.extra_fields)
                    .find(([k]) => /birth|dob/i.test(k))?.[1]);
                if (!dobVal) return "Not provided";
                const d = new Date(dobVal);
                return isNaN(d.getTime()) ? String(dobVal) : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
              })()}
            </span>
          </div>
          <div>
            <span style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Registered Date</span>
            <span style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#111827", fontFamily: "'DM Sans', sans-serif" }}>
              {user.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
            </span>
          </div>
          <div style={{ gridColumn: "span 2" }}>
            <span style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Push Notification Status</span>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              background: user.fcm_tokens && user.fcm_tokens.length > 0 ? "#ecfdf5" : "#f3f4f6",
              color: user.fcm_tokens && user.fcm_tokens.length > 0 ? "#047857" : "#6b7280",
              marginTop: 2
            }}>
              {user.fcm_tokens && user.fcm_tokens.length > 0 ? `● Active (${user.fcm_tokens.length} ${user.fcm_tokens.length === 1 ? 'device' : 'devices'})` : "○ Inactive"}
            </span>
          </div>
        </div>

        {user.extra_fields && Object.keys(user.extra_fields).filter(k => !/birth|dob/i.test(k)).length > 0 && (
          <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 16 }}>
            <h5 style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "'DM Sans', sans-serif" }}>Additional Information</h5>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
              {Object.entries(user.extra_fields).filter(([k]) => !/birth|dob/i.test(k)).map(([k, val]) => {
                const valString = typeof val === "object" && val !== null ? JSON.stringify(val) : String(val || "—");
                const formattedKey = k.split(/[_\-\s]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
                return (
                  <div key={k}>
                    <span style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{formattedKey}</span>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#111827", fontFamily: "'DM Sans', sans-serif" }}>{valString}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 12, borderTop: "1px solid #e5e7eb", paddingTop: 16 }}>
          <Btn onClick={onClose} variant="ghost">Close</Btn>
          {onEdit && <Btn onClick={onEdit} variant="primary">Edit User</Btn>}
        </div>
      </div>
    </Modal>
  );
};

// ─── ATTENDANCE DETAILS MODAL ────────────────────────────────────────────────
const AttendanceDetailsModal = ({ eventLog, users, onClose, onEdit }) => {
  if (!eventLog) return null;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the attendance log");
      return;
    }

    const formattedDate = new Date(eventLog.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    const presentRecords = eventLog.records.filter(r => r.status === "present");
    const absentRecords = eventLog.records.filter(r => r.status === "absent");

    const buildRows = (records) => records.map((r) => {
      const user = users.find(u => u.id === r.user_id || u._id === r.user_id);
      const userName = r.user_full_name || user?.full_name || r.user_id;
      const userTag = user?.tag || "—";
      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px; font-size: 14px; font-weight: 500; color: #111827;">${userName}</td>
          <td style="padding: 12px; font-size: 14px; color: #4b5563; text-transform: capitalize;">${userTag.replace(/_/g, ' ')}</td>
        </tr>
      `;
    }).join("");

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Attendance Log: ${eventLog.event_name} - ${formattedDate}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #111827;
            padding: 40px;
            margin: 0;
          }
          .header {
            border-bottom: 2px solid #111827;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .title {
            font-size: 24px;
            font-weight: 800;
            margin: 0 0 8px 0;
            color: #0b1f3b;
          }
          .meta {
            font-size: 14px;
            color: #4b5563;
            margin-bottom: 16px;
          }
          .stats-container {
            display: flex;
            gap: 24px;
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 30px;
          }
          .stat-box { font-size: 14px; }
          .stat-val { font-size: 18px; font-weight: 700; margin-top: 4px; }
          .section-title {
            font-size: 16px;
            font-weight: 800;
            margin: 30px 0 10px 0;
            padding: 8px 14px;
            border-radius: 6px;
          }
          .section-present { background: #d1fae5; color: #065f46; }
          .section-absent { background: #fee2e2; color: #991b1b; margin-top: 40px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th {
            background: #f1f5f9;
            padding: 12px;
            font-size: 12px;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            text-align: left;
            border-bottom: 2px solid #cbd5e1;
          }
          .print-watermark {
            position: fixed; top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.05; z-index: -1; pointer-events: none;
            display: flex; justify-content: center; align-items: center;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-watermark img { width: 550px; height: 550px; object-fit: contain; filter: grayscale(100%); }
          @media print {
            body { padding: 20px; }
            tr { page-break-inside: avoid; }
            .print-watermark { opacity: 0.08 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        </style>
      </head>
      <body>
        <div class="print-watermark"><img src="logo.jpg" alt="" /></div>
        <div class="header">
          <div class="title">${eventLog.event_name}</div>
          <div class="meta">Date: <strong>${formattedDate}</strong></div>
          <div class="stats-container">
            <div class="stat-box"><div>Present</div><div class="stat-val" style="color: #047857;">${presentRecords.length}</div></div>
            <div class="stat-box"><div>Absent</div><div class="stat-val" style="color: #b91c1c;">${absentRecords.length}</div></div>
            <div class="stat-box"><div>Total</div><div class="stat-val">${eventLog.present + eventLog.absent}</div></div>
            <div class="stat-box"><div>Attendance Rate</div><div class="stat-val">${(eventLog.present + eventLog.absent) > 0 ? Math.round((eventLog.present / (eventLog.present + eventLog.absent)) * 100) : 0}%</div></div>
          </div>
        </div>

        <div class="section-title section-present">✓ Present (${presentRecords.length})</div>
        <table>
          <thead><tr><th>Name</th><th>Role</th></tr></thead>
          <tbody>${buildRows(presentRecords) || "<tr><td colspan='2' style='padding:12px;color:#9ca3af;'>No present records</td></tr>"}</tbody>
        </table>

        <div class="section-title section-absent">✗ Absent (${absentRecords.length})</div>
        <table>
          <thead><tr><th>Name</th><th>Role</th></tr></thead>
          <tbody>${buildRows(absentRecords) || "<tr><td colspan='2' style='padding:12px;color:#9ca3af;'>No absent records</td></tr>"}</tbody>
        </table>

        <div style="margin-top: 50px; border-top: 1px dashed #cbd5e1; padding-top: 10px; font-size: 11px; color: #94a3b8; text-align: center;">
          Generated by Citadel Church CMS on ${new Date().toLocaleString()}
        </div>
        <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };</script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <Modal title={`Attendance Log: ${eventLog.event_name}`} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: 12 }}>
          <div style={{ fontSize: 14, color: "#6b7280", fontFamily: "'DM Sans', sans-serif" }}>
            Date: <strong>{new Date(eventLog.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong>
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            <span style={{ fontSize: 13, color: "#047857", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>● Present: {eventLog.present}</span>
            <span style={{ fontSize: 13, color: "#b91c1c", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>● Absent: {eventLog.absent}</span>
            <span style={{ fontSize: 13, color: "#111827", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Total: {eventLog.present + eventLog.absent}</span>
          </div>
        </div>

        <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Name</th>
                <th style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Role</th>
                <th style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {eventLog.records.map((r, idx) => {
                const user = users.find(u => u.id === r.user_id || u._id === r.user_id);
                const userName = r.user_full_name || user?.full_name || r.user_id;
                const userTag = user?.tag || "—";
                return (
                  <tr key={idx} style={{ borderBottom: idx < eventLog.records.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <td style={{ padding: "10px 12px", fontSize: 13, color: "#111827", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{userName}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280", fontFamily: "'DM Sans', sans-serif" }}><Badge label={userTag} /></td>
                    <td style={{ padding: "10px 12px", fontSize: 13 }}><Badge label={r.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", gap: 10, borderTop: "1px solid #e5e7eb", paddingTop: 12, justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={onClose} variant="ghost">Close</Btn>
            {onEdit && (
              <Btn onClick={onEdit} variant="primary">Edit Log</Btn>
            )}
          </div>
          <Btn onClick={handlePrint} variant="accent">
            <Icon name="print" size={16} /> Print Log
          </Btn>
        </div>
      </div>
    </Modal>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ════════════════════════════════════════════════════════════════════════════════
const LoginPage = ({ onLogin, toast }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handle = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setError("");
    setLoading(true);
    try {
      await onLogin(email, password);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    if (!email) { setError("Please enter your email address first."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(API_URLS.AUTH_FORGOT_PASSWORD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        toast(data.message || "OTP sent to your email", "success");
        setForgotStep(2);
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch (err) {
      setError("Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotReset = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) { setError("Please enter the OTP and a new password."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(API_URLS.AUTH_RESET_PASSWORD_OTP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password: newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        toast(data.message || "Password reset successful", "success");
        setForgotMode(false);
        setForgotStep(1);
        setPassword("");
        setOtp("");
        setNewPassword("");
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch (err) {
      setError("Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  if (forgotMode) {
    return (
      <div style={{ minHeight: "100vh", background: "#0B1F3B", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", padding: 16 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <img src={churchLogo} alt="Citadel Logo" style={{ width: 80, height: 80, objectFit: "contain", marginBottom: 16, animation: "scaleIn .4s ease" }} />
            <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 800, margin: "0 0 6px" }}>Citadel</h1>
          </div>
          <div style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 32px 80px rgba(0,0,0,0.3)" }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "#0B1F3B" }}>Reset Password</h2>
            <p style={{ margin: "0 0 24px", color: "#6b7280", fontSize: 14 }}>{forgotStep === 1 ? "Enter your email to receive a one-time password." : "Check your email for the OTP and enter your new password."}</p>
            {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#dc2626", fontFamily: "'DM Sans', sans-serif" }}>{error}</div>}

            <Input label="Email Address" value={email} onChange={setEmail} type="email" placeholder="you@church.org" />

            {forgotStep === 2 && (
              <>
                <Input label="One-Time Password (OTP)" value={otp} onChange={setOtp} type="text" placeholder="123456" />
                <Input label="New Password" value={newPassword} onChange={setNewPassword} type="password" placeholder="••••••••" autoComplete="new-password" name="newPassword" />
              </>
            )}

            <button onClick={forgotStep === 1 ? handleForgotRequest : handleForgotReset} disabled={loading} style={{
              width: "100%", background: loading ? "#1e3a6e" : "#0B1F3B", color: "#fff", border: "none",
              borderRadius: 12, padding: "13px", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "'DM Sans', sans-serif"
            }}>
              {loading && <span style={{ display: "inline-block", width: 16, height: 16, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} />}
              {loading ? "Processing..." : (forgotStep === 1 ? "Send OTP" : "Reset Password")}
            </button>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button onClick={() => { setForgotMode(false); setForgotStep(1); setError(""); }} style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Back to Login</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0B1F3B",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", padding: 16,
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <img src={churchLogo} alt="Citadel Logo" style={{ width: 80, height: 80, objectFit: "contain", marginBottom: 16, animation: "scaleIn .4s ease" }} />
          <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 800, margin: "0 0 6px" }}>Citadel</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: 0 }}>E-Management System</p>
        </div>
        <div style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 32px 80px rgba(0,0,0,0.3)" }}>
          <h2 style={{ margin: "0 0 24px", fontSize: 20, fontWeight: 700, color: "#0B1F3B" }}>Sign in to continue</h2>
          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#dc2626", fontFamily: "'DM Sans', sans-serif" }}>{error}</div>}
          <Input label="Email Address" value={email} onChange={setEmail} type="email" placeholder="you@church.org" />
          <Input label="Password" value={password} onChange={setPassword} type="password" placeholder="••••••••" />
          <div style={{ textAlign: "right", marginTop: -8, marginBottom: 16 }}>
            <button onClick={() => { setForgotMode(true); setError(""); }} style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Forgot Password?</button>
          </div>
          <button onClick={handle} disabled={loading} style={{
            width: "100%", background: loading ? "#1e3a6e" : "#0B1F3B", color: "#fff", border: "none",
            borderRadius: 12, padding: "13px", fontSize: 15, fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif", cursor: loading ? "not-allowed" : "pointer",
            transition: "background .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}>
            {loading && (
              <span style={{
                display: "inline-block", width: 16, height: 16, border: "2.5px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff", borderRadius: "50%",
                animation: "spin .7s linear infinite",
              }} />
            )}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};


// ════════════════════════════════════════════════════════════════════════════════
// PUBLIC REGISTRATION
// ════════════════════════════════════════════════════════════════════════════════
const RegisterPage = ({ formType, formFields, onSubmit, onBack }) => {
  const [values, setValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [permission, setPermission] = useState(() => {
    if (typeof window === "undefined") return "default";
    if (!("Notification" in window)) return "default";
    return Notification.permission;
  });
  const fields = (formFields[formType] || []).filter(f => {
    if (!f.active) return false;
    if (f.worker_only && values.role_type !== "Worker") return false;
    return true;
  });


  const handleRequestPermission = async () => {
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        const p = await Notification.requestPermission();
        setPermission(p);
      } else {
        alert("Push notifications are not supported in this browser. Proceeding to registration.");
        setPermission("granted");
      }
    } catch (err) {
      console.warn("Push request failed:", err);
      setPermission("granted");
    }
  };

  const handleSubmit = async () => {
    const missing = fields.filter(f => f.required && !values[f.field_key]);
    if (missing.length) return;

    setSubmitting(true);
    // Attempt to get FCM Token immediately without blocking mobile users if it hangs
    let fcmToken = null;
    try {
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 2500));
      fcmToken = await Promise.race([requestForToken(), timeoutPromise]);
    } catch (err) {
      console.warn("Push registration timed out or skipped:", err);
    }

    try {
      await onSubmit({ ...values, fcm_token: fcmToken }, formType);
    } finally {
      setSubmitting(false);
    }
  };

  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isPWA = typeof window !== "undefined" && window.matchMedia('(display-mode: standalone)').matches;

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg, #0B1F3B 0%, #1e3a6e 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{ width: "100%", maxWidth: 480 }}>

        <div style={{ background: "#fff", borderRadius: 20, padding: "32px 24px", boxShadow: "0 32px 80px rgba(0,0,0,0.3)" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <img src={churchLogo} alt="Citadel Logo" style={{ width: 80, height: 80, objectFit: "contain", marginBottom: 12 }} />
            <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#0B1F3B", fontFamily: "'DM Sans', sans-serif" }}>
              {formType === "first_timer"
                ? "First-Timer Registration"
                : "Member & Worker Registration"}
            </h2>
            <p style={{ margin: 0, color: "#6b7280", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>{import.meta.env.VITE_CHURCH_NAME || "Church Registration"}</p>

            <div style={{ display: "inline-flex", marginTop: 16, alignItems: "center", gap: 8, padding: "8px 12px", background: permission === 'granted' ? "#ecfdf5" : "#fff7ed", borderRadius: 8, border: `1px solid ${permission === 'granted' ? "#10b981" : "#f59e0b"}` }}>
              <Icon name="bell" size={14} color={permission === 'granted' ? "#10b981" : "#f59e0b"} />
              <span style={{ fontSize: 12, fontWeight: 600, color: permission === 'granted' ? "#065f46" : "#92400e", fontFamily: "'DM Sans', sans-serif" }}>
                {permission === 'granted' ? "Notifications Enabled" : "Notifications Required"}
              </span>
            </div>
          </div>

          {permission !== 'granted' ? (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <p style={{ color: "#374151", fontSize: 15, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, marginBottom: 16 }}>
                To receive important service reminders and instant updates, please allow notifications.
              </p>

              {isIOS && !isPWA && (
                <div style={{ background: "#eff6ff", border: "1px dashed #3b82f6", color: "#1e3a8a", padding: "16px", borderRadius: 12, fontSize: 13, fontFamily: "'DM Sans', sans-serif", marginBottom: 20, textAlign: "left", lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 800, marginBottom: 6, color: "#1d4ed8" }}>📱 Apple iPhone/iPad Instructions:</div>
                  To enable push notifications on iOS, you must add this page to your Home Screen first:
                  <ol style={{ margin: "8px 0 0 16px", padding: 0 }}>
                    <li>Tap the <strong>Share button</strong> <span style={{ fontSize: 16 }}>⎋</span> at the bottom of Safari.</li>
                    <li>Scroll down and select <strong>"Add to Home Screen"</strong>.</li>
                    <li>Open the installed <strong>Citadel CMS</strong> app from your Home Screen to register!</li>
                  </ol>
                </div>
              )}

              <div style={{ background: "#f9fafb", color: "#4b5563", padding: "12px", borderRadius: 8, fontSize: 12, fontFamily: "'DM Sans', sans-serif", marginBottom: 20 }}>
                When prompted, select <strong>"Allow"</strong> to enable notifications.
              </div>
              <Btn onClick={handleRequestPermission} variant="accent" style={{ width: "100%" }}>
                Enable Notifications
              </Btn>
            </div>
          ) : (
            <>
              {fields.map(f => (
                <Input
                  key={f.id} label={f.label} required={f.required}
                  type={f.type}
                  options={f.options}
                  value={values[f.field_key] || ""}
                  onChange={v => setValues(prev => ({ ...prev, [f.field_key]: v }))}
                />
              ))}
              <Btn onClick={handleSubmit} variant="primary" style={{ width: "100%", marginTop: 12 }} disabled={submitting}>
                {submitting ? "Registering..." : "Submit Registration"}
              </Btn>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// CMS Website Content Management
// ════════════════════════════════════════════════════════════════════════════════
const CMSWebsiteContent = ({ state, toast }) => {
  const [subActive, setSubActive] = useState("hero");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({ hero: [], events: [], sermons: [], gallery: [], global: {} });

  const token = state.session?.token;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(API_URLS.WEBSITE_DATA);
        if (res.ok) {
          const fetched = await res.json();
          setData({
            hero: fetched.hero || [],
            events: fetched.events || [],
            sermons: fetched.sermons || [],
            gallery: fetched.gallery || [],
            global: fetched.global || {}
          });
        } else {
          toast("Failed to fetch website data", "error");
        }
      } catch (err) {
        toast("Server error fetching website data", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpload = async (file, type, index, fieldKey) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    try {
      toast("Uploading image...", "info");
      const res = await fetch(API_URLS.UPLOAD, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const result = await res.json();
        toast("Upload success!", "success");
        if (type === "global") {
          setData(prev => ({
            ...prev,
            global: { ...prev.global, [fieldKey]: result.url }
          }));
        } else {
          setData(prev => {
            const arr = [...prev[type]];
            const key = fieldKey || "imageUrl";
            arr[index] = { ...arr[index], [key]: result.url };
            return { ...prev, [type]: arr };
          });
        }
      } else {
        toast("Upload failed", "error");
      }
    } catch (err) {
      toast("Error uploading image", "error");
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const res = await fetch(API_URLS.WEBSITE_DATA, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        toast("Website content deployed successfully!", "success");
      } else {
        const errData = await res.json();
        toast(errData.error || "Failed to deploy website changes", "error");
      }
    } catch (err) {
      toast("Network error. Deploy failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const addHeroSlide = () => {
    setData(prev => ({
      ...prev,
      hero: [
        {
          eyebrow: "Welcome",
          headingHtml: "New Slide Heading",
          description: "",
          imageUrl: "",
          btn1Text: "",
          btn1Link: "",
          btn2Text: "",
          btn2Link: ""
        },
        ...prev.hero
      ]
    }));
  };

  const addEvent = () => {
    setData(prev => ({
      ...prev,
      events: [
        {
          id: Date.now(),
          badge: "New",
          date: "TBD",
          title: "New Event",
          description: "",
          imageUrl: "",
          logoImage: "",
          bannerImage: "",
          linkRef: ""
        },
        ...prev.events
      ]
    }));
  };

  const addSermon = () => {
    setData(prev => ({
      ...prev,
      sermons: [
        {
          id: Date.now(),
          meta: "",
          title: "New Sermon",
          description: "",
          imageUrl: "",
          videoUrl: "",
          audioUrl: ""
        },
        ...prev.sermons
      ]
    }));
  };

  const addGalleryImage = () => {
    setData(prev => ({
      ...prev,
      gallery: [{ id: Date.now(), imageUrl: "" }, ...prev.gallery]
    }));
  };

  if (loading) {
    return (
      <Page title="Website Content" subtitle="Loading website configurations...">
        <div style={{ color: "#4b5563", fontFamily: "'DM Sans', sans-serif" }}>Loading website content...</div>
      </Page>
    );
  }

  return (
    <Page
      title="Website Content"
      subtitle="Manage main public website pages, sections, and global assets"
      actions={
        <Btn onClick={handleSaveAll} variant="primary" disabled={saving}>
          {saving ? "Deploying..." : "Deploy Website Changes"}
        </Btn>
      }
    >
      {/* Sub tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { key: "hero", label: "Hero Slides" },
          { key: "events", label: "Programs" },
          { key: "sermons", label: "Sermons" },
          { key: "gallery", label: "Gallery" },
          { key: "global", label: "Global Assets" }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setSubActive(t.key)}
            style={{
              background: subActive === t.key ? "#0B1F3B" : "#fff",
              color: subActive === t.key ? "#fff" : "#6b7280",
              border: "1.5px solid",
              borderColor: subActive === t.key ? "#0B1F3B" : "#e5e7eb",
              borderRadius: 10,
              padding: "8px 18px",
              cursor: "pointer",
              fontSize: 14,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Hero Slides tab */}
      {subActive === "hero" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", color: "#0B1F3B" }}>Homepage Banner Rotation</h3>
            <Btn onClick={addHeroSlide} variant="accent" small>+ Add Slide</Btn>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {data.hero.map((h, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#6b7280" }}>Slide {i + 1}</span>
                  <button
                    onClick={() => {
                      if (confirm("Delete this slide?")) {
                        setData(prev => ({ ...prev, hero: prev.hero.filter((_, idx) => idx !== i) }));
                      }
                    }}
                    style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12 }}
                  >
                    Delete
                  </button>
                </div>
                {h.imageUrl && <img src={h.imageUrl} alt="" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8, marginBottom: 12 }} />}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Upload Photo</label>
                  <input type="file" accept="image/*" onChange={e => handleUpload(e.target.files[0], "hero", i)} />
                </div>
                <Input
                  label="Or Image URL"
                  value={h.imageUrl}
                  onChange={v => setData(prev => {
                    const arr = [...prev.hero];
                    arr[i] = { ...arr[i], imageUrl: v };
                    return { ...prev, hero: arr };
                  })}
                  small
                />
                <Input
                  label="Eyebrow Text"
                  value={h.eyebrow}
                  onChange={v => setData(prev => {
                    const arr = [...prev.hero];
                    arr[i] = { ...arr[i], eyebrow: v };
                    return { ...prev, hero: arr };
                  })}
                  small
                />
                <Input
                  label="Heading HTML"
                  value={h.headingHtml}
                  onChange={v => setData(prev => {
                    const arr = [...prev.hero];
                    arr[i] = { ...arr[i], headingHtml: v };
                    return { ...prev, hero: arr };
                  })}
                  small
                />
                <Input
                  label="Description"
                  value={h.description}
                  onChange={v => setData(prev => {
                    const arr = [...prev.hero];
                    arr[i] = { ...arr[i], description: v };
                    return { ...prev, hero: arr };
                  })}
                  small
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Input
                    label="Btn 1 Text"
                    value={h.btn1Text}
                    onChange={v => setData(prev => {
                      const arr = [...prev.hero];
                      arr[i] = { ...arr[i], btn1Text: v };
                      return { ...prev, hero: arr };
                    })}
                    small
                  />
                  <Input
                    label="Btn 1 Link"
                    value={h.btn1Link}
                    onChange={v => setData(prev => {
                      const arr = [...prev.hero];
                      arr[i] = { ...arr[i], btn1Link: v };
                      return { ...prev, hero: arr };
                    })}
                    small
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Input
                    label="Btn 2 Text"
                    value={h.btn2Text}
                    onChange={v => setData(prev => {
                      const arr = [...prev.hero];
                      arr[i] = { ...arr[i], btn2Text: v };
                      return { ...prev, hero: arr };
                    })}
                    small
                  />
                  <Input
                    label="Btn 2 Link"
                    value={h.btn2Link}
                    onChange={v => setData(prev => {
                      const arr = [...prev.hero];
                      arr[i] = { ...arr[i], btn2Link: v };
                      return { ...prev, hero: arr };
                    })}
                    small
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events tab */}
      {subActive === "events" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", color: "#0B1F3B" }}>Upcoming Programs</h3>
            <Btn onClick={addEvent} variant="accent" small>+ Add Program</Btn>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {data.events.map((e, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#6b7280" }}>Event {i + 1}</span>
                  <button
                    onClick={() => {
                      if (confirm("Delete this event?")) {
                        setData(prev => ({ ...prev, events: prev.events.filter((_, idx) => idx !== i) }));
                      }
                    }}
                    style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12 }}
                  >
                    Delete
                  </button>
                </div>


                {/* Banner Cover */}
                <div style={{ background: "#f8fafc", borderRadius: 8, padding: 12, marginBottom: 12, border: "1px solid #e5e7eb" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Banner Cover</div>
                  {e.bannerImage && <img src={e.bannerImage} alt="Banner Preview" style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 6, marginBottom: 8 }} />}
                  <div style={{ marginBottom: 6 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Upload Banner</label>
                    <input type="file" accept="image/*" onChange={el => handleUpload(el.target.files[0], "events", i, "bannerImage")} />
                  </div>
                  <Input
                    label="Or Banner URL"
                    value={e.bannerImage || ""}
                    onChange={v => setData(prev => {
                      const arr = [...prev.events];
                      arr[i] = { ...arr[i], bannerImage: v };
                      return { ...prev, events: arr };
                    })}
                    small
                  />
                </div>

                {/* Event Logo */}
                <div style={{ background: "#f8fafc", borderRadius: 8, padding: 12, marginBottom: 12, border: "1px solid #e5e7eb" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Event Logo</div>
                  {e.logoImage && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <img src={e.logoImage} alt="Logo" style={{ height: 40, objectFit: "contain", borderRadius: 4 }} />
                    </div>
                  )}
                  <div style={{ marginBottom: 6 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Upload Logo</label>
                    <input type="file" accept="image/*" onChange={el => handleUpload(el.target.files[0], "events", i, "logoImage")} />
                  </div>
                  <Input
                    label="Or Logo URL"
                    value={e.logoImage || ""}
                    onChange={v => setData(prev => {
                      const arr = [...prev.events];
                      arr[i] = { ...arr[i], logoImage: v };
                      return { ...prev, events: arr };
                    })}
                    small
                  />
                </div>

                {/* Thumbnail Photo */}
                <div style={{ background: "#f8fafc", borderRadius: 8, padding: 12, marginBottom: 12, border: "1px solid #e5e7eb" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Card Thumbnail</div>
                  {e.imageUrl && <img src={e.imageUrl} alt="" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 6, marginBottom: 8 }} />}
                  <div style={{ marginBottom: 6 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Upload Thumbnail</label>
                    <input type="file" accept="image/*" onChange={el => handleUpload(el.target.files[0], "events", i)} />
                  </div>
                  <Input
                    label="Or Thumbnail URL"
                    value={e.imageUrl}
                    onChange={v => setData(prev => {
                      const arr = [...prev.events];
                      arr[i] = { ...arr[i], imageUrl: v };
                      return { ...prev, events: arr };
                    })}
                    small
                  />
                </div>

                <Input
                  label="Badge (e.g. New / Zoom)"
                  value={e.badge}
                  onChange={v => setData(prev => {
                    const arr = [...prev.events];
                    arr[i] = { ...arr[i], badge: v };
                    return { ...prev, events: arr };
                  })}
                  small
                />
                <Input
                  label="Date/Time Text"
                  value={e.date}
                  onChange={v => setData(prev => {
                    const arr = [...prev.events];
                    arr[i] = { ...arr[i], date: v };
                    return { ...prev, events: arr };
                  })}
                  small
                />
                <Input
                  label="Title"
                  value={e.title}
                  onChange={v => setData(prev => {
                    const arr = [...prev.events];
                    arr[i] = { ...arr[i], title: v };
                    return { ...prev, events: arr };
                  })}
                  small
                />
                <Input
                  label="Description"
                  value={e.description}
                  onChange={v => setData(prev => {
                    const arr = [...prev.events];
                    arr[i] = { ...arr[i], description: v };
                    return { ...prev, events: arr };
                  })}
                  small
                />
                <Input
                  label="Link Reference"
                  value={e.linkRef}
                  onChange={v => setData(prev => {
                    const arr = [...prev.events];
                    arr[i] = { ...arr[i], linkRef: v };
                    return { ...prev, events: arr };
                  })}
                  small
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sermons tab */}
      {subActive === "sermons" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", color: "#0B1F3B" }}>Sermon Vault</h3>
            <Btn onClick={addSermon} variant="accent" small>+ Add Sermon</Btn>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {data.sermons.map((s, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#6b7280" }}>Sermon {i + 1}</span>
                  <button
                    onClick={() => {
                      if (confirm("Delete this sermon?")) {
                        setData(prev => ({ ...prev, sermons: prev.sermons.filter((_, idx) => idx !== i) }));
                      }
                    }}
                    style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12 }}
                  >
                    Delete
                  </button>
                </div>
                {s.imageUrl && <img src={s.imageUrl} alt="" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8, marginBottom: 12 }} />}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Upload Photo</label>
                  <input type="file" accept="image/*" onChange={el => handleUpload(el.target.files[0], "sermons", i)} />
                </div>
                <Input
                  label="Or Image URL"
                  value={s.imageUrl}
                  onChange={v => setData(prev => {
                    const arr = [...prev.sermons];
                    arr[i] = { ...arr[i], imageUrl: v };
                    return { ...prev, sermons: arr };
                  })}
                  small
                />
                <Input
                  label="Meta (e.g. Date / Series)"
                  value={s.meta}
                  onChange={v => setData(prev => {
                    const arr = [...prev.sermons];
                    arr[i] = { ...arr[i], meta: v };
                    return { ...prev, sermons: arr };
                  })}
                  small
                />
                <Input
                  label="Title"
                  value={s.title}
                  onChange={v => setData(prev => {
                    const arr = [...prev.sermons];
                    arr[i] = { ...arr[i], title: v };
                    return { ...prev, sermons: arr };
                  })}
                  small
                />
                <Input
                  label="Description"
                  value={s.description}
                  onChange={v => setData(prev => {
                    const arr = [...prev.sermons];
                    arr[i] = { ...arr[i], description: v };
                    return { ...prev, sermons: arr };
                  })}
                  small
                />
                <Input
                  label="Video Link (YouTube)"
                  value={s.videoUrl}
                  onChange={v => setData(prev => {
                    const arr = [...prev.sermons];
                    arr[i] = { ...arr[i], videoUrl: v };
                    return { ...prev, sermons: arr };
                  })}
                  small
                />
                <Input
                  label="Audio Link (MP3)"
                  value={s.audioUrl}
                  onChange={v => setData(prev => {
                    const arr = [...prev.sermons];
                    arr[i] = { ...arr[i], audioUrl: v };
                    return { ...prev, sermons: arr };
                  })}
                  small
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gallery tab */}
      {subActive === "gallery" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", color: "#0B1F3B" }}>Community Gallery</h3>
            <Btn onClick={addGalleryImage} variant="accent" small>+ Add Photo</Btn>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 }}>
            {data.gallery.map((g, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#6b7280" }}>Photo {i + 1}</span>
                    <button
                      onClick={() => {
                        if (confirm("Remove this photo?")) {
                          setData(prev => ({ ...prev, gallery: prev.gallery.filter((_, idx) => idx !== i) }));
                        }
                      }}
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12 }}
                    >
                      Remove
                    </button>
                  </div>
                  {g.imageUrl && <img src={g.imageUrl} alt="" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8, marginBottom: 12 }} />}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Upload Photo</label>
                    <input type="file" accept="image/*" onChange={el => handleUpload(el.target.files[0], "gallery", i)} />
                  </div>
                </div>
                <Input
                  label="Or Image URL"
                  value={g.imageUrl}
                  onChange={v => setData(prev => {
                    const arr = [...prev.gallery];
                    arr[i] = { ...arr[i], imageUrl: v };
                    return { ...prev, gallery: arr };
                  })}
                  small
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Assets tab */}
      {subActive === "global" && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, maxWidth: 600 }}>
          <h3 style={{ margin: "0 0 16px", fontFamily: "'DM Sans', sans-serif", color: "#0B1F3B" }}>Global Site Assets</h3>
          
          <div style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: 20, marginBottom: 20 }}>
            <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>Church Logo</h4>
            {data.global?.logoImage && <img src={data.global.logoImage} alt="" style={{ height: 60, objectFit: "contain", marginBottom: 12, display: "block" }} />}
            <input type="file" accept="image/*" onChange={e => handleUpload(e.target.files[0], "global", null, "logoImage")} style={{ marginBottom: 8, display: "block" }} />
            <Input
              label="Logo Image URL"
              value={data.global?.logoImage || ""}
              onChange={v => setData(prev => ({ ...prev, global: { ...prev.global, logoImage: v } }))}
              small
            />
          </div>

          <div style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: 20, marginBottom: 20 }}>
            <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>About Us Section Image</h4>
            {data.global?.aboutImage && <img src={data.global.aboutImage} alt="" style={{ height: 100, objectFit: "cover", width: "100%", borderRadius: 8, marginBottom: 12, display: "block" }} />}
            <input type="file" accept="image/*" onChange={e => handleUpload(e.target.files[0], "global", null, "aboutImage")} style={{ marginBottom: 8, display: "block" }} />
            <Input
              label="About Us Image URL"
              value={data.global?.aboutImage || ""}
              onChange={v => setData(prev => ({ ...prev, global: { ...prev.global, aboutImage: v } }))}
              small
            />
          </div>

          <div>
            <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>Pastor Section Image</h4>
            {data.global?.pastorImage && <img src={data.global.pastorImage} alt="" style={{ height: 100, objectFit: "cover", width: "100%", borderRadius: 8, marginBottom: 12, display: "block" }} />}
            <input type="file" accept="image/*" onChange={e => handleUpload(e.target.files[0], "global", null, "pastorImage")} style={{ marginBottom: 8, display: "block" }} />
            <Input
              label="Pastor Image URL"
              value={data.global?.pastorImage || ""}
              onChange={v => setData(prev => ({ ...prev, global: { ...prev.global, pastorImage: v } }))}
              small
            />
          </div>
        </div>
      )}
    </Page>
  );
};

const CMSEventRegistrations = ({ state, toast }) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null); // null = overview
  const [selectedDayTab, setSelectedDayTab] = useState("all"); // "all" or specific day
  const [detailTab, setDetailTab] = useState("registrations"); // "registrations" | "attendance"
  const [search, setSearch] = useState("");

  // Website data state to load details like logo/banner
  const [webData, setWebData] = useState({ events: [] });
  const [updatingAssets, setUpdatingAssets] = useState(false);

  // Manual registration modal state
  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({ name: "", email: "", phone: "", eventTitle: "" });
  const [regSubmitting, setRegSubmitting] = useState(false);

  // User detail modal state
  const [selectedUser, setSelectedUser] = useState(null);

  const token = state.session?.token;

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URLS.EVENT_REGISTRATIONS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data);
      } else {
        toast("Failed to fetch event registrations", "error");
      }
    } catch (err) {
      toast("Connection error fetching registrations", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchWebData = async () => {
    try {
      const res = await fetch(API_URLS.WEBSITE_DATA);
      if (res.ok) {
        const data = await res.json();
        setWebData(data);
      }
    } catch (err) {
      console.error("Failed to load website data in registrations", err);
    }
  };

  useEffect(() => {
    fetchRegistrations();
    fetchWebData();
  }, []);

  const handleAssetUpload = async (file, eventTitle, fieldKey) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    try {
      toast("Uploading image...", "info");
      const res = await fetch(API_URLS.UPLOAD, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const result = await res.json();
        toast("Upload success!", "success");
        setWebData(prev => {
          const updatedEvents = prev.events.map(e => {
            if (e.title === eventTitle) {
              return { ...e, [fieldKey]: result.url };
            }
            return e;
          });
          return { ...prev, events: updatedEvents };
        });
      } else {
        toast("Upload failed", "error");
      }
    } catch (err) {
      toast("Error uploading image", "error");
    }
  };

  const handleSaveAssets = async (eventTitle) => {
    setUpdatingAssets(true);
    try {
      const res = await fetch(API_URLS.WEBSITE_DATA, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(webData)
      });
      if (res.ok) {
        toast("Event registration page settings updated successfully!", "success");
      } else {
        toast("Failed to save changes", "error");
      }
    } catch (err) {
      toast("Network error saving changes", "error");
    } finally {
      setUpdatingAssets(false);
    }
  };

  const handleManualRegister = async () => {
    const { name, email, phone, eventTitle } = regForm;
    if (!name.trim() || !email.trim() || !eventTitle.trim()) {
      toast("Name, email and program are required", "error");
      return;
    }
    if (!isValidEmail(email)) {
      toast("Please enter a valid email address (e.g. john@example.com)", "error");
      return;
    }
    if (phone && !isValidPhone(phone)) {
      toast("Please enter a valid phone number (e.g. +2348012345678)", "error");
      return;
    }
    setRegSubmitting(true);
    try {
      const res = await fetch(`${API_URLS.BASE}/api/register-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim(), eventTitle: eventTitle.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast(`${name} registered for ${eventTitle}!`, "success");
        setShowRegModal(false);
        setRegForm({ name: "", email: "", phone: "", eventTitle: selectedEvent || "" });
        fetchRegistrations();
      } else {
        toast(data.error || "Registration failed", "error");
      }
    } catch (err) {
      toast("Server connection failed", "error");
    } finally {
      setRegSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this registration?")) return;
    try {
      const res = await fetch(`${API_URLS.EVENT_REGISTRATIONS}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setRegistrations(prev => prev.filter(r => r._id !== id));
        toast("Registration deleted", "success");
      } else {
        toast("Failed to delete registration", "error");
      }
    } catch (err) {
      toast("Server connection failed", "error");
    }
  };

  const handleToggleAttendance = async (id, day = null) => {
    try {
      const res = await fetch(`${API_URLS.EVENT_REGISTRATIONS}/${id}/attendance`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ day })
      });
      if (res.ok) {
        const { attended, attendanceRecords } = await res.json();
        setRegistrations(prev => prev.map(r => r._id === id ? { ...r, attended, attendanceRecords } : r));
      } else {
        toast("Failed to update attendance", "error");
      }
    } catch (err) {
      toast("Server error", "error");
    }
  };

  const handlePrintRegistrations = (rows, title) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the report");
      return;
    }

    const rowsHtml = rows.map(r => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px; font-size: 13px; color: #111827; font-weight: 500;">${r.name}</td>
        <td style="padding: 10px; font-size: 13px; color: #4b5563;">${r.email}</td>
        <td style="padding: 10px; font-size: 13px; color: #4b5563;">${r.phone || "—"}</td>
        <td style="padding: 10px; font-size: 13px; color: #4b5563;">${r.eventTitle}</td>
        <td style="padding: 10px; font-size: 13px; font-weight: 600; color: ${r.attended ? '#047857' : '#b91c1c'};">${r.attended ? "Yes" : "No"}</td>
      </tr>
    `).join("");

    const churchName = import.meta.env.VITE_CHURCH_NAME || "Church";
    const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${churchName} - ${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; margin: 0; }
          .header { border-bottom: 2px solid #111827; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: 800; margin: 0 0 8px 0; color: #0b1f3b; }
          .meta { font-size: 14px; color: #4b5563; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #f1f5f9; padding: 12px 10px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; text-align: left; border-bottom: 2px solid #cbd5e1; }
          @media print { body { padding: 20px; } tr { page-break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${churchName} - ${title}</div>
          <div class="meta">Generated: <strong>${dateStr}</strong> | Total Registrations: <strong>${rows.length}</strong></div>
        </div>
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th>Event</th><th>Attended</th></tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };</script>
      </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Group registrations by event
  const byEvent = registrations.reduce((acc, r) => {
    if (!acc[r.eventTitle]) acc[r.eventTitle] = [];
    acc[r.eventTitle].push(r);
    return acc;
  }, {});

  // If viewing a specific event
  if (selectedEvent) {
    const eventRegs = byEvent[selectedEvent] || [];
    const searchLower = search.toLowerCase();
    const filtered = eventRegs.filter(r =>
      !search ||
      r.name.toLowerCase().includes(searchLower) ||
      r.email.toLowerCase().includes(searchLower) ||
      (r.phone && r.phone.includes(search))
    );
    // Find custom event details
    const dbEvent = webData.events ? webData.events.find(e => e.title === selectedEvent) : null;
    const eventDaysArr = (dbEvent && dbEvent.eventDays && dbEvent.eventDays.trim()) 
      ? dbEvent.eventDays.split(",").map(d => d.trim()) 
      : [];

    let tabAttendedCount = 0;
    let tabAbsentCount = 0;
    let perfectAttendedCount = 0;
    
    if (selectedDayTab === "all" || eventDaysArr.length === 0) {
      tabAttendedCount = eventRegs.filter(r => r.attended).length;
      tabAbsentCount = eventRegs.filter(r => !r.attended).length;
      if (eventDaysArr.length > 0) {
        perfectAttendedCount = eventRegs.filter(r => r.attendanceRecords && r.attendanceRecords.length >= eventDaysArr.length).length;
      } else {
        perfectAttendedCount = tabAttendedCount;
      }
    } else {
      tabAttendedCount = eventRegs.filter(r => r.attendanceRecords && r.attendanceRecords.includes(selectedDayTab)).length;
      tabAbsentCount = eventRegs.length - tabAttendedCount;
    }

    const attendedList = filtered.filter(r => {
      if (selectedDayTab === "all" || eventDaysArr.length === 0) return r.attended;
      return r.attendanceRecords && r.attendanceRecords.includes(selectedDayTab);
    });
    const absentList = filtered.filter(r => !attendedList.includes(r));
    const tabList = detailTab === "attendance" ? attendedList : filtered;

    return (
      <>
      <Page
        title={selectedEvent}
        subtitle={`${eventRegs.length} registered · ${tabAttendedCount} attended`}
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={() => { setRegForm({ name: "", email: "", phone: "", eventTitle: selectedEvent }); setShowRegModal(true); }} variant="primary" small>
              <Icon name="plus" size={14} /> Register Person
            </Btn>
            <Btn onClick={() => handlePrintRegistrations(eventRegs, `${selectedEvent} Registrations`)} variant="accent" small><Icon name="print" size={14} /> Print Registrations</Btn>
            <Btn onClick={() => { setSelectedEvent(null); setSelectedDayTab("all"); setSearch(""); setDetailTab("registrations"); }} variant="ghost" small>← All Events</Btn>
          </div>
        }
      >
        {/* Banner Cover & Logo configuration for this event */}
        {dbEvent && (
          <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 700, color: "#0B1F3B", fontFamily: "'DM Sans', sans-serif" }}>Registration Form Design & Page Assets</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 20 }}>
              
              {/* Banner Cover */}
              <div style={{ background: "#f8fafc", borderRadius: 10, padding: 16, border: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Banner Cover</div>
                {dbEvent.bannerImage && <img src={dbEvent.bannerImage} alt="Banner" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 6, marginBottom: 8 }} />}
                <input type="file" accept="image/*" onChange={el => handleAssetUpload(el.target.files[0], selectedEvent, "bannerImage")} style={{ fontSize: 11, marginBottom: 8, display: "block" }} />
                <Input
                  label="Or Banner URL"
                  value={dbEvent.bannerImage || ""}
                  onChange={v => setWebData(prev => {
                    const u = prev.events.map(e => e.title === selectedEvent ? { ...e, bannerImage: v } : e);
                    return { ...prev, events: u };
                  })}
                  small
                />
              </div>

              {/* Event Logo */}
              <div style={{ background: "#f8fafc", borderRadius: 10, padding: 16, border: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Event Logo</div>
                {dbEvent.logoImage && <img src={dbEvent.logoImage} alt="Logo" style={{ height: 40, objectFit: "contain", borderRadius: 4, marginBottom: 8, display: "block" }} />}
                <input type="file" accept="image/*" onChange={el => handleAssetUpload(el.target.files[0], selectedEvent, "logoImage")} style={{ fontSize: 11, marginBottom: 8, display: "block" }} />
                <Input
                  label="Or Logo URL"
                  value={dbEvent.logoImage || ""}
                  onChange={v => setWebData(prev => {
                    const u = prev.events.map(e => e.title === selectedEvent ? { ...e, logoImage: v } : e);
                    return { ...prev, events: u };
                  })}
                  small
                />
              </div>

              {/* Card Thumbnail */}
              <div style={{ background: "#f8fafc", borderRadius: 10, padding: 16, border: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Card Thumbnail</div>
                {dbEvent.imageUrl && <img src={dbEvent.imageUrl} alt="Thumbnail" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 6, marginBottom: 8 }} />}
                <input type="file" accept="image/*" onChange={el => handleAssetUpload(el.target.files[0], selectedEvent, "imageUrl")} style={{ fontSize: 11, marginBottom: 8, display: "block" }} />
                <Input
                  label="Or Thumbnail URL"
                  value={dbEvent.imageUrl || ""}
                  onChange={v => setWebData(prev => {
                    const u = prev.events.map(e => e.title === selectedEvent ? { ...e, imageUrl: v } : e);
                    return { ...prev, events: u };
                  })}
                  small
                />
              </div>

              {/* Event Days Configuration */}
              <div style={{ background: "#f8fafc", borderRadius: 10, padding: 16, border: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Multi-Day Attendance</div>
                <Input
                  label="Event Days (comma-separated)"
                  value={dbEvent.eventDays || ""}
                  onChange={v => setWebData(prev => {
                    const u = prev.events.map(e => e.title === selectedEvent ? { ...e, eventDays: v } : e);
                    return { ...prev, events: u };
                  })}
                  placeholder="e.g. Day 1, Day 2, Day 3"
                  small
                />
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6, lineHeight: 1.4 }}>
                  Specify the days for this event to track attendance separately per day. Leave blank for a standard 1-day event.
                </div>
              </div>

            </div>

            <Btn onClick={() => handleSaveAssets(selectedEvent)} variant="accent" disabled={updatingAssets}>
              {updatingAssets ? "Saving Settings..." : "Save Event Page Settings"}
            </Btn>
          </div>
        )}
        {/* Folder Tabs for Multi-Day */}
        {eventDaysArr.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", borderBottom: "2px solid #e2e8f0" }}>
            <button
              onClick={() => setSelectedDayTab("all")}
              style={{
                padding: "10px 20px",
                borderRadius: "10px 10px 0 0",
                border: "none",
                background: selectedDayTab === "all" ? "#0B1F3B" : "#f1f5f9",
                color: selectedDayTab === "all" ? "#fff" : "#475569",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              Overview
            </button>
            {eventDaysArr.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDayTab(day)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px 10px 0 0",
                  border: "none",
                  background: selectedDayTab === day ? "#0B1F3B" : "#f1f5f9",
                  color: selectedDayTab === day ? "#fff" : "#475569",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {day}
              </button>
            ))}
          </div>
        )}

        {/* Stats Bar */}
        <div style={{ display: "grid", gridTemplateColumns: selectedDayTab === "all" && eventDaysArr.length > 0 ? "repeat(4, 1fr)" : "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          {(selectedDayTab === "all" && eventDaysArr.length > 0 ? [
            { label: "Total Registered", value: eventRegs.length, color: "#0B1F3B" },
            { label: "Perfect Attendees (All Days)", value: perfectAttendedCount, color: "#10b981" },
            { label: "Partial Attendees (Some Days)", value: tabAttendedCount - perfectAttendedCount, color: "#3b82f6" },
            { label: "Absentees (No Days)", value: eventRegs.filter(r => !r.attendanceRecords || r.attendanceRecords.length === 0).length, color: "#f59e0b" }
          ] : [
            { label: "Total Registered", value: eventRegs.length, color: "#0B1F3B" },
            { label: selectedDayTab === "all" ? "Attended (Any Day)" : `Attended (${selectedDayTab})`, value: tabAttendedCount, color: "#059669" },
            { label: selectedDayTab === "all" ? "Absent / Pending" : `Absent (${selectedDayTab})`, value: tabAbsentCount, color: "#f59e0b" }
          ]).map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: "18px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", borderLeft: `4px solid ${s.color}` }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: "'DM Sans', sans-serif" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tab + Search Bar */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            {["registrations", "attendance"].map(tab => (
              <button
                key={tab}
                onClick={() => setDetailTab(tab)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 8,
                  border: detailTab === tab ? "none" : "1px solid #e5e7eb",
                  background: detailTab === tab ? "#0B1F3B" : "transparent",
                  color: detailTab === tab ? "#fff" : "#6b7280",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  textTransform: "capitalize"
                }}
              >
                {tab === "attendance" ? `✓ Attendance (${attendedList.length})` : `All Registrations (${eventRegs.length})`}
              </button>
            ))}
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, phone..."
              style={{ ...inputStyle, marginLeft: "auto", width: 240, minHeight: 36 }}
            />
          </div>
        </div>

        {/* Table */}
        <Table
          headers={["Name", "Email", "Reg. Date", "Attendance", "Actions"]}
          rows={tabList.map(r => [
            <div style={{ fontWeight: 700, color: "#0B1F3B", cursor: "pointer" }} onClick={() => setSelectedUser(r)}>{r.name}</div>,
            r.email,
            r.created_at ? new Date(r.created_at).toLocaleDateString() : "—",
            (dbEvent && dbEvent.eventDays && dbEvent.eventDays.trim()) ? (
              selectedDayTab === "all" ? (
                <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
                  {r.attendanceRecords ? r.attendanceRecords.length : 0} / {eventDaysArr.length} days
                </span>
              ) : (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", maxWidth: 200 }}>
                  {dbEvent.eventDays.split(",").map(dayStr => {
                    const day = dayStr.trim();
                    if (selectedDayTab !== day) return null;
                    const isAttended = r.attendanceRecords && r.attendanceRecords.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => handleToggleAttendance(r._id, day)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: isAttended ? "1px solid #10b981" : "1px solid #d1d5db",
                          background: isAttended ? "#dcfce7" : "#fff",
                          color: isAttended ? "#059669" : "#6b7280",
                          fontWeight: 600,
                          fontSize: 10,
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                        title={day}
                      >
                        {isAttended ? "✓ " : ""}{day}
                      </button>
                    );
                  })}
                </div>
              )
            ) : (
              <button
                onClick={() => handleToggleAttendance(r._id)}
                style={{
                  padding: "4px 14px",
                  borderRadius: 20,
                  border: "none",
                  background: r.attended ? "#dcfce7" : "#f3f4f6",
                  color: r.attended ? "#059669" : "#9ca3af",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {r.attended ? "✓ Present" : "Absent"}
              </button>
            ),
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setSelectedUser(r)}
                style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", padding: 4 }}
                title="View Full Info"
              >
                <Icon name="eye" size={14} />
              </button>
              <button
                onClick={() => handleDelete(r._id)}
                style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4 }}
                title="Delete"
              >
                <Icon name="trash" size={14} />
              </button>
            </div>
          ])}
        />
      </Page>

      {/* Manual Registration Modal — also accessible inside event detail view */}
      {showRegModal && (
        <Modal title="Register Person for Program" onClose={() => setShowRegModal(false)}>
          <p style={{ margin: "0 0 18px", color: "#6b7280", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
            Fill in the details below to manually register an attendee for a program.
          </p>
          <Input label="Full Name" value={regForm.name} onChange={v => setRegForm(f => ({ ...f, name: v }))} placeholder="e.g. John Doe" required />
          <Input label="Email Address" type="email" value={regForm.email} onChange={v => setRegForm(f => ({ ...f, email: v }))} placeholder="john@example.com" required />
          <Input label="Phone Number" value={regForm.phone} onChange={v => setRegForm(f => ({ ...f, phone: v }))} placeholder="+234..." />
          <Input
            label="Program / Event"
            type="dropdown"
            value={regForm.eventTitle}
            onChange={v => setRegForm(f => ({ ...f, eventTitle: v }))}
            options={
              webData.events && webData.events.length > 0
                ? webData.events.map(e => ({ value: e.title, label: e.title }))
                : Object.keys(byEvent).map(t => ({ value: t, label: t }))
            }
            required
          />
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Btn onClick={() => setShowRegModal(false)} variant="ghost">Cancel</Btn>
            <Btn
              onClick={handleManualRegister}
              variant="primary"
              disabled={regSubmitting || !regForm.name.trim() || !regForm.email.trim() || !regForm.eventTitle.trim()}
            >
              {regSubmitting ? "Registering..." : "Complete Registration"}
            </Btn>
          </div>
        </Modal>
      )}
        {/* User Info Modal */}
      {selectedUser && (
        <Modal title="Registration Details" onClose={() => setSelectedUser(null)}>
          <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Full Name</div>
              <div style={{ fontSize: 16, color: "#111827", fontWeight: 500 }}>{selectedUser.name}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Email</div>
              <div style={{ fontSize: 16, color: "#111827" }}>{selectedUser.email}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Phone</div>
              <div style={{ fontSize: 16, color: "#111827" }}>{selectedUser.phone || "Not provided"}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Registration Date</div>
              <div style={{ fontSize: 16, color: "#111827" }}>{new Date(selectedUser.created_at).toLocaleString()}</div>
            </div>
            
            {/* Custom Fields */}
            {selectedUser.customFields && Object.keys(selectedUser.customFields).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Additional Responses</div>
                <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  {Object.entries(selectedUser.customFields).map(([k, v]) => (
                    <div key={k} style={{ marginBottom: 6, fontSize: 14 }}>
                      <strong style={{ color: "#475569" }}>{k.replace(/_/g, ' ')}:</strong> {String(v)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attendance Overview */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Attendance Record</div>
              {selectedUser.attendanceRecords && selectedUser.attendanceRecords.length > 0 ? (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {selectedUser.attendanceRecords.map(day => (
                    <span key={day} style={{ background: "#dcfce7", color: "#059669", padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                      ✓ {day}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 14, color: "#ef4444" }}>No attendance recorded yet.</div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
              <Btn onClick={() => setSelectedUser(null)} variant="primary">Close</Btn>
            </div>
          </div>
        </Modal>
      )}

    </>
    );
  }

  // Overview: show event summary cards
  const eventNames = Object.keys(byEvent);
  const totalRegistered = registrations.length;
  const totalAttended = registrations.filter(r => r.attended).length;

  return (
    <>
    <Page
      title="Program Registrations"
      subtitle={`${totalRegistered} total signups across ${eventNames.length} event${eventNames.length !== 1 ? "s" : ""}`}
      actions={
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={() => { setRegForm({ name: "", email: "", phone: "", eventTitle: eventNames[0] || "" }); setShowRegModal(true); }} variant="primary" small>
            <Icon name="plus" size={14} /> Register Person
          </Btn>
          <Btn onClick={() => handlePrintRegistrations(registrations, "All Event Registrations")} variant="accent" small>
            <Icon name="print" size={14} /> Print All Registrations
          </Btn>
        </div>
      }
    >
      {/* Global Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Registered", value: totalRegistered, color: "#0B1F3B" },
          { label: "Total Attended", value: totalAttended, color: "#059669" },
          { label: "Absent / Pending", value: totalRegistered - totalAttended, color: "#f59e0b" },
          { label: "Programs", value: eventNames.length, color: "#6366f1" }
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: "18px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", borderLeft: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: "'DM Sans', sans-serif" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#4b5563" }}>Loading registrations...</div>
      ) : eventNames.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontFamily: "'DM Sans', sans-serif" }}>
          No registrations yet. Registrations submitted via the website will appear here.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {eventNames.map(evtName => {
            const regs = byEvent[evtName];
            const attended = regs.filter(r => r.attended).length;
            const pct = regs.length > 0 ? Math.round((attended / regs.length) * 100) : 0;
            return (
              <div
                key={evtName}
                onClick={() => { setSelectedEvent(evtName); setDetailTab("registrations"); setSearch(""); }}
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                  cursor: "pointer",
                  transition: "transform 0.18s, box-shadow 0.18s",
                  borderTop: "4px solid #0B1F3B"
                }}
                onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"; }}
                onMouseOut={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)"; }}
              >
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 16, color: "#0B1F3B", marginBottom: 12 }}>{evtName}</div>
                <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#0B1F3B" }}>{regs.length}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>Registered</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#059669" }}>{attended}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>Attended</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#f59e0b" }}>{regs.length - attended}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>Absent</div>
                  </div>
                </div>
                {/* Attendance progress bar */}
                <div style={{ background: "#f3f4f6", borderRadius: 99, height: 8, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, background: "linear-gradient(90deg, #059669, #10b981)", height: "100%", borderRadius: 99, transition: "width 0.6s" }} />
                </div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6, fontWeight: 600 }}>{pct}% attendance rate</div>
                <div style={{ marginTop: 14, fontSize: 12, color: "#6366f1", fontWeight: 700 }}>View Details →</div>
              </div>
            );
          })}
        </div>
      )}
    </Page>

    {/* Manual Registration Modal */}
    {showRegModal && (
      <Modal title="Register Person for Program" onClose={() => setShowRegModal(false)}>
        <p style={{ margin: "0 0 18px", color: "#6b7280", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
          Fill in the details below to manually register an attendee for a program.
        </p>
        <Input
          label="Full Name"
          value={regForm.name}
          onChange={v => setRegForm(f => ({ ...f, name: v }))}
          placeholder="e.g. John Doe"
          required
        />
        <Input
          label="Email Address"
          type="email"
          value={regForm.email}
          onChange={v => setRegForm(f => ({ ...f, email: v }))}
          placeholder="john@example.com"
          required
        />
        <Input
          label="Phone Number"
          value={regForm.phone}
          onChange={v => setRegForm(f => ({ ...f, phone: v }))}
          placeholder="+234..."
        />
        <Input
          label="Program / Event"
          type="dropdown"
          value={regForm.eventTitle}
          onChange={v => setRegForm(f => ({ ...f, eventTitle: v }))}
          options={
            webData.events && webData.events.length > 0
              ? webData.events.map(e => ({ value: e.title, label: e.title }))
              : Object.keys(byEvent).map(t => ({ value: t, label: t }))
          }
          required
        />
        {(webData.events.length === 0 && Object.keys(byEvent).length === 0) && (
          <Input
            label="Or type program name"
            value={regForm.eventTitle}
            onChange={v => setRegForm(f => ({ ...f, eventTitle: v }))}
            placeholder="Program / Event name"
          />
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <Btn onClick={() => setShowRegModal(false)} variant="ghost">Cancel</Btn>
          <Btn
            onClick={handleManualRegister}
            variant="primary"
            disabled={regSubmitting || !regForm.name.trim() || !regForm.email.trim() || !regForm.eventTitle.trim()}
          >
            {regSubmitting ? "Registering..." : "Complete Registration"}
          </Btn>
        </div>
      </Modal>
    )}
    </>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// CMS DASHBOARD
// ════════════════════════════════════════════════════════════════════════════════
const CMSDashboard = ({ state, dispatch, toast }) => {
  const [active, setActive] = useState("dashboard");
  const [userFilterTag, setUserFilterTag] = useState("all");

  const nav = [
    { key: "dashboard", label: "Dashboard", icon: "dashboard" },
    { key: "website_content", label: "Website Content", icon: "church" },
    { key: "event_regs", label: "Program Registrations", icon: "attendance" },
    { key: "users", label: "Users", icon: "users" },
    { key: "forms", label: "Form Builder", icon: "forms" },
    { key: "admins", label: "Admins", icon: "admins" },
    { key: "attendance", label: "Attendance", icon: "attendance" },
    { key: "messages", label: "Messages", icon: "messages" },
    { key: "fin_sections", label: "Finance Sections", icon: "settings" },
    { key: "service_reviews", label: "Service Reviews", icon: "forms" },
    { key: "settings", label: "Settings", icon: "settings" }
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <Sidebar nav={nav} active={active} setActive={setActive} role="cms" adminName={state.session?.admin?.name} onLogout={() => dispatch({ type: "LOGOUT" })} />
      <main style={{ marginLeft: 240, flex: 1, minHeight: "100vh" }}>
        {active === "dashboard" && <CMSHome state={state} token={state.session.token} toast={toast} setActive={setActive} setUserFilterTag={setUserFilterTag} />}
        {active === "website_content" && <CMSWebsiteContent state={state} toast={toast} />}
        {active === "event_regs" && <CMSEventRegistrations state={state} toast={toast} />}
        {active === "users" && <CMSUsers state={state} dispatch={dispatch} toast={toast} initialFilter={userFilterTag} />}
        {active === "add_user" && <UsherAddUser state={state} dispatch={dispatch} toast={toast} />}
        {active === "forms" && <CMSForms state={state} dispatch={dispatch} toast={toast} />}
        {active === "admins" && <CMSAdmins state={state} dispatch={dispatch} toast={toast} />}
        {active === "attendance" && <CMSAttendance state={state} />}
        {active === "messages" && <CMSMessages state={state} />}
        {active === "fin_sections" && <CMSFinanceSections state={state} dispatch={dispatch} toast={toast} />}
        {active === "service_reviews" && <CMSServiceReviews state={state} dispatch={dispatch} toast={toast} role="cms" />}
        {active === "settings" && <CMSSettings token={state.session.token} toast={toast} />}
      </main>
    </div>
  );
};

const CMSFinanceSections = ({ state, dispatch, toast }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const sections = state.financialSections || [];

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast("Section name required", "error");
    setSaving(true);
    try {
      const res = await fetch(API_URLS.FINANCIAL_SECTIONS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${state.session.token}`
        },
        body: JSON.stringify({ name: name.trim(), description })
      });
      if (res.ok) {
        const newSec = await res.json();
        dispatch({ type: "SYNC_DATA", key: "financialSections", data: [...sections, newSec] });
        setName("");
        setDescription("");
        toast("Financial section added!", "success");
      } else {
        const err = await res.json();
        toast(err.error || "Failed to add section", "error");
      }
    } catch (e) {
      toast("Server connection failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this section?")) return;
    try {
      const res = await fetch(`${API_URLS.FINANCIAL_SECTIONS}/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${state.session.token}` }
      });
      if (res.ok) {
        dispatch({ type: "SYNC_DATA", key: "financialSections", data: sections.filter(s => s._id !== id && s.id !== id) });
        toast("Section deleted", "success");
      } else {
        toast("Failed to delete section", "error");
      }
    } catch (e) {
      toast("Server connection failed", "error");
    }
  };

  return (
    <Page title="Manage Financial Sections" subtitle="Configure departments/categories for budget tracking">
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 700, color: "#0B1F3B", fontFamily: "'DM Sans', sans-serif" }}>Existing Sections</h3>
          <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={thStyle}>Section Name</th>
                  <th style={thStyle}>Description</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sections.length === 0 ? (
                  <tr><td colSpan={3} style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>No sections defined.</td></tr>
                ) : sections.map((s) => (
                  <tr key={s.id || s._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{s.name}</td>
                    <td style={tdStyle}>{s.description || "N/A"}</td>
                    <td style={tdStyle}>
                      <button onClick={() => handleDelete(s.id || s._id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>
                        <Icon name="trash" size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ width: 320, background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 700, color: "#0B1F3B", fontFamily: "'DM Sans', sans-serif" }}>Create Section</h3>
          <form onSubmit={handleAdd}>
            <Input label="Section Name" value={name} onChange={setName} placeholder="e.g. Welfare, Building Project" required />
            <Input label="Description" value={description} onChange={setDescription} placeholder="Brief department description..." />
            <div style={{ marginTop: 24 }}>
              <Btn type="submit" variant="primary" disabled={saving}>
                {saving ? "Adding..." : "Create Section"}
              </Btn>
            </div>
          </form>
        </div>
      </div>
    </Page>
  );
};

const CMSSettings = ({ token, toast }) => {
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [birthdayMessage, setBirthdayMessage] = useState("");
  const [autoLogoutMinutes, setAutoLogoutMinutes] = useState("10");
  const [youtubeLiveUrl, setYoutubeLiveUrl] = useState("");
  const [youtubeLiveEnabled, setYoutubeLiveEnabled] = useState("true");
  const [serviceCheckinEnabled, setServiceCheckinEnabled] = useState("true");
  const [savingYoutube, setSavingYoutube] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingBirthday, setSavingBirthday] = useState(false);
  const [savingLogout, setSavingLogout] = useState(false);

  // Database Management States
  const [purgeTarget, setPurgeTarget] = useState("finance");
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeConfirmation, setPurgeConfirmation] = useState("");
  const [purging, setPurging] = useState(false);

  const [selfieFrameUrl, setSelfieFrameUrl] = useState("");
  const [uploadingFrame, setUploadingFrame] = useState(false);

  useEffect(() => {
    const loadFrameSetting = async () => {
      try {
        const res = await fetch(API_URLS.SETTINGS);
        if (res.ok) {
          const data = await res.json();
          setSelfieFrameUrl(data.selfie_frame_url || "");
        }
      } catch (_) {}
    };
    loadFrameSetting();
  }, [token]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(API_URLS.SETTINGS);
        if (res.ok) {
          const data = await res.json();
          setWelcomeMessage(data.welcome_message || "");
          setBirthdayMessage(data.birthday_message || "");
          setYoutubeLiveUrl(data.youtube_live_url || "");
          if (data.youtube_live_enabled !== undefined) {
            setYoutubeLiveEnabled(data.youtube_live_enabled);
          }
          if (data.service_checkin_enabled !== undefined) {
            setServiceCheckinEnabled(data.service_checkin_enabled);
          }
          if (data.auto_logout_minutes) setAutoLogoutMinutes(String(data.auto_logout_minutes));
        }
      } catch (err) {
        toast("Failed to load settings", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(API_URLS.SETTINGS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ key: "welcome_message", value: welcomeMessage })
      });
      if (res.ok) {
        toast("Welcome message saved!", "success");
      } else {
        toast("Failed to save welcome message", "error");
      }
    } catch (err) {
      toast("Server connection failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBirthday = async () => {
    setSavingBirthday(true);
    try {
      const res = await fetch(API_URLS.SETTINGS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ key: "birthday_message", value: birthdayMessage })
      });
      if (res.ok) {
        toast("Birthday message saved!", "success");
      } else {
        toast("Failed to save birthday message", "error");
      }
    } catch (err) {
      toast("Server connection failed", "error");
    } finally {
      setSavingBirthday(false);
    }
  };

  const handleSaveLogoutTimer = async () => {
    const mins = parseInt(autoLogoutMinutes, 10);
    if (isNaN(mins) || mins < 1) return toast("Please enter a valid number of minutes (minimum 1)", "error");
    setSavingLogout(true);
    try {
      const res = await fetch(API_URLS.SETTINGS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ key: "auto_logout_minutes", value: String(mins) })
      });
      if (res.ok) {
        toast(`Auto-logout timer set to ${mins} minute${mins !== 1 ? "s" : ""}! Changes take effect on next login.`, "success");
      } else {
        toast("Failed to save logout timer", "error");
      }
    } catch (err) {
      toast("Server connection failed", "error");
    } finally {
      setSavingLogout(false);
    }
  };

  const handleSaveYoutubeUrl = async () => {
    setSavingYoutube(true);
    try {
      const res1 = fetch(API_URLS.SETTINGS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ key: "youtube_live_url", value: youtubeLiveUrl.trim() })
      });
      const res2 = fetch(API_URLS.SETTINGS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ key: "youtube_live_enabled", value: youtubeLiveEnabled })
      });

      const [r1, r2] = await Promise.all([res1, res2]);

      if (r1.ok && r2.ok) {
        toast("YouTube livestream settings saved! The website has been updated.", "success");
      } else {
        toast("Failed to save YouTube settings", "error");
      }
    } catch (err) {
      toast("Server connection failed", "error");
    } finally {
      setSavingYoutube(false);
    }
  };

  const handlePurge = async () => {
    if (purgeConfirmation !== "I UNDERSTAND AND WISH TO PURGE DATA") {
      return toast("Incorrect confirmation phrase.", "error");
    }
    setPurging(true);
    try {
      const res = await fetch(`${API_URLS.DATABASE_PURGE}/${purgeTarget}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ confirmation: purgeConfirmation })
      });
      const data = await res.json();
      if (res.ok) {
        toast(`Data purged successfully.`, "success");
        setShowPurgeModal(false);
        setPurgeConfirmation("");
        // A full reload might be best here to ensure all state is wiped clean
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast(data.error || "Purge failed", "error");
      }
    } catch (err) {
      toast("Server connection failed", "error");
    } finally {
      setPurging(false);
    }
  };

  if (loading) {
    return (
      <Page title="System Settings" subtitle="Loading configurations...">
        <div style={{ color: "#4b5563", fontFamily: "'DM Sans', sans-serif" }}>Loading...</div>
      </Page>
    );
  }

  const handleFrameUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFrame(true);
    const formData = new FormData();
    formData.append("frame", file);

    try {
      const res = await fetch(`${API_URLS.BASE}/api/upload-frame`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setSelfieFrameUrl(data.url);
        toast("Selfie frame uploaded successfully!", "success");
      } else {
        toast(data.error || "Frame upload failed", "error");
      }
    } catch (err) {
      toast("Server connection failed during upload", "error");
    } finally {
      setUploadingFrame(false);
    }
  };

  const handleSaveCheckinStatus = async () => {
    try {
      await fetch(API_URLS.SETTINGS, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ key: "service_checkin_enabled", value: serviceCheckinEnabled })
      });
      toast("Check-in status saved!", "success");
    } catch (err) {
      toast("Failed to save check-in status", "error");
    }
  };

  return (
    <Page title="System Settings" subtitle="Configure system templates and defaults">
      {/* ── YouTube Livestream ── */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", maxWidth: 650, marginBottom: 24, borderLeft: "4px solid #ef4444" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 22 }}>📺</span>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827", fontFamily: "'DM Sans', sans-serif" }}>YouTube Channel — Auto Livestream</h3>
        </div>
        <p style={{ margin: "0 0 16px 0", color: "#6b7280", fontSize: 13, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
          Enter your <strong>YouTube Channel ID</strong> once and every livestream will automatically appear on the church website — no manual updates needed.
          <br /><br />
          <strong>How to find your Channel ID:</strong> Go to <a href="https://studio.youtube.com" target="_blank" rel="noopener" style={{color:"#ef4444"}}>YouTube Studio</a> → Settings → Channel → Advanced Settings → copy the <em>Channel ID</em> (starts with <code style={{background:"#f3f4f6",padding:"2px 6px",borderRadius:4}}>UC...</code>).
        </p>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: "#374151" }}>
            <input 
              type="checkbox" 
              checked={youtubeLiveEnabled === "true"} 
              onChange={(e) => setYoutubeLiveEnabled(e.target.checked ? "true" : "false")}
              style={{ width: 18, height: 18, accentColor: "#ef4444", cursor: "pointer" }}
            />
            Show "Watch Live" section on the website (turn off when service is over)
          </label>
        </div>

        <Input
          label="YouTube Channel ID"
          value={youtubeLiveUrl}
          onChange={setYoutubeLiveUrl}
          placeholder="e.g. UCxxxxxxxxxxxxxxxxxxxxxxxx"
        />
        {youtubeLiveUrl && youtubeLiveEnabled === "true" && (
          <p style={{ margin: "4px 0 12px", fontSize: 11, color: "#059669", fontFamily: "'DM Sans', sans-serif" }}>
            ✓ Channel set and Active. Livestreams will be shown.
          </p>
        )}
        {youtubeLiveEnabled === "false" && (
          <p style={{ margin: "4px 0 12px", fontSize: 11, color: "#ef4444", fontFamily: "'DM Sans', sans-serif" }}>
            ✕ Disabled. The live stream section is currently hidden from the website.
          </p>
        )}
        <Btn onClick={handleSaveYoutubeUrl} variant="primary" style={{ background: "#ef4444" }} disabled={savingYoutube}>
          {savingYoutube ? "Saving..." : "Save Settings"}
        </Btn>
      </div>

      {/* ── Selfie Frame Overlay Configuration ── */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", maxWidth: 650, marginBottom: 24, borderLeft: "4px solid #7c3aed" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 22 }}>📸</span>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827", fontFamily: "'DM Sans', sans-serif" }}>Selfie Frame Configuration</h3>
        </div>
        <p style={{ margin: "0 0 16px 0", color: "#6b7280", fontSize: 13, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
          Upload a transparent PNG frame overlay (4:3 aspect ratio recommended, e.g. 1440x1080px). Users taking a selfie will be framed by this design automatically.
        </p>

        <div style={{ padding: "12px 16px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 20 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
            <input 
              type="checkbox" 
              checked={serviceCheckinEnabled === "true"} 
              onChange={(e) => setServiceCheckinEnabled(e.target.checked ? "true" : "false")}
              style={{ width: 18, height: 18, accentColor: "#7c3aed", cursor: "pointer" }}
            />
            Enable Service Check-in Page
          </label>
          <p style={{ margin: "6px 0 0 28px", color: "#64748b", fontSize: 12, lineHeight: 1.5 }}>
            Turn this off when service is over to prevent people from using the check-in photo experience.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {selfieFrameUrl ? (
            <div style={{ position: "relative", width: "100%", maxWidth: 240, aspectRatio: "4/3", border: "1px dashed #cbd5e1", borderRadius: 10, overflow: "hidden", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={selfieFrameUrl} alt="Current Frame" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
          ) : (
            <div style={{ width: "100%", maxWidth: 240, aspectRatio: "4/3", border: "1px dashed #cbd5e1", borderRadius: 10, background: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
              <span>No frame uploaded</span>
            </div>
          )}

          <label style={{ display: "inline-flex", width: "fit-content" }}>
            <span style={{ padding: "10px 20px", background: uploadingFrame ? "#cbd5e1" : "#7c3aed", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: uploadingFrame ? "not-allowed" : "pointer" }}>
              {uploadingFrame ? "Uploading..." : "Upload PNG Frame"}
            </span>
            <input type="file" accept="image/png" onChange={handleFrameUpload} disabled={uploadingFrame} style={{ display: "none" }} />
          </label>
        </div>
        
        <div style={{ marginTop: 20 }}>
          <Btn onClick={handleSaveCheckinStatus} variant="primary" style={{ background: "#7c3aed" }}>
            Save Check-in Settings
          </Btn>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", maxWidth: 650 }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: 16, fontWeight: 700, color: "#111827", fontFamily: "'DM Sans', sans-serif" }}>Welcome Message Template</h3>
        <p style={{ margin: "0 0 16px 0", color: "#6b7280", fontSize: 13, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
          This message is automatically sent to newly registered users via Email and Push notifications.
          <br />
          Use <strong>{"{name}"}</strong> to insert the user's full name dynamically, and <strong>{"{church}"}</strong> to insert the church name dynamically.
        </p>

        <textarea
          value={welcomeMessage}
          onChange={e => setWelcomeMessage(e.target.value)}
          placeholder="Welcome to our church..."
          style={{
            width: "100%", boxSizing: "border-box", padding: "14px",
            border: "1.5px solid #e5e7eb", borderRadius: 10,
            fontSize: 14, fontFamily: "'DM Sans', sans-serif",
            minHeight: 180, resize: "vertical", outline: "none",
            marginBottom: 20, lineHeight: 1.6
          }}
        />

        <Btn onClick={handleSave} variant="primary" disabled={saving}>
          {saving ? "Saving Changes..." : "Save Welcome Message"}
        </Btn>
      </div>

      {/* ── Birthday Message Template ───────────────────────────────── */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", maxWidth: 650, marginTop: 24, borderLeft: "4px solid #f59e0b" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 22 }}>🎂</span>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827", fontFamily: "'DM Sans', sans-serif" }}>Birthday Greeting Template</h3>
        </div>
        <p style={{ margin: "0 0 16px 0", color: "#6b7280", fontSize: 13, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
          Automatically sent to <strong>members and workers</strong> on their birthday at 8:00 AM WAT via push notification and email.
          <br />
          Use <strong>{"{name}"}</strong> to insert the member's <em>first name</em> dynamically.
        </p>

        <textarea
          value={birthdayMessage}
          onChange={e => setBirthdayMessage(e.target.value)}
          placeholder="🎂 Happy Birthday, {name}!..."
          style={{
            width: "100%", boxSizing: "border-box", padding: "14px",
            border: "1.5px solid #fde68a", borderRadius: 10,
            fontSize: 14, fontFamily: "'DM Sans', sans-serif",
            minHeight: 180, resize: "vertical", outline: "none",
            marginBottom: 16, lineHeight: 1.6, background: "#fffbeb"
          }}
        />

        {/* Live Preview */}
        {birthdayMessage && (
          <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
              📱 Live Preview — as recipient sees it
            </div>
            <div style={{ fontSize: 13, color: "#374151", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {birthdayMessage.replace(/\{name\}/g, "David")}
            </div>
          </div>
        )}

        <Btn onClick={handleSaveBirthday} variant="primary" style={{ background: "#d97706", border: "none" }} disabled={savingBirthday}>
          {savingBirthday ? "Saving..." : "Save Birthday Message"}
        </Btn>
      </div>

      {/* ── Auto-Logout Timer ──────────────────────────────────────────── */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", maxWidth: 650, marginTop: 24, borderLeft: "4px solid #6366f1" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 22 }}>⏱️</span>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827", fontFamily: "'DM Sans', sans-serif" }}>Auto-Logout Timer</h3>
        </div>
        <p style={{ margin: "0 0 16px 0", color: "#6b7280", fontSize: 13, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
          Automatically log out all admin users after this many minutes of inactivity.
          <br />
          The default is <strong>10 minutes</strong>. Changes take effect on next login session.
        </p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
          <div style={{ flex: 1, maxWidth: 200 }}>
            <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Inactivity Timeout (minutes)</label>
            <input
              type="number"
              min="1"
              max="480"
              value={autoLogoutMinutes}
              onChange={e => setAutoLogoutMinutes(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box", padding: "10px 14px",
                border: "1.5px solid #e5e7eb", borderRadius: 10,
                fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none"
              }}
            />
          </div>
          <Btn onClick={handleSaveLogoutTimer} variant="primary" style={{ background: "#6366f1", border: "none", marginBottom: 0, height: 42 }} disabled={savingLogout}>
            {savingLogout ? "Saving..." : "Save Timer"}
          </Btn>
        </div>
        <p style={{ margin: "10px 0 0 0", fontSize: 12, color: "#9ca3af", fontFamily: "'DM Sans', sans-serif" }}>
          Current value: <strong>{autoLogoutMinutes} minute{parseInt(autoLogoutMinutes) !== 1 ? "s" : ""}</strong>
        </p>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", maxWidth: 650, marginTop: 24, borderLeft: "4px solid #ef4444" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: 16, fontWeight: 700, color: "#111827", fontFamily: "'DM Sans', sans-serif" }}>DANGER ZONE: Database Management</h3>
        <p style={{ margin: "0 0 16px 0", color: "#6b7280", fontSize: 13, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
          WARNING: These actions permanently delete data from the system. This cannot be undone.
          If you need a fresh start for a new year or to clear test data, select the target below.
        </p>

        <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <Input
              label="Target Data to Purge"
              type="dropdown"
              options={[
                { value: "finance", label: "Financial Data (Logs, Salaries, Requests)" },
                { value: "users", label: "Members & First-timers" },
                { value: "attendance", label: "Attendance Records" },
                { value: "communications", label: "Messages & Reminders" },
                { value: "audits", label: "Login Audits" },
                { value: "service_reviews", label: "Service Reviews" },
                { value: "all", label: "ENTIRE DATABASE (Complete Reset)" }
              ]}
              value={purgeTarget}
              onChange={setPurgeTarget}
            />
          </div>
          <Btn onClick={() => setShowPurgeModal(true)} variant="primary" style={{ background: "#ef4444", border: "none", height: 42, marginBottom: 16 }}>
            <Icon name="trash" size={16} /> Delete Data
          </Btn>
        </div>
      </div>

      {showPurgeModal && (
        <Modal title="⚠️ IRREVERSIBLE ACTION WARNING" onClose={() => setShowPurgeModal(false)}>
          <div style={{ padding: 24 }}>
            <div style={{ background: "#fef2f2", color: "#991b1b", padding: 16, borderRadius: 8, fontSize: 14, fontFamily: "'DM Sans', sans-serif", marginBottom: 20 }}>
              <strong>WARNING:</strong> You are about to permanently delete <strong>{purgeTarget.toUpperCase()}</strong> data.
              This action <u>cannot be undone</u> and the data cannot be recovered.
            </div>

            <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#374151", fontFamily: "'DM Sans', sans-serif" }}>
              Please type exactly <code style={{ background: "#e5e7eb", padding: "2px 6px", borderRadius: 4, userSelect: "none" }}>I UNDERSTAND AND WISH TO PURGE DATA</code> to confirm.
            </p>
            <Input
              value={purgeConfirmation}
              onChange={setPurgeConfirmation}
              placeholder="Type confirmation phrase here..."
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
              <Btn variant="secondary" onClick={() => setShowPurgeModal(false)}>Cancel</Btn>
              <Btn
                variant="primary"
                style={{ background: "#ef4444", border: "none" }}
                onClick={handlePurge}
                disabled={purging || purgeConfirmation !== "I UNDERSTAND AND WISH TO PURGE DATA"}
              >
                {purging ? "Purging Data..." : "Permanently Delete Data"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </Page>
  );
};

const CMSHome = ({ state, token, toast, setActive, setUserFilterTag }) => {
  const firstTimers = state.users.filter(u => u.tag === "first_timer").length;
  const members = state.users.filter(u => u.tag === "member").length;
  const workers = state.users.filter(u => u.tag === "worker").length;
  const activeAdmins = state.admins.filter(a => a.status === "active").length;
  const todayStr = new Date().toLocaleDateString("en-CA");
  const todayAttendance = state.attendance.filter(a => {
    const aDate = a.date ? (typeof a.date === "string" ? a.date.slice(0, 10) : new Date(a.date).toLocaleDateString("en-CA")) : "";
    return aDate === todayStr && a.status === "present";
  }).length;
  const [printing, setPrinting] = useState(false);

  const handlePrintAll = async () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast("Popup blocker active! Please allow popups to print the report.", "error");
      return;
    }
    printWindow.document.write("<html><body><p style='font-family: sans-serif; padding: 20px;'>Generating report... Please wait.</p></body></html>");
    setPrinting(true);
    try {
      const res = await fetch(API_URLS.REPORTS_ALL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch reports");
      const data = await res.json();

      printWindow.document.open();
      printWindow.document.write(`
        <html><head><title>Citadel CMS Complete Report</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #0B1F3B; }
          h1 { border-bottom: 2px solid #0B1F3B; padding-bottom: 10px; }
          h2 { margin-top: 40px; color: #059669; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
          th { background: #f8fafc; }
          .summary { background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .voided { color: #ef4444; text-decoration: line-through; }
          .print-watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.05;
            z-index: -1;
            pointer-events: none;
            display: flex;
            justify-content: center;
            align-items: center;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-watermark img {
            width: 550px;
            height: 550px;
            object-fit: contain;
            filter: grayscale(100%);
          }
          @media print {
            .print-watermark {
              opacity: 0.08 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style></head><body>
        <div class="print-watermark">
          <img src={churchLogo} alt="" />
        </div>
        
        <h1>Citadel CMS Master Report</h1>
        <p><strong>Generated At:</strong> ${new Date(data.generatedAt).toLocaleString()}</p>
        <p><strong>Generated By:</strong> ${data.generatedBy}</p>
        
        <div class="summary">
          <h3>System Summary</h3>
          <p>Total Members: ${data.summary.totalMembers} | First-timers: ${data.summary.totalFirstTimers} | Workers: ${data.summary.totalWorkers}</p>
          <p>Active Admins: ${data.summary.totalAdmins} | Login Activities: ${data.summary.loginActivityCount}</p>
          <p>Total Income: ₦${data.summary.financialSummary.totalIncome.toLocaleString()}</p>
          <p>Total Expense: ₦${data.summary.financialSummary.totalExpense.toLocaleString()}</p>
          <p>Net Balance: ₦${data.summary.financialSummary.netBalance.toLocaleString()}</p>
        </div>

        <h2>1. Financial Ledger (Includes Voided)</h2>
        <table>
          <tr><th>Date</th><th>Type</th><th>Category</th><th>Amount (₦)</th><th>Status</th><th>Notes</th></tr>
          ${data.financialLogs.map(l => `
            <tr class="${l.voided ? 'voided' : ''}">
              <td>${new Date(l.date).toLocaleDateString()}</td>
              <td>${l.type.toUpperCase()}</td>
              <td>${l.category}</td>
              <td>${l.amount.toLocaleString()}</td>
              <td>${l.voided ? 'VOIDED: ' + l.void_reason : 'Active'}</td>
              <td>${l.description || '-'}</td>
            </tr>
          `).join('')}
        </table>

        <h2>2. Salary Logs</h2>
        <table>
          <tr><th>Month</th><th>Staff Name</th><th>Role</th><th>Amount (₦)</th><th>Status</th></tr>
          ${data.salaryLogs.map(s => `
            <tr class="${s.voided ? 'voided' : ''}">
              <td>${s.month}</td>
              <td>${s.staff_name}</td>
              <td>${s.role}</td>
              <td>${s.amount.toLocaleString()}</td>
              <td>${s.voided ? 'VOIDED: ' + s.void_reason : s.status.toUpperCase()}</td>
            </tr>
          `).join('')}
        </table>

        <h2>3. Member Directory</h2>
        <table>
          <tr><th>Name</th><th>Email</th><th>Phone</th><th>Tag</th><th>Joined</th></tr>
          ${data.members.map(u => `
            <tr>
              <td>${u.full_name}</td>
              <td>${u.email}</td>
              <td>${u.phone || '-'}</td>
              <td>${u.tag}</td>
              <td>${new Date(u.created_at).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </table>

        <h2>4. Login Audit (Last 500)</h2>
        <table>
          <tr><th>Time</th><th>Email</th><th>Role</th><th>Status</th><th>IP</th><th>Failure Reason</th></tr>
          ${data.loginActivity.map(l => `
            <tr>
              <td>${new Date(l.logged_at).toLocaleString()}</td>
              <td>${l.email}</td>
              <td>${l.role || '-'}</td>
              <td style="color:${l.success ? 'green' : 'red'}">${l.success ? 'SUCCESS' : 'FAILED'}</td>
              <td>${l.ip_address || '-'}</td>
              <td>${l.failure_reason || '-'}</td>
            </tr>
          `).join('')}
        </table>
        
        <script>
          setTimeout(() => { window.print(); }, 500);
        </script>
        </body></html>
      `);
      printWindow.document.close();
      toast("Report generated successfully", "success");
    } catch (err) {
      printWindow.close();
      toast("Failed to generate report", "error");
    } finally {
      setPrinting(false);
    }
  };



  return (
    <Page
      title="CMS Dashboard"
      subtitle="Full system overview and controls"
      actions={
        <Btn onClick={handlePrintAll} variant="primary" disabled={printing}>
          <Icon name="forms" size={16} />
          {printing ? "Generating Report..." : "Print Master Report"}
        </Btn>
      }
    >
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
        <StatCard label="Total Users" value={state.users.length} icon="users" accent onClick={() => { setActive("users"); setUserFilterTag("all"); }} />
        <StatCard label="First-Timers" value={firstTimers} icon="bell" onClick={() => { setActive("users"); setUserFilterTag("first_timer"); }} />
        <StatCard label="Members" value={members} icon="users" onClick={() => { setActive("users"); setUserFilterTag("member"); }} />
        <StatCard label="Workers" value={workers} icon="church" onClick={() => { setActive("users"); setUserFilterTag("worker"); }} />
        <StatCard label="Active Admins" value={activeAdmins} icon="admins" onClick={() => setActive("admins")} />
        <StatCard label="Present Today" value={todayAttendance} icon="attendance" onClick={() => setActive("attendance")} />
      </div>
      <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <h3 style={{ margin: "0 0 16px", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: "#0B1F3B" }}>Recent Registrations</h3>
        <Table
          headers={["Name", "Email", "Tag", "Push Status", "Joined"]}
          rows={[...state.users].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5).map(u => [
            u.full_name, u.email, <Badge label={u.tag} />,
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              background: u.fcm_tokens && u.fcm_tokens.length > 0 ? "#ecfdf5" : "#f3f4f6",
              color: u.fcm_tokens && u.fcm_tokens.length > 0 ? "#047857" : "#6b7280"
            }}>
              {u.fcm_tokens && u.fcm_tokens.length > 0 ? "● Active" : "○ Inactive"}
            </span>,
            new Date(u.created_at).toLocaleDateString()
          ])}
        />
      </div>
    </Page>
  );
};

const CMSUsers = ({ state, dispatch, toast, initialFilter = "all" }) => {
  const [filter, setFilter] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);
  const [editUser, setEditUser] = useState(null);
  const [editTag, setEditTag] = useState("");
  const [editDept, setEditDept] = useState("");
  const [viewUser, setViewUser] = useState(null);

  const departmentField = state.formFields?.member_worker?.find(f => f.field_key === "department");
  const deptOptions = departmentField && departmentField.options && departmentField.options.length > 0
    ? ["", ...departmentField.options]
    : ["", "Media", "Ushering", "Security", "Choir"];

  const filtered = state.users.filter(u => {
    const matchesFilter = filter === "all" || u.tag === filter;
    const matchesSearch = !searchQuery ||
      (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.phone && u.phone.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URLS.USERS}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${state.session.token}` }
      });
      if (res.ok) {
        dispatch({ type: "DELETE_USER", id });
        toast("User deleted", "success");
      }
    } catch (err) { toast("Delete failed", "error"); }
  };

  const handleEdit = (u) => { setEditUser(u); setEditTag(u.tag); setEditDept(u.department || ""); };

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_URLS.USERS}/${editUser._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.session.token}`
        },
        body: JSON.stringify({ tag: editTag, department: editDept || null })
      });
      if (res.ok) {
        dispatch({ type: "UPDATE_USER", id: editUser._id, tag: editTag, department: editDept || null });
        setEditUser(null);
        toast("User updated", "success");
      }
    } catch (err) { toast("Update failed", "error"); }
  };

  const handlePrintUsers = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the user report");
      return;
    }

    const rowsHtml = state.users.map(u => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px; font-size: 13px; color: #111827;">${u.full_name || "—"}</td>
        <td style="padding: 10px; font-size: 13px; color: #4b5563;">${u.email || "—"}</td>
        <td style="padding: 10px; font-size: 13px; color: #4b5563;">${u.phone || "—"}</td>
        <td style="padding: 10px; font-size: 13px; color: #4b5563; text-transform: capitalize;">${(u.tag || "—").replace(/_/g, ' ')}</td>
        <td style="padding: 10px; font-size: 13px; color: #4b5563;">${u.department || "—"}</td>
      </tr>
    `).join("");

    const churchName = import.meta.env.VITE_CHURCH_NAME || "Church";
    const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${churchName} - User Database Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; margin: 0; }
          .header { border-bottom: 2px solid #111827; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: 800; margin: 0 0 8px 0; color: #0b1f3b; }
          .meta { font-size: 14px; color: #4b5563; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #f1f5f9; padding: 12px 10px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; text-align: left; border-bottom: 2px solid #cbd5e1; }
          @media print { body { padding: 20px; } tr { page-break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${churchName} - Database Users</div>
          <div class="meta">Generated: <strong>${dateStr}</strong> | Total Users: <strong>${state.users.length}</strong></div>
        </div>
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th>Tag</th><th>Department</th></tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };</script>
      </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <Page title="User Management" subtitle={`${state.users.length} total users`}
      actions={
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 200, maxWidth: 300, marginBottom: -16 }}>
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search users by name, email..." />
          </div>
          {["all", "first_timer", "member", "worker"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter === f ? "#0B1F3B" : "#fff", color: filter === f ? "#fff" : "#6b7280",
              border: "1.5px solid", borderColor: filter === f ? "#0B1F3B" : "#e5e7eb",
              borderRadius: 10, padding: "7px 14px", cursor: "pointer",
              fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
            }}>{f === "all" ? "All" : f.replace("_", " ")}</button>
          ))}
          <Btn onClick={handlePrintUsers} variant="accent" small>
            <Icon name="print" size={14} /> Print Report (PDF)
          </Btn>
        </div>
      }
    >
      <Table
        headers={["Name", "Email", "Phone", "Tag", "Department", "Push Status", "Actions"]}
        onRowClick={(i) => setViewUser(filtered[i])}
        rows={filtered.map(u => [
          u.full_name, u.email, u.phone, <Badge label={u.tag} />, u.department || "—",
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 8px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            background: u.fcm_tokens && u.fcm_tokens.length > 0 ? "#ecfdf5" : "#f3f4f6",
            color: u.fcm_tokens && u.fcm_tokens.length > 0 ? "#047857" : "#6b7280"
          }}>
            {u.fcm_tokens && u.fcm_tokens.length > 0 ? "● Active" : "○ Inactive"}
          </span>,
          <div style={{ display: "flex", gap: 6 }}>
            <Btn onClick={(e) => { e.stopPropagation(); handleEdit(u); }} variant="ghost" small><Icon name="edit" size={14} /></Btn>
            <Btn onClick={(e) => { e.stopPropagation(); handleDelete(u._id); }} variant="danger" small><Icon name="trash" size={14} /></Btn>
          </div>
        ])}
      />
      {editUser && (
        <Modal title="Edit User" onClose={() => setEditUser(null)}>
          <p style={{ margin: "0 0 16px", color: "#6b7280", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>{editUser.full_name}</p>
          <Input label="Tag" value={editTag} onChange={setEditTag} type="dropdown" options={["first_timer", "member", "worker"]} />
          <Input label="Department" value={editDept} onChange={setEditDept} type="dropdown" options={deptOptions} />
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Btn onClick={() => setEditUser(null)} variant="ghost">Cancel</Btn>
            <Btn onClick={handleSave} variant="primary">Save Changes</Btn>
          </div>
        </Modal>
      )}
      {viewUser && (
        <UserDetailsModal
          user={viewUser}
          onClose={() => setViewUser(null)}
          onEdit={() => { handleEdit(viewUser); setViewUser(null); }}
        />
      )}
    </Page>
  );
};

const CMSForms = ({ state, dispatch, toast }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newField, setNewField] = useState({ label: "", field_key: "", type: "text", required: false, worker_only: false, options: "" });

  // Per-event form fields: "event_fields" tab uses a 2-step picker → editor
  const [activeTab, setActiveTab] = useState("first_timer"); // UI tab key
  const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const toEventSlug = title => `event_${slugify(title)}`;

  // formType is either a real form type (first_timer, member_worker, event_<slug>) or "event_design"
  // When activeTab === "event_fields", formType is set to the selected event's slug
  const [formType, setFormType] = useState("first_timer");

  // Website data state for Event Design + Event Fields tabs
  const [webData, setWebData] = useState({ events: [] });
  const [loadingWeb, setLoadingWeb] = useState(false);
  const [savingWeb, setSavingWeb] = useState(false);

  const token = state.session?.token;
  const fields = state.formFields[formType] || [];

  const fetchWebData = async () => {
    setLoadingWeb(true);
    try {
      const res = await fetch(API_URLS.WEBSITE_DATA);
      if (res.ok) {
        const data = await res.json();
        setWebData(data);
      }
    } catch (err) {
      console.error("Failed to load website data in form builder", err);
    } finally {
      setLoadingWeb(false);
    }
  };

  useEffect(() => {
    if (activeTab === "event_design" || activeTab === "event_fields") {
      fetchWebData();
    }
  }, [activeTab]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === "first_timer" || tab === "member_worker") {
      setFormType(tab);
    } else if (tab === "event_design") {
      setFormType("event_design");
    } else if (tab === "event_fields") {
      setFormType("event_fields"); // picker mode — no field list shown yet
    }
  };

  const handleAssetUpload = async (file, eventTitle, fieldKey) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    try {
      toast("Uploading image...", "info");
      const res = await fetch(API_URLS.UPLOAD, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const result = await res.json();
        toast("Upload success!", "success");
        setWebData(prev => {
          const updatedEvents = prev.events.map(e => {
            if (e.title === eventTitle) {
              return { ...e, [fieldKey]: result.url };
            }
            return e;
          });
          return { ...prev, events: updatedEvents };
        });
      } else {
        toast("Upload failed", "error");
      }
    } catch (err) {
      toast("Error uploading image", "error");
    }
  };

  const handleSaveAssets = async () => {
    setSavingWeb(true);
    try {
      const res = await fetch(API_URLS.WEBSITE_DATA, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(webData)
      });
      if (res.ok) {
        toast("Event page design settings saved successfully!", "success");
      } else {
        toast("Failed to save changes", "error");
      }
    } catch (err) {
      toast("Network error saving changes", "error");
    } finally {
      setSavingWeb(false);
    }
  };

  const handleMove = async (index, direction) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;

    const list = [...fields];
    const current = { ...list[index] };
    const target = { ...list[targetIndex] };

    const currentSort = typeof current.sort_order === "number" ? current.sort_order : index;
    const targetSort = typeof target.sort_order === "number" ? target.sort_order : targetIndex;

    current.sort_order = targetSort;
    target.sort_order = currentSort;

    list[index] = target;
    list[targetIndex] = current;

    // Collect all fields from the other form types to preserve them during reorder sync
    const allOtherFields = Object.entries(state.formFields)
      .filter(([k]) => k !== formType)
      .flatMap(([, v]) => v || []);

    dispatch({ type: "SYNC_DATA", key: "formFields", data: [...allOtherFields, ...list] });

    try {
      await Promise.all([
        fetch(`${API_URLS.FORMS}/${current.id || current._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.session.token}`
          },
          body: JSON.stringify({ sort_order: targetSort })
        }),
        fetch(`${API_URLS.FORMS}/${target.id || target._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.session.token}`
          },
          body: JSON.stringify({ sort_order: currentSort })
        })
      ]);
    } catch (err) {
      toast("Failed to sync reorder on server", "error");
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await fetch(`${API_URLS.FORMS}/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${state.session.token}` }
      });
      if (res.ok) {
        dispatch({ type: "TOGGLE_FIELD", formType, id });
        toast("Field updated", "success");
      }
    } catch (err) { toast("Update failed", "error"); }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URLS.FORMS}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${state.session.token}` }
      });
      if (res.ok) {
        dispatch({ type: "DELETE_FIELD", formType, id });
        toast("Field deleted", "success");
      }
    } catch (err) { toast("Delete failed", "error"); }
  };

  const handleAdd = async () => {
    if (!newField.label || !newField.field_key) return;
    try {
      const payloadOptions = newField.type === "dropdown" && newField.options
        ? newField.options.split(",").map(o => o.trim()).filter(Boolean)
        : [];
      const res = await fetch(API_URLS.FORMS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.session.token}`
        },
        body: JSON.stringify({ ...newField, options: payloadOptions, form_type: formType, active: true })
      });
      if (res.ok) {
        const addedField = await res.json();
        dispatch({ type: "ADD_FIELD", formType, field: { ...addedField, id: addedField._id } });
        setNewField({ label: "", field_key: "", type: "text", required: false, worker_only: false, options: "" });
        setShowAdd(false);
        toast("Field added", "success");
      } else {
        const err = await res.json();
        toast(err.error || "Failed to add field", "error");
      }
    } catch (err) { toast("Server connection failed", "error"); }
  };

  const isEventFieldsActive = activeTab === "event_fields";
  const canAddField = formType !== "event_design" && formType !== "event_fields";

  return (
    <Page title="Form Builder" subtitle="Manage dynamic registration fields and pages"
      actions={canAddField ? <Btn onClick={() => setShowAdd(true)} variant="accent"><Icon name="plus" size={16} /> Add Field</Btn> : null}
    >
      {/* ── TAB BAR ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {["first_timer", "member_worker", "event_fields", "event_design"].map(tab => (
          <button key={tab} onClick={() => switchTab(tab)} style={{
            background: activeTab === tab ? "#0B1F3B" : "#fff",
            color: activeTab === tab ? "#fff" : "#6b7280",
            border: "1.5px solid", borderColor: activeTab === tab ? "#0B1F3B" : "#e5e7eb",
            borderRadius: 10, padding: "8px 18px", cursor: "pointer",
            fontSize: 14, fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
          }}>
            {tab === "first_timer" ? "First-Timer Form" : tab === "member_worker" ? "Member / Worker Form" : tab === "event_fields" ? "Event Form Fields" : "Event Page Design"}
          </button>
        ))}
      </div>

      {/* ── EVENT FIELDS: PICKER ── */}
      {isEventFieldsActive && formType === "event_fields" && (
        <div>
          <div style={{ marginBottom: 16, fontFamily: "'DM Sans', sans-serif", color: "#374151", fontSize: 14 }}>
            Select an event to configure its registration form fields:
          </div>
          {loadingWeb ? (
            <div style={{ padding: 40, textAlign: "center", color: "#4b5563" }}>Loading events...</div>
          ) : webData.events.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontFamily: "'DM Sans', sans-serif" }}>No events found. Add events in Website Content tab first.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {webData.events.map((e, idx) => {
                const slug = toEventSlug(e.title);
                const fieldCount = (state.formFields[slug] || []).length;
                return (
                  <div key={idx} onClick={() => setFormType(slug)}
                    style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: 20, cursor: "pointer",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.05)", transition: "all 0.2s",
                    }}
                    onMouseEnter={el => el.currentTarget.style.borderColor = "#0B1F3B"}
                    onMouseLeave={el => el.currentTarget.style.borderColor = "#e5e7eb"}
                  >
                    {e.imageUrl && <img src={e.imageUrl} alt={e.title} style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 8, marginBottom: 12 }} />}
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 15, color: "#0B1F3B", marginBottom: 6 }}>{e.title}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>📅 {e.date}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: fieldCount > 0 ? "#1e40af" : "#9ca3af", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                        {fieldCount > 0 ? `${fieldCount} custom field${fieldCount > 1 ? 's' : ''}` : 'No custom fields yet'}
                      </span>
                      <span style={{ fontSize: 12, color: "#0B1F3B", fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>Configure →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── EVENT FIELDS: EDITOR (after event selected) ── */}
      {isEventFieldsActive && formType !== "event_fields" && formType !== "event_design" && (
        <div>
          {/* Breadcrumb / back */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Btn onClick={() => setFormType("event_fields")} variant="ghost" small>← Back to Events</Btn>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 15, color: "#0B1F3B" }}>
              {webData.events.find(e => toEventSlug(e.title) === formType)?.title || formType} — Custom Fields
            </div>
            <Btn onClick={() => setShowAdd(true)} variant="accent" small><Icon name="plus" size={14} /> Add Field</Btn>
          </div>
          <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
            {fields.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontFamily: "'DM Sans', sans-serif" }}>
                No custom fields yet for this event.<br />Click <strong>Add Field</strong> above to get started.
              </div>
            ) : fields.map((f, i) => (
              <div key={f.id} style={{
                display: "flex", alignItems: "center", padding: "14px 20px",
                borderBottom: i < fields.length - 1 ? "1px solid #f3f4f6" : "none", gap: 12,
              }}>
                <div style={{ width: 36, height: 36, background: f.active ? "#dbeafe" : "#f3f4f6", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: f.active ? "#1e40af" : "#9ca3af", flexShrink: 0 }}>
                  <Icon name="forms" size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, color: "#111827" }}>{f.label}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6b7280" }}>key: {f.field_key} · type: {f.type}{f.required ? " · required" : ""}</div>
                </div>
                <Badge label={f.active ? "active" : "disabled"} />
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn onClick={() => handleMove(i, "up")} variant="ghost" small disabled={i === 0} style={{ padding: "4px 8px" }}>↑</Btn>
                  <Btn onClick={() => handleMove(i, "down")} variant="ghost" small disabled={i === fields.length - 1} style={{ padding: "4px 8px" }}>↓</Btn>
                  <Btn onClick={() => handleToggle(f.id)} variant="ghost" small>{f.active ? "Disable" : "Enable"}</Btn>
                  <Btn onClick={() => handleDelete(f.id)} variant="danger" small><Icon name="trash" size={14} /></Btn>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {formType === "event_design" ? (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", color: "#0B1F3B", fontSize: 16 }}>Event Logo & Banner Cover Configuration</h3>
            <Btn onClick={handleSaveAssets} disabled={savingWeb} variant="accent">
              {savingWeb ? "Saving..." : "Save All Changes"}
            </Btn>
          </div>
          {loadingWeb ? (
            <div style={{ padding: 40, textAlign: "center", color: "#4b5563" }}>Loading event info...</div>
          ) : webData.events.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>No events found to configure. Add events in Website Content tab first.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
              {webData.events.map((e, idx) => (
                <div key={idx} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 18 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 16, color: "#0B1F3B", marginBottom: 16 }}>{e.title}</div>
                  
                  {/* Banner Cover */}
                  <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, marginBottom: 12, border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Banner Cover</div>
                    {e.bannerImage && <img src={e.bannerImage} alt="Banner" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 6, marginBottom: 8 }} />}
                    <input type="file" accept="image/*" onChange={el => handleAssetUpload(el.target.files[0], e.title, "bannerImage")} style={{ fontSize: 11, marginBottom: 8, display: "block" }} />
                    <Input
                      label="Or Banner URL"
                      value={e.bannerImage || ""}
                      onChange={v => setWebData(prev => {
                        const u = prev.events.map(ev => ev.title === e.title ? { ...ev, bannerImage: v } : ev);
                        return { ...prev, events: u };
                      })}
                      small
                    />
                  </div>

                  {/* Event Logo */}
                  <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, marginBottom: 12, border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Event Logo</div>
                    {e.logoImage && <img src={e.logoImage} alt="Logo" style={{ height: 40, objectFit: "contain", borderRadius: 4, marginBottom: 8, display: "block" }} />}
                    <input type="file" accept="image/*" onChange={el => handleAssetUpload(el.target.files[0], e.title, "logoImage")} style={{ fontSize: 11, marginBottom: 8, display: "block" }} />
                    <Input
                      label="Or Logo URL"
                      value={e.logoImage || ""}
                      onChange={v => setWebData(prev => {
                        const u = prev.events.map(ev => ev.title === e.title ? { ...ev, logoImage: v } : ev);
                        return { ...prev, events: u };
                      })}
                      small
                    />
                  </div>

                  {/* Card Thumbnail */}
                  <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Card Thumbnail</div>
                    {e.imageUrl && <img src={e.imageUrl} alt="Thumbnail" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 6, marginBottom: 8 }} />}
                    <input type="file" accept="image/*" onChange={el => handleAssetUpload(el.target.files[0], e.title, "imageUrl")} style={{ fontSize: 11, marginBottom: 8, display: "block" }} />
                    <Input
                      label="Or Thumbnail URL"
                      value={e.imageUrl || ""}
                      onChange={v => setWebData(prev => {
                        const u = prev.events.map(ev => ev.title === e.title ? { ...ev, imageUrl: v } : ev);
                        return { ...prev, events: u };
                      })}
                      small
                    />
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* First-Timer and Member/Worker fields list */
        !isEventFieldsActive && formType !== "event_design" && (
          <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
            {fields.map((f, i) => (
              <div key={f.id} style={{
                display: "flex", alignItems: "center", padding: "14px 20px",
                borderBottom: i < fields.length - 1 ? "1px solid #f3f4f6" : "none",
                gap: 12,
              }}>
                <div style={{
                  width: 36, height: 36, background: f.active ? "#dbeafe" : "#f3f4f6",
                  borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                  color: f.active ? "#1e40af" : "#9ca3af", flexShrink: 0,
                }}>
                  <Icon name="forms" size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, color: "#111827" }}>{f.label}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6b7280" }}>key: {f.field_key} · type: {f.type} {f.required ? "· required" : ""}{f.worker_only ? " · worker only" : ""}</div>
                </div>
                <Badge label={f.active ? "active" : "disabled"} />
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn onClick={() => handleMove(i, "up")} variant="ghost" small disabled={i === 0} style={{ padding: "4px 8px" }}>↑</Btn>
                  <Btn onClick={() => handleMove(i, "down")} variant="ghost" small disabled={i === fields.length - 1} style={{ padding: "4px 8px" }}>↓</Btn>
                  <Btn onClick={() => handleToggle(f.id)} variant="ghost" small>{f.active ? "Disable" : "Enable"}</Btn>
                  <Btn onClick={() => handleDelete(f.id)} variant="danger" small><Icon name="trash" size={14} /></Btn>
                </div>
              </div>
            ))}
          </div>
        )
      )}
      {showAdd && (
        <Modal title="Add Form Field" onClose={() => setShowAdd(false)}>
          <Input label="Field Label" value={newField.label} onChange={v => setNewField(p => ({ ...p, label: v }))} placeholder="e.g. Date of Birth" />
          <Input label="Field Key" value={newField.field_key} onChange={v => setNewField(p => ({ ...p, field_key: v.replace(/\s/g, "_").toLowerCase() }))} placeholder="e.g. date_of_birth" />
          <Input label="Field Type" value={newField.type} onChange={v => setNewField(p => ({ ...p, type: v }))} type="dropdown" options={["text", "dropdown", "date", "number"]} />

          {newField.type === "dropdown" && (
            <Input label="Dropdown Options (comma-separated)" value={newField.options || ""} onChange={v => setNewField(p => ({ ...p, options: v }))} placeholder="e.g. Yes, No, Maybe" />
          )}

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, marginBottom: 8, fontSize: 14, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", color: "#374151", fontWeight: 600 }}>
            <input type="checkbox" checked={newField.required} onChange={e => setNewField(p => ({ ...p, required: e.target.checked }))} style={{ width: 16, height: 16, cursor: "pointer" }} />
            Required Field
          </label>

          {formType === "member_worker" && (
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 8, fontSize: 14, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", color: "#374151", fontWeight: 600 }}>
              <input type="checkbox" checked={newField.worker_only} onChange={e => setNewField(p => ({ ...p, worker_only: e.target.checked }))} style={{ width: 16, height: 16, cursor: "pointer" }} />
              Worker Only Field
            </label>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <Btn onClick={() => setShowAdd(false)} variant="ghost">Cancel</Btn>
            <Btn onClick={handleAdd} variant="primary"><Icon name="plus" size={14} /> Add Field</Btn>
          </div>
        </Modal>
      )}
    </Page>
  );
};

const CMSAdmins = ({ state, dispatch, toast }) => {
  const [showInvite, setShowInvite] = useState(false);
  const [invEmail, setInvEmail] = useState("");
  const [invRole, setInvRole] = useState("media_admin");
  const [invName, setInvName] = useState("");
  const [sending, setSending] = useState(false);

  const handleInvite = async () => {
    if (!invEmail || !invRole) return;
    setSending(true);
    try {
      const res = await fetch(API_URLS.AUTH_INVITE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.session.token}`
        },
        body: JSON.stringify({ email: invEmail, role: invRole, name: invName || undefined })
      });
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: "SYNC_DATA", key: "admins", data: [...state.admins, data.admin] });
        setInvEmail(""); setInvRole("media_admin"); setInvName(""); setShowInvite(false);
        toast(`Invite sent to ${invEmail} — check their inbox!`, "success");
      } else {
        const err = await res.json();
        toast(err.error || "Invite failed", "error");
      }
    } catch (err) {
      toast("Server connection failed", "error");
    } finally {
      setSending(false);
    }
  };

  const handleToggle = async (id, status) => {
    // Optimistic update — flip immediately
    const newStatus = status === "active" ? "suspended" : "active";
    dispatch({ type: "SYNC_DATA", key: "admins", data: state.admins.map(a => a._id === id ? { ...a, status: newStatus } : a) });
    try {
      const res = await fetch(`${API_URLS.ADMINS}/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${state.session.token}` }
      });
      if (res.ok) {
        const updated = await res.json();
        dispatch({ type: "SYNC_DATA", key: "admins", data: state.admins.map(a => a._id === id ? updated : a) });
        toast("Admin status updated", "success");
      } else {
        // Revert on failure
        dispatch({ type: "SYNC_DATA", key: "admins", data: state.admins.map(a => a._id === id ? { ...a, status } : a) });
        toast("Update failed", "error");
      }
    } catch (err) {
      dispatch({ type: "SYNC_DATA", key: "admins", data: state.admins.map(a => a._id === id ? { ...a, status } : a) });
      toast("Update failed", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this admin?")) return;
    // Optimistic update — remove immediately
    const previous = state.admins;
    dispatch({ type: "SYNC_DATA", key: "admins", data: state.admins.filter(a => a._id !== id) });
    try {
      const res = await fetch(`${API_URLS.ADMINS}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${state.session.token}` }
      });
      if (res.ok) {
        toast("Admin deleted", "success");
      } else {
        // Revert on failure
        dispatch({ type: "SYNC_DATA", key: "admins", data: previous });
        toast("Delete failed", "error");
      }
    } catch (err) {
      dispatch({ type: "SYNC_DATA", key: "admins", data: previous });
      toast("Delete failed", "error");
    }
  };

  return (
    <Page title="Admin Management" subtitle="Invite and manage role-based admins"
      actions={<Btn onClick={() => setShowInvite(true)} variant="accent"><Icon name="plus" size={16} /> Invite Admin</Btn>}
    >
      <Table
        headers={["Name", "Email", "Role", "Status", "Actions"]}
        rows={state.admins.map(a => [
          a.name || "—", a.email, <Badge label={a.role} />, <Badge label={a.status} />,
          <div style={{ display: "flex", gap: 6 }}>
            <Btn onClick={() => handleToggle(a._id, a.status)} variant={a.status === "active" ? "danger" : "success"} small>
              {a.status === "active" ? "Disable" : "Activate"}
            </Btn>
            <Btn onClick={() => handleDelete(a._id)} variant="danger" small><Icon name="trash" size={14} /></Btn>
          </div>
        ])}
      />
      {showInvite && (
        <Modal title="Invite Admin" onClose={() => setShowInvite(false)}>
          <Input label="Admin Name" value={invName} onChange={setInvName} placeholder="e.g. John Doe" />
          <Input label="Admin Email" value={invEmail} onChange={setInvEmail} type="email" placeholder="admin@church.org" />
          <Input label="Assign Role" value={invRole} onChange={setInvRole} type="dropdown" options={["media_admin", "usher_admin", "leader", "finance_admin", "quality_control"]} />
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Btn onClick={() => setShowInvite(false)} variant="ghost">Cancel</Btn>
            <Btn onClick={handleInvite} variant="primary" disabled={sending}>
              <Icon name="send" size={14} /> {sending ? "Sending..." : "Send Invite"}
            </Btn>
          </div>
        </Modal>
      )}
    </Page>
  );
};

const CMSAttendance = ({ state }) => {
  const [selectedLog, setSelectedLog] = useState(null);

  // Group attendance records by event & date
  const groupedLogs = [];
  const groups = {};
  state.attendance.forEach(a => {
    const dStr = a.date ? (typeof a.date === "string" ? a.date.slice(0, 10) : new Date(a.date).toISOString().split('T')[0]) : "Unknown";
    const key = `${a.event_name}||${dStr}`;
    if (!groups[key]) {
      groups[key] = {
        event_name: a.event_name,
        date: dStr,
        present: 0,
        absent: 0,
        records: []
      };
      groupedLogs.push(groups[key]);
    }
    if (a.status === "present") groups[key].present++;
    else if (a.status === "absent") groups[key].absent++;
    groups[key].records.push(a);
  });
  groupedLogs.sort((a, b) => b.date.localeCompare(a.date) || a.event_name.localeCompare(b.event_name));

  return (
    <Page title="Attendance Records" subtitle="View all attendance logs">
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <StatCard label="Total Event Sheets" value={groupedLogs.length} icon="attendance" />
        <StatCard label="Present Today" value={state.attendance.filter(a => a.status === "present" && (typeof a.date === "string" ? a.date.slice(0, 10) : new Date(a.date).toISOString().slice(0, 10)) === new Date().toISOString().slice(0, 10)).length} icon="check" />
        <StatCard label="Absent Today" value={state.attendance.filter(a => a.status === "absent" && (typeof a.date === "string" ? a.date.slice(0, 10) : new Date(a.date).toISOString().slice(0, 10)) === new Date().toISOString().slice(0, 10)).length} icon="x" />
      </div>
      <Table
        headers={["Event Name", "Date", "Present", "Absent", "Total Marks"]}
        onRowClick={(i) => setSelectedLog(groupedLogs[i])}
        rows={groupedLogs.map(g => [
          g.event_name,
          new Date(g.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
          g.present,
          g.absent,
          g.present + g.absent
        ])}
      />
      {selectedLog && (
        <AttendanceDetailsModal
          eventLog={selectedLog}
          users={state.users}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </Page>
  );
};

const CMSMessages = ({ state }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const humanMessages = state.messages.filter(m => {
    const isHuman = m.type === "bulk" || m.type === "individual";
    const matchesSearch = !searchQuery ||
      (m.sender_name && m.sender_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.message && m.message.toLowerCase().includes(searchQuery.toLowerCase()));
    return isHuman && matchesSearch;
  });
  return (
    <Page title="Message Logs" subtitle="All messages sent by media admins"
      actions={
        <div style={{ minWidth: 200, maxWidth: 300, marginBottom: -16 }}>
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search messages..." />
        </div>
      }
    >
      {humanMessages.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 14, padding: 40, textAlign: "center", color: "#9ca3af", fontFamily: "'DM Sans', sans-serif" }}>No messages sent yet.</div>
      ) : humanMessages.map(m => (
        <div key={m.id} style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", marginBottom: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 36, height: 36, background: "#ede9fe", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="messages" size={16} />
              </div>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14, color: "#111827" }}>{m.sender_name}</div>
                <div style={{ fontSize: 12, color: "#6b7280", fontFamily: "'DM Sans', sans-serif" }}>To: <Badge label={m.target_group || m.target_type} /></div>
              </div>
            </div>
            <span style={{ fontSize: 12, color: "#9ca3af", fontFamily: "'DM Sans', sans-serif" }}>{new Date(m.created_at).toLocaleString()}</span>
          </div>
          <p style={{ margin: 0, color: "#374151", fontSize: 14, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>{m.message}</p>
        </div>
      ))}
    </Page>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// MEDIA ADMIN DASHBOARD
// ════════════════════════════════════════════════════════════════════════════════
const MediaDashboard = ({ state, dispatch, toast, admin }) => {
  const [active, setActive] = useState("compose");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [targetGroup, setTargetGroup] = useState("first_timer");
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [channels, setChannels] = useState({ push: true, email: true, sms: false });
  const [newReminder, setNewReminder] = useState({ name: "", day: "sunday", time: "09:00", message: "" });
  const [reminderTargets, setReminderTargets] = useState({ first_timer: true, member: false, worker: false });
  const [reminderChannels, setReminderChannels] = useState({ push: true, email: false, sms: false });
  
  const [churchEvents, setChurchEvents] = useState([]);

  const fetchEvents = async () => {
    try {
      const res = await fetch(API_URLS.WEBSITE_DATA);
      if (res.ok) {
        const data = await res.json();
        setChurchEvents(data.events || []);
      }
    } catch (e) {
      console.error("Failed to load events in MediaDashboard", e);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const nav = [
    { key: "compose", label: "Compose Message", icon: "messages" },
    { key: "history", label: "Message History", icon: "eye" },
    { key: "firsttimers", label: "First-Timers", icon: "users" },
    { key: "reminders", label: "Service Reminders", icon: "bell" },
  ];

  const firstTimers = state.users.filter(u => u.tag === "first_timer");
  const myMessages = state.messages.filter(m => m.sender === admin.id || m.sender_id === admin.id);
  const reminders = state.reminders || [];

  const handleSend = async () => {
    if (!message.trim()) return;
    const selectedChannels = Object.keys(channels).filter(k => channels[k]);
    if (selectedChannels.length === 0) return toast("Select at least one channel", "error");

    setSending(true);
    try {
      const res = await fetch(`${API_URLS.MESSAGES}/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.session.token}` },
        body: JSON.stringify({ message, channels: selectedChannels, subject: "Church Update", target_group: targetGroup, attendanceFilter })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          dispatch({ type: "SYNC_DATA", key: "messages", data: [data.message, ...state.messages] });
        }
        setMessage("");
        toast("Message sent successfully!", "success");
      } else {
        const err = await res.json();
        toast(err.error || "Send failed", "error");
      }
    } catch (err) { toast("Server connection failed", "error"); }
    finally { setSending(false); }
  };

  const handleCreateReminder = async () => {
    const selectedTargets = Object.keys(reminderTargets).filter(k => reminderTargets[k]);
    const selectedChannels = Object.keys(reminderChannels).filter(k => reminderChannels[k]);
    if (!newReminder.name || !newReminder.message) return toast("Name and message required", "error");
    if (!selectedTargets.length) return toast("Select at least one target", "error");
    if (!selectedChannels.length) return toast("Select at least one channel", "error");

    try {
      const res = await fetch(API_URLS.REMINDERS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.session.token}` },
        body: JSON.stringify({ ...newReminder, targets: selectedTargets, channels: selectedChannels })
      });
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: "SYNC_DATA", key: "reminders", data: [...reminders, data] });
        setNewReminder({ name: "", day: "sunday", time: "09:00", message: "" });
        toast("Reminder created!", "success");
      } else {
        const err = await res.json();
        toast(err.error || "Creation failed", "error");
      }
    } catch (err) { toast("Server connection failed", "error"); }
  };

  const toggleReminder = async (id) => {
    try {
      const res = await fetch(`${API_URLS.REMINDERS}/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${state.session.token}` }
      });
      if (res.ok) {
        const updated = await res.json();
        dispatch({ type: "SYNC_DATA", key: "reminders", data: reminders.map(r => r._id === id || r.id === id ? updated : r) });
        toast("Reminder toggled", "success");
      }
    } catch (err) { toast("Toggle failed", "error"); }
  };

  const deleteReminder = async (id) => {
    if (!confirm("Delete this reminder?")) return;
    try {
      const res = await fetch(`${API_URLS.REMINDERS}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${state.session.token}` }
      });
      if (res.ok) {
        dispatch({ type: "SYNC_DATA", key: "reminders", data: reminders.filter(r => r._id !== id && r.id !== id) });
        toast("Reminder deleted", "success");
      }
    } catch (err) { toast("Delete failed", "error"); }
  };

  const handleDeleteMessage = async (id) => {
    if (!confirm("Delete this message? It will be removed from all dashboards.")) return;
    try {
      const res = await fetch(`${API_URLS.MESSAGES}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${state.session.token}` }
      });
      if (res.ok) {
        dispatch({ type: "SYNC_DATA", key: "messages", data: state.messages.filter(m => m._id !== id && m.id !== id) });
        toast("Message deleted successfully", "success");
      } else {
        const err = await res.json();
        toast(err.error || "Delete failed", "error");
      }
    } catch (err) { toast("Delete failed", "error"); }
  };

  const selectedEventObj = churchEvents.find(e => e.title === targetGroup);
  const targetDaysArr = (selectedEventObj && selectedEventObj.eventDays && selectedEventObj.eventDays.trim()) 
    ? selectedEventObj.eventDays.split(",").map(d => d.trim()) 
    : [];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <Sidebar nav={nav} active={active} setActive={setActive} role="media_admin" adminName={admin?.name} onLogout={() => dispatch({ type: "LOGOUT" })} />
      <main style={{ marginLeft: 240, flex: 1 }}>
        {active === "add_user" && <UsherAddUser state={state} dispatch={dispatch} toast={toast} />}
        {active === "compose" && (
          <Page title="Send Message" subtitle="Broadcast a message">
            <div style={{ background: "#fff", borderRadius: 14, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", maxWidth: 600 }}>
              <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Target Audience</label>
                  <select value={targetGroup} onChange={e => { setTargetGroup(e.target.value); setAttendanceFilter("all"); }} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e5e7eb", outline: "none", fontFamily: "'DM Sans', sans-serif" }}>
                    <optgroup label="System Roles">
                      <option value="first_timer">First Timers</option>
                      <option value="member">Members</option>
                      <option value="worker">Workers</option>
                      <option value="all">All Users</option>
                    </optgroup>
                    {churchEvents.length > 0 && (
                      <optgroup label="Event Attendees">
                        {churchEvents.map(e => (
                          <option key={e.title} value={e.title}>{e.title}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
                {churchEvents.some(e => e.title === targetGroup) && (
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Attendance Filter</label>
                    <select value={attendanceFilter} onChange={e => setAttendanceFilter(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e5e7eb", outline: "none", fontFamily: "'DM Sans', sans-serif" }}>
                      <option value="all">All Registered</option>
                      <option value="perfect">Perfect Attendees (All Days)</option>
                      <option value="partial">Partial Attendees (Missed some days)</option>
                      <option value="absent">Absentees (Did not attend any day)</option>
                      {targetDaysArr.length > 0 && targetDaysArr.map(d => (
                        <optgroup key={d} label={d}>
                          <option value={`attended:${d}`}>Attended {d}</option>
                          <option value={`absent:${d}`}>Absent {d}</option>
                        </optgroup>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Channels</label>
                <div style={{ display: "flex", gap: 16 }}>
                  {["push", "email", "sms"].map(ch => (
                    <label key={ch} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
                      <input type="checkbox" checked={channels[ch]} onChange={e => setChannels(prev => ({ ...prev, [ch]: e.target.checked }))} />
                      {ch.charAt(0).toUpperCase() + ch.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
              <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Type your message here..."
                style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif", minHeight: 140, resize: "vertical", outline: "none" }}
              />
              <div style={{ marginTop: 16 }}>
                <Btn onClick={handleSend} variant="accent" disabled={sending || !message.trim()}>
                  <Icon name="send" size={16} /> {sending ? "Sending..." : "Send Broadcast"}
                </Btn>
              </div>
            </div>
          </Page>
        )}
        {active === "history" && (
          <Page title="Message History" subtitle="Messages you've sent">
            {myMessages.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 14, padding: 40, textAlign: "center", color: "#9ca3af", fontFamily: "'DM Sans', sans-serif" }}>No messages sent yet</div>
            ) : myMessages.map(m => (
              <div key={m.id} style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
                  <Badge label={m.target_group || "Unknown"} />
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#9ca3af", fontFamily: "'DM Sans', sans-serif" }}>{new Date(m.created_at).toLocaleString()}</span>
                    <button onClick={() => handleDeleteMessage(m.id || m._id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", padding: 4 }} title="Delete Message">
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>
                <p style={{ margin: 0, color: "#374151", fontSize: 14, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>{m.message}</p>
                <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280", fontFamily: "'DM Sans', sans-serif" }}>Channels: {(m.channels || []).join(", ")}</div>
              </div>
            ))}
          </Page>
        )}
        {active === "firsttimers" && (
          <Page title="First-Timers" subtitle={`${firstTimers.length} registered`}>
            <Table
              headers={["Name", "Email", "Phone", "Joined"]}
              rows={firstTimers.map(u => [u.full_name, u.email, u.phone, new Date(u.created_at).toLocaleDateString()])}
            />
          </Page>
        )}
        {active === "reminders" && (
          <Page title="Service Reminders" subtitle="Automated notifications">
            <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 300 }}>
                {reminders.length === 0 ? (
                  <div style={{ background: "#fff", borderRadius: 14, padding: 40, textAlign: "center", color: "#9ca3af", fontFamily: "'DM Sans', sans-serif" }}>No reminders created</div>
                ) : reminders.map(r => (
                  <div key={r.id || r._id} style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderLeft: `4px solid ${r.active ? '#10b981' : '#d1d5db'}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827", fontFamily: "'DM Sans', sans-serif" }}>{r.name}</h4>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => toggleReminder(r.id || r._id)} style={{ padding: "4px 8px", fontSize: 12, borderRadius: 4, border: "none", background: r.active ? "#ecfdf5" : "#f3f4f6", color: r.active ? "#059669" : "#6b7280", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{r.active ? "Active" : "Inactive"}</button>
                        <button onClick={() => deleteReminder(r.id || r._id)} style={{ padding: "4px 8px", fontSize: 12, borderRadius: 4, border: "none", background: "#fef2f2", color: "#ef4444", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Delete</button>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 12, fontSize: 13, color: "#4b5563", fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>
                      <span><strong>Day:</strong> {r.day}</span>
                      <span><strong>Time:</strong> {r.time}</span>
                    </div>
                    <p style={{ margin: "0 0 8px 0", color: "#374151", fontSize: 14, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>{r.message}</p>
                    <div style={{ fontSize: 12, color: "#6b7280", fontFamily: "'DM Sans', sans-serif" }}>
                      Targets: {(r.targets || []).join(", ")} | Channels: {(r.channels || []).join(", ")}
                    </div>
                  </div>
                ))}
              </div>
              <div className="reminder-form-card" style={{ width: 340, background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 700, color: "#111827", fontFamily: "'DM Sans', sans-serif" }}>Create Reminder</h3>
                <Input label="Reminder Name" value={newReminder.name} onChange={v => setNewReminder(prev => ({ ...prev, name: v }))} placeholder="e.g., Sunday Service" />
                <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Day</label>
                    <select value={newReminder.day} onChange={e => setNewReminder(prev => ({ ...prev, day: e.target.value }))} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #e5e7eb", outline: "none", fontFamily: "'DM Sans', sans-serif" }}>
                      {["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Input label="Time" type="time" value={newReminder.time} onChange={v => setNewReminder(prev => ({ ...prev, time: v }))} />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Targets</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 150, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 8, padding: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #f3f4f6", paddingBottom: 2, marginBottom: 4 }}>System Roles</div>
                    {["first_timer", "member", "worker"].map(t => (
                      <label key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                        <input type="checkbox" checked={!!reminderTargets[t]} onChange={e => setReminderTargets(prev => ({ ...prev, [t]: e.target.checked }))} /> {t.replace("_", " ")}
                      </label>
                    ))}
                    {churchEvents.length > 0 && (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #f3f4f6", paddingBottom: 2, marginTop: 8, marginBottom: 4 }}>Event Attendees</div>
                        {churchEvents.map(e => (
                          <label key={e.title} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                            <input type="checkbox" checked={!!reminderTargets[e.title]} onChange={el => setReminderTargets(prev => ({ ...prev, [e.title]: el.target.checked }))} /> {e.title}
                          </label>
                        ))}
                      </>
                    )}
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Channels</label>
                  {["push", "email", "sms"].map(ch => (
                    <label key={ch} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>
                      <input type="checkbox" checked={reminderChannels[ch]} onChange={e => setReminderChannels(prev => ({ ...prev, [ch]: e.target.checked }))} /> {ch}
                    </label>
                  ))}
                </div>
                <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Message</label>
                <textarea
                  value={newReminder.message}
                  onChange={e => setNewReminder(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Don't forget service is tomorrow!"
                  style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif", minHeight: 80, resize: "vertical", outline: "none", marginBottom: 16 }}
                />
                <Btn onClick={handleCreateReminder} variant="primary" style={{ width: "100%" }}>Save Reminder</Btn>
              </div>
            </div>
          </Page>
        )}
      </main>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// USHER ADMIN DASHBOARD
// ════════════════════════════════════════════════════════════════════════════════
const UsherAddUser = ({ state, dispatch, toast }) => {
  const [formType, setFormType] = useState("first_timer");
  const [values, setValues] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fields = (state.formFields[formType] || []).filter(f => {
    if (!f.active) return false;
    if (f.worker_only && values.role_type !== "Worker") return false;
    return true;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const missing = fields.filter(f => f.required && !values[f.field_key]);
    if (missing.length) return toast(`Missing required fields: ${missing.map(f => f.label).join(", ")}`, "error");
    // Format validation
    const emailField = fields.find(f => f.type === "email");
    if (emailField && values[emailField.field_key] && !isValidEmail(values[emailField.field_key]))
      return toast("Please enter a valid email address (e.g. john@example.com)", "error");
    const phoneField = fields.find(f => f.type === "tel" || f.field_key === "phone");
    if (phoneField && values[phoneField.field_key] && !isValidPhone(values[phoneField.field_key]))
      return toast("Please enter a valid phone number (e.g. +2348012345678)", "error");

    setSubmitting(true);
    try {
      const url = formType === "first_timer" ? API_URLS.REGISTER_FIRST_TIMER : API_URLS.REGISTER_MEMBER_WORKER;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      if (res.ok) {
        const responseData = await res.json();
        // Since Ushers might need to mark attendance for this new user, add to local state instantly.
        // We prepend responseData.user instead of responseData because backend returns { user, message }
        dispatch({ type: "SYNC_DATA", key: "users", data: [responseData.user, ...state.users] });
        setValues({});
        toast("User registered successfully!", "success");
      } else {
        const err = await res.json();
        toast(err.error || "Failed to register user", "error");
      }
    } catch (err) {
      toast("Server connection failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page title="Register User" subtitle="Manually add a new First Timer or Member/Worker">
      <div style={{ maxWidth: 600, background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <button type="button" onClick={() => { setFormType("first_timer"); setValues({}); }} style={{ flex: 1, padding: "12px 0", border: `2px solid ${formType === "first_timer" ? "#0B1F3B" : "#e5e7eb"}`, borderRadius: 10, background: formType === "first_timer" ? "#f8fafc" : "#fff", color: formType === "first_timer" ? "#0B1F3B" : "#9ca3af", fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all .2s" }}>
            First Timer
          </button>
          <button type="button" onClick={() => { setFormType("member_worker"); setValues({}); }} style={{ flex: 1, padding: "12px 0", border: `2px solid ${formType === "member_worker" ? "#0B1F3B" : "#e5e7eb"}`, borderRadius: 10, background: formType === "member_worker" ? "#f8fafc" : "#fff", color: formType === "member_worker" ? "#0B1F3B" : "#9ca3af", fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all .2s" }}>
            Member / Worker
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {fields.map(f => (
            <Input
              key={f.id || f._id} label={f.label} required={f.required}
              type={f.type}
              options={f.options}
              value={values[f.field_key] || ""}
              onChange={v => setValues(prev => ({ ...prev, [f.field_key]: v }))}
            />
          ))}
          <Btn type="submit" variant="primary" style={{ width: "100%", marginTop: 12 }} disabled={submitting}>
            {submitting ? "Registering..." : "Register User"}
          </Btn>
        </form>
      </div>
    </Page>
  );
};

const UsherDashboard = ({ state, dispatch, toast, admin }) => {
  const [active, setActive] = useState("mark");
  const [searchQuery, setSearchQuery] = useState("");
  const [eventName, setEventName] = useState("Sunday Service");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [viewUser, setViewUser] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showCreateLog, setShowCreateLog] = useState(false);
  const [newLogName, setNewLogName] = useState("Sunday Service");
  const [newLogDate, setNewLogDate] = useState(new Date().toISOString().split("T")[0]);

  const nav = [
    { key: "mark", label: "Mark Attendance", icon: "attendance" },
    { key: "history", label: "Attendance Logs", icon: "eye" },
    { key: "members", label: "Members & Workers", icon: "users" },
    { key: "add_user", label: "Register User", icon: "admins" },
    { key: "event_regs", label: "Event Registrations", icon: "forms" },
  ];

  const eligible = state.users.filter(u => {
    const isEligible = u.tag === "member" || u.tag === "worker";
    const matchesSearch = !searchQuery ||
      (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase()));
    return isEligible && matchesSearch;
  });
  const currentMarked = state.attendance.filter(a => {
    const aDate = a.date ? (typeof a.date === "string" ? a.date.slice(0, 10) : new Date(a.date).toISOString().slice(0, 10)) : "";
    return aDate === date && a.event_name === eventName;
  });
  const isMarked = (uid) => currentMarked.find(a => a.user_id === uid);

  const handleMark = async (uid, status) => {
    try {
      const res = await fetch(API_URLS.ATTENDANCE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.session.token}`
        },
        body: JSON.stringify({ user_id: uid, event_name: eventName, status, date })
      });
      if (res.ok) {
        const data = await res.json();
        const filtered = state.attendance.filter(a => (a._id || a.id) !== (data._id || data.id));
        dispatch({ type: "SYNC_DATA", key: "attendance", data: [...filtered, data] });
        toast(`Marked ${status}`, "success");
      } else {
        toast("Failed to update attendance", "error");
      }
    } catch (err) {
      toast("Server connection failed", "error");
    }
  };

  const handleCreateLog = () => {
    setEventName(newLogName);
    setDate(newLogDate);
    setShowCreateLog(false);
    setActive("mark");
    toast(`Attendance sheet ready for "${newLogName}"`, "success");
  };

  // Group attendance records by event & date
  const groupedLogs = [];
  const groups = {};
  state.attendance.forEach(a => {
    const dStr = a.date ? (typeof a.date === "string" ? a.date.slice(0, 10) : new Date(a.date).toISOString().slice(0, 10)) : "Unknown";
    const key = `${a.event_name}||${dStr}`;
    if (!groups[key]) {
      groups[key] = { event_name: a.event_name, date: dStr, present: 0, absent: 0, records: [] };
      groupedLogs.push(groups[key]);
    }
    if (a.status === "present") groups[key].present++;
    groups[key].records.push(a);
  });
  // Calculate absent based on current eligible members (since unmarked = absent)
  groupedLogs.forEach(g => {
    g.absent = Math.max(0, eligible.length - g.present);
  });
  groupedLogs.sort((a, b) => b.date.localeCompare(a.date) || a.event_name.localeCompare(b.event_name));

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <Sidebar nav={nav} active={active} setActive={setActive} role="usher_admin" adminName={admin?.name} onLogout={() => dispatch({ type: "LOGOUT" })} />
      <main style={{ marginLeft: 240, flex: 1 }}>
        {active === "mark" && (
          <Page title="Mark Attendance" actions={<div style={{ minWidth: 200, maxWidth: 300, marginBottom: -16 }}><SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search members..." /></div>}>
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <Input label="Event Name" value={eventName} onChange={setEventName} />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <Input label="Date" value={date} onChange={setDate} type="date" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <StatCard label="Present" value={currentMarked.filter(a => a.status === "present").length} icon="check" />
              <StatCard label="Absent (Default)" value={Math.max(0, eligible.length - currentMarked.filter(a => a.status === "present").length)} icon="x" />
            </div>
            <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
              {eligible.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontFamily: "'DM Sans', sans-serif" }}>No members or workers found</div>
              ) : eligible.map((u, i) => {
                const mark = isMarked(u.id);
                const isPresent = mark?.status === "present";
                const isAbsent = !isPresent; // Default to absent
                return (
                  <div key={u.id} style={{
                    display: "flex", alignItems: "center", padding: "14px 20px",
                    borderBottom: i < eligible.length - 1 ? "1px solid #f3f4f6" : "none", gap: 14,
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#f0f4ff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: "#0B1F3B", flexShrink: 0 }}>
                      {u.full_name ? u.full_name[0] : "?"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, color: "#111827" }}>{u.full_name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", fontFamily: "'DM Sans', sans-serif" }}>{u.tag} {u.department ? `· ${u.department}` : ""}</div>
                    </div>
                    <Badge label={isAbsent ? "absent" : "present"} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn onClick={() => handleMark(u.id, "present")} variant={isPresent ? "success" : "ghost"} small>
                        <Icon name="check" size={14} /> Present
                      </Btn>
                      <Btn onClick={() => handleMark(u.id, "absent")} variant={isAbsent ? "danger" : "ghost"} small>
                        <Icon name="x" size={14} /> Absent
                      </Btn>
                    </div>
                  </div>
                );
              })}
            </div>
          </Page>
        )}

        {active === "history" && (
          <Page
            title="Attendance Logs"
            subtitle={`${groupedLogs.length} event log${groupedLogs.length !== 1 ? "s" : ""}`}
            actions={
              <Btn onClick={() => { setNewLogName("Sunday Service"); setNewLogDate(new Date().toISOString().split("T")[0]); setShowCreateLog(true); }} variant="primary" small>
                <Icon name="plus" size={14} /> Create New Log
              </Btn>
            }
          >
            <Table
              headers={["Event Name", "Date", "Present", "Absent", "Total"]}
              onRowClick={(i) => setSelectedLog(groupedLogs[i])}
              rows={groupedLogs.map(g => [
                g.event_name,
                new Date(g.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
                <span style={{ color: "#047857", fontWeight: 700 }}>{g.present}</span>,
                <span style={{ color: "#b91c1c", fontWeight: 700 }}>{g.absent}</span>,
                g.present + g.absent
              ])}
            />
          </Page>
        )}

        {active === "members" && (
          <Page title="Members & Workers" subtitle={`${eligible.length} registered`} actions={<div style={{ minWidth: 200, maxWidth: 300, marginBottom: -16 }}><SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search members..." /></div>}>
            <Table
              headers={["Name", "Email", "Phone", "Role", "Department"]}
              onRowClick={(i) => setViewUser(eligible[i])}
              rows={eligible.map(u => [u.full_name, u.email, u.phone, <Badge label={u.tag} />, u.department || "—"])}
            />
          </Page>
        )}

        {active === "add_user" && <UsherAddUser state={state} dispatch={dispatch} toast={toast} />}
        {active === "event_regs" && <CMSEventRegistrations state={state} toast={toast} />}
      </main>

      {/* Create New Log Modal */}
      {showCreateLog && (
        <Modal title="Create New Attendance Log" onClose={() => setShowCreateLog(false)}>
          <p style={{ margin: "0 0 16px", color: "#6b7280", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
            Set the event details and start marking attendance for a new session.
          </p>
          <Input label="Event Name" value={newLogName} onChange={setNewLogName} placeholder="e.g. Midweek Praise" />
          <Input label="Date" value={newLogDate} onChange={setNewLogDate} type="date" />
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Btn onClick={() => setShowCreateLog(false)} variant="ghost">Cancel</Btn>
            <Btn onClick={handleCreateLog} variant="primary" disabled={!newLogName.trim()}>Start Marking</Btn>
          </div>
        </Modal>
      )}

      {/* Attendance Log Details Modal */}
      {selectedLog && (
        <AttendanceDetailsModal
          eventLog={selectedLog}
          users={state.users}
          onClose={() => setSelectedLog(null)}
          onEdit={() => {
            setEventName(selectedLog.event_name);
            setDate(selectedLog.date);
            setSelectedLog(null);
            setActive("mark");
          }}
        />
      )}

      {/* Member/Worker Profile Modal */}
      {viewUser && (
        <UserDetailsModal user={viewUser} onClose={() => setViewUser(null)} />
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// HELPER: MONTHLY LEDGER
// ════════════════════════════════════════════════════════════════════════════════
const processMonthlyLedger = (logs, searchQuery = "") => {
  const allSortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
  const monthlyLedger = [];
  let runningBalance = 0;

  allSortedLogs.forEach(l => {
    const d = new Date(l.date);
    const monthKey = `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;

    let monthGroup = monthlyLedger.find(m => m.month === monthKey);
    if (!monthGroup) {
      monthGroup = {
        month: monthKey,
        openingBalance: runningBalance,
        totalIncome: 0,
        totalExpense: 0,
        transactions: []
      };
      monthlyLedger.push(monthGroup);
    }

    if (!l.voided) {
      if (l.type === "income") monthGroup.totalIncome += l.amount;
      else if (l.type === "expense") monthGroup.totalExpense += l.amount;
    }

    monthGroup.transactions.push(l);

    if (!l.voided) {
      if (l.type === "income") runningBalance += l.amount;
      else if (l.type === "expense") runningBalance -= l.amount;
    }
  });

  monthlyLedger.forEach(m => {
    m.closingBalance = m.openingBalance + m.totalIncome - m.totalExpense;
    m.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  });
  monthlyLedger.reverse();

  return monthlyLedger.map(m => ({
    ...m,
    transactions: m.transactions.filter(l => {
      const matchesSearch = !searchQuery ||
        (l.category && l.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (l.description && l.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (l.logged_by_name && l.logged_by_name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    })
  })).filter(m => m.transactions.length > 0);
};

const printFinancialReport = (logs, toast) => {
  if (logs.length === 0) return toast("No logs available to print", "error");
  const monthlyLedger = processMonthlyLedger(logs);

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to print the report");
    return;
  }

  const churchName = import.meta.env.VITE_CHURCH_NAME || "Church";
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  let rowsHtml = "";
  monthlyLedger.forEach(m => {
    rowsHtml += `
      <tr style="background: #f8fafc;">
        <td colspan="7" style="padding: 10px 12px; font-weight: 800; color: #0b1f3b;">
          ${m.month} <span style="float: right;">Opening Balance: ₦${m.openingBalance.toLocaleString()}</span>
        </td>
      </tr>
    `;

    m.transactions.forEach(l => {
      const typeColor = l.type === "income" ? "#047857" : "#b91c1c";
      rowsHtml += `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px; font-size: 13px; color: #4b5563;">${new Date(l.date).toLocaleDateString()}</td>
          <td style="padding: 10px; font-size: 13px; font-weight: 700; color: ${typeColor}; text-transform: uppercase;">${l.type}</td>
          <td style="padding: 10px; font-size: 13px; color: #111827;">${l.category}</td>
          <td style="padding: 10px; font-size: 13px; font-weight: 600; color: ${typeColor};">₦${l.amount.toLocaleString()}</td>
          <td style="padding: 10px; font-size: 13px; color: #4b5563;">${l.description || "—"}</td>
          <td style="padding: 10px; font-size: 13px; color: #4b5563;">${l.logged_by_name}</td>
          <td style="padding: 10px; font-size: 12px; color: #6b7280;">${l.acknowledgements ? l.acknowledgements.map(a => a.leader_name).join("<br>") : ""}</td>
        </tr>
      `;
    });

    rowsHtml += `
      <tr>
        <td colspan="7" style="padding: 12px; font-weight: 700; font-size: 13px; border-bottom: 2px solid #0b1f3b;">
          Monthly Totals: <span style="color: #047857;">Income: +₦${m.totalIncome.toLocaleString()}</span> | 
          <span style="color: #b91c1c;">Expense: -₦${m.totalExpense.toLocaleString()}</span>
          <span style="float: right; font-weight: 800; font-size: 14px;">Closing Balance: ₦${m.closingBalance.toLocaleString()}</span>
        </td>
      </tr>
      <tr><td colspan="7" style="height: 20px;"></td></tr>
    `;
  });

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${churchName} - Financial Report</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; margin: 0; }
        .header { border-bottom: 2px solid #111827; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: 800; margin: 0 0 8px 0; color: #0b1f3b; }
        .meta { font-size: 14px; color: #4b5563; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #f1f5f9; padding: 12px 10px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; text-align: left; border-bottom: 2px solid #cbd5e1; }
        @media print { body { padding: 20px; } tr { page-break-inside: avoid; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${churchName} - Financial Audit Report</div>
        <div class="meta">Generated: <strong>${dateStr}</strong></div>
      </div>
      <table>
        <thead>
          <tr><th>Date</th><th>Type</th><th>Section</th><th>Amount</th><th>Description</th><th>Logged By</th><th>Acknowledgements</th></tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };</script>
    </body>
    </html>
  `;
  printWindow.document.write(printContent);
  printWindow.document.close();
};

// ════════════════════════════════════════════════════════════════════════════════
// LEADER DASHBOARD (VIEW ONLY)
// ════════════════════════════════════════════════════════════════════════════════
const LeaderDashboard = ({ state, dispatch, admin, toast }) => {
  const [active, setActive] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilterTag, setUserFilterTag] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [viewUser, setViewUser] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const sessionStartTime = useRef(Date.now()); // Capture the exact timestamp when this session starts
  const [recentReviews, setRecentReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [overviewTab, setOverviewTab] = useState("recent_activity");
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [viewedActivities, setViewedActivities] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("leader_viewed_activities") || "[]");
    } catch {
      return [];
    }
  });

  const handleMarkActivityViewed = (key) => {
    const updated = [...viewedActivities, key];
    setViewedActivities(updated);
    localStorage.setItem("leader_viewed_activities", JSON.stringify(updated));
  };

  const nav = [
    { key: "overview", label: "Overview", icon: "dashboard" },
    { key: "users", label: "Users", icon: "users" },
    { key: "attendance", label: "Attendance", icon: "attendance" },
    { key: "messages", label: "Message Logs", icon: "messages" },
    { key: "financial_review", label: "Financial Review", icon: "forms" },
    { key: "approvals", label: "Approvals Center", icon: "check" },
    { key: "service_reviews", label: "Service Reviews", icon: "forms" },
  ];

  const fetchRecentReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`${API_URLS.SERVICE_REVIEWS}?limit=3&page=1`);
      if (res.ok) {
        const data = await res.json();
        setRecentReviews(data.reviews || []);
      }
    } catch (err) {
      console.error("Failed to load reviews for leader dashboard", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (active === "overview") {
      fetchRecentReviews();
    }
  }, [active]);

  const firstTimers = state.users.filter(u => u.tag === "first_timer").length;
  const members = state.users.filter(u => u.tag === "member").length;
  const workers = state.users.filter(u => u.tag === "worker").length;

  const filteredUsers = state.users.filter(u => {
    const matchesTag = userFilterTag === "all" || u.tag === userFilterTag;
    const matchesSearch = !searchQuery ||
      (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.tag && u.tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTag && matchesSearch;
  });

  // Filter messages: only show messages created during/after the current session start
  const newMessages = state.messages.filter(m => new Date(m.created_at).getTime() > sessionStartTime.current);

  const logs = state.financial || [];
  const salaries = state.salaries || [];
  const fundRequests = state.fundRequests || [];

  // Financial calculations
  const totalIncome = logs.filter(l => l.type === "income").reduce((sum, l) => sum + l.amount, 0);
  const totalExpense = logs.filter(l => l.type === "expense").reduce((sum, l) => sum + l.amount, 0);
  const balance = totalIncome - totalExpense;
  const monthlyLedger = processMonthlyLedger(logs, searchQuery);

  // Pending counts
  const pendingLedgerAcks = logs.filter(l => !l.acknowledgements || !l.acknowledgements.some(ack => ack.leader_id === admin.id)).length;
  const pendingSalaryAcks = salaries.filter(s => !s.acknowledgements || !s.acknowledgements.some(ack => ack.leader_id === admin.id)).length;
  const pendingFundReqs = fundRequests.filter(r => r.status === "pending").length;

  const handleAcknowledge = async (id) => {
    try {
      const res = await fetch(`${API_URLS.FINANCIAL}/${id}/acknowledge`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${state.session.token}` }
      });
      if (res.ok) {
        const updated = await res.json();
        dispatch({ type: "SYNC_DATA", key: "financial", data: logs.map(l => (l._id === id || l.id === id) ? updated : l) });
        toast("Transaction acknowledged successfully!", "success");
      } else {
        const err = await res.json();
        toast(err.error || "Acknowledge failed", "error");
      }
    } catch (err) {
      toast("Acknowledge failed", "error");
    }
  };

  const handleAcknowledgeSalary = async (id) => {
    try {
      const res = await fetch(`${API_URLS.FINANCIAL_SALARIES}/${id}/acknowledge`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${state.session.token}` }
      });
      if (res.ok) {
        const updated = await res.json();
        dispatch({ type: "SYNC_DATA", key: "salaries", data: salaries.map(s => (s._id === id || s.id === id) ? updated : s) });
        toast("Salary payout acknowledged successfully!", "success");
      } else {
        const err = await res.json();
        toast(err.error || "Acknowledge failed", "error");
      }
    } catch (err) {
      toast("Acknowledge failed", "error");
    }
  };

  const handleResolveFundRequest = async (id, status) => {
    let reason = "";
    if (status === "rejected") {
      reason = prompt("Please enter the reason for rejecting this fund request:");
      if (reason === null) return; // User cancelled
      if (!reason.trim()) return toast("Rejection reason is required", "error");
    }

    try {
      const res = await fetch(`${API_URLS.FINANCIAL_FUND_REQUESTS}/${id}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.session.token}`
        },
        body: JSON.stringify({ status, rejection_reason: reason.trim() })
      });
      if (res.ok) {
        const updated = await res.json();
        dispatch({ type: "SYNC_DATA", key: "fundRequests", data: fundRequests.map(r => (r._id === id || r.id === id) ? updated : r) });
        toast(`Fund request ${status} successfully!`, "success");
        // Re-fetch ledger to sync any auto-created expense
        const ledgerRes = await fetch(API_URLS.FINANCIAL);
        if (ledgerRes.ok) {
          const ledgerData = await ledgerRes.json();
          dispatch({ type: "SYNC_DATA", key: "financial", data: ledgerData });
        }
      } else {
        const err = await res.json();
        toast(err.error || "Action failed", "error");
      }
    } catch (err) {
      toast("Server connection failed", "error");
    }
  };

  const handlePrintFinancial = () => printFinancialReport(logs, toast);

  // Group attendance records by event & date
  const groupedLogs = [];
  const groups = {};
  state.attendance.forEach(a => {
    const dStr = a.date ? (typeof a.date === "string" ? a.date.slice(0, 10) : new Date(a.date).toISOString().split('T')[0]) : "Unknown";
    const key = `${a.event_name}||${dStr}`;
    if (!groups[key]) {
      groups[key] = { event_name: a.event_name, date: dStr, present: 0, absent: 0, records: [] };
      groupedLogs.push(groups[key]);
    }
    if (a.status === "present") groups[key].present++;
    else if (a.status === "absent") groups[key].absent++;
    groups[key].records.push(a);
  });
  groupedLogs.sort((a, b) => b.date.localeCompare(a.date) || a.event_name.localeCompare(b.event_name));

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <Sidebar nav={nav} active={active} setActive={setActive} role="leader" adminName={admin?.name} onLogout={() => dispatch({ type: "LOGOUT" })} />
      <main style={{ marginLeft: 240, flex: 1, minHeight: "100vh" }}>
        {active === "add_user" && <UsherAddUser state={state} dispatch={dispatch} toast={toast} />}
        {active === "overview" && (
          <Page title="Church Overview" subtitle="Read-only system overview">
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 16px", marginBottom: 20, fontSize: 13, color: "#92400e", fontFamily: "'DM Sans', sans-serif" }}>
              You have view-only access. No edits can be made from this dashboard.
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
              <StatCard label="Total Users" value={state.users.length} icon="users" accent onClick={() => { setActive("users"); setUserFilterTag("all"); }} />
              <StatCard label="First-Timers" value={firstTimers} icon="bell" onClick={() => { setActive("users"); setUserFilterTag("first_timer"); }} />
              <StatCard label="Members" value={members} icon="users" onClick={() => { setActive("users"); setUserFilterTag("member"); }} />
              <StatCard label="Workers" value={workers} icon="church" onClick={() => { setActive("users"); setUserFilterTag("worker"); }} />
              <StatCard label="Total Messages" value={state.messages.filter(m => new Date(m.created_at).getTime() > sessionStartTime.current).length} icon="messages" onClick={() => setActive("messages")} />
              <StatCard label="Attendance Sheets" value={groupedLogs.length} icon="attendance" onClick={() => setActive("attendance")} />
            </div>

            {(() => {
              const allActivities = [];
              state.users.forEach(u => {
                const uKey = `reg-${u.id || u._id}`;
                allActivities.push({
                  key: uKey,
                  type: "registration",
                  title: `New User: ${u.full_name}`,
                  subtitle: `${u.tag.replace('_', ' ')}` + (u.department ? ` • ${u.department}` : ""),
                  date: new Date(u.created_at),
                  icon: "users",
                  color: "#3b82f6"
                });
              });
              groupedLogs.forEach(g => {
                const aKey = `att-${g.event_name}-${g.date}`;
                allActivities.push({
                  key: aKey,
                  type: "attendance",
                  title: `Attendance Marked: ${g.event_name}`,
                  subtitle: `Present: ${g.present} • Absent: ${g.absent}`,
                  date: new Date(g.date),
                  icon: "attendance",
                  color: "#10b981"
                });
              });
              logs.forEach(l => {
                const fKey = `fin-${l.id || l._id}`;
                allActivities.push({
                  key: fKey,
                  type: "financial",
                  title: `Finance Log: ${l.category}`,
                  subtitle: `${l.type.toUpperCase()} • ₦${l.amount.toLocaleString()} (${l.description || 'No notes'})`,
                  date: new Date(l.date),
                  icon: "forms",
                  color: l.type === "income" ? "#059669" : "#dc2626"
                });
              });

              // Filter unviewed only
              const unreadActivities = allActivities.filter(act => !viewedActivities.includes(act.key));
              unreadActivities.sort((a, b) => b.date - a.date);
              const recentActivities = unreadActivities.slice(0, 8);

              // Filter unread QC Reviews
              const unreadReviews = recentReviews.filter(r => !viewedActivities.includes(`rev-${r._id || r.id}`));

              return (
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", gap: 24, borderBottom: "2px solid #f1f5f9", marginBottom: 20, paddingBottom: 10, flexWrap: "wrap" }}>
                    <button
                      onClick={() => setOverviewTab("recent_activity")}
                      style={{
                        background: "none", border: "none", padding: "0 0 8px 0",
                        fontWeight: 700, fontSize: 15, cursor: "pointer",
                        color: overviewTab === "recent_activity" ? "#0B1F3B" : "#94a3b8",
                        borderBottom: overviewTab === "recent_activity" ? "3px solid #0B1F3B" : "3px solid transparent",
                        transition: "all .15s"
                      }}
                    >
                      Recent Activities Feed ({unreadActivities.length})
                    </button>
                    <button
                      onClick={() => setOverviewTab("qc_reviews")}
                      style={{
                        background: "none", border: "none", padding: "0 0 8px 0",
                        fontWeight: 700, fontSize: 15, cursor: "pointer",
                        color: overviewTab === "qc_reviews" ? "#0B1F3B" : "#94a3b8",
                        borderBottom: overviewTab === "qc_reviews" ? "3px solid #0B1F3B" : "3px solid transparent",
                        transition: "all .15s"
                      }}
                    >
                      QC Service Reviews ({unreadReviews.length})
                    </button>
                  </div>

                  {overviewTab === "recent_activity" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {recentActivities.length === 0 ? (
                        <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>No new activities.</div>
                      ) : (
                        recentActivities.map((act) => (
                          <div key={act.key} onClick={() => setSelectedActivity(act)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", border: "1px solid #f1f5f9", borderRadius: 12, background: "#f8fafc", cursor: "pointer", transition: "all .15s" }}>
                            <div style={{ background: act.color + "15", color: act.color, borderRadius: 10, padding: 8, display: "flex", flexShrink: 0 }}>
                              <Icon name={act.icon} size={18} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", fontFamily: "'DM Sans', sans-serif" }}>{act.title}</div>
                              <div style={{ fontSize: 12, color: "#64748b", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{act.subtitle}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}>
                                {act.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div>
                      {reviewsLoading ? (
                        <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Loading QC reviews...</div>
                      ) : unreadReviews.length === 0 ? (
                        <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>No unread service reviews.</div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {unreadReviews.map((r, i) => {
                            const rKey = `rev-${r._id || r.id}`;
                            const rating = r.overall_average || r.overall_rating || 0;
                            const ratingColor = rating >= 8 ? "#10b981" : rating >= 5 ? "#f59e0b" : "#ef4444";
                            return (
                              <div key={rKey} style={{ border: "1px solid #f1f5f9", borderRadius: 12, padding: 16, background: "#f8fafc", display: "flex", flexDirection: "column", gap: 8 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                                  <span style={{ fontWeight: 700, color: "#1e293b", textTransform: "capitalize", fontSize: 14 }}>
                                    {r.service_type?.replace(/_/g, " ")}
                                  </span>
                                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <span style={{ fontSize: 12, color: "#64748b" }}>
                                      {r.service_date ? new Date(r.service_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                                    </span>
                                    <span style={{ background: ratingColor, color: "#fff", padding: "2px 8px", borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                                      ★ {rating.toFixed(1)}/10
                                    </span>
                                    <button
                                      onClick={() => handleMarkActivityViewed(rKey)}
                                      style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4, display: "flex" }}
                                      title="Dismiss"
                                    >
                                      <Icon name="x" size={14} />
                                    </button>
                                  </div>
                                </div>
                                {r.highlight && (
                                  <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
                                    <strong>Highlight:</strong> {r.highlight}
                                  </p>
                                )}
                                {r.improvement_suggestions && (
                                  <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
                                    <strong>Suggestions:</strong> {r.improvement_suggestions}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                          <div style={{ textAlign: "right", marginTop: 8 }}>
                            <button onClick={() => setActive("service_reviews")} style={{ background: "none", border: "none", color: "#6366f1", fontWeight: 700, fontSize: 13, cursor: "pointer", padding: 0 }}>
                              View all detailed reviews →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </Page>
        )}

        {selectedActivity && selectedActivity.type === "registration" && (
          <UserDetailsModal 
            user={state.users.find(u => `reg-${u.id || u._id}` === selectedActivity.key)} 
            onClose={() => { handleMarkActivityViewed(selectedActivity.key); setSelectedActivity(null); }} 
          />
        )}
        {selectedActivity && selectedActivity.type === "attendance" && (
          <AttendanceDetailsModal 
            eventLog={groupedLogs.find(g => `att-${g.event_name}-${g.date}` === selectedActivity.key)} 
            users={state.users} 
            onClose={() => { handleMarkActivityViewed(selectedActivity.key); setSelectedActivity(null); }} 
          />
        )}
        {selectedActivity && selectedActivity.type === "financial" && (
          <Modal title="Financial Log Details" onClose={() => { handleMarkActivityViewed(selectedActivity.key); setSelectedActivity(null); }}>
            <div style={{ padding: "10px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid #e5e7eb", paddingBottom: 16, marginBottom: 16 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%", background: selectedActivity.color + "15", color: selectedActivity.color,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <Icon name="forms" size={24} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0B1F3B", fontFamily: "'DM Sans', sans-serif" }}>{selectedActivity.title}</h4>
                  <div style={{ fontSize: 14, color: "#6b7280", fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>
                    {selectedActivity.subtitle}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <Btn onClick={() => { handleMarkActivityViewed(selectedActivity.key); setSelectedActivity(null); }} variant="ghost">Close</Btn>
              </div>
            </div>
          </Modal>
        )}

        {active === "users" && (
          <Page
            title={userFilterTag === "all" ? "All Users" : userFilterTag === "first_timer" ? "First-Timers" : userFilterTag === "member" ? "Members" : "Workers"}
            subtitle={`View only · ${filteredUsers.length} record${filteredUsers.length !== 1 ? "s" : ""}`}
            actions={<div style={{ minWidth: 200, maxWidth: 300, marginBottom: -16 }}><SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search users..." /></div>}
          >
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {[
                { key: "all", label: "All Users" },
                { key: "first_timer", label: "First-Timers" },
                { key: "member", label: "Members" },
                { key: "worker", label: "Workers" },
              ].map(f => (
                <button key={f.key} onClick={() => setUserFilterTag(f.key)} style={{
                  padding: "6px 14px", borderRadius: 99, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
                  background: userFilterTag === f.key ? "#6366f1" : "#f3f4f6",
                  color: userFilterTag === f.key ? "#fff" : "#374151",
                  transition: "all 0.15s"
                }}>{f.label}</button>
              ))}
            </div>
            <Table
              headers={["Name", "Email", "Phone", "Tag", "Department", "Joined"]}
              onRowClick={(i) => setViewUser(filteredUsers[i])}
              rows={filteredUsers.map(u => [u.full_name, u.email, u.phone, <Badge label={u.tag} />, u.department || "—", new Date(u.created_at).toLocaleDateString()])}
            />
          </Page>
        )}
        {active === "attendance" && (
          <Page title="Attendance Records">
            <Table
              headers={["Event Name", "Date", "Present", "Absent", "Total Marks"]}
              onRowClick={(i) => setSelectedLog(groupedLogs[i])}
              rows={groupedLogs.map(g => [
                g.event_name,
                new Date(g.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
                <span style={{ color: "#047857", fontWeight: 700 }}>{g.present}</span>,
                <span style={{ color: "#b91c1c", fontWeight: 700 }}>{g.absent}</span>,
                g.present + g.absent
              ])}
            />
          </Page>
        )}
        {active === "messages" && (
          <Page title="Message Logs" subtitle="Only messages received during this session are shown.">
            {newMessages.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 14, padding: 40, textAlign: "center", color: "#9ca3af", fontFamily: "'DM Sans', sans-serif" }}>No messages received in this session.</div>
            ) : newMessages.map(m => (
              <div key={m.id} style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14 }}>{m.sender_name}</span>
                  <span style={{ fontSize: 12, color: "#9ca3af", fontFamily: "'DM Sans', sans-serif" }}>{new Date(m.created_at).toLocaleString()}</span>
                </div>
                <p style={{ margin: 0, color: "#374151", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>{m.message}</p>
              </div>
            ))}
          </Page>
        )}

        {/* VIEW 5: FINANCIAL REVIEW (READ-ONLY WITH GRAPHS) */}
        {active === "financial_review" && (
          <Page title="Financial Audit Logs" subtitle="Review financial trends and history" actions={<Btn onClick={handlePrintFinancial} variant="accent"><Icon name="print" size={16} /> Print Report (PDF)</Btn>}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 24 }}>
              <StatCard label="Total Income" value={`₦${totalIncome.toLocaleString()}`} icon="check" />
              <StatCard label="Total Expenses" value={`₦${totalExpense.toLocaleString()}`} icon="x" />
              <StatCard label="Net Balance" value={`₦${balance.toLocaleString()}`} icon="dashboard" accent />
            </div>

            <FinancialCharts logs={logs} />

            <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflowX: "auto", marginTop: 24 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Section</th>
                    <th style={thStyle}>Amount</th>
                    <th style={thStyle}>Description</th>
                    <th style={thStyle}>Logged By</th>
                    <th style={thStyle}>Acks</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyLedger.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>No transactions logged.</td></tr>
                  ) : monthlyLedger.map((m) => (
                    <Fragment key={m.month}>
                      <tr style={{ background: "#f3f4f6", borderBottom: "1px solid #e5e7eb" }}>
                        <td colSpan={7} style={{ padding: "12px 18px", fontWeight: 700, color: "#111827", fontFamily: "'DM Sans',sans-serif" }}>
                          {m.month} <span style={{ marginLeft: 16, fontSize: 13, color: "#6b7280", fontWeight: 600 }}>Opening Balance: ₦{m.openingBalance.toLocaleString()}</span>
                        </td>
                      </tr>
                      {m.transactions.map((l) => (
                        <tr key={l.id || l._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td style={tdStyle}>{new Date(l.date).toLocaleDateString()}</td>
                          <td style={tdStyle}><Badge label={l.type} /></td>
                          <td style={tdStyle}>{l.category}</td>
                          <td style={{ ...tdStyle, fontWeight: 700, color: l.type === "income" ? "#059669" : "#dc2626" }}>
                            {l.type === "income" ? "+" : "-"}₦{l.amount.toLocaleString()}
                          </td>
                          <td style={tdStyle}>{l.description || "N/A"}</td>
                          <td style={tdStyle}>{l.logged_by_name}</td>
                          <td style={tdStyle}>
                            <span style={{ fontSize: 12, color: "#6b7280", fontFamily: "'DM Sans', sans-serif" }}>
                              {l.acknowledgements && l.acknowledgements.length > 0 ? (
                                <span title={l.acknowledgements.map(a => a.leader_name).join(", ")} style={{ color: "#059669", fontWeight: 600 }}>
                                  ✓ Acked ({l.acknowledgements.length})
                                </span>
                              ) : "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))}
                      <tr style={{ background: "#f8fafc", borderBottom: "3px solid #e5e7eb" }}>
                        <td colSpan={3} style={{ padding: "12px 18px", fontWeight: 600, color: "#4b5563", fontFamily: "'DM Sans',sans-serif", textAlign: "right" }}>Monthly Totals:</td>
                        <td style={{ padding: "12px 18px", fontWeight: 700, color: "#059669", fontFamily: "'DM Sans',sans-serif" }}>+₦{m.totalIncome.toLocaleString()}</td>
                        <td style={{ padding: "12px 18px", fontWeight: 700, color: "#dc2626", fontFamily: "'DM Sans',sans-serif" }}>-₦{m.totalExpense.toLocaleString()}</td>
                        <td colSpan={2} style={{ padding: "12px 18px", fontWeight: 700, color: "#111827", fontFamily: "'DM Sans',sans-serif" }}>
                          Closing Balance: <span style={{ color: m.closingBalance >= 0 ? "#059669" : "#dc2626" }}>₦{m.closingBalance.toLocaleString()}</span>
                        </td>
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </Page>
        )}

        {/* VIEW 6: APPROVALS & ACKNOWLEDGEMENTS CENTER */}
        {active === "approvals" && (
          <Page title="Leader Approvals & Acknowledgements" subtitle="Approve fund requests and acknowledge transactions">
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
              <StatCard label="Pending Ledger Acks" value={pendingLedgerAcks} icon="dashboard" />
              <StatCard label="Pending Salary Acks" value={pendingSalaryAcks} icon="users" />
              <StatCard label="Pending Fund Requests" value={pendingFundReqs} icon="forms" accent />
            </div>

            {/* General Ledger Section */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 24 }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 700, color: "#0B1F3B", fontFamily: "'DM Sans', sans-serif" }}>General Ledger Acks Awaiting Your Review</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Type</th>
                      <th style={thStyle}>Section</th>
                      <th style={thStyle}>Amount</th>
                      <th style={thStyle}>Description</th>
                      <th style={thStyle}>Logged By</th>
                      <th style={thStyle}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.filter(l => !l.acknowledgements || !l.acknowledgements.some(ack => ack.leader_id === admin.id)).length === 0 ? (
                      <tr><td colSpan={7} style={{ padding: 30, textAlign: "center", color: "#9ca3af" }}>All caught up! No ledger items pending your acknowledgement.</td></tr>
                    ) : logs.filter(l => !l.acknowledgements || !l.acknowledgements.some(ack => ack.leader_id === admin.id)).map((l) => (
                      <tr key={l.id || l._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={tdStyle}>{new Date(l.date).toLocaleDateString()}</td>
                        <td style={tdStyle}><Badge label={l.type} /></td>
                        <td style={tdStyle}>{l.category}</td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: l.type === "income" ? "#059669" : "#dc2626" }}>
                          ₦{l.amount.toLocaleString()}
                        </td>
                        <td style={tdStyle}>{l.description || "N/A"}</td>
                        <td style={tdStyle}>{l.logged_by_name}</td>
                        <td style={tdStyle}>
                          <Btn onClick={() => handleAcknowledge(l.id || l._id)} variant="success" small>
                            Acknowledge
                          </Btn>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Salaries Section */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 24 }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 700, color: "#0B1F3B", fontFamily: "'DM Sans', sans-serif" }}>Salary Payouts Awaiting Your Acknowledgement</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={thStyle}>Staff Name</th>
                      <th style={thStyle}>Role</th>
                      <th style={thStyle}>Month</th>
                      <th style={thStyle}>Amount</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaries.filter(s => !s.acknowledgements || !s.acknowledgements.some(ack => ack.leader_id === admin.id)).length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: 30, textAlign: "center", color: "#9ca3af" }}>All caught up! No salaries pending your acknowledgement.</td></tr>
                    ) : salaries.filter(s => !s.acknowledgements || !s.acknowledgements.some(ack => ack.leader_id === admin.id)).map((s) => (
                      <tr key={s.id || s._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{s.staff_name}</td>
                        <td style={tdStyle}>{s.role}</td>
                        <td style={tdStyle}>{s.month}</td>
                        <td style={{ ...tdStyle, fontWeight: 700 }}>₦{s.amount.toLocaleString()}</td>
                        <td style={tdStyle}><Badge label={s.status} /></td>
                        <td style={tdStyle}>
                          <Btn onClick={() => handleAcknowledgeSalary(s.id || s._id)} variant="success" small>
                            Acknowledge
                          </Btn>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fund Requests Section */}
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 700, color: "#0B1F3B", fontFamily: "'DM Sans', sans-serif" }}>Project Fund Requests Awaiting Your Resolution</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Project/Title</th>
                      <th style={thStyle}>Dept/Section</th>
                      <th style={thStyle}>Amount</th>
                      <th style={thStyle}>Requester</th>
                      <th style={thStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fundRequests.filter(r => r.status === "pending").length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: 30, textAlign: "center", color: "#9ca3af" }}>All caught up! No fund requests pending approval.</td></tr>
                    ) : fundRequests.filter(r => r.status === "pending").map((r) => (
                      <tr key={r.id || r._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={tdStyle}>{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 600, color: "#0B1F3B" }}>{r.title}</div>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>{r.description}</div>
                        </td>
                        <td style={tdStyle}>{r.department}</td>
                        <td style={{ ...tdStyle, fontWeight: 700 }}>₦{r.amount.toLocaleString()}</td>
                        <td style={tdStyle}>{r.requester_name || "Admin"}</td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <Btn onClick={() => handleResolveFundRequest(r.id || r._id, "approved")} variant="success" small>
                              Approve
                            </Btn>
                            <Btn onClick={() => handleResolveFundRequest(r.id || r._id, "rejected")} variant="danger" small>
                              Reject
                            </Btn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </Page>
        )}
        {active === "service_reviews" && <CMSServiceReviews state={state} dispatch={dispatch} toast={toast} role="leader" />}
      </main>
      {viewUser && (
        <UserDetailsModal user={viewUser} onClose={() => setViewUser(null)} />
      )}
      {selectedLog && (
        <AttendanceDetailsModal
          eventLog={selectedLog}
          users={state.users}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// QUALITY CONTROL DASHBOARD
// ════════════════════════════════════════════════════════════════════════════════
const QualityControlDashboard = ({ state, dispatch, toast, admin }) => {
  const [active, setActive] = useState("overview");
  const [overviewData, setOverviewData] = useState({ recent: [], top: [], low: [] });
  const [overviewLoading, setOverviewLoading] = useState(true);

  const nav = [
    { key: "overview", label: "Overview", icon: "dashboard" },
    { key: "service_reviews", label: "Service Reviews", icon: "forms" },
    { key: "submit_review", label: "Submit Review", icon: "plus" }
  ];

  const fetchOverview = async () => {
    setOverviewLoading(true);
    try {
      const res = await fetch(`${API_URLS.SERVICE_REVIEWS}?limit=50&page=1`);
      if (res.ok) {
        const data = await res.json();
        const all = data.reviews || [];
        const sorted = [...all].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
        const byRating = [...all].sort((a, b) => (b.overall_rating || 0) - (a.overall_rating || 0));
        setOverviewData({
          recent: sorted.slice(0, 5),
          top: byRating.slice(0, 5),
          low: byRating.slice(-5).reverse(),
        });
      }
    } catch (err) {
      console.error("Failed to load overview reviews", err);
    } finally {
      setOverviewLoading(false);
    }
  };

  useEffect(() => { if (active === "overview") fetchOverview(); }, [active]);

  const starBar = (rating) => {
    const r = Math.round(rating || 0);
    const color = r >= 4 ? "#10b981" : r === 3 ? "#f59e0b" : "#ef4444";
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontWeight: 800, fontSize: 14, color }}>{(rating || 0).toFixed(1)}</span>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>/5</span>
        <span style={{ display: "inline-block", width: 50, height: 6, background: "#e5e7eb", borderRadius: 99, overflow: "hidden", marginLeft: 4 }}>
          <span style={{ display: "block", height: "100%", width: `${(rating / 5) * 100}%`, background: color, borderRadius: 99 }} />
        </span>
      </span>
    );
  };

  const ReviewTable = ({ title, rows, accent }) => (
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", overflow: "hidden", marginBottom: 20 }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: accent }} />
        <span style={{ fontWeight: 700, fontSize: 15, color: "#0B1F3B" }}>{title}</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8" }}>{rows.length} reviews</span>
      </div>
      {overviewLoading ? (
        <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Loading...</div>
      ) : rows.length === 0 ? (
        <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No reviews yet</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" }}>Service</th>
                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" }}>Reviewer</th>
                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" }}>Rating</th>
                <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r._id || i} style={{ borderTop: "1px solid #f1f5f9", transition: "background .15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = ""}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#111827", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.service_type || "Service"}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#374151", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.reviewer_name || r.submitted_by || "Anonymous"}
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>{starBar(r.overall_rating)}</td>
                  <td style={{ padding: "12px 16px", color: "#64748b", whiteSpace: "nowrap" }}>
                    {r.date ? new Date(r.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9", textAlign: "right" }}>
        <button onClick={() => setActive("service_reviews")} style={{ background: "none", border: "none", color: accent, fontWeight: 700, fontSize: 13, cursor: "pointer", padding: 0 }}>
          View all reviews →
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <Sidebar nav={nav} active={active} setActive={setActive} role="quality_control" adminName={admin?.name} onLogout={() => dispatch({ type: "LOGOUT" })} />
      <main style={{ marginLeft: 240, flex: 1, minHeight: "100vh" }}>
        {active === "overview" && (
          <Page title="Quality Control Overview" subtitle={`Welcome back, ${admin?.name || "QC Officer"}`}>
            <ReviewTable title="Recent Reviews" rows={overviewData.recent} accent="#6366f1" />
            <ReviewTable title="Top Rated" rows={overviewData.top} accent="#10b981" />
            <ReviewTable title="Low Rated" rows={overviewData.low} accent="#ef4444" />
          </Page>
        )}
        {active === "service_reviews" && <CMSServiceReviews state={state} dispatch={dispatch} toast={toast} role="quality_control" />}
        {active === "submit_review" && (
          <Page title="Submit Service Review" subtitle="Submit a new review for a church service">
            <div style={{ background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", maxWidth: 800 }}>
              <ServiceReviewFormPage
                onBack={() => setActive("overview")}
                inline={true}
                onSuccess={() => {
                  toast("Service review submitted successfully!", "success");
                  setActive("service_reviews");
                }}
              />
            </div>
          </Page>
        )}
      </main>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// Finance Dashboard
// ════════════════════════════════════════════════════════════════════════════════
// Helper components for FinancialDashboard (moved outside to prevent unmounting and keyboard focus issues on input typing)
const FCard = ({ children, style = {} }) => {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 768 : false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const paddingVal = style.padding !== undefined ? style.padding : (isMobile ? 16 : 24);
  const cleanedStyle = { ...style };
  delete cleanedStyle.padding;
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: paddingVal, ...cleanedStyle }}>{children}</div>
  );
};

const SBar = ({ text, accent = "#0B1F3B" }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
    <div style={{ width: 4, height: 18, background: accent, borderRadius: 2 }} />
    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0B1F3B", fontFamily: "'DM Sans',sans-serif" }}>{text}</h3>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════════
// Finance Dashboard
// ════════════════════════════════════════════════════════════════════════════════
const FinancialCharts = ({ logs }) => {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYear = new Date().getFullYear();

  const formatCompact = (num) => {
    if (num === 0) return '';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return num.toString();
  };

  if (selectedMonth !== null) {
    const daysInMonth = new Date(currentYear, selectedMonth + 1, 0).getDate();
    const dailyIncome = Array(daysInMonth).fill(0);
    const dailyExpense = Array(daysInMonth).fill(0);

    logs.forEach(l => {
      const d = new Date(l.date);
      if (d.getFullYear() === currentYear && d.getMonth() === selectedMonth) {
        const dayIdx = d.getDate() - 1;
        if (l.type === "income") dailyIncome[dayIdx] += l.amount;
        else dailyExpense[dayIdx] += l.amount;
      }
    });

    const maxVal = Math.max(...dailyIncome, ...dailyExpense, 100);
    const chartH = 150;

    return (
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "20px 24px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Btn onClick={() => setSelectedMonth(null)} variant="ghost" small>← Back</Btn>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0B1F3B", fontFamily: "'DM Sans',sans-serif" }}>Daily Breakdown — {months[selectedMonth]} {currentYear}</h4>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <span style={{ fontSize: 12, color: "#059669", fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>● Income</span>
            <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>● Expense</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: chartH + 48, overflowX: "auto", paddingBottom: 8, paddingTop: 30 }}>
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const incH = (dailyIncome[idx] / maxVal) * chartH;
            const expH = (dailyExpense[idx] / maxVal) * chartH;
            return (
              <div key={idx} style={{ flex: 1, minWidth: 20, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: chartH, width: "100%", justifyContent: "center" }}>
                  <div title={`Income: ₦${dailyIncome[idx].toLocaleString()}`} style={{ position: "relative", width: "40%", maxWidth: 12, height: Math.max(incH, 2), background: "#059669", borderRadius: "2px 2px 0 0" }}>
                    {dailyIncome[idx] > 0 && <span style={{ position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%) translateY(-6px) rotate(-90deg)", transformOrigin: "bottom center", fontSize: 9, fontWeight: 700, color: "#059669" }}>{formatCompact(dailyIncome[idx])}</span>}
                  </div>
                  <div title={`Expense: ₦${dailyExpense[idx].toLocaleString()}`} style={{ position: "relative", width: "40%", maxWidth: 12, height: Math.max(expH, 2), background: "#dc2626", borderRadius: "2px 2px 0 0" }}>
                    {dailyExpense[idx] > 0 && <span style={{ position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%) translateY(-6px) rotate(-90deg)", transformOrigin: "bottom center", fontSize: 9, fontWeight: 700, color: "#dc2626" }}>{formatCompact(dailyExpense[idx])}</span>}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4, fontFamily: "'DM Sans',sans-serif" }}>{idx + 1}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const monthlyIncome = Array(12).fill(0);
  const monthlyExpense = Array(12).fill(0);
  logs.forEach(l => {
    const d = new Date(l.date);
    if (d.getFullYear() === currentYear) {
      const m = d.getMonth();
      if (l.type === "income") monthlyIncome[m] += l.amount;
      else monthlyExpense[m] += l.amount;
    }
  });
  const maxVal = Math.max(...monthlyIncome, ...monthlyExpense, 100);
  const chartH = 150;

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "20px 24px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0B1F3B", fontFamily: "'DM Sans',sans-serif" }}>Monthly Cash Flow — {currentYear} <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500, marginLeft: 8 }}>(Click month for daily view)</span></h4>
        <div style={{ display: "flex", gap: 16 }}>
          <span style={{ fontSize: 12, color: "#059669", fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>● Income</span>
          <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>● Expense</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: chartH + 40, overflowX: "auto", paddingTop: 20 }}>
        {months.map((m, idx) => {
          const incH = (monthlyIncome[idx] / maxVal) * chartH;
          const expH = (monthlyExpense[idx] / maxVal) * chartH;
          return (
            <div key={idx} onClick={() => setSelectedMonth(idx)} style={{ flex: 1, minWidth: 40, display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", padding: "4px 0", borderRadius: 8, transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#f8fafc"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: chartH, width: "100%", justifyContent: "center" }}>
                <div title={`Income: ₦${monthlyIncome[idx].toLocaleString()}`} style={{ position: "relative", width: "46%", maxWidth: 20, height: Math.max(incH, 3), background: "#059669", borderRadius: "3px 3px 0 0" }}>
                  {monthlyIncome[idx] > 0 && <span style={{ position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%) translateY(-2px)", fontSize: 9, fontWeight: 700, color: "#059669" }}>{formatCompact(monthlyIncome[idx])}</span>}
                </div>
                <div title={`Expense: ₦${monthlyExpense[idx].toLocaleString()}`} style={{ position: "relative", width: "46%", maxWidth: 20, height: Math.max(expH, 3), background: "#dc2626", borderRadius: "3px 3px 0 0" }}>
                  {monthlyExpense[idx] > 0 && <span style={{ position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%) translateY(-2px)", fontSize: 9, fontWeight: 700, color: "#dc2626" }}>{formatCompact(monthlyExpense[idx])}</span>}
                </div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginTop: 4, fontFamily: "'DM Sans',sans-serif" }}>{m}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FinancialDashboard = ({ state, dispatch, toast, admin }) => {
  const [active, setActive] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  // Income states
  const [incomeCategory, setIncomeCategory] = useState("General");
  const [incomeSubCategory, setIncomeSubCategory] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeDescription, setIncomeDescription] = useState("");
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split("T")[0]);
  const [loggingIncome, setLoggingIncome] = useState(false);

  // Expense states
  const [expenseCategory, setExpenseCategory] = useState("General");
  const [expenseSubCategory, setExpenseSubCategory] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [loggingExpense, setLoggingExpense] = useState(false);

  // Salary states
  const [salaryStaff, setSalaryStaff] = useState("");
  const [salaryRole, setSalaryRole] = useState("");
  const [salaryMonth, setSalaryMonth] = useState("");
  const [salaryAmount, setSalaryAmount] = useState("");
  const [salaryStatus, setSalaryStatus] = useState("pending");
  const [loggingSalary, setLoggingSalary] = useState(false);

  // Fund request states
  const [reqTitle, setReqTitle] = useState("");
  const [reqAmount, setReqAmount] = useState("");
  const [reqDept, setReqDept] = useState("General");
  const [reqDesc, setReqDesc] = useState("");
  const [submittingReq, setSubmittingReq] = useState(false);

  // Void modal state
  const [voidModal, setVoidModal] = useState(null); // { type: 'ledger'|'salary', id, ref }
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);

  // Edit modal state
  const [editModal, setEditModal] = useState(null); // holds the log object being edited
  const [editCategory, setEditCategory] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editingLog, setEditingLog] = useState(false);

  const nav = [
    { key: "overview", label: "Ledger & Overview", icon: "dashboard" },
    { key: "log", label: "Log Transaction", icon: "plus" },
    { key: "salaries", label: "Salary Tracker", icon: "users" },
    { key: "requests", label: "Fund Requests", icon: "forms" },
  ];

  const logs = state.financial || [];
  const salaries = state.salaries || [];
  const fundRequests = state.fundRequests || [];
  const sections = state.financialSections || [];

  const monthlyLedger = processMonthlyLedger(logs, searchQuery);

  // Auto-calculations
  const totalIncome = logs.filter(l => l.type === "income" && !l.voided).reduce((sum, l) => sum + l.amount, 0);
  const totalExpense = logs.filter(l => l.type === "expense" && !l.voided).reduce((sum, l) => sum + l.amount, 0);
  const balance = totalIncome - totalExpense;

  // Handlers
  const handleLogIncome = async (e) => {
    e.preventDefault();
    if (!incomeCategory || !incomeAmount) return toast("Income section and amount required", "error");
    if (isNaN(incomeAmount) || parseFloat(incomeAmount) <= 0) return toast("Amount must be a positive number", "error");

    setLoggingIncome(true);
    try {
      const res = await fetch(API_URLS.FINANCIAL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.session.token}`
        },
        body: JSON.stringify({
          type: "income",
          category: incomeCategory,
          amount: parseFloat(incomeAmount),
          description: incomeSubCategory ? `[${incomeSubCategory}] ${incomeDescription}`.trim() : incomeDescription,
          date: incomeDate
        })
      });
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: "SYNC_DATA", key: "financial", data: [data, ...logs] });
        setIncomeSubCategory("");
        setIncomeAmount("");
        setIncomeDescription("");
        toast("Income logged successfully & Leaders notified!", "success");
      } else {
        const err = await res.json();
        toast(err.error || "Failed to log income", "error");
      }
    } catch (err) {
      toast("Server connection failed", "error");
    } finally {
      setLoggingIncome(false);
    }
  };

  const handleLogExpense = async (e) => {
    e.preventDefault();
    if (!expenseCategory || !expenseAmount) return toast("Expense section and amount required", "error");
    if (isNaN(expenseAmount) || parseFloat(expenseAmount) <= 0) return toast("Amount must be a positive number", "error");
    if (parseFloat(expenseAmount) > balance) return toast(`Insufficient balance — available: ₦${balance.toLocaleString()}`, "error");

    setLoggingExpense(true);
    try {
      const res = await fetch(API_URLS.FINANCIAL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.session.token}`
        },
        body: JSON.stringify({
          type: "expense",
          category: expenseCategory,
          amount: parseFloat(expenseAmount),
          description: expenseSubCategory ? `[${expenseSubCategory}] ${expenseDescription}`.trim() : expenseDescription,
          date: expenseDate
        })
      });
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: "SYNC_DATA", key: "financial", data: [data, ...logs] });
        setExpenseSubCategory("");
        setExpenseAmount("");
        setExpenseDescription("");
        toast("Expense logged successfully & Leaders notified!", "success");
      } else {
        const err = await res.json();
        toast(err.error || "Failed to log expense", "error");
      }
    } catch (err) {
      toast("Server connection failed", "error");
    } finally {
      setLoggingExpense(false);
    }
  };

  // Opens void modal — requires reason before voiding
  const openVoidModal = (type, id) => {
    setVoidModal({ type, id });
    setVoidReason("");
  };

  const handleVoidSubmit = async () => {
    if (!voidReason.trim()) return toast("Please state a reason for voiding this record", "error");
    setVoiding(true);
    try {
      const url = voidModal.type === "ledger"
        ? `${API_URLS.FINANCIAL}/${voidModal.id}/void`
        : `${API_URLS.FINANCIAL_SALARIES}/${voidModal.id}/void`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.session.token}` },
        body: JSON.stringify({ void_reason: voidReason.trim() })
      });
      if (res.ok) {
        if (voidModal.type === "ledger") {
          dispatch({ type: "SYNC_DATA", key: "financial", data: logs.filter(l => (l.id || l._id) !== voidModal.id) });
        } else {
          dispatch({ type: "SYNC_DATA", key: "salaries", data: salaries.filter(s => (s.id || s._id) !== voidModal.id) });
        }
        toast("Record voided successfully. Audit trail preserved.", "success");
        setVoidModal(null);
        setVoidReason("");
      } else {
        const err = await res.json();
        toast(err.error || "Failed to void record", "error");
      }
    } catch (err) {
      toast("Connection error", "error");
    } finally {
      setVoiding(false);
    }
  };

  const openEditModal = (log) => {
    setEditModal(log);
    setEditCategory(log.category);
    setEditAmount(log.amount);
    setEditDescription(log.description || "");
    setEditDate(new Date(log.date).toISOString().split("T")[0]);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editCategory || !editAmount) return toast("Section and amount required", "error");
    if (isNaN(editAmount) || parseFloat(editAmount) <= 0) return toast("Amount must be a positive number", "error");

    setEditingLog(true);
    try {
      const res = await fetch(`${API_URLS.FINANCIAL}/${editModal.id || editModal._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.session.token}` },
        body: JSON.stringify({
          category: editCategory,
          amount: parseFloat(editAmount),
          description: editDescription,
          date: editDate
        })
      });
      if (res.ok) {
        const data = await res.json();
        // Replace the old log with the voided version, and unshift the new log
        const filteredLogs = logs.filter(l => (l.id || l._id) !== (data.oldLog.id || data.oldLog._id));
        dispatch({ type: "SYNC_DATA", key: "financial", data: [data.newLog, data.oldLog, ...filteredLogs] });
        toast("Record edited successfully", "success");
        setEditModal(null);
      } else {
        const err = await res.json();
        toast(err.error || "Failed to edit record", "error");
      }
    } catch (err) {
      toast("Connection error", "error");
    } finally {
      setEditingLog(false);
    }
  };

  const handleLogSalary = async (e) => {
    e.preventDefault();
    if (!salaryStaff || !salaryRole || !salaryMonth || !salaryAmount) {
      return toast("All salary fields are required", "error");
    }
    if (isNaN(salaryAmount) || parseFloat(salaryAmount) <= 0) {
      return toast("Amount must be a positive number", "error");
    }

    setLoggingSalary(true);
    try {
      const res = await fetch(API_URLS.FINANCIAL_SALARIES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.session.token}`
        },
        body: JSON.stringify({
          staff_name: salaryStaff,
          role: salaryRole,
          month: salaryMonth,
          amount: parseFloat(salaryAmount),
          status: salaryStatus
        })
      });
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: "SYNC_DATA", key: "salaries", data: [data, ...salaries] });
        setSalaryStaff("");
        setSalaryRole("");
        setSalaryMonth("");
        setSalaryAmount("");
        toast("Salary payout logged successfully & Leaders notified!", "success");
        // Re-fetch ledger to sync auto-created expense
        const ledgerRes = await fetch(API_URLS.FINANCIAL);
        if (ledgerRes.ok) {
          const ledgerData = await ledgerRes.json();
          dispatch({ type: "SYNC_DATA", key: "financial", data: ledgerData });
        }
      } else {
        const err = await res.json();
        toast(err.error || "Failed to log salary", "error");
      }
    } catch (err) {
      toast("Server connection failed", "error");
    } finally {
      setLoggingSalary(false);
    }
  };

  const handleDeleteSalary = async (id) => {
    if (!confirm("Are you sure you want to delete this salary log?")) return;
    try {
      const res = await fetch(`${API_URLS.FINANCIAL_SALARIES}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${state.session.token}` }
      });
      if (res.ok) {
        dispatch({ type: "SYNC_DATA", key: "salaries", data: salaries.filter(s => s._id !== id && s.id !== id) });
        toast("Salary log deleted", "success");
      } else {
        toast("Failed to delete salary log", "error");
      }
    } catch (err) {
      toast("Delete failed", "error");
    }
  };

  const handleCreateFundRequest = async (e) => {
    e.preventDefault();
    if (!reqTitle || !reqAmount || !reqDesc || !reqDept) {
      return toast("All request fields are required", "error");
    }
    if (isNaN(reqAmount) || parseFloat(reqAmount) <= 0) {
      return toast("Amount must be a positive number", "error");
    }

    setSubmittingReq(true);
    try {
      const res = await fetch(API_URLS.FINANCIAL_FUND_REQUESTS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.session.token}`
        },
        body: JSON.stringify({
          title: reqTitle,
          amount: parseFloat(reqAmount),
          description: reqDesc,
          department: reqDept
        })
      });
      if (res.ok) {
        const data = await res.json();
        dispatch({ type: "SYNC_DATA", key: "fundRequests", data: [data, ...fundRequests] });
        setReqTitle("");
        setReqAmount("");
        setReqDesc("");
        toast("Fund request submitted successfully & Leaders notified!", "success");
      } else {
        const err = await res.json();
        toast(err.error || "Failed to submit request", "error");
      }
    } catch (err) {
      toast("Server connection failed", "error");
    } finally {
      setSubmittingReq(false);
    }
  };

  const handlePrintFinancial = () => printFinancialReport(logs, toast);


  const incomeCategoryOptions = sections.length > 0 ? [...sections.map(s => s.name), "Others"] : ["Offering", "Tithes", "Donation", "Building", "Others"];
  
  const expenseCategoryOptions = [
    "Diesel / Fuel",
    "Electricity / Power",
    "Generator Maintenance",
    "Building Repairs",
    "Stationery / Printing",
    "Catering / Food",
    "Transportation",
    "Equipment Purchase",
    "Sound / Media Supplies",
    "Welfare / Benevolence",
    "Staff Welfare",
    "Sanitation / Cleaning",
    "Event Expenses",
    "Utilities (Water, Internet)",
    "Miscellaneous",
    "Others"
  ];

  const fundRequestCategoryOptions = [
    "Media",
    "Choir",
    "Welfare",
    "Ushering",
    "Others"
  ];



  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <Sidebar nav={nav} active={active} setActive={setActive} role="finance_admin" adminName={admin?.name} onLogout={() => dispatch({ type: "LOGOUT" })} />
      <main style={{ marginLeft: 240, flex: 1, minHeight: "100vh" }}>
        {active === "add_user" && <UsherAddUser state={state} dispatch={dispatch} toast={toast} />}

        {active === "overview" && (
          <Page title="Finance Dashboard" subtitle="Manage church revenues and expenses" actions={<Btn onClick={handlePrintFinancial} variant="accent"><Icon name="print" size={16} /> Print Report (PDF)</Btn>}>

            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Total Income", val: `₦${totalIncome.toLocaleString()}`, color: "#059669", border: "#059669", sub: `${logs.filter(l => l.type === "income").length} entries` },
                { label: "Total Expenses", val: `₦${totalExpense.toLocaleString()}`, color: "#dc2626", border: "#dc2626", sub: `${logs.filter(l => l.type === "expense").length} entries` },
                { label: "Net Balance", val: `₦${balance.toLocaleString()}`, color: balance >= 0 ? "#059669" : "#dc2626", border: "#0B1F3B", sub: "Current surplus/deficit" },
              ].map((c, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", border: "1px solid #e5e7eb", borderLeft: `4px solid ${c.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden", cursor: "pointer", transition: "transform 0.15s" }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", fontFamily: "'DM Sans',sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{c.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: c.color, fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.val}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4, fontFamily: "'DM Sans',sans-serif" }}>{c.sub}</div>
                </div>
              ))}
            </div>

            <FinancialCharts logs={logs.filter(l => !l.voided)} />

            <div style={{ display: "flex", gap: 24, marginTop: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 340 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <SBar text="Transaction Ledger" />
                  <div style={{ minWidth: 200, maxWidth: 300, marginBottom: -16 }}>
                    <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search ledger..." />
                  </div>
                </div>
                <FCard>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
                          <th style={thStyle}>Date</th><th style={thStyle}>Type</th><th style={thStyle}>Section</th>
                          <th style={thStyle}>Amount</th><th style={thStyle}>Description</th><th style={thStyle}>By</th>
                          <th style={thStyle}>Acks</th><th style={thStyle}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyLedger.length === 0 ? (
                          <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontFamily: "'DM Sans',sans-serif" }}>No transactions logged yet.</td></tr>
                        ) : monthlyLedger.map((m) => (
                          <Fragment key={m.month}>
                            <tr style={{ background: "#f3f4f6", borderBottom: "1px solid #e5e7eb" }}>
                              <td colSpan={8} style={{ padding: "12px 18px", fontWeight: 700, color: "#111827", fontFamily: "'DM Sans',sans-serif" }}>
                                {m.month} <span style={{ marginLeft: 16, fontSize: 13, color: "#6b7280", fontWeight: 600 }}>Opening Balance: ₦{m.openingBalance.toLocaleString()}</span>
                              </td>
                            </tr>

                            {m.transactions.map(l => (
                              <tr key={l.id || l._id} style={{ borderBottom: "1px solid #f3f4f6", textDecoration: l.voided ? "line-through" : "none", color: l.voided ? "#9ca3af" : "inherit" }}>
                                <td style={{...tdStyle, color: l.voided ? "#9ca3af" : tdStyle.color}}>{new Date(l.date).toLocaleDateString()}</td>
                                <td style={tdStyle}><Badge label={l.type} color={l.voided ? "#9ca3af" : undefined} /></td>
                                <td style={{...tdStyle, color: l.voided ? "#9ca3af" : tdStyle.color}}>{l.category}</td>
                                <td style={{ ...tdStyle, fontWeight: 700, color: l.voided ? "#9ca3af" : (l.type === "income" ? "#059669" : "#dc2626") }}>
                                  {l.type === "income" ? "+" : "-"}₦{l.amount.toLocaleString()}
                                </td>
                                <td style={{ ...tdStyle, color: l.voided ? "#9ca3af" : tdStyle.color, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {l.voided && l.void_reason ? `[Voided: ${l.void_reason}] ` : ""}{l.description || "—"}
                                </td>
                                <td style={{...tdStyle, color: l.voided ? "#9ca3af" : tdStyle.color}}>{l.logged_by_name}</td>
                                <td style={tdStyle}>
                                  {l.voided ? <span style={{ fontSize: 11, color: "#9ca3af" }}>—</span> : (
                                    l.acknowledgements && l.acknowledgements.length > 0
                                      ? <span style={{ fontSize: 11, color: "#059669", fontWeight: 700 }}>✓ {l.acknowledgements.length}</span>
                                      : <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>Pending</span>
                                  )}
                                </td>
                                <td style={tdStyle}>
                                  {!l.voided && (
                                    <div style={{display: "flex", gap: 8}}>
                                      <button onClick={() => openEditModal(l)} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", padding: 4 }}>
                                        <Icon name="settings" size={14} />
                                      </button>
                                      <button onClick={() => openVoidModal("ledger", l.id || l._id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4 }}>
                                        <Icon name="trash" size={14} />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}

                            <tr style={{ background: "#f8fafc", borderBottom: "3px solid #e5e7eb" }}>
                              <td colSpan={3} style={{ padding: "12px 18px", fontWeight: 600, color: "#4b5563", fontFamily: "'DM Sans',sans-serif", textAlign: "right" }}>Monthly Totals:</td>
                              <td style={{ padding: "12px 18px", fontWeight: 700, color: "#059669", fontFamily: "'DM Sans',sans-serif" }}>+₦{m.totalIncome.toLocaleString()}</td>
                              <td style={{ padding: "12px 18px", fontWeight: 700, color: "#dc2626", fontFamily: "'DM Sans',sans-serif" }}>-₦{m.totalExpense.toLocaleString()}</td>
                              <td colSpan={3} style={{ padding: "12px 18px", fontWeight: 700, color: "#111827", fontFamily: "'DM Sans',sans-serif" }}>
                                Closing Balance: <span style={{ color: m.closingBalance >= 0 ? "#059669" : "#dc2626" }}>₦{m.closingBalance.toLocaleString()}</span>
                              </td>
                            </tr>
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </FCard>
              </div>
            </div>
          </Page>
        )}

        {active === "log" && (
          <Page title="Record Transaction" subtitle="Record new church incomes or expenses simultaneously">
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start", width: "100%" }}>

              {/* Income Column */}
              <div style={{ flex: 1, minWidth: 320 }}>
                <SBar text="Log Income" accent="#059669" />
                <FCard style={{ borderTop: "4px solid #059669", padding: 20 }}>
                  <form onSubmit={handleLogIncome}>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ flex: "1 1 200px" }}>
                        <Input label="Section" value={incomeCategory} onChange={setIncomeCategory} type="dropdown" options={incomeCategoryOptions} required />
                      </div>
                      <div style={{ flex: "1 1 200px" }}>
                        <Input label="Sub-category / Detail" value={incomeSubCategory} onChange={setIncomeSubCategory} placeholder="e.g. Sunday Offering" required />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ flex: "1 1 200px" }}>
                        <Input label="Amount (₦)" value={incomeAmount} onChange={setIncomeAmount} type="text" placeholder="0.00" inputMode="decimal" required />
                      </div>
                      <div style={{ flex: "1 1 200px" }}>
                        <Input label="Date" value={incomeDate} onChange={setIncomeDate} type="date" required style={{ minHeight: "43px" }} />
                      </div>
                    </div>

                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", fontFamily: "'DM Sans',sans-serif", marginBottom: 8 }}>Notes (optional)</label>
                    <textarea value={incomeDescription} onChange={e => setIncomeDescription(e.target.value)} placeholder="Additional income details..." style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans',sans-serif", minHeight: 80, resize: "vertical", outline: "none", marginBottom: 24, color: "#374151" }} />

                    <Btn type="submit" variant="primary" style={{ width: "100%", padding: "12px 0", fontSize: 15, justifyContent: "center", background: "#059669", color: "#fff" }} disabled={loggingIncome}>
                      <Icon name="check" size={16} />
                      {loggingIncome ? "Saving Income..." : "Save Income"}
                    </Btn>
                  </form>
                </FCard>
              </div>

              {/* Expense Column */}
              <div style={{ flex: 1, minWidth: 320 }}>
                <SBar text="Log Expense" accent="#dc2626" />
                <FCard style={{ borderTop: "4px solid #dc2626", padding: 20 }}>
                  <form onSubmit={handleLogExpense}>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ flex: "1 1 200px" }}>
                        <Input label="Expense Category" value={expenseCategory} onChange={setExpenseCategory} type="dropdown" options={expenseCategoryOptions} required />
                      </div>
                      <div style={{ flex: "1 1 200px" }}>
                        <Input label="Description / Detail" value={expenseSubCategory} onChange={setExpenseSubCategory} placeholder="e.g. Generator diesel top-up" required />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ flex: "1 1 200px" }}>
                        <Input label="Amount (₦)" value={expenseAmount} onChange={setExpenseAmount} type="text" placeholder="0.00" inputMode="decimal" required />
                      </div>
                      <div style={{ flex: "1 1 200px" }}>
                        <Input label="Date" value={expenseDate} onChange={setExpenseDate} type="date" required style={{ minHeight: "43px" }} />
                      </div>
                    </div>

                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", fontFamily: "'DM Sans',sans-serif", marginBottom: 8 }}>Notes (optional)</label>
                    <textarea value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} placeholder="Additional expense details..." style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans',sans-serif", minHeight: 80, resize: "vertical", outline: "none", marginBottom: 24, color: "#374151" }} />

                    <Btn type="submit" variant="primary" style={{ width: "100%", padding: "12px 0", fontSize: 15, justifyContent: "center", background: "#dc2626", color: "#fff" }} disabled={loggingExpense}>
                      <Icon name="check" size={16} />
                      {loggingExpense ? "Saving Expense..." : "Save Expense"}
                    </Btn>
                  </form>
                </FCard>
              </div>

            </div>
          </Page>
        )}

        {active === "salaries" && (
          <Page title="Salary Tracker" subtitle="Record and track monthly staff salary payouts">

            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Total Paid", val: `₦${salaries.filter(s => s.status === "paid").reduce((a, s) => a + s.amount, 0).toLocaleString()}`, color: "#059669", border: "#059669" },
                { label: "Total Pending", val: `₦${salaries.filter(s => s.status === "pending").reduce((a, s) => a + s.amount, 0).toLocaleString()}`, color: "#d97706", border: "#d97706" },
                { label: "Total Payroll", val: `₦${salaries.reduce((a, s) => a + s.amount, 0).toLocaleString()}`, color: "#0B1F3B", border: "#0B1F3B" },
              ].map((c, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", borderLeft: `4px solid ${c.border}`, border: "1px solid #e5e7eb", borderLeftWidth: 4, borderLeftColor: c.border, borderLeftStyle: "solid", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", fontFamily: "'DM Sans',sans-serif", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{c.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: c.color, fontFamily: "'DM Sans',sans-serif", wordBreak: "break-word", lineHeight: 1.2 }}>{c.val}</div>
                </div>
              ))}
            </div>

            {/* Main layout: list + form stacked on mobile, side-by-side on wide screens */}
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 24 }}>

              {/* Log Salary Form */}
              <div>
                <SBar text="Log Salary Payout" accent="#0B1F3B" />
                <FCard style={{ padding: 20 }}>
                  <form onSubmit={handleLogSalary}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <Input label="Staff Name" value={salaryStaff} onChange={setSalaryStaff} placeholder="e.g. Pastor David" required />
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <Input label="Staff Role" value={salaryRole} onChange={setSalaryRole} placeholder="e.g. Lead Pastor" required />
                      </div>
                      <Input label="Month" value={salaryMonth} onChange={setSalaryMonth} placeholder="e.g. May 2026" required />
                      <Input label="Amount (N)" value={salaryAmount} onChange={setSalaryAmount} placeholder="0.00" required />
                      <div style={{ gridColumn: "1 / -1" }}>
                        <Input label="Payout Status" value={salaryStatus} onChange={setSalaryStatus} type="dropdown" options={["paid", "pending"]} required />
                      </div>
                    </div>
                    <Btn type="submit" variant="primary" style={{ width: "100%", marginTop: 8, justifyContent: "center" }} disabled={loggingSalary}>
                      {loggingSalary ? "Saving..." : "Save Payout"}
                    </Btn>
                  </form>
                </FCard>
              </div>

              {/* Salary Logs */}
              <div>
                <SBar text="Salary Logs" />
                <FCard style={{ padding: 0, overflow: "hidden" }}>
                  {salaries.length === 0 ? (
                    <div style={{ padding: 48, textAlign: "center", color: "#9ca3af", fontFamily: "'DM Sans',sans-serif", fontSize: 14 }}>No salaries logged yet.</div>
                  ) : salaries.map((s, i) => (
                    <div key={s.id || s._id} style={{
                      padding: "16px 18px",
                      borderBottom: i < salaries.length - 1 ? "1px solid #f0f0f0" : "none",
                      background: "#fff",
                    }}>
                      {/* Top row: name/role + delete */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.staff_name}</div>
                          <div style={{ fontSize: 12, color: "#6b7280", fontFamily: "'DM Sans',sans-serif", marginTop: 2 }}>{s.role}</div>
                        </div>
                        <button
                          onClick={() => openVoidModal("salary", s.id || s._id)}
                          style={{ background: "#fff0f0", border: "1px solid #fca5a5", borderRadius: 6, color: "#ef4444", cursor: "pointer", padding: "4px 8px", display: "flex", alignItems: "center", gap: 4, flexShrink: 0, marginLeft: 12 }}
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                      {/* Bottom row: metadata chips */}
                      <div style={{ display: "grid", gridTemplateColumns: "auto auto auto 1fr", alignItems: "center", gap: "6px 10px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, fontFamily: "'DM Sans',sans-serif", color: "#374151", background: "#f3f4f6", borderRadius: 6, padding: "3px 10px", fontWeight: 600, whiteSpace: "nowrap" }}>{s.month}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#0B1F3B", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap" }}>N{s.amount.toLocaleString()}</span>
                        <Badge label={s.status} />
                        <span style={{ fontSize: 11, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, color: s.acknowledgements && s.acknowledgements.length > 0 ? "#059669" : "#d97706", textAlign: "right" }}>
                          {s.acknowledgements && s.acknowledgements.length > 0 ? `Acknowledged (${s.acknowledgements.length})` : "Pending Ack"}
                        </span>
                      </div>
                    </div>
                  ))}
                </FCard>
              </div>

            </div>
          </Page>
        )}


        {active === "requests" && (
          <Page title="Fund Requests" subtitle="Request budgets/funds for church project developments">

            {/* Status Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Pending Requests", val: fundRequests.filter(r => r.status === "pending").length, color: "#f59e0b", border: "#f59e0b" },
                { label: "Approved", val: fundRequests.filter(r => r.status === "approved").length, color: "#059669", border: "#059669" },
                { label: "Total Requested", val: `₦${fundRequests.reduce((a, r) => a + r.amount, 0).toLocaleString()}`, color: "#0B1F3B", border: "#0B1F3B" },
              ].map((c, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", border: "1px solid #e5e7eb", borderLeft: `4px solid ${c.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", overflow: "hidden" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", fontFamily: "'DM Sans',sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{c.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: c.color, fontFamily: "'DM Sans',sans-serif" }}>{c.val}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 320 }}>
                <SBar text="Requested Budgets" />
                <FCard>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
                          <th style={thStyle}>Date</th><th style={thStyle}>Project / Title</th>
                          <th style={thStyle}>Section</th><th style={thStyle}>Amount</th>
                          <th style={thStyle}>Status</th><th style={thStyle}>Resolved By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fundRequests.length === 0 ? (
                          <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontFamily: "'DM Sans',sans-serif" }}>No fund requests submitted yet.</td></tr>
                        ) : fundRequests.map(r => (
                          <tr key={r.id || r._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td style={tdStyle}>{new Date(r.createdAt).toLocaleDateString()}</td>
                            <td style={tdStyle}>
                              <div style={{ fontWeight: 700, color: "#0B1F3B", fontSize: 13 }}>{r.title}</div>
                              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{r.description}</div>
                            </td>
                            <td style={tdStyle}>{r.department}</td>
                            <td style={{ ...tdStyle, fontWeight: 700, color: "#0B1F3B" }}>₦{r.amount.toLocaleString()}</td>
                            <td style={tdStyle}><Badge label={r.status} /></td>
                            <td style={tdStyle}>
                              {r.status !== "pending" ? (
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{r.resolved_by_name}</div>
                                  {r.rejection_reason && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>Reason: {r.rejection_reason}</div>}
                                </div>
                              ) : <span style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>Awaiting Review</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </FCard>
              </div>

              <div style={{ width: 290, flexShrink: 0 }}>
                <SBar text="Submit Fund Request" accent="#dc2626" />
                <FCard style={{ padding: 20 }}>
                  <form onSubmit={handleCreateFundRequest}>
                    <Input label="Project Title" value={reqTitle} onChange={setReqTitle} placeholder="e.g. Repair church backup generator" required />
                    <Input label="Section / Department" value={reqDept} onChange={setReqDept} type="dropdown" options={fundRequestCategoryOptions} required />
                    <Input label="Requested Amount (₦)" value={reqAmount} onChange={setReqAmount} placeholder="0.00" required />
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", fontFamily: "'DM Sans',sans-serif", marginBottom: 6 }}>Purpose / Description</label>
                    <textarea value={reqDesc} onChange={e => setReqDesc(e.target.value)} placeholder="Describe what these funds will be used for..." style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans',sans-serif", minHeight: 90, resize: "vertical", outline: "none", marginBottom: 16, color: "#374151" }} required />
                    <Btn type="submit" variant="primary" style={{ width: "100%" }} disabled={submittingReq}>
                      {submittingReq ? "Submitting..." : "Submit Request"}
                    </Btn>
                  </form>
                </FCard>
              </div>
            </div>
          </Page>
        )}

      <Modal isOpen={!!voidModal} onClose={() => setVoidModal(null)} title="Void / Delete Record">
        <p style={{ fontSize: 13, color: "#4b5563", marginBottom: 16, fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5 }}>
          You are about to void this record. It will remain in the ledger as struck-out for audit purposes, but will be removed from all calculations and balances.
        </p>
        <Input label="Reason for Voiding (Required)" value={voidReason} onChange={setVoidReason} placeholder="e.g. Logged incorrect amount" required />
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <Btn onClick={() => setVoidModal(null)} variant="ghost" style={{ flex: 1, justifyContent: "center" }}>Cancel</Btn>
          <Btn onClick={handleVoidSubmit} variant="primary" style={{ flex: 1, justifyContent: "center", background: "#ef4444" }} disabled={voiding}>
            {voiding ? "Voiding..." : "Confirm Void"}
          </Btn>
        </div>
      </Modal>

      <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title={`Edit ${editModal?.type === 'income' ? 'Income' : 'Expense'} Record`}>
        <p style={{ fontSize: 13, color: "#4b5563", marginBottom: 16, fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5 }}>
          Editing will void the current record and issue a new corrected record to preserve the audit trail.
        </p>
        <form onSubmit={handleEditSubmit}>
          <div style={{ marginBottom: 12 }}>
            <Input label="Section / Category" value={editCategory} onChange={setEditCategory} type="dropdown" options={editModal?.type === "income" ? incomeCategoryOptions : expenseCategoryOptions} required />
          </div>
          <div style={{ marginBottom: 12 }}>
            <Input label="Amount (₦)" value={editAmount} onChange={setEditAmount} type="text" inputMode="decimal" required />
          </div>
          <div style={{ marginBottom: 12 }}>
            <Input label="Date" value={editDate} onChange={setEditDate} type="date" required />
          </div>
          <div style={{ marginBottom: 20 }}>
            <Input label="Description / Notes" value={editDescription} onChange={setEditDescription} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Btn type="button" onClick={() => setEditModal(null)} variant="ghost" style={{ flex: 1, justifyContent: "center" }}>Cancel</Btn>
            <Btn type="submit" variant="primary" style={{ flex: 1, justifyContent: "center", background: "#3b82f6" }} disabled={editingLog}>
              {editingLog ? "Saving..." : "Save Edit"}
            </Btn>
          </div>
        </form>
      </Modal>

      </main>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// Service Reviews Component
// ════════════════════════════════════════════════════════════════════════════════
const CMSServiceReviews = ({ state, dispatch, toast, role }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [serviceType, setServiceType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [selectedReview, setSelectedReview] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await fetch(API_URLS.SERVICE_REVIEWS_STATS);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch reviews stats:", err);
    }
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: 10,
        search,
        service_type: serviceType,
        date_from: dateFrom,
        date_to: dateTo,
      });
      const res = await fetch(`${API_URLS.SERVICE_REVIEWS}?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setPages(data.pagination?.pages || 1);
        setTotal(data.pagination?.total || 0);
      } else {
        toast("Failed to load service reviews", "error");
      }
    } catch (err) {
      toast("Connection error loading reviews", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [page, search, serviceType, dateFrom, dateTo]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this service review?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_URLS.SERVICE_REVIEWS}/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast("Service review deleted successfully", "success");
        fetchReviews();
        fetchStats();
        if (selectedReview && selectedReview._id === id) {
          setSelectedReview(null);
        }
      } else {
        const err = await res.json();
        toast(err.error || "Failed to delete review", "error");
      }
    } catch (e) {
      toast("Server connection failed", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePrintReviews = async () => {
    const queryParams = new URLSearchParams({
      service_type: serviceType,
      date_from: dateFrom,
      date_to: dateTo,
      limit: 1000 // Print all
    });
    try {
      const res = await fetch(`${API_URLS.SERVICE_REVIEWS}?${queryParams.toString()}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const reviewsToPrint = data.reviews || [];
        if (reviewsToPrint.length === 0) return toast("No reviews to print", "error");

        const printWindow = window.open("", "_blank");
        if (!printWindow) return alert("Please allow popups");

        const churchName = import.meta.env.VITE_CHURCH_NAME || "Church";
        
        const rowsHtml = reviewsToPrint.map(r => {
          const ratingColor = r.overall_average >= 8 ? "#047857" : r.overall_average >= 5 ? "#d97706" : "#b91c1c";
          return `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px; font-size: 13px;">${new Date(r.createdAt || r.date).toLocaleDateString()}</td>
              <td style="padding: 10px; font-size: 13px;">${r.service_title || "—"}</td>
              <td style="padding: 10px; font-size: 13px; text-transform: capitalize;">${r.service_type ? r.service_type.replace(/_/g, ' ') : "—"}</td>
              <td style="padding: 10px; font-size: 13px;">${r.submitted_by_name || "—"}</td>
              <td style="padding: 10px; font-size: 13px; font-weight: 700; color: ${ratingColor};">${r.overall_average || 0}/10</td>
            </tr>
          `;
        }).join("");

        const printContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>${churchName} - Service Reviews Report</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; margin: 0; }
              .header { border-bottom: 2px solid #111827; padding-bottom: 20px; margin-bottom: 30px; }
              .title { font-size: 24px; font-weight: 800; margin: 0 0 8px 0; color: #0b1f3b; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th { background: #f1f5f9; padding: 12px 10px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; text-align: left; border-bottom: 2px solid #cbd5e1; }
              @media print { body { padding: 20px; } tr { page-break-inside: avoid; } }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">${churchName} - Service Reviews</div>
              <div style="font-size: 14px; color: #4b5563;">Total Reviews: <strong>${reviewsToPrint.length}</strong></div>
            </div>
            <table>
              <thead>
                <tr><th>Date</th><th>Service Title</th><th>Type</th><th>Reviewer</th><th>Overall Rating</th></tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
            </table>
            <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };</script>
          </body>
          </html>
        `;
        printWindow.document.write(printContent);
        printWindow.document.close();
      } else {
        toast("Failed to generate print view", "error");
      }
    } catch (err) {
      toast("Error generating print view", "error");
    }
  };

  const getScoreColor = (score) => {
    if (score >= 9) return { bg: "#d1fae5", text: "#065f46" }; // Excellent
    if (score >= 7) return { bg: "#dbeafe", text: "#1e40af" }; // Good
    if (score >= 5) return { bg: "#fef3c7", text: "#92400e" }; // Fair
    return { bg: "#fee2e2", text: "#991b1b" }; // Needs work
  };

  const serviceTypeLabel = (t) => {
    const map = {
      sunday_service: "Sunday Service",
      midweek: "Midweek Service",
      special: "Special Service",
    };
    return map[t] || t;
  };

  return (
    <Page
      title="Service Reviews Dashboard"
      subtitle="Monitor congregation feedback and rating trends"
    >
      {/* Stats Section */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
          <StatCard label="Total Submissions" value={stats.total_submissions} icon="forms" />
          <StatCard label="Overall Avg Rating" value={`${stats.average_rating || 0} / 10`} icon="dashboard" accent />

          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>Rating Breakdown</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px 16px" }}>
              {[
                { label: "Excellent (9-10)", val: stats.ratings_breakdown?.excellent || 0, color: "#10b981" },
                { label: "Good (7-8)", val: stats.ratings_breakdown?.good || 0, color: "#3b82f6" },
                { label: "Fair (5-6)", val: stats.ratings_breakdown?.fair || 0, color: "#f59e0b" },
                { label: "Needs Work (1-4)", val: stats.ratings_breakdown?.needs_work || 0, color: "#ef4444" },
              ].map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
                  <span style={{ color: "#4b5563", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: b.color }} />
                    {b.label}
                  </span>
                  <span style={{ fontWeight: 700, color: "#111827" }}>{b.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 200px" }}>
            <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Search Submitter Name</label>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name..."
              style={{ ...inputStyle, minHeight: 40 }}
            />
          </div>
          <div style={{ flex: "1 1 150px" }}>
            <Input
              label="Service Type"
              type="dropdown"
              options={[
                { value: "all", label: "All Services" },
                { value: "sunday_service", label: "Sunday Service" },
                { value: "midweek", label: "Midweek Service" },
                { value: "special", label: "Special Service" }
              ]}
              value={serviceType}
              onChange={v => { setServiceType(v); setPage(1); }}
              small
            />
          </div>
          <div style={{ flex: "1 1 150px" }}>
            <Input
              label="From Date"
              type="date"
              value={dateFrom}
              onChange={v => { setDateFrom(v); setPage(1); }}
              small
            />
          </div>
          <div style={{ flex: "1 1 150px" }}>
            <Input
              label="To Date"
              type="date"
              value={dateTo}
              onChange={v => { setDateTo(v); setPage(1); }}
              small
            />
          </div>
          {(search || serviceType !== "all" || dateFrom || dateTo) && (
            <Btn
              variant="ghost"
              onClick={() => {
                setSearch("");
                setServiceType("all");
                setDateFrom("");
                setDateTo("");
                setPage(1);
              }}
              style={{ height: 40, marginBottom: 16 }}
            >
              Clear Filters
            </Btn>
          )}
          <div style={{ flex: "1 1 150px", marginBottom: 16 }}>
            <Btn onClick={handlePrintReviews} variant="accent" style={{ minHeight: 40, width: "100%", justifyContent: "center" }}>
              <Icon name="print" size={16} /> Print PDF
            </Btn>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#4b5563", fontFamily: "'DM Sans', sans-serif" }}>
          Loading service reviews...
        </div>
      ) : (
        <>
          <Table
            headers={role === "cms" ? ["Date", "Submitter", "Role", "Service", "Avg Rating", "Actions"] : ["Date", "Submitter", "Role", "Service", "Avg Rating"]}
            onRowClick={(i) => setSelectedReview(reviews[i])}
            rows={reviews.map(r => {
              const scoreColor = getScoreColor(r.overall_average);
              const columns = [
                new Date(r.service_date).toLocaleDateString(),
                <div style={{ fontWeight: 600, color: "#0B1F3B" }}>{r.full_name}</div>,
                <Badge label={r.role} />,
                serviceTypeLabel(r.service_type),
                <span style={{
                  background: scoreColor.bg,
                  color: scoreColor.text,
                  padding: "3px 10px",
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 700
                }}>
                  {r.overall_average?.toFixed(1) || "0.0"}
                </span>
              ];
              if (role === "cms") {
                columns.push(
                  <button
                    onClick={(e) => handleDelete(r._id || r.id, e)}
                    disabled={deletingId === (r._id || r.id)}
                    style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4 }}
                    title="Delete Review"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                );
              }
              return columns;
            })}
          />

          {/* Pagination Controls */}
          {pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 24, fontFamily: "'DM Sans', sans-serif" }}>
              <Btn
                variant="ghost"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                small
              >
                Previous
              </Btn>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
                Page {page} of {pages}
              </span>
              <Btn
                variant="ghost"
                disabled={page === pages}
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                small
              >
                Next
              </Btn>
            </div>
          )}
        </>
      )}

      {/* Review Detail Modal */}
      {selectedReview && (
        <Modal
          title={`Review by ${selectedReview.full_name}`}
          onClose={() => setSelectedReview(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18, paddingRight: 6 }}>
            {/* Metadata Header */}
            <div style={{ display: "flex", gap: 16, alignItems: "center", borderBottom: "1px solid #e5e7eb", paddingBottom: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%", background: "#0B1F3B", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans', sans-serif"
              }}>
                {selectedReview.full_name ? selectedReview.full_name[0].toUpperCase() : "?"}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0B1F3B", fontFamily: "'DM Sans', sans-serif" }}>{selectedReview.full_name}</h4>
                <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                  <Badge label={selectedReview.role} />
                  <span style={{ fontSize: 12, color: "#6b7280", fontFamily: "'DM Sans', sans-serif" }}>
                    Service: <strong>{serviceTypeLabel(selectedReview.service_type)}</strong> ({new Date(selectedReview.service_date).toLocaleDateString()})
                  </span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{
                  background: getScoreColor(selectedReview.overall_average).bg,
                  color: getScoreColor(selectedReview.overall_average).text,
                  padding: "6px 12px", borderRadius: 10, fontSize: 16, fontWeight: 800,
                  fontFamily: "'DM Sans', sans-serif"
                }}>
                  {selectedReview.overall_average?.toFixed(1)}
                </div>
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>OVERALL</div>
              </div>
            </div>

            {/* Ratings Breakdown Grid */}
            <div>
              <h5 style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "'DM Sans', sans-serif" }}>
                Detailed Category Scores (1-10)
              </h5>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* 1. Worship & Audio */}
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontWeight: 700, color: "#0B1F3B", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                    Worship & Sound Quality
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#4b5563" }}>Worship Leading</span>
                      <strong style={{ color: "#111827" }}>{selectedReview.worship_team_leading} / 10</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#4b5563" }}>Sound & Audio Quality</span>
                      <strong style={{ color: "#111827" }}>{selectedReview.sound_audio_quality} / 10</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#4b5563" }}>Song Selection Appropriate</span>
                      <strong style={{ color: "#111827" }}>{selectedReview.song_selection} / 10</strong>
                    </div>
                  </div>
                </div>

                {/* 2. Ushering */}
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontWeight: 700, color: "#0B1F3B", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                    Ushering & Atmosphere
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#4b5563" }}>Welcoming Atmosphere</span>
                      <strong style={{ color: "#111827" }}>{selectedReview.welcoming_atmosphere} / 10</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#4b5563" }}>Seating Management & Order</span>
                      <strong style={{ color: "#111827" }}>{selectedReview.usher_seating_order} / 10</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#4b5563" }}>Offering Handout Transitions</span>
                      <strong style={{ color: "#111827" }}>{selectedReview.offering_transitions} / 10</strong>
                    </div>
                  </div>
                </div>

                {/* 3. Children's Church */}
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontWeight: 700, color: "#0B1F3B", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                    Children & Youth Ministry
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#4b5563" }}>Youth Engagement & Care</span>
                      <strong style={{ color: "#111827" }}>{selectedReview.children_youth_engagement} / 10</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#4b5563" }}>Children Area Safety</span>
                      <strong style={{ color: "#111827" }}>{selectedReview.children_area_safety} / 10</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#4b5563" }}>Teachers Prepared / Material</span>
                      <strong style={{ color: "#111827" }}>{selectedReview.materials_teachers_prepared} / 10</strong>
                    </div>
                  </div>
                </div>

                {/* 4. Media */}
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontWeight: 700, color: "#0B1F3B", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                    Media, Display & Livestream
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#4b5563" }}>Lyrics & Scripture Projection</span>
                      <strong style={{ color: "#111827" }}>{selectedReview.projection_displays} / 10</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#4b5563" }}>Livestream Video / Audio</span>
                      <strong style={{ color: "#111827" }}>{selectedReview.livestream_quality} / 10</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#4b5563" }}>Transitions & Technical Coordination</span>
                      <strong style={{ color: "#111827" }}>{selectedReview.media_transitions} / 10</strong>
                    </div>
                  </div>
                </div>

                {/* 5. Punctuality */}
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontWeight: 700, color: "#0B1F3B", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
                    Punctuality & Time Control
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#4b5563" }}>Service Started on Time</span>
                      <strong style={{ color: "#111827" }}>{selectedReview.service_start_time} / 10</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#4b5563" }}>Overall Service Duration</span>
                      <strong style={{ color: "#111827" }}>{selectedReview.overall_time_management} / 10</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#4b5563" }}>Teams Setup & Ready Early</span>
                      <strong style={{ color: "#111827" }}>{selectedReview.teams_ready_before_service} / 10</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments / Suggestions */}
            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <span style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                    Service Highlight
                  </span>
                  <div style={{ fontSize: 14, color: "#111827", fontFamily: "'DM Sans', sans-serif", background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0", lineHeight: 1.5 }}>
                    {selectedReview.highlight || "No highlights entered."}
                  </div>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                    Areas of Improvement
                  </span>
                  <div style={{ fontSize: 14, color: "#111827", fontFamily: "'DM Sans', sans-serif", background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0", lineHeight: 1.5 }}>
                    {selectedReview.improvement_suggestions || "No suggestions entered."}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 10, marginTop: 12, borderTop: "1px solid #e5e7eb", paddingTop: 16, justifyContent: "space-between" }}>
              <Btn onClick={() => setSelectedReview(null)} variant="ghost">Close</Btn>
              {role === "cms" && (
                <Btn
                  onClick={(e) => {
                    if (confirm("Delete this review?")) {
                      handleDelete(selectedReview._id || selectedReview.id, e);
                    }
                  }}
                  variant="danger"
                >
                  <Icon name="trash" size={14} /> Delete Review
                </Btn>
              )}
            </div>
          </div>
        </Modal>
      )}
    </Page>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// PUBLIC SERVICE REVIEW FORM
// ════════════════════════════════════════════════════════════════════════════════
const RatingSelector = ({ label, field, value, onChange }) => {
  const [hovered, setHovered] = useState(null);
  const getColor = (n) => {
    if (n <= 4) return { active: "#ef4444", bg: "#fee2e2" };
    if (n <= 6) return { active: "#f59e0b", bg: "#fef3c7" };
    if (n <= 8) return { active: "#3b82f6", bg: "#dbeafe" };
    return { active: "#10b981", bg: "#d1fae5" };
  };
  const display = hovered || value;
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4, maxWidth: "75%" }}>{label}</label>
        <span style={{
          fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
          color: display ? getColor(display).active : "#9ca3af",
          minWidth: 60, textAlign: "right"
        }}>{display ? `${display} / 10` : "Rate 1–10"}</span>
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
          const col = getColor(n);
          const isActive = value >= n;
          const isHov = hovered !== null && hovered >= n;
          return (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onChange(field, n)}
              style={{
                width: 32, height: 32, borderRadius: 8, border: "none",
                background: isHov ? col.bg : isActive ? col.bg : "#f3f4f6",
                color: isHov ? col.active : isActive ? col.active : "#9ca3af",
                fontWeight: 700, fontSize: 13, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all .15s",
                transform: (isHov && hovered === n) ? "scale(1.15)" : "scale(1)",
                outline: value === n ? `2px solid ${col.active}` : "none",
                outlineOffset: 1,
              }}
            >{n}</button>
          );
        })}
      </div>
    </div>
  );
};

// Field names exactly match the backend model
const SERVICE_REVIEW_SECTIONS = [
  {
    emoji: "🎵",
    title: "Worship & Sound Quality",
    fields: [
      { field: "worship_team_leading", label: "How well did the worship team lead the congregation?" },
      { field: "sound_audio_quality", label: "How was the overall sound and audio quality?" },
      { field: "song_selection", label: "Was the song selection appropriate for the service theme?" },
    ]
  },
  {
    emoji: "🤝",
    title: "Ushering & Atmosphere",
    fields: [
      { field: "welcoming_atmosphere", label: "How welcoming was the atmosphere as people arrived?" },
      { field: "usher_seating_order", label: "How effectively did the ushers manage seating and order?" },
      { field: "offering_transitions", label: "How smoothly were the offering and service transitions managed?" },
    ]
  },
  {
    emoji: "👶",
    title: "Children & Youth Ministry",
    fields: [
      { field: "children_youth_engagement", label: "How well were children and youth engaged and cared for?" },
      { field: "children_area_safety", label: "How safe and secure was the children\'s area?" },
      { field: "materials_teachers_prepared", label: "How prepared were the teachers/ministers with materials?" },
    ]
  },
  {
    emoji: "💻",
    title: "Media, Display & Livestream",
    fields: [
      { field: "projection_displays", label: "How well were lyrics and scriptures projected?" },
      { field: "livestream_quality", label: "How was the livestream video/audio quality?" },
      { field: "media_transitions", label: "How smooth were transitions and technical coordination?" },
    ]
  },
  {
    emoji: "⏰",
    title: "Punctuality & Time Control",
    fields: [
      { field: "service_start_time", label: "Did the service start on time?" },
      { field: "overall_time_management", label: "How was the overall service duration and time management?" },
      { field: "teams_ready_before_service", label: "Were all teams set up and ready before service?" },
    ]
  },
];

// Roles accepted by the backend enum
const ROLE_OPTIONS = [
  { value: "member", label: "Member" },
  { value: "worker", label: "Worker" },
  { value: "leader", label: "Leader" },
  { value: "pastor", label: "Pastor" },
  { value: "visitor", label: "Visitor" },
];

const ServiceReviewFormPage = ({ onBack, inline = false, onSuccess = null }) => {
  const emptyRatings = {};
  SERVICE_REVIEW_SECTIONS.forEach(s => s.fields.forEach(f => { emptyRatings[f.field] = 0; }));

  const [form, setForm] = useState({
    role: "member",
    service_date: "",
    service_type: "",
    highlight: "",
    improvement_suggestions: "",
    ...emptyRatings,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(6);

  useEffect(() => {
    if (!submitted || inline) return;
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    const r = setTimeout(() => { window.location.href = "https://citadeloftruthandmercyassembly.netlify.app/"; }, 6000);
    return () => { clearInterval(t); clearTimeout(r); };
  }, [submitted, inline]);

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const ratedCount = Object.entries(form).filter(([k, v]) => emptyRatings.hasOwnProperty(k) && v > 0).length;
  const totalFields = Object.keys(emptyRatings).length;
  const pct = Math.round((ratedCount / totalFields) * 100);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.service_date) { setError("Please select the service date."); return; }
    if (!form.service_type) { setError("Please select the service type."); return; }
    const unrated = SERVICE_REVIEW_SECTIONS.flatMap(s => s.fields).filter(f => !form[f.field]);
    if (unrated.length > 0) { setError(`Please rate all ${totalFields} items. ${unrated.length} remaining.`); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(API_URLS.SERVICE_REVIEWS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        if (onSuccess) {
          onSuccess();
        } else {
          setSubmitted(true);
        }
      } else {
        const d = await res.json();
        setError(d.error || "Submission failed. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({
      role: "member",
      service_date: "",
      service_type: "",
      highlight: "",
      improvement_suggestions: "",
      ...emptyRatings,
    });
    setSubmitted(false);
    setError("");
  };

  if (submitted) {
    return (
      <div style={{
        minHeight: inline ? "auto" : "100vh",
        background: inline ? "transparent" : "linear-gradient(135deg, #0B1F3B 0%, #1a3a5c 50%, #0d2d4a 100%)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: inline ? 0 : 24,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{
          background: "#fff", borderRadius: 24, padding: "48px 40px", textAlign: "center",
          maxWidth: 460, width: "100%", boxShadow: inline ? "none" : "0 40px 100px rgba(0,0,0,0.35)",
          animation: "scaleIn .3s ease",
        }}>
          <div style={{
            display: "inline-flex", background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
            color: "#059669", borderRadius: "50%", padding: 20, marginBottom: 28,
            boxShadow: "0 8px 24px rgba(16,185,129,0.25)",
          }}>
            <Icon name="check" size={48} />
          </div>
          <h2 style={{ margin: "0 0 12px", fontSize: 26, fontWeight: 800, color: "#0B1F3B" }}>Submitted Successfully!</h2>
          <p style={{ margin: "0 0 8px", color: "#6b7280", fontSize: 15, lineHeight: 1.6 }}>
            Thank you! Your anonymous review has been recorded.
          </p>
          <p style={{ margin: "0 0 32px", color: "#9ca3af", fontSize: 13 }}>Your feedback helps us improve every service.</p>
          
          {inline ? (
            <button
              onClick={handleReset}
              style={{
                marginTop: 20, background: "#0B1F3B", color: "#fff", border: "none",
                borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 700,
                cursor: "pointer", width: "100%"
              }}
            >
              Submit Another Review
            </button>
          ) : (
            <>
              <div style={{
                background: "#f0f4ff", borderRadius: 14, padding: "16px 20px",
                display: "flex", alignItems: "center", gap: 14, justifyContent: "center"
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  border: "2.5px solid #3b82f6", borderTopColor: "transparent",
                  animation: "spin 1s linear infinite", flexShrink: 0
                }} />
                <span style={{ color: "#1e40af", fontSize: 14, fontWeight: 600 }}>
                  Returning to church website in {countdown}s…
                </span>
              </div>
              <button
                onClick={() => { window.location.href = "https://citadeloftruthandmercyassembly.netlify.app/"; }}
                style={{
                  marginTop: 20, background: "#0B1F3B", color: "#fff", border: "none",
                  borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 700,
                  cursor: "pointer", width: "100%"
                }}
              >
                Go to Church Website
              </button>
            </>
          )}
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } @keyframes scaleIn { from { transform: scale(0.93); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: inline ? "auto" : "100vh",
      background: inline ? "transparent" : "#f8fafc",
      fontFamily: "'DM Sans', sans-serif",
      paddingBottom: inline ? 0 : 60,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; max-width: 100%; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes scaleIn { from { transform: scale(0.93); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes fadeUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px !important; }
        .sr-section { animation: fadeUp .35s ease both; }
        .sr-section:nth-child(1) { animation-delay: .05s; }
        .sr-section:nth-child(2) { animation-delay: .1s; }
        .sr-section:nth-child(3) { animation-delay: .15s; }
        .sr-section:nth-child(4) { animation-delay: .2s; }
        .sr-section:nth-child(5) { animation-delay: .25s; }
        .sr-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .sr-details-grid > div { min-width: 0; overflow: hidden; }
        .sr-details-grid input, .sr-details-grid select { min-width: 0; width: 100% !important; }
        @media (max-width: 520px) { .sr-details-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* Header */}
      {!inline && (
        <div style={{
          background: "#fff", borderBottom: "1px solid #e5e7eb",
          padding: "16px 24px", display: "flex", alignItems: "center", gap: 16,
          position: "sticky", top: 0, zIndex: 100,
        }}>
          <img src={churchLogo} alt="Citadel" style={{ width: 38, height: 38, objectFit: "contain", borderRadius: 8 }} />
          <div>
            <div style={{ color: "#0B1F3B", fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>Citadel of Truth and Mercy Assembly</div>
            <div style={{ color: "#6b7280", fontSize: 12, fontWeight: 500 }}>Post-Service Review Form</div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: inline ? "100%" : 700, margin: "0 auto", padding: inline ? 0 : "28px 16px 0" }}>

        {/* Title block */}
        {!inline && (
          <div style={{ textAlign: "center", marginBottom: 28, animation: "fadeUp .3s ease" }}>
            <h1 style={{ color: "#0B1F3B", fontSize: 26, fontWeight: 800, margin: "0 0 8px" }}>Service Review Form</h1>
            <p style={{ color: "#6b7280", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              Help us improve by rating today's service across {totalFields} key areas.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Service Details card */}
          <div style={{
            background: "#fff", borderRadius: 12, padding: "20px 24px",
            marginBottom: 20, border: "1px solid #e5e7eb",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            animation: "fadeUp .3s ease",
          }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#0B1F3B", borderBottom: "1px solid #f3f4f6", paddingBottom: 10 }}>
              Service Details
            </h3>
            <div className="sr-details-grid">
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Service Date <span style={{ color: "#ef4444" }}>*</span></label>
                <input
                  type="date" value={form.service_date}
                  onChange={e => setField("service_date", e.target.value)}
                  style={{
                    width: "100%", height: 40, padding: "0 12px", border: "1.5px solid #e5e7eb",
                    borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                    outline: "none", background: "#fafafa", boxSizing: "border-box", cursor: "pointer"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Service Type <span style={{ color: "#ef4444" }}>*</span></label>
                <select
                  value={form.service_type}
                  onChange={e => setField("service_type", e.target.value)}
                  style={{
                    width: "100%", height: 40, padding: "0 12px", border: "1.5px solid #e5e7eb",
                    borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                    outline: "none", background: "#fafafa", boxSizing: "border-box", cursor: "pointer"
                  }}
                >
                  <option value="">Select type</option>
                  <option value="sunday_service">Sunday Service</option>
                  <option value="midweek">Midweek Service</option>
                  <option value="special">Special Service</option>
                </select>
              </div>
            </div>
          </div>

          {/* Rating legend */}
          <div style={{
            display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20,
            justifyContent: "center",
          }}>
            {[["1–4", "Needs work", "#ef4444", "#fee2e2"], ["5–6", "Fair", "#f59e0b", "#fef3c7"], ["7–8", "Good", "#3b82f6", "#dbeafe"], ["9–10", "Excellent", "#10b981", "#d1fae5"]].map(([range, label, color, bg]) => (
              <div key={range} style={{
                background: bg, color, borderRadius: 20, padding: "5px 14px",
                fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span>{range}</span>
                <span style={{ fontWeight: 400, color: color, opacity: 0.75 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Rating sections */}
          {SERVICE_REVIEW_SECTIONS.map((section) => (
            <div key={section.title} className="sr-section" style={{
              background: "#fff", borderRadius: 12, padding: "20px 20px 4px",
              marginBottom: 16, border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden",
            }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#0B1F3B", borderBottom: "1px solid #f3f4f6", paddingBottom: 10 }}>
                {section.title
              }</h3>
              {section.fields.map(f => (
                <RatingSelector
                  key={f.field}
                  field={f.field}
                  label={f.label}
                  value={form[f.field]}
                  onChange={setField}
                />
              ))}
            </div>
          ))}

          {/* Comments */}
          <div style={{
            background: "#fff", borderRadius: 12, padding: "24px 28px",
            marginBottom: 24, border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            animation: "fadeUp .4s .3s ease both",
          }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 700, color: "#0B1F3B", borderBottom: "1px solid #f3f4f6", paddingBottom: 10 }}>Comments (Optional)</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Service Highlight</label>
              <textarea
                value={form.highlight}
                onChange={e => setField("highlight", e.target.value)}
                placeholder="What stood out positively in today's service?"
                rows={3}
                style={{
                  width: "100%", padding: "10px 14px", border: "1.5px solid #e5e7eb",
                  borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                  outline: "none", background: "#fafafa", resize: "vertical", boxSizing: "border-box"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Areas of Improvement</label>
              <textarea
                value={form.improvement_suggestions}
                onChange={e => setField("improvement_suggestions", e.target.value)}
                placeholder="What could be done better next time?"
                rows={3}
                style={{
                  width: "100%", padding: "10px 14px", border: "1.5px solid #e5e7eb",
                  borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                  outline: "none", background: "#fafafa", resize: "vertical", boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)",
              borderRadius: 12, padding: "12px 18px", marginBottom: 16,
              fontSize: 14, color: "#ef4444", fontWeight: 500,
            }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%", background: submitting ? "#6b7280" : "#0B1F3B",
              color: "#fff", border: "none", borderRadius: 12,
              padding: "14px", fontSize: 15, fontWeight: 700,
              cursor: submitting ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              transition: "all .2s",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {submitting && (
              <span style={{
                display: "inline-block", width: 16, height: 16,
                border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
                borderRadius: "50%", animation: "spin .7s linear infinite"
              }} />
            )}
            {submitting ? "Submitting..." : `Submit Review (${ratedCount}/${totalFields} rated)`}
          </button>
        </form>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// REDUCER
// ════════════════════════════════════════════════════════════════════════════════
function reducer(state, action) {
  switch (action.type) {
    case "LOGOUT": {
      try {
        localStorage.removeItem("church_cms_last_activity");
        localStorage.removeItem("citadel_session_token");
      } catch (e) { console.error(e); }
      return { ...state, session: null };
    }
    case "SYNC_DATA": {
      if (action.key === "formFields") {
        if (action.data && action.data.length > 0) {
          // Dynamically group by any form_type (supports per-event slugs like event_easter_sunday)
          const grouped = {};
          action.data.forEach(f => {
            const key = f.form_type;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push({ ...f, id: f._id || f.id });
          });
          Object.keys(grouped).forEach(k => { grouped[k].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)); });
          return { ...state, formFields: { ...state.formFields, ...grouped } };
        }
        return state;
      }
      const data = action.data.map(item => {
        let mapped = { ...item, id: item._id || item.id };
        if (action.key === "attendance" && item.user_id && typeof item.user_id === 'object') {
          mapped.user_id = item.user_id._id || item.user_id.id;
          mapped.user_full_name = item.user_id.full_name;
        }
        return mapped;
      });
      return { ...state, [action.key]: data };
    }
    case "LOGIN": {
      try {
        localStorage.setItem("church_cms_last_activity", Date.now().toString());
      } catch (e) { console.error(e); }
      return { ...state, session: action.session };
    }
    case "DELETE_USER": return { ...state, users: state.users.filter(u => u._id !== action.id) };
    case "UPDATE_USER": return {
      ...state,
      users: state.users.map(u => u._id === action.id ? { ...u, tag: action.tag, department: action.department } : u)
    };
    case "ADD_FIELD": {
      const list = [...(state.formFields[action.formType] || []), action.field].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      return {
        ...state,
        formFields: { ...state.formFields, [action.formType]: list }
      };
    }
    case "DELETE_FIELD": return {
      ...state,
      formFields: { ...state.formFields, [action.formType]: state.formFields[action.formType].filter(f => f.id !== action.id) }
    };
    case "TOGGLE_FIELD": return {
      ...state,
      formFields: {
        ...state.formFields,
        [action.formType]: state.formFields[action.formType].map(f => f.id === action.id ? { ...f, active: !f.active } : f)
      }
    };

    case "REGISTER_USER": {
      const vals = action.values;
      const isWorker = vals.role_type === "Worker";
      const tag = action.formType === "first_timer" ? "first_timer" : (isWorker ? "worker" : "member");
      return {
        ...state,
        users: [{
          _id: "u" + Date.now(), full_name: vals.full_name || "New User",
          email: vals.email || "", phone: vals.phone || "",
          tag, department: isWorker ? vals.department || null : null,
          created_at: new Date().toISOString(),
        }, ...state.users]
      };
    }
    case "BATCH_SYNC": {
      // Applied by fetchData() — processes each { key, data } update with the
      // same normalization logic used by SYNC_DATA (id aliasing, attendance expansion).
      let next = { ...state };
      for (const { key, data } of action.updates) {
        if (!Array.isArray(data)) continue;
        if (key === "formFields") {
          if (data.length > 0) {
            // Dynamically group by any form_type (supports per-event slugs)
            const grouped = {};
            data.forEach(f => {
              const k = f.form_type;
              if (!grouped[k]) grouped[k] = [];
              grouped[k].push({ ...f, id: f._id || f.id });
            });
            Object.keys(grouped).forEach(k => { grouped[k].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)); });
            next.formFields = { ...next.formFields, ...grouped };
          }
        } else {
          next[key] = data.map(item => {
            let mapped = { ...item, id: item._id || item.id };
            if (key === "attendance" && item.user_id && typeof item.user_id === "object") {
              mapped.user_id = item.user_id._id || item.user_id.id;
              mapped.user_full_name = item.user_id.full_name;
            }
            return mapped;
          });
        }
      }
      return next;
    }
    default: return state;
  }
}

// ─── NOTIFICATION PROMPT ──────────────────────────────────────────────────────
const NotificationPrompt = ({ onAllow, permission }) => (
  <div style={{
    position: "fixed", inset: 0, zIndex: 10000,
    background: "#0B1F3B",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    textAlign: "center", color: "#fff", fontFamily: "'DM Sans', sans-serif"
  }}>
    <div style={{ maxWidth: 400 }}>
      <div style={{ background: "#F4C430", borderRadius: 20, padding: 16, display: "inline-flex", marginBottom: 24 }}>
        <Icon name="bell" size={48} />
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Enable Notifications</h1>
      <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: 32 }}>
        To ensure you receive important updates and reminders, please enable notifications. This is required to access the Citadel CMS.
      </p>
      {permission === "denied" ? (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <p style={{ margin: 0, color: "#f87171", fontSize: 14 }}>
            Notifications are blocked. Please reset permission in your browser settings to continue.
          </p>
        </div>
      ) : (
        <button onClick={onAllow} style={{
          background: "#F4C430", color: "#0B1F3B", border: "none",
          borderRadius: 12, padding: "16px 32px", fontSize: 16, fontWeight: 700,
          cursor: "pointer", transition: "transform .2s",
        }} onMouseEnter={e => e.target.style.transform = "scale(1.02)"} onMouseLeave={e => e.target.style.transform = "scale(1)"}>
          Allow Notifications
        </button>
      )}
    </div>
  </div>
);

const SuccessPage = ({ message, redirectUrl }) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    const redirectTimer = setTimeout(() => {
      window.location.href = redirectUrl;
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirectTimer);
    };
  }, [redirectUrl]);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0B1F3B 0%, #1e3a6e 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 40, textAlign: "center", maxWidth: 400, boxShadow: "0 32px 80px rgba(0,0,0,0.3)", animation: "scaleIn .2s ease" }}>
        <div style={{ display: "inline-flex", background: "#d1fae5", color: "#059669", borderRadius: "50%", padding: 16, marginBottom: 24 }}>
          <Icon name="check" size={48} />
        </div>
        <h2 style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 800, color: "#0B1F3B", fontFamily: "'DM Sans', sans-serif" }}>Registration Successful!</h2>
        <p style={{ margin: "0 0 32px", color: "#6b7280", fontSize: 15, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>{message || "Thank you for registering. You will receive a welcome message shortly."}</p>

        <div style={{ background: "#f0f4ff", padding: "12px 16px", borderRadius: 12, display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid #3b82f6", borderTopColor: "transparent", animation: "spin 1s linear infinite" }}></div>
          <span style={{ color: "#1e40af", fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Redirecting to website in {countdown}s...</span>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};

// Patch fetch to always send cookies (DB Sessions) and Bearer tokens (fallback for cross-site cookie restrictions)
try {
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    let [resource, config] = args;
    if (!config) config = {};
    if (typeof resource === 'string' && (resource.startsWith(API_URLS.BASE || "http") || resource.startsWith('/'))) {
      config.credentials = 'include';
      try {
        const localToken = localStorage.getItem("citadel_session_token");
        if (localToken) {
          if (!config.headers) config.headers = {};
          if (config.headers instanceof Headers) {
            if (!config.headers.has("Authorization")) {
              config.headers.set("Authorization", `Bearer ${localToken}`);
            }
          } else {
            if (!config.headers["Authorization"] && !config.headers["authorization"]) {
              config.headers["Authorization"] = `Bearer ${localToken}`;
            }
          }
        }
      } catch (e) {
        console.error("Failed to read token from localStorage", e);
      }
    }
    // Use call(window, resource, config) to pass the modified config and prevent "Illegal invocation" errors in Safari/iOS
    return originalFetch.call(window, resource, config);
  };
} catch (err) {
  console.error("Failed to patch fetch:", err);
}

// ════════════════════════════════════════════════════════════════════════════════
// CHANGE PASSWORD MODAL
// ════════════════════════════════════════════════════════════════════════════════
const ChangePasswordModal = ({ onSuccess, showToast }) => {
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleChange = async () => {
    if (!newPass) { setErr("Please enter a new password."); return; }
    if (newPass !== confirmPass) { setErr("Passwords do not match."); return; }
    if (newPass.length < 6) { setErr("Password must be at least 6 characters."); return; }
    setErr("");
    setSaving(true);
    try {
      const res = await fetch(API_URLS.AUTH_CHANGE_PASSWORD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPass })
      });
      if (res.ok) {
        onSuccess();
        showToast("Password updated successfully!", "success");
      } else {
        const d = await res.json();
        setErr(d.error || "Update failed");
      }
    } catch (e) {
      setErr("Server connection failed. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 20000, background: "rgba(11,31,59,0.9)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: 32, width: "100%", maxWidth: 400, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 800, color: "#0B1F3B", fontFamily: "'DM Sans', sans-serif" }}> Change Password</h2>
        <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>For security, please change your temporary password before continuing.</p>
        {err && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#dc2626", fontFamily: "'DM Sans', sans-serif" }}>{err}</div>}
        <Input label="New Password" type="password" value={newPass} onChange={setNewPass} placeholder="Enter new secure password" autoComplete="new-password" name="newPass" />
        <Input label="Confirm Password" type="password" value={confirmPass} onChange={setConfirmPass} placeholder="Confirm your password" autoComplete="new-password" name="confirmPass" />
        <div style={{ marginTop: 24 }}>
          <Btn onClick={handleChange} variant="primary" disabled={saving} style={{ width: "100%", justifyContent: "center" }}>
            {saving && <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} />}
            {saving ? "Updating..." : "Update & Continue"}
          </Btn>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ════════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [state, dispatch_] = useState({ ...INITIAL_STATE, session: null });
  const [isInitializingSession, setIsInitializingSession] = useState(true);
  const [toast, setToast] = useState(null);
  const [publicForm, setPublicForm] = useState(() => {
    if (typeof window === "undefined") return null;
    const path = window.location.pathname;
    if (path.includes("/first-timer")) return "first_timer";
    if (path.includes("/member")) return "member_worker";
    if (path.includes("/reviews")) return "service_review";

    const hash = window.location.hash;
    if (hash === "#/register/first-timer") return "first_timer";
    if (hash === "#/register/member-worker") return "member_worker";
    if (hash === "#/service-review") return "service_review";
    return null;
  }); // "first_timer" | "member_worker"
  const [redirectUrl, setRedirectUrl] = useState("/");
  const [notifPermission, setNotifPermission] = useState(() => typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default");
  const [forceChangePassword, setForceChangePassword] = useState(false);
  // Auto-logout: stores the configured timeout in ms; defaults to 10 minutes
  const autoLogoutMsRef = useRef(10 * 60 * 1000);

  // Fetch the auto_logout_minutes setting on mount and keep the ref in sync
  useEffect(() => {
    const loadLogoutSetting = async () => {
      try {
        const res = await fetch(API_URLS.SETTINGS);
        if (res.ok) {
          const data = await res.json();
          if (data.auto_logout_minutes) {
            const mins = parseInt(data.auto_logout_minutes, 10);
            if (!isNaN(mins) && mins > 0) {
              autoLogoutMsRef.current = mins * 60 * 1000;
            }
          }
        }
      } catch (_) { /* silently fail — keep default */ }
    };
    loadLogoutSetting();
  }, []);

  const dispatch = (action) => dispatch_(prev => reducer(prev, action));
  const showToast = (msg, type = "success") => setToast({ msg, type });

  // Init DB Session from Cookie / localStorage token fallback
  useEffect(() => {
    const initSession = async () => {
      try {
        const localToken = localStorage.getItem("citadel_session_token");
        const res = await fetch(API_URLS.AUTH_ME, {
          headers: localToken ? { "Authorization": `Bearer ${localToken}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          // Ensure token is preserved in session state
          const restoredSession = { ...data.session, token: data.session.token || localToken };
          if (restoredSession.type === "cms" && !restoredSession.admin) {
            restoredSession.admin = { id: "cms", role: "cms", name: "CMS Root" };
          }
          if (restoredSession.admin && restoredSession.admin.role === "financial_admin") {
            restoredSession.admin.role = "finance_admin";
          }
          dispatch({ type: "LOGIN", session: restoredSession });
        } else {
          // If authorization check fails, clean up localStorage token
          localStorage.removeItem("citadel_session_token");
        }
      } catch (err) {
        console.error("Failed to restore session", err);
      } finally {
        setIsInitializingSession(false);
      }
    };
    initSession();
  }, []);

  useEffect(() => {
    if (!state.session) return;

    if (!localStorage.getItem("church_cms_last_activity")) {
      localStorage.setItem("church_cms_last_activity", Date.now().toString());
    }

    const updateActivity = () => {
      try {
        localStorage.setItem("church_cms_last_activity", Date.now().toString());
      } catch (e) { console.error(e); }
    };

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, updateActivity));

    const interval = setInterval(() => {
      try {
        const lastActivity = parseInt(localStorage.getItem("church_cms_last_activity") || "0", 10);
        if (lastActivity > 0) {
          const diff = Date.now() - lastActivity;
          if (diff > autoLogoutMsRef.current) {
            const mins = Math.round(autoLogoutMsRef.current / 60000);
            fetch(API_URLS.AUTH_LOGOUT, { method: "POST" }).catch(console.error);
            dispatch({ type: "LOGOUT" });
            showToast(`Logged out due to ${mins} minute${mins !== 1 ? "s" : ""} of inactivity`, "warning");
          }
        }
      } catch (e) { console.error(e); }
    }, 5000);

    return () => {
      events.forEach(e => window.removeEventListener(e, updateActivity));
      clearInterval(interval);
    };
  }, [state.session]);

  useEffect(() => {
    const handleHash = () => {
      const path = window.location.pathname;
      if (path.includes("/first-timer")) {
        setPublicForm("first_timer");
        return;
      }
      if (path.includes("/member")) {
        setPublicForm("member_worker");
        return;
      }
      if (path.includes("/reviews")) {
        setPublicForm("service_review");
        return;
      }

      const hash = window.location.hash;
      if (hash === "#/register/first-timer") setPublicForm("first_timer");
      else if (hash === "#/register/member-worker") setPublicForm("member_worker");
      else if (hash === "#/service-review") setPublicForm("service_review");
      else if (hash === "" || hash === "#/") setPublicForm(null);
    };

    window.addEventListener("hashchange", handleHash);
    handleHash();

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === 'granted') {
      requestForToken(state.session?.token);
    }

    const fetchFormFields = async () => {
      try {
        const res = await fetch(API_URLS.FORMS);
        if (res.ok) {
          const data = await res.json();
          dispatch_((prev) => reducer(prev, { type: "SYNC_DATA", key: "formFields", data }));
        }
      } catch (err) { console.error("Failed to fetch forms", err); }
    };
    fetchFormFields();

    let unsubscribeMessage = null;
    try {
      unsubscribeMessage = onMessageListener(payload => {
        setToast({ msg: `${payload.notification.title}: ${payload.notification.body}`, type: "success" });
      });
    } catch (err) {
      console.log('failed to set up push listener: ', err);
    }

    let pollInterval = null;
    if (state.session) {
      fetchData();
      pollInterval = setInterval(fetchData, 10000);
    }

    return () => {
      window.removeEventListener("hashchange", handleHash);
      if (unsubscribeMessage) unsubscribeMessage();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [state.session]);

  const fetchData = async () => {
    try {
      const token = state.session?.token;
      const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

      // ── Wake-up ping for Render free-tier cold starts ──────────────────────
      // If the server is sleeping, the first requests fail with ERR_SSL_BAD_RECORD_MAC_ALERT.
      // Pinging /health first forces the server to wake before data fetches.
      try {
        await fetch(`${API_URLS.BASE}/health`, { signal: AbortSignal.timeout(8000) });
      } catch (_) { /* server may still be waking — continue anyway */ }

      const endpoints = [
        { key: "users", url: API_URLS.USERS },
        { key: "attendance", url: API_URLS.ATTENDANCE },
        { key: "messages", url: API_URLS.MESSAGES },
        { key: "admins", url: API_URLS.ADMINS },
        { key: "reminders", url: API_URLS.REMINDERS },
        { key: "financial", url: API_URLS.FINANCIAL },
        { key: "financialSections", url: API_URLS.FINANCIAL_SECTIONS },
        { key: "salaries", url: API_URLS.FINANCIAL_SALARIES },
        { key: "fundRequests", url: API_URLS.FINANCIAL_FUND_REQUESTS },
      ];

      // Helper: fetch with one automatic retry after a short delay
      const fetchWithRetry = async (url, options, retries = 1, delayMs = 2000) => {
        try {
          return await fetch(url, options);
        } catch (err) {
          if (retries > 0) {
            await new Promise(r => setTimeout(r, delayMs));
            return fetchWithRetry(url, options, retries - 1, delayMs);
          }
          throw err;
        }
      };

      const results = await Promise.all(
        endpoints.map(async ({ key, url }) => {
          try {
            const res = await fetchWithRetry(url, { headers: authHeaders });
            if (res.ok) {
              const data = await res.json();
              return { key, data };
            }
          } catch (e) {
            console.error(`Fetch failed for ${key}:`, e.message || e);
          }
          return null;
        })
      );

      const updates = results.filter(r => r !== null);
      if (updates.length > 0) {
        dispatch({ type: "BATCH_SYNC", updates });
      }
    } catch (err) {
      console.error("Fetch failed:", err);
    }
  };


  const handleAllowNotif = async () => {
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === 'granted') {
      requestForToken(state.session?.token);
    }
  };

  // Expose public form navigation to login page
  window._showPublic = setPublicForm;

  // Handle public registration
  if (publicForm) {
    if (publicForm === "success") {
      return (
        <>
          <style>{styles}</style>
          <SuccessPage redirectUrl={redirectUrl} />
        </>
      );
    }

    if (publicForm === "service_review") {
      return (
        <ServiceReviewFormPage onBack={() => {
          window.location.hash = "";
          setPublicForm(null);
        }} />
      );
    }

    return (
      <>
        <style>{styles}</style>
        <RegisterPage
          formType={publicForm}
          formFields={state.formFields}
          onSubmit={async (values, formType) => {
            try {
              const url = formType === "first_timer" ? API_URLS.REGISTER_FIRST_TIMER : API_URLS.REGISTER_MEMBER_WORKER;
              const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values)
              });
              if (res.ok) {
                dispatch({ type: "REGISTER_USER", values, formType });
                setRedirectUrl("https://citadeloftruthandmercyassembly.netlify.app/");
                setPublicForm("success");
                // showToast(data.message || "Registration successful! Welcome 🎉", "success");
              } else {
                const data = await res.json();
                showToast(data.error || "Registration failed", "error");
              }
            } catch (err) {
              showToast("Network error. Please try again.", "error");
            }
          }}
          onBack={() => setPublicForm(null)}
        />
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </>
    );
  }



  // Auth
  const handleLogin = async (email, password) => {

    // 2. Real Backend Login
    try {
      const res = await fetch(API_URLS.AUTH_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        const isCms = data.role === "cms";
        const normalizedRole = data.role === "financial_admin" ? "finance_admin" : data.role;
        const sessionPayload = {
          token: data.token,
          type: isCms ? "cms" : "admin",
          admin: isCms ? { id: "cms", role: "cms", name: data.name || "CMS Root" } : { id: data.id, role: normalizedRole, name: data.name }
        };
        try {
          localStorage.setItem("citadel_session_token", data.token);
        } catch (e) { console.error(e); }
        dispatch({ type: "LOGIN", session: sessionPayload });
        if (data.must_change_password) {
          setForceChangePassword(true);
        }
      } else {
        showToast(data.error || "Invalid credentials", "error");
      }
    } catch (err) {
      showToast("Server connection failed", "error");
    }
  };

  if (isInitializingSession) {
    return (
      <div style={{ minHeight: "100vh", background: "#0B1F3B", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!state.session) {
    return (
      <>
        <style>{styles}</style>
        <LoginPage onLogin={handleLogin} toast={showToast} />
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </>
    );
  }

  const { session } = state;

  if (forceChangePassword) {
    return <><style>{styles}</style><ChangePasswordModal onSuccess={() => setForceChangePassword(false)} showToast={showToast} /></>;
  }

  return (
    <>
      <style>{styles}</style>

      {session.type === "cms" && <CMSDashboard state={state} dispatch={dispatch} toast={showToast} />}
      {session.type === "admin" && session.admin.role === "media_admin" && <MediaDashboard state={state} dispatch={dispatch} toast={showToast} admin={session.admin} />}
      {session.type === "admin" && session.admin.role === "usher_admin" && <UsherDashboard state={state} dispatch={dispatch} toast={showToast} admin={session.admin} />}
      {session.type === "admin" && session.admin.role === "finance_admin" && <FinancialDashboard state={state} dispatch={dispatch} toast={showToast} admin={session.admin} />}
      {session.type === "admin" && session.admin.role === "leader" && <LeaderDashboard state={state} dispatch={dispatch} admin={session.admin} toast={showToast} />}
      {session.type === "admin" && session.admin.role === "quality_control" && <QualityControlDashboard state={state} dispatch={dispatch} toast={showToast} admin={session.admin} />}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  
  * {
    box-sizing: border-box;
    max-width: 100%;
  }
  
  html, body, #root {
    margin: 0;
    padding: 0;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden !important;
    position: relative;
    background: #f8fafc;
  }

  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  input[type=date]::-webkit-calendar-picker-indicator { cursor: pointer; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #f1f5f9; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  select { appearance: none; cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px !important; }

  .page-watermark {
    position: fixed;
    top: 50%;
    left: calc(50vw + 120px);
    transform: translate(-50%, -50%);
    opacity: 0.03;
    pointer-events: none;
    z-index: -1;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .page-watermark img {
    width: 550px;
    height: 550px;
    object-fit: contain;
    filter: grayscale(100%);
  }
  @media print {
    .page-watermark {
      opacity: 0.08 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .page-watermark img {
      filter: grayscale(100%) !important;
    }
  }

  @media (max-width: 768px) {
    html, body, #root {
      width: 100% !important;
      max-width: 100vw !important;
      overflow-x: hidden !important;
      position: relative;
    }
    
    main {
      margin-left: 0 !important;
      padding-top: 60px !important;
      width: 100% !important;
      max-width: 100% !important;
      overflow-x: hidden !important;
    }
    
    .page-container {
      padding: 16px 12px 32px !important;
      width: 100% !important;
      max-width: 100% !important;
      overflow-x: hidden !important;
    }
    
    .page-container > div {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 12px !important;
      width: 100% !important;
    }

    .page-container > div > div {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 8px !important;
      width: 100% !important;
      justify-content: flex-start !important;
    }
    
    .stat-card {
      min-width: 100% !important;
      width: 100% !important;
    }

    .reminder-form-card {
      width: 100% !important;
      max-width: 100% !important;
    }
    
    .page-watermark {
      left: 50% !important;
    }
    .page-watermark img {
      width: min(350px, 80vw) !important;
      height: min(350px, 80vw) !important;
    }
  }
`;
