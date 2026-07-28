export function ArmorDisplay({
  armor,
  compact = false,
  showNumbers = false,
}: {
  armor: number;
  compact?: boolean;
  showNumbers?: boolean;
}) {
  const safeArmor = Math.max(0, Math.round(armor));
  const visibleCount = Math.min(safeArmor, 5);
  const overflow = safeArmor - visibleCount;

  return (
    <span
      aria-label={`当前${safeArmor}点护甲`}
      className={`armor-display${compact ? " is-compact" : ""}`}
      role="img"
    >
      <span aria-hidden="true" className="armor-shields">
        {safeArmor === 0 ? (
          <i className="armor-shield is-empty" />
        ) : Array.from({ length: visibleCount }, (_, index) => (
          <i className="armor-shield" key={index} />
        ))}
        {overflow > 0 && <b>+{overflow}</b>}
      </span>
      {showNumbers && <small>{safeArmor} 点护甲</small>}
    </span>
  );
}
