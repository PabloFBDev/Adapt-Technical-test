"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LogOut, Settings, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <nav className="glass-premium sticky top-0 z-50 relative border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          href="/tickets"
          className="flex items-center gap-2.5 group"
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-shadow duration-300">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-mono text-lg tracking-tight animate-brand-glow">
            <span className="font-black">Ops</span>
            <span className="text-muted-foreground/40 mx-0.5">/</span>
            <span className="font-black">Copilot</span>
          </span>
        </Link>

        {session ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/80 to-primary/50 flex items-center justify-center ring-2 ring-primary/10">
                <span className="font-mono text-[10px] text-primary-foreground font-bold">
                  {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <span className="font-mono text-xs text-muted-foreground hidden sm:inline truncate max-w-[160px]">
                {session.user.name || session.user.email}
              </span>
            </div>
            <Link href="/settings">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground gap-1.5 px-2.5 rounded-full"
              >
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Config</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-muted-foreground hover:text-foreground gap-1.5 px-2.5 rounded-full"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">Sair</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="rounded-full text-xs">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="rounded-full text-xs">
                Criar conta
              </Button>
            </Link>
          </div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </nav>
  );
}
