/** The Relay mark — two forward chevrons, reading as motion/hand-off
 * (a ticket moving forward through the pipeline). Fixed brand colors
 * (not currentColor) since the mark doesn't adapt to surrounding text
 * color the way an icon would. */
export function Logo({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      className={className}
      aria-hidden="true"
    >
      <rect width="96" height="96" rx="22" fill="#0e241c" />
      <polyline
        points="30,26 54,48 30,70"
        fill="none"
        stroke="#32cd32"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="50,26 74,48 50,70"
        fill="none"
        stroke="#32cd32"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
    </svg>
  );
}
