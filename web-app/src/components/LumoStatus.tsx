/**
 * Lumo presence indicator — the breathing glyph + a status string. Used
 * in places where the AI is "thinking" or has a passive suggestion.
 */
export function LumoStatus({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 py-2 text-[13px] text-text-secondary">
      <span className="lumo-glyph">
        <span className="halo" />
        <span className="core" />
      </span>
      <span>{text}</span>
    </div>
  );
}
