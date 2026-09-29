export default function ButtonArrow({ direction = 'right', className, size = 14 }) {
  const path = direction === 'up-right'
    ? 'M3 13 13 3M3 3h10v10'
    : direction === 'left' ? 'M13.5 8h-11M7 3.5 2.5 8 7 12.5' : 'M2.5 8h11M9 3.5 13.5 8 9 12.5'

  return (
    <svg
      className={className}
      data-button-icon={direction}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d={path} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
