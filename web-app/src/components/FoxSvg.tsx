const ACCENT = "var(--accent-primary)";

export function FoxSvg({ mood, size = 64 }: { mood: string; size?: number }) {
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
        {/* Bushy tail with white tip */}
        <path
          d="M 52 44 Q 65 32 61 20 Q 59 12 53 16"
          stroke="#d4601c"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          className="pet-tail"
        />
        <path
          d="M 59 17 Q 63 13 60 20"
          stroke="white"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Body */}
        <ellipse cx="32" cy="46" rx="20" ry="14" fill="#d4601c" />
        <ellipse cx="32" cy="49" rx="12" ry="9" fill="#f8d8b0" opacity="0.8" />
        {/* Rear legs */}
        <rect x="12" y="54" width="9" height="14" rx="4.5" fill="#c05518" />
        <rect x="43" y="54" width="9" height="14" rx="4.5" fill="#c05518" />
        {/* Head */}
        <circle cx="32" cy="24" r="18" fill="#d4601c" />
        {/* White muzzle */}
        <ellipse cx="32" cy="29" rx="11" ry="10" fill="#f8d8b0" opacity="0.9" />
        {/* Pointy ears */}
        <polygon points="15,15 9,0 23,8" fill="#d4601c" />
        <polygon points="16,14 11,2 22,8" fill="#c05518" opacity="0.7" />
        <polygon points="15,14 12,4 21,9" fill={ACCENT} opacity="0.5" />
        <polygon points="49,15 55,0 41,8" fill="#d4601c" />
        <polygon points="48,14 53,2 42,8" fill="#c05518" opacity="0.7" />
        <polygon points="49,14 52,4 43,9" fill={ACCENT} opacity="0.5" />
        {/* Cheek blush */}
        <circle cx="19" cy="28" r="5" fill={ACCENT} opacity="0.2" />
        <circle cx="45" cy="28" r="5" fill={ACCENT} opacity="0.2" />
        {/* Eyes */}
        <g style={{ transformOrigin: "24px 20px" }}>
          <circle cx="24" cy="20" r="5" fill="white" />
          <circle cx="25" cy="20" r="3" fill="#130900" />
          <circle cx="26" cy="18.5" r="1" fill="white" />
        </g>
        <g style={{ transformOrigin: "40px 20px" }}>
          <circle cx="40" cy="20" r="5" fill="white" />
          <circle cx="41" cy="20" r="3" fill="#130900" />
          <circle cx="42" cy="18.5" r="1" fill="white" />
        </g>
        {/* Nose */}
        <ellipse cx="32" cy="29" rx="3.5" ry="2.5" fill="#130900" />
        {/* Mouth */}
        <path
          d={mood === "happy" || mood === "excited" ? "M 28 32 Q 32 37 36 32" : "M 29 32 Q 32 35 35 32"}
          stroke="#130900"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Front legs */}
        <rect x="21" y="55" width="9" height="12" rx="4.5" fill="#d4601c" />
        <rect x="34" y="55" width="9" height="12" rx="4.5" fill="#d4601c" />
        {/* Excited sparkles */}
        {mood === "excited" && (
          <>
            <circle cx="8" cy="12" r="2" fill={ACCENT} opacity="0.9" className="pet-sparkle" />
            <circle cx="56" cy="10" r="2" fill={ACCENT} opacity="0.9" className="pet-sparkle" style={{ animationDelay: "0.3s" }} />
            <circle cx="4" cy="30" r="1.5" fill={ACCENT} opacity="0.7" className="pet-sparkle" style={{ animationDelay: "0.15s" }} />
          </>
        )}
      </svg>
    </div>
  );
}
