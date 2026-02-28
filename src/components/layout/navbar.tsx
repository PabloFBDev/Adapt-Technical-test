"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <nav className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link
          href="/tickets"
          className="font-mono text-xl animate-brand-glow"
        >
          <span className="font-black">Ops</span>
          <span className="text-muted-foreground/60">/</span>
          <span className="font-black">Copilot</span>
        </Link>

        {session ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <span className="font-mono text-xs text-primary font-semibold">
                  {session.user.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <span className="font-mono text-xs text-muted-foreground hidden sm:inline truncate max-w-[180px]">
                {session.user.email}
              </span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-muted-foreground hover:text-foreground gap-1.5 px-2"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">Sair</span>
            </Button>
          </div>
        ) : (
          <Link href="/login">
            <Button variant="outline" size="sm">
              Login
            </Button>
          </Link>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </nav>
  );
}
