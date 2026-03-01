"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, ArrowRight, AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";

function validateEmail(email: string): string | null {
  if (!email) return "Email é obrigatório";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email inválido";
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return "Senha é obrigatória";
  if (password.length < 8) return "Mínimo 8 caracteres";
  if (!/[a-zA-Z]/.test(password)) return "Deve conter pelo menos uma letra";
  if (!/[0-9]/.test(password)) return "Deve conter pelo menos um número";
  return null;
}

function validateConfirmPassword(password: string, confirmPassword: string): string | null {
  if (!confirmPassword) return "Confirmação é obrigatória";
  if (password !== confirmPassword) return "As senhas não coincidem";
  return null;
}

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const emailError = touched.email ? validateEmail(email) : null;
  const passwordError = touched.password ? validatePassword(password) : null;
  const confirmPasswordError = touched.confirmPassword
    ? validateConfirmPassword(password, confirmPassword)
    : null;

  const isFormValid =
    !validateEmail(email) &&
    !validatePassword(password) &&
    !validateConfirmPassword(password, confirmPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true, confirmPassword: true });
    setError("");

    if (!isFormValid) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao criar conta");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Conta criada, mas falha no login automático. Tente fazer login.");
        setLoading(false);
        return;
      }

      router.push("/tickets");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <Card className="relative w-full max-w-md mx-auto shadow-2xl shadow-primary/8 animate-fade-in-up glass-premium border-border/40 has-[:focus-visible]:border-primary/25 has-[:focus-visible]:shadow-primary/12 transition-all duration-500">
      {/* Top accent gradient */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent rounded-t-xl" />

      <CardHeader className="text-center pb-2 pt-10">
        <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
          <Zap className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="font-mono text-2xl mb-1">
          <span className="font-black">Ops</span>
          <span className="text-muted-foreground/40 mx-0.5">/</span>
          <span className="font-black">Copilot</span>
        </div>
        <CardDescription className="font-mono text-[11px] uppercase tracking-widest mt-1.5 text-muted-foreground/70">
          criar conta
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-8 pb-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/70">
              Nome <span className="text-muted-foreground/40">(opcional)</span>
            </Label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary/70 transition-colors" />
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 h-11 rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/70">
              E-mail
            </Label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary/70 transition-colors" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                className="pl-10 h-11 rounded-lg"
                aria-invalid={!!emailError}
              />
            </div>
            {emailError && (
              <p className="font-mono text-[11px] text-destructive flex items-center gap-1.5 animate-scale-in">
                <span className="inline-block h-1 w-1 rounded-full bg-destructive" />
                {emailError}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/70">
              Senha
            </Label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary/70 transition-colors" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                className="pl-10 h-11 rounded-lg"
                aria-invalid={!!passwordError}
              />
            </div>
            {passwordError && (
              <p className="font-mono text-[11px] text-destructive flex items-center gap-1.5 animate-scale-in">
                <span className="inline-block h-1 w-1 rounded-full bg-destructive" />
                {passwordError}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/70">
              Confirmar Senha
            </Label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary/70 transition-colors" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                className="pl-10 h-11 rounded-lg"
                aria-invalid={!!confirmPasswordError}
              />
            </div>
            {confirmPasswordError && (
              <p className="font-mono text-[11px] text-destructive flex items-center gap-1.5 animate-scale-in">
                <span className="inline-block h-1 w-1 rounded-full bg-destructive" />
                {confirmPasswordError}
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 animate-scale-in">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm font-mono text-destructive">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 gap-2 text-sm font-medium rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Criando...
              </span>
            ) : (
              <>
                Criar conta
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          <Link href="/login" className="block">
            <Button
              type="button"
              variant="ghost"
              className="w-full font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              Já tem conta? <span className="text-primary ml-1">Entrar</span>
            </Button>
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
