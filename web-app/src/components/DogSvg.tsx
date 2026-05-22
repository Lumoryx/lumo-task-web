import { getTierFromLevel } from "@/store/useDogStore";
import type { DogTier } from "@/store/useDogStore";

const PALETTE: Record<DogTier, { body: string; belly: string; leg: string; tail: string }> = {
  puppy:     { body: "#c89645", belly: "#e8c870", leg: "#b8893a", tail: "#c89645" },
  adult:     { body: "#d4a030", belly: "#f0d080", leg: "#c08828", tail: "#d4a030" },
  wise:      { body: "#8899aa", belly: "#b8cce0", leg: "#7a8899", tail: "#8899aa" },
  legendary: { body: "#e0eaff", belly: "#ffffff", leg: "#c8d8f8", tail: "#e0eaff" },
};

function Scarf() {
  return (
    <ellipse cx="32" cy="41" rx="15" ry="5" fill="#e05030" opacity="0.9" />
  );
}

function Glasses() {
  return (
    <g opacity="0.85">
      <circle cx="24" cy="21" r="6" fill="none" stroke="#6080a0" strokeWidth="1.5" />
      <circle cx="40" cy="21" r="6" fill="none" stroke="#6080a0" strokeWidth="1.5" />
      <line x1="30" y1="21" x2="34" y2="21" stroke="#6080a0" strokeWidth="1.5" />
    </g>
  );
}

function Crown() {
  return (
    <g>
      <polygon points="32,2 26,12 32,9 38,12" fill="#f0c010" />
      <rect x="24" y="10" width="16" height="5" rx="2" fill="#f0c010" />
      <circle cx="26" cy="10" r="2" fill="#ff4040" />
      <circle cx="32" cy="8" r="2" fill="#4080ff" />
      <circle cx="38" cy="10" r="2" fill="#40c040" />
    </g>
  );
}

export function DogSvg({ mood, size = 64, level = 1 }: { mood: string; size?: number; level?: number }) {
  const scale = size / 64;
  const tier = getTierFromLevel(level);
  const p = PALETTE[tier];

  const isLegendary = tier === "legendary";
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
          filter: isLegendary
            ? "drop-shadow(0 4px 12px rgba(0,0,0,0.5)) drop-shadow(0 0 12px rgba(160,200,255,0.6))"
            : "drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
          overflow: "visible",
        }}
      >
        {/* Rear legs */}
        <rect x="11" y="52" width="10" height="15" rx="5" fill={p.leg} />
        <rect x="43" y="52" width="10" height="15" rx="5" fill={p.leg} />
        {/* Tail */}
        <path className="pet-tail" d="M 50 42 Q 62 34 58 21 Q 56 14 50 17" stroke={p.tail} strokeWidth="7" strokeLinecap="round" fill="none" />
        {/* Body */}
        <ellipse cx="32" cy="45" rx="21" ry="15" fill={p.body} />
        <ellipse cx="32" cy="47" rx="13" ry="9" fill={p.belly} opacity="0.5" />
        {/* Head */}
        <circle cx="32" cy="24" r="18" fill={p.body} />
        <ellipse cx="32" cy="26" rx="12" ry="11" fill={p.belly} opacity="0.7" />
        {/* Ears */}
        <polygon points="14,18 7,1 23,7" fill={p.leg} />
        <polygon points="15,17 10,5 22,9" fill="var(--accent-primary)" opacity="0.85" />
        <polygon points="50,18 57,1 41,7" fill={p.leg} />
        <polygon points="49,17 54,5 42,9" fill="var(--accent-primary)" opacity="0.85" />
        {/* Cheek blush */}
        <circle cx="18" cy="29" r="5" fill="var(--accent-primary)" opacity="0.2" />
        <circle cx="46" cy="29" r="5" fill="var(--accent-primary)" opacity="0.2" />
        {/* Eyes */}
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
        {/* Nose */}
        <ellipse cx="32" cy="29" rx="4" ry="3" fill="#130900" />
        <circle cx="31" cy="28" r="1" fill="white" opacity="0.45" />
        {/* Mouth */}
        <path
          d={mood === "happy" || mood === "excited"
            ? "M 27 33 Q 32 38 37 33"
            : "M 28 33 Q 32 36 36 33"}
          stroke="#130900"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Front legs */}
        <rect x="20" y="55" width="10" height="13" rx="5" fill={p.body} />
        <rect x="34" y="55" width="10" height="13" rx="5" fill={p.body} />

        {/* Tier accessories */}
        {tier === "adult" && <Scarf />}
        {tier === "wise" && <Glasses />}
        {tier === "legendary" && <Crown />}

        {/* Excited sparkles */}
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
