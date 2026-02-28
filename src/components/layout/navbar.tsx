"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/tickets" className="text-lg font-mono animate-brand-glow">
          <span className="font-semibold">ops</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold">copilot</span>
        </Link>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="font-mono text-xs text-muted-foreground hidden sm:inline">
                {session.user.email}
              </span>
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
    </nav>
  );
}
