"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <nav className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/tickets" className="font-mono text-3xl mb-1 animate-brand-glow">
          <span className="font-black">Ops</span>
          <span className="text-muted-foreground/60">/</span>
          <span className="font-black">Copilot</span>
        </Link>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center">
                  <span className="font-mono text-[10px] text-primary font-semibold">
                    {session.user.email?.[0]?.toUpperCase()}
                  </span>
                </div>
                <span className="font-mono text-xs text-muted-foreground hidden sm:inline">
                  {session.user.email}
                </span>
              </div>
              <Link href="/tickets/new">
                <Button size="sm">Novo Ticket</Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Sair
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </nav>
  );
}
