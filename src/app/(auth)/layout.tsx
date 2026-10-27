import Logo from "@/components/layout/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-layers flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Logo className="mb-8" />
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-xl shadow-primary/5 sm:p-8">
        {children}
      </div>
    </div>
  );
}
