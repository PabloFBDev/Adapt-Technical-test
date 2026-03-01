import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      {/* Ambient gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/5 -left-32 w-[600px] h-[600px] bg-primary/12 rounded-full blur-[120px] animate-subtle-float" />
        <div className="absolute bottom-1/5 -right-32 w-[500px] h-[500px] bg-ai/8 rounded-full blur-[120px] animate-subtle-float" style={{ animationDelay: "3s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 w-full px-4">
        <LoginForm />
      </div>
    </div>
  );
}
