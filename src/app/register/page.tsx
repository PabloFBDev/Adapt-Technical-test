import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      {/* Extra gradient orbs for login emphasis */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[100px] animate-subtle-float" />
        <div className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] bg-ai/10 rounded-full blur-[100px] animate-subtle-float" style={{ animationDelay: "3s" }} />
      </div>

      <div className="relative z-10 w-full px-4">
        <RegisterForm />
      </div>
    </div>
  );
}
