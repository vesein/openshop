export function ImagePlaceholder({ className = "size-10" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="4" fill="#e5e7eb" />
      <path
        d="M12 28l6-8 4 5 3-3 5 6H12z"
        fill="#9ca3af"
      />
      <circle cx="16" cy="16" r="3" fill="#9ca3af" />
    </svg>
  );
}
