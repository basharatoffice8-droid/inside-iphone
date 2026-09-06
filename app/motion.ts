// A resumed or virtualized animation timeline can move backwards. Never apply
// negative damping: it makes assemblies move away from their destination.
export function frameDelta(now: number, previous: number) {
  const elapsed = (now - previous) / 1000;
  return Math.min(
    0.045,
    Math.max(1 / 240, Number.isFinite(elapsed) ? elapsed : 1 / 60),
  );
}
