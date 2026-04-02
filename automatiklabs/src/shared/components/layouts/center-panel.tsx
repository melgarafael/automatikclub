export function CenterPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-[680px] px-5">
      {children}
    </div>
  );
}

export default CenterPanel;
