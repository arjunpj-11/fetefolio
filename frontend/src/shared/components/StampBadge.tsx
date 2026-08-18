interface IStampBadgeProps {
  label: string;
  tone?: 'sage' | 'rosewood' | 'marigold';
  compact?: boolean;
}
export function StampBadge({ label, tone = 'sage', compact = false }: IStampBadgeProps) {
  return (
    <span
      className={`stamp stamp--${tone} ${compact ? 'stamp--compact' : ''}`}
      aria-label={`Status: ${label}`}
    >
      <span>◦ {label.toUpperCase()} ◦</span>
    </span>
  );
}
