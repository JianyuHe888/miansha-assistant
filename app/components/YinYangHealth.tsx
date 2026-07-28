export function YinYangHealth({
  current,
  max = current,
  compact = false,
  showNumbers = false,
}: {
  current: number;
  max?: number;
  compact?: boolean;
  showNumbers?: boolean;
}) {
  const safeMax = Math.max(1, Math.round(max));
  const safeCurrent = Math.max(0, Math.min(safeMax, Math.round(current)));
  const visibleLimit = compact ? 6 : 10;
  const visibleCount = Math.min(safeMax, visibleLimit);
  const overflow = safeMax - visibleCount;

  return (
    <span
      aria-label={`当前${safeCurrent}点体力，体力上限${safeMax}点`}
      className={`yin-yang-health${compact ? " is-compact" : ""}`}
      role="img"
    >
      <span aria-hidden="true" className="yin-yang-fishes">
        {Array.from({ length: visibleCount }, (_, index) => (
          <i
            className={`yin-yang-fish${index >= safeCurrent ? " is-lost" : ""}`}
            key={index}
          >
            ☯︎
          </i>
        ))}
        {overflow > 0 && <b className="yin-yang-overflow">+{overflow}</b>}
      </span>
      {showNumbers && <small className="yin-yang-numbers">{safeCurrent} / {safeMax}</small>}
    </span>
  );
}
