export function DogSvg({ mood, size = 64 }: { mood: string; size?: number }) {
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
        style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))", overflow: "visible" }}
      >
        <rect x="11" y="52" width="10" height="15" rx="5" fill="#b8893a" />
        <rect x="43" y="52" width="10" height="15" rx="5" fill="#b8893a" />
        <path className="pet-tail" d="M 50 42 Q 62 34 58 21 Q 56 14 50 17" stroke="#c89645" strokeWidth="7" strokeLinecap="round" fill="none" />
        <ellipse cx="32" cy="45" rx="21" ry="15" fill="#c89645" />
        <ellipse cx="32" cy="47" rx="13" ry="9" fill="#e8c870" opacity="0.5" />
        <circle cx="32" cy="24" r="18" fill="#c89645" />
        <ellipse cx="32" cy="26" rx="12" ry="11" fill="#e8c870" opacity="0.7" />
        <polygon points="14,18 7,1 23,7" fill="#a87030" />
        <polygon points="15,17 10,5 22,9" fill="var(--accent-primary)" opacity="0.85" />
        <polygon points="50,18 57,1 41,7" fill="#a87030" />
        <polygon points="49,17 54,5 42,9" fill="var(--accent-primary)" opacity="0.85" />
        <circle cx="18" cy="29" r="5" fill="var(--accent-primary)" opacity="0.2" />
        <circle cx="46" cy="29" r="5" fill="var(--accent-primary)" opacity="0.2" />
        <g className="pet-eye-l" style={{ transformOrigin: "24px 21px" }}>
          <circle cx="24" cy="21" r="5" fill="white" />
          <circle cx="25" cy="21" r="3" fill="#130900" />
          <circle cx="26" cy="19.5" r="1" fill="white" />
        </g>
        <g className="pet-eye-r" style={{ transformOrigin: "40px 21px" }}>
          <circle cx="40" cy="21" r="5" fill="white" />
          <circle cx="41" cy="21" r="3" fill="#130900" />
          <circle cx="42" cy="19.5" r="1" fill="white" />
        </g>
        <ellipse cx="32" cy="29" rx="4" ry="3" fill="#130900" />
        <circle cx="31" cy="28" r="1" fill="white" opacity="0.45" />
        <path
          d={mood === "happy" || mood === "excited"
            ? "M 27 33 Q 32 38 37 33"
            : "M 28 33 Q 32 36 36 33"}
          stroke="#130900"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <rect x="20" y="55" width="10" height="13" rx="5" fill="#c89645" />
        <rect x="34" y="55" width="10" height="13" rx="5" fill="#c89645" />
        {mood === "excited" && (
          <>
            <circle cx="8" cy="12" r="2" fill="var(--accent-primary)" opacity="0.9" className="pet-sparkle" />
            <circle cx="56" cy="10" r="2" fill="var(--accent-primary)" opacity="0.9" className="pet-sparkle" style={{ animationDelay: "0.3s" }} />
            <circle cx="4" cy="30" r="1.5" fill="var(--accent-primary)" opacity="0.7" className="pet-sparkle" style={{ animationDelay: "0.15s" }} />
          </>
        )}
      </svg>
    </div>
  );
}
