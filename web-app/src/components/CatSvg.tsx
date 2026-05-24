const ACCENT = "var(--accent-primary)";

export function CatSvg({ mood, size = 64 }: { mood: string; size?: number }) {
  const scale = size / 64;
  const bounceStyle: React.CSSProperties = {
    animation: mood === "excited"
      ? "petBounce 0.4s var(--ease-spring) infinite"
      : "petBounce 2.8s ease-in-out infinite",
    display: "block",
  };

  return (
    <div style={bounceStyle}>
      <svg
        width={64 * scale}
        height={72 * scale}
        viewBox="0 0 64 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
          overflow: "visible",
        }}
      >
        {/* Tail */}
        <path
          d="M 50 48 Q 62 38 60 26 Q 58 18 52 22"
          stroke="#888"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          className="pet-tail"
        />
        {/* Body */}
        <ellipse cx="32" cy="47" rx="18" ry="13" fill="#aaa" />
        <ellipse cx="32" cy="49" rx="11" ry="8" fill="#ddd" opacity="0.6" />
        {/* Rear legs */}
        <rect x="13" y="54" width="9" height="14" rx="4.5" fill="#999" />
        <rect x="42" y="54" width="9" height="14" rx="4.5" fill="#999" />
        {/* Head */}
        <circle cx="32" cy="24" r="17" fill="#aaa" />
        <ellipse cx="32" cy="27" rx="10" ry="10" fill="#ddd" opacity="0.7" />
        {/* Pointy ears */}
        <polygon points="15,14 10,0 22,8" fill="#aaa" />
        <polygon points="16,13 12,3 21,9" fill={ACCENT} opacity="0.7" />
        <polygon points="49,14 54,0 42,8" fill="#aaa" />
        <polygon points="48,13 52,3 43,9" fill={ACCENT} opacity="0.7" />
        {/* Eyes — slightly slanted for cat look */}
        <g style={{ transformOrigin: "23px 21px" }}>
          <ellipse cx="23" cy="21" rx="5" ry="4" fill="white" />
          <ellipse cx="24" cy="21" rx={mood === "happy" || mood === "excited" ? 2 : 1.5} ry="3" fill="#130900" />
          <circle cx="25" cy="19.5" r="1" fill="white" />
        </g>
        <g style={{ transformOrigin: "41px 21px" }}>
          <ellipse cx="41" cy="21" rx="5" ry="4" fill="white" />
          <ellipse cx="42" cy="21" rx={mood === "happy" || mood === "excited" ? 2 : 1.5} ry="3" fill="#130900" />
          <circle cx="43" cy="19.5" r="1" fill="white" />
        </g>
        {/* Nose */}
        <polygon points="32,28 29,31 35,31" fill="#e06080" />
        {/* Mouth */}
        <path
          d={mood === "happy" || mood === "excited" ? "M 29 31 Q 32 35 35 31" : "M 29 32 Q 32 34 35 32"}
          stroke="#130900"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Whiskers */}
        <line x1="10" y1="27" x2="24" y2="29" stroke="#888" strokeWidth="1" opacity="0.7" />
        <line x1="10" y1="31" x2="24" y2="31" stroke="#888" strokeWidth="1" opacity="0.7" />
        <line x1="40" y1="29" x2="54" y2="27" stroke="#888" strokeWidth="1" opacity="0.7" />
        <line x1="40" y1="31" x2="54" y2="31" stroke="#888" strokeWidth="1" opacity="0.7" />
        {/* Cheek blush */}
        <circle cx="18" cy="29" r="4" fill={ACCENT} opacity="0.2" />
        <circle cx="46" cy="29" r="4" fill={ACCENT} opacity="0.2" />
        {/* Front legs */}
        <rect x="21" y="55" width="9" height="12" rx="4.5" fill="#aaa" />
        <rect x="34" y="55" width="9" height="12" rx="4.5" fill="#aaa" />
        {/* Excited sparkles */}
        {mood === "excited" && (
          <>
            <circle cx="8" cy="12" r="2" fill={ACCENT} opacity="0.9" className="pet-sparkle" />
            <circle cx="56" cy="10" r="2" fill={ACCENT} opacity="0.9" className="pet-sparkle" style={{ animationDelay: "0.3s" }} />
          </>
        )}
      </svg>
    </div>
  );
}
