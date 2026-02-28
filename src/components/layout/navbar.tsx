"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="border-b bg-background">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/tickets" className="text-lg font-semibold">
          Ops Copilot
        </Link>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">
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
