import { useEffect, useRef, useState } from "react";
import { usePetStore } from "@/store/usePetStore";
import { useAIStore } from "@/store/useAIStore";
import { useTasksStore } from "@/store/useTasksStore";
import { useAppStore } from "@/store/useAppStore";
import { useT } from "@/i18n/useT";
import { PetChat } from "@/components/PetChat";

// ── Message pool ──────────────────────────────────────────────────────────────

const MSG_MORNING = ["pet.morning.1", "pet.morning.2"];
const MSG_AFTERNOON = ["pet.afternoon.1", "pet.afternoon.2"];
const MSG_EVENING = ["pet.evening.1", "pet.evening.2"];
const MSG_NIGHT = ["pet.night.1", "pet.night.2"];
const MSG_IDLE = [
  "pet.idle.1", "pet.idle.2", "pet.idle.3",
  "pet.idle.4", "pet.idle.5", "pet.idle.6",
];
const MSG_TASKS_MANY = ["pet.tasks.many"];
const MSG_TASKS_NONE = ["pet.tasks.none"];

let lastMsgKey = "";

function pickMessage(q1Count: number): string {
  const h = new Date().getHours();
  let pool: string[];

  if (q1Count >= 3) pool = MSG_TASKS_MANY;
  else if (q1Count === 0) pool = MSG_TASKS_NONE;
  else if (h >= 5 && h < 11) pool = MSG_MORNING;
  else if (h >= 11 && h < 17) pool = MSG_AFTERNOON;
  else if (h >= 17 && h < 21) pool = MSG_EVENING;
  else pool = MSG_NIGHT;

  // mix in some idle messages
  const combined = [...pool, ...MSG_IDLE];
  const options = combined.filter((k) => k !== lastMsgKey);
  const key = options[Math.floor(Math.random() * options.length)];
  lastMsgKey = key;
  return key;
}

// ── Dog SVG ───────────────────────────────────────────────────────────────────

function DogSvg({ mood }: { mood: string }) {
  const bounceStyle: React.CSSProperties = {
    animation: mood === "excited"
      ? "petBounce 0.4s var(--ease-spring) infinite"
      : "petBounce 2.8s ease-in-out infinite",
    display: "block",
  };

  return (
    <div style={bounceStyle}>
      <svg
        width="64"
        height="72"
        viewBox="0 0 64 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))", overflow: "visible" }}
      >
        {/* Back legs */}
        <rect x="11" y="52" width="10" height="15" rx="5" fill="#b8893a" />
        <rect x="43" y="52" width="10" height="15" rx="5" fill="#b8893a" />

        {/* Tail (animated) */}
        <path
          className="pet-tail"
          d="M 50 42 Q 62 34 58 21 Q 56 14 50 17"
          stroke="#c89645"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />

        {/* Body */}
        <ellipse cx="32" cy="45" rx="21" ry="15" fill="#c89645" />

        {/* Belly highlight */}
        <ellipse cx="32" cy="47" rx="13" ry="9" fill="#e8c870" opacity="0.5" />

        {/* Head */}
        <circle cx="32" cy="24" r="18" fill="#c89645" />

        {/* Face lighter patch */}
        <ellipse cx="32" cy="26" rx="12" ry="11" fill="#e8c870" opacity="0.7" />

        {/* Left ear outer */}
        <polygon points="14,18 7,1 23,7" fill="#a87030" />
        {/* Left ear inner — accent glow */}
        <polygon points="15,17 10,5 22,9" fill="var(--accent-primary)" opacity="0.85" />

        {/* Right ear outer */}
        <polygon points="50,18 57,1 41,7" fill="#a87030" />
        {/* Right ear inner — accent glow */}
        <polygon points="49,17 54,5 42,9" fill="var(--accent-primary)" opacity="0.85" />

        {/* Cheek blushes */}
        <circle cx="18" cy="29" r="5" fill="var(--accent-primary)" opacity="0.2" />
        <circle cx="46" cy="29" r="5" fill="var(--accent-primary)" opacity="0.2" />

        {/* Left eye */}
        <g className="pet-eye-l" style={{ transformOrigin: "24px 21px" }}>
          <circle cx="24" cy="21" r="5" fill="white" />
          <circle cx="25" cy="21" r="3" fill="#130900" />
          <circle cx="26" cy="19.5" r="1" fill="white" />
        </g>

        {/* Right eye */}
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
        <rect x="20" y="55" width="10" height="13" rx="5" fill="#c89645" />
        <rect x="34" y="55" width="10" height="13" rx="5" fill="#c89645" />

        {/* Happy sparkles when excited */}
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

