export function NoiseGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-40"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
        backgroundSize: "54px 54px",
        maskImage: "radial-gradient(circle at center, black 35%, transparent 85%)",
      }}
    />
  );
}
