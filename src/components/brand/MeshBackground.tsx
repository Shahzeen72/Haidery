export function MeshBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="mesh-blob left-[-10%] top-[-10%] h-[55vw] w-[55vw] bg-lavender opacity-35" />
      <div className="mesh-blob right-[-12%] top-[10%] h-[45vw] w-[45vw] bg-market opacity-20 [animation-delay:-7s]" />
      <div className="mesh-blob bottom-[-15%] left-[30%] h-[40vw] w-[40vw] bg-community opacity-20 [animation-delay:-13s]" />
    </div>
  );
}
