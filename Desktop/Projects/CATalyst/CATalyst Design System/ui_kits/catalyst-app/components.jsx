// CATalyst UI Kit — shared components (Sidebar, AppShell, primitives)

const { useState, useEffect } = React;

// ----------- Sidebar -----------
function Sidebar({ active, onNav, mistakesLeft, goalDone, goalTotal }) {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: "◆" },
    { id: "practice",  label: "Practice",  icon: "◉" },
    { id: "errors",    label: "My Error Log", icon: "✕", badge: mistakesLeft },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="../../assets/icon-bolt.svg" width="40" height="40" alt="CATalyst bolt" />
        <span className="sidebar-brand-text">CATalyst</span>
      </div>

      <nav className="sidebar-nav">
        {items.map(it => (
          <div
            key={it.id}
            className={`nav-item ${it.id === "errors" ? "errors" : ""} ${active === it.id ? "active" : ""}`}
            onClick={() => onNav(it.id)}
          >
            <span className="nav-label"><span style={{width: 18, display:"inline-flex", justifyContent:"center"}}>{it.icon}</span>{it.label}</span>
            {it.badge != null && <span className="nav-badge">{it.badge}</span>}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="mistakes-pill" onClick={() => onNav("practice", { mode: "fix" })}>
          <span>{mistakesLeft} mistakes left</span>
          <span className="fix">Fix →</span>
        </div>
        <button className="upgrade-cta">⚡ Upgrade to Pro</button>
        <div className="trial-pill">
          <span>🕓 Trial: 2 days left</span>
          <span className="upgrade-link">Upgrade</span>
        </div>
        <div className="goal-card">
          <div className="label">Today's Goal</div>
          <div className="progress"><div style={{ width: `${(goalDone / goalTotal) * 100}%` }} /></div>
          <div className="count">{goalDone} / {goalTotal}</div>
        </div>

        <div className="user-chip">
          <div className="avatar">S</div>
          <div>
            <div className="name">Sahil Solankey</div>
            <div className="cohort">CAT 2026</div>
          </div>
          <span className="logout">→</span>
        </div>
      </div>
    </aside>
  );
}

// ----------- Top bar (theme toggle) -----------
function TopBar({ theme, onToggleTheme }) {
  return (
    <div className="topbar">
      <div />
      <button
        className="theme-toggle"
        onClick={onToggleTheme}
        title="Toggle theme"
      >{theme === "dark" ? "☀" : "☾"}</button>
    </div>
  );
}

// ----------- Floating chat FAB -----------
function ChatFab() {
  return <button className="chat-fab" title="Get help">💬</button>;
}

// ----------- Toast (auto-dismissing) -----------
function Toast({ children, k }) {
  return <div className="toast" key={k}>{children}</div>;
}

// Expose to other scripts
Object.assign(window, { Sidebar, TopBar, ChatFab, Toast });
