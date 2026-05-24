const ACCENT = "var(--accent-primary)";

export function PandaSvg({ mood, size = 64 }: { mood: string; size?: number }) {
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
        {/* Tail (small panda tail) */}
        <ellipse cx="52" cy="48" rx="6" ry="5" fill="white" />
        {/* Body */}
        <ellipse cx="32" cy="47" rx="21" ry="15" fill="white" />
        {/* Black sides on body */}
        <ellipse cx="13" cy="47" rx="8" ry="12" fill="#1a1a1a" />
        <ellipse cx="51" cy="47" rx="8" ry="12" fill="#1a1a1a" />
        {/* Rear legs */}
        <rect x="11" y="54" width="10" height="15" rx="5" fill="#1a1a1a" />
        <rect x="43" y="54" width="10" height="15" rx="5" fill="#1a1a1a" />
        {/* Head */}
        <circle cx="32" cy="24" r="19" fill="white" />
        {/* Black ears */}
        <circle cx="16" cy="10" r="9" fill="#1a1a1a" />
        <circle cx="48" cy="10" r="9" fill="#1a1a1a" />
        {/* Eye patches */}
        <ellipse cx="22" cy="23" rx="8" ry="7" fill="#1a1a1a" />
        <ellipse cx="42" cy="23" rx="8" ry="7" fill="#1a1a1a" />
        {/* Eyes */}
        <circle cx="22" cy="22" r="4.5" fill="white" />
        <circle cx="23" cy="22" r="3" fill="#130900" />
        <circle cx="24" cy="20.5" r="1" fill="white" />
        <circle cx="42" cy="22" r="4.5" fill="white" />
        <circle cx="43" cy="22" r="3" fill="#130900" />
        <circle cx="44" cy="20.5" r="1" fill="white" />
        {/* Nose */}
        <ellipse cx="32" cy="30" rx="4" ry="3" fill="#1a1a1a" />
        <circle cx="31" cy="29" r="1" fill="white" opacity="0.4" />
        {/* Mouth */}
        <path
          d={mood === "happy" || mood === "excited" ? "M 27 33 Q 32 39 37 33" : "M 28 33 Q 32 36 36 33"}
          stroke="#1a1a1a"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Cheek blush */}
        <circle cx="16" cy="31" r="4" fill={ACCENT} opacity="0.15" />
        <circle cx="48" cy="31" r="4" fill={ACCENT} opacity="0.15" />
        {/* Front legs */}
        <rect x="19" y="55" width="11" height="13" rx="5.5" fill="#1a1a1a" />
        <rect x="34" y="55" width="11" height="13" rx="5.5" fill="#1a1a1a" />
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
