"use client";

export type OSView = "office" | "ops" | "skills" | "memory" | "connectors";

interface NavRailProps {
  activeView: OSView;
  onViewChange: (v: OSView) => void;
  processingCount: number;
}

const NAV_ITEMS: { id: OSView; icon: string; label: string }[] = [
  { id: "office",     icon: "🏢", label: "Oficina" },
  { id: "ops",        icon: "⚡", label: "Operaciones" },
  { id: "skills",     icon: "🎯", label: "Skills" },
  { id: "memory",     icon: "🧠", label: "Memoria" },
  { id: "connectors", icon: "🔌", label: "Conectores" },
];

export default function NavRail({ activeView, onViewChange, processingCount }: NavRailProps) {
  return (
    <nav
      style={{
        width: "var(--nav-width)",
        background: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "14px 0",
        gap: 4,
        zIndex: 10,
        position: "relative",
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: "linear-gradient(135deg, var(--color-accent) 0%, var(--color-purple) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 800,
          color: "#fff",
          marginBottom: 12,
          letterSpacing: "-0.02em",
          flexShrink: 0,
        }}
      >
        AC
      </div>

      {/* Nav items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, width: "100%", padding: "0 8px" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`nav-item${isActive ? " active" : ""}`}
              title={item.label}
              style={{
                width: "100%",
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                position: "relative",
              }}
            >
              {item.icon}
              {/* Active indicator */}
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    left: -8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 3,
                    height: 20,
                    borderRadius: "0 2px 2px 0",
                    background: "var(--color-accent)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Processing indicator */}
      {processingCount > 0 && (
        <div
          className="status-dot-active"
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--color-warning)",
            marginBottom: 4,
          }}
        />
      )}

      {/* User badge */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #1a2a4a, #0a1525)",
          border: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--color-accent)",
          marginTop: 8,
          cursor: "default",
          }}
        title="CEO — Tú"
      >
        CEO
      </div>
    </nav>
  );
}