// ── Speech bubble ─────────────────────────────────────────────────────────────

function SpeechBubble({ text }: { text: string }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% + 10px)",
        left: "50%",
        transform: "translateX(-50%)",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-strong)",
        borderRadius: "12px",
        padding: "8px 14px",
        fontSize: "12px",
        lineHeight: "1.5",
        color: "var(--text-primary)",
        whiteSpace: "nowrap",
        maxWidth: "220px",
        pointerEvents: "none",
        animation: "petBubbleIn 0.22s var(--ease-spring) both",
        boxShadow: "0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px var(--accent-dim)",
        zIndex: 1,
      }}
    >
      {text}
      {/* Triangle pointer */}
      <div
        style={{
          position: "absolute",
          top: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "7px solid transparent",
          borderRight: "7px solid transparent",
          borderTop: "7px solid var(--border-strong)",
          marginTop: "0px",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "calc(100% - 1px)",
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: "6px solid var(--bg-elevated)",
        }}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function FloatingPet() {
  const t = useT();
  const { pos, visible, activeMsg, mood, setPos, setMsg, setMood } = usePetStore();
  const { chatOpen, toggleChat, loadConfig, configLoaded } = useAIStore();
  const tasks = useTasksStore((s) => s.tasks);
  const locale = useAppStore((s) => s.locale);

  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Load AI config once on mount
  useEffect(() => {
    if (!configLoaded) loadConfig();
  }, [configLoaded, loadConfig]);
  const dragOffset = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const pendingPos = useRef(pos);
  const msgTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ── Drag logic ──────────────────────────────────────────────────────────────
  const dragMoved = useRef(false);

  function onMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    dragMoved.current = false;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    setIsDragging(true);
    setMood("excited");
  }

  useEffect(() => {
    if (!isDragging) return;

    function onMouseMove(e: MouseEvent) {
      dragMoved.current = true;
      pendingPos.current = {
        x: Math.max(0, Math.min(window.innerWidth - 70, e.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 80, e.clientY - dragOffset.current.y)),
      };
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setPos(pendingPos.current);
      });
    }

    function onMouseUp() {
      setIsDragging(false);
      cancelAnimationFrame(rafRef.current);
      if (!dragMoved.current) {
        // Short click — toggle chat
        toggleChat();
        setMood("happy");
        setTimeout(() => setMood("idle"), 1200);
      } else {
        setMood("happy");
        setTimeout(() => setMood("idle"), 1200);
      }
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, setPos, setMood]);

  // ── Periodic messages ───────────────────────────────────────────────────────
  useEffect(() => {
    const q1Count = tasks.filter((t) => t.quadrant === "Q1" && !t.completed).length;
    const interval = setInterval(() => {
      const key = pickMessage(q1Count);
      setMsg(key);
      setMood("happy");
      clearTimeout(msgTimeoutRef.current);
      msgTimeoutRef.current = setTimeout(() => {
        setMsg(null);
        setMood("idle");
      }, 6000);
    }, 45_000);
    return () => {
      clearInterval(interval);
      clearTimeout(msgTimeoutRef.current);
    };
  }, [tasks, locale, setMsg, setMood]);

  // ── Hover message ───────────────────────────────────────────────────────────
  const hoverTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  function onMouseEnter() {
    setIsHovered(true);
    if (!activeMsg) {
      setMood("happy");
    }
  }
  function onMouseLeave() {
    setIsHovered(false);
    clearTimeout(hoverTimeout.current);
    if (!activeMsg) {
      hoverTimeout.current = setTimeout(() => setMood("idle"), 800);
    }
  }

  const displayMsg = activeMsg
    ? t(activeMsg)
    : isHovered
    ? t("pet.hover")
    : null;

  if (!visible) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          left: pos.x,
          top: pos.y,
          zIndex: 9998,
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none",
          width: 64,
          height: 72,
        }}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {!chatOpen && displayMsg && <SpeechBubble text={displayMsg} />}
        <DogSvg mood={mood} />
        {/* Chat open indicator dot */}
        {chatOpen && (
          <div
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "var(--accent-primary)",
              border: "2px solid var(--bg-elevated)",
            }}
          />
        )}
      </div>
      <PetChat petPos={pos} />
    </>
  );
}
