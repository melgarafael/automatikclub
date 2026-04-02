export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="w-full max-w-[400px] p-5">{children}</div>
    </div>
  );
}
