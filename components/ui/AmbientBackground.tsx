export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute top-[-20%] left-[15%] h-125 w-125 rounded-full bg-purple-600/15 blur-[140px]" />
      <div className="absolute bottom-[10%] right-[10%] h-100 w-100 rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="absolute top-[40%] left-[60%] h-75 w-75 rounded-full bg-indigo-500/8 blur-[100px]" />
    </div>
  );
}
