export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="absolute -left-[8%] -top-[10%] h-[46vw] w-[46vw] animate-drift bg-[radial-gradient(circle_at_40%_40%,#FFB6C9,transparent_68%)] opacity-65 blur-[60px] will-change-transform" />
      <div className="absolute -bottom-[14%] -right-[6%] h-[52vw] w-[52vw] animate-drift2 bg-[radial-gradient(circle_at_50%_50%,#FFD3B0,transparent_66%)] opacity-55 blur-[70px] will-change-transform" />
      <div className="absolute right-[22%] top-[38%] h-[34vw] w-[34vw] animate-drift bg-[radial-gradient(circle_at_50%_50%,#E7D6FF,transparent_64%)] opacity-40 blur-[66px] will-change-transform" />

      <span className="absolute left-[8%] top-[14%] h-1.5 w-1.5 animate-sparkle rounded-full bg-brand-light will-change-transform" />
      <span className="absolute left-[26%] top-[62%] h-[5px] w-[5px] animate-sparkle rounded-full bg-brand will-change-transform [animation-delay:0.8s]" />
      <span className="absolute right-[14%] top-[28%] h-[7px] w-[7px] animate-sparkle rounded-full bg-brand-pale will-change-transform [animation-delay:1.4s]" />
      <span className="absolute right-[32%] top-[80%] h-1 w-1 animate-sparkle rounded-full bg-brand-light will-change-transform [animation-delay:0.3s]" />
      <span className="absolute left-[52%] top-[48%] h-1.5 w-1.5 animate-sparkle rounded-full bg-lilac will-change-transform [animation-delay:2s]" />
    </div>
  );
}
