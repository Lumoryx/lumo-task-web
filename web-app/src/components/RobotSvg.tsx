const ACCENT = "var(--accent-primary)";

export function RobotSvg({ mood, size = 64 }: { mood: string; size?: number }) {
  const scale = size / 64;
  const bounceStyle: React.CSSProperties = {
    animation: mood === "excited"
      ? "petBounce 0.4s var(--ease-spring) infinite"
      : "petBounce 2.8s ease-in-out infinite",
    display: "block",
  };
  const eyeColor = mood === "excited" ? "#00ff88" : mood === "happy" ? ACCENT : "#4488cc";

  return (
    <div style={bounceStyle}>
      <svg
        width={64 * scale}
        height={72 * scale}
        viewBox="0 0 64 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: mood === "excited"
            ? "drop-shadow(0 4px 12px rgba(0,0,0,0.5)) drop-shadow(0 0 8px rgba(0,255,136,0.4))"
            : "drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
          overflow: "visible",
        }}
      >
        {/* Antenna */}
        <line x1="32" y1="4" x2="32" y2="13" stroke="#556" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="32" cy="3" r="3" fill={eyeColor} opacity="0.9" />
        {/* Head — square with rounded corners */}
        <rect x="11" y="10" width="42" height="30" rx="6" fill="#445566" />
        <rect x="13" y="12" width="38" height="26" rx="4" fill="#334455" />
        {/* Eye panels */}
        <rect x="16" y="16" width="13" height="10" rx="2" fill="#223344" />
        <rect x="35" y="16" width="13" height="10" rx="2" fill="#223344" />
        {/* Eyes — glowing */}
        <circle cx="22.5" cy="21" r="4" fill={eyeColor} opacity="0.9" />
        <circle cx="41.5" cy="21" r="4" fill={eyeColor} opacity="0.9" />
        <circle cx="22.5" cy="21" r="2" fill="white" opacity="0.3" />
        <circle cx="41.5" cy="21" r="2" fill="white" opacity="0.3" />
        {/* Mouth display — pixel-style */}
        {mood === "happy" || mood === "excited" ? (
          <path d="M 20 32 L 24 28 L 28 32 L 32 28 L 36 32 L 40 28 L 44 32" stroke={eyeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        ) : (
          <rect x="20" y="30" width="24" height="2.5" rx="1" fill="#445" opacity="0.6" />
        )}
        {/* Neck */}
        <rect x="26" y="40" width="12" height="6" rx="2" fill="#334455" />
        {/* Body */}
        <rect x="10" y="44" width="44" height="22" rx="6" fill="#445566" />
        <rect x="14" y="48" width="36" height="14" rx="4" fill="#334455" />
        {/* Body panel details */}
        <rect x="17" y="51" width="10" height="7" rx="2" fill="#223344" />
        <rect x="37" y="51" width="10" height="7" rx="2" fill="#223344" />
        <circle cx="32" cy="54.5" r="3" fill={eyeColor} opacity="0.6" />
        {/* Arms */}
        <rect x="0" y="46" width="10" height="16" rx="5" fill="#445566" />
        <rect x="54" y="46" width="10" height="16" rx="5" fill="#445566" />
        {/* Legs */}
        <rect x="16" y="64" width="12" height="8" rx="4" fill="#334455" />
        <rect x="36" y="64" width="12" height="8" rx="4" fill="#334455" />
        {/* Excited sparkles */}
        {mood === "excited" && (
          <>
            <circle cx="6" cy="30" r="2" fill={eyeColor} opacity="0.9" className="pet-sparkle" />
            <circle cx="58" cy="28" r="2" fill={eyeColor} opacity="0.9" className="pet-sparkle" style={{ animationDelay: "0.3s" }} />
            <circle cx="4" cy="48" r="1.5" fill={eyeColor} opacity="0.7" className="pet-sparkle" style={{ animationDelay: "0.15s" }} />
          </>
        )}
      </svg>
    </div>
  );
}
