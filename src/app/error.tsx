"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="font-mono text-xl font-bold">Algo deu errado</h2>
      <p className="font-mono text-sm text-muted-foreground text-center max-w-md">
        Ocorreu um erro inesperado. Tente novamente ou entre em contato com o
        suporte se o problema persistir.
      </p>
      <Button onClick={reset} variant="outline" className="font-mono">
        Tentar novamente
      </Button>
    </div>
  );
}
