"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "2rem",
            fontFamily: "monospace",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
            Erro critico
          </h2>
          <p style={{ color: "#666", textAlign: "center", maxWidth: "400px" }}>
            Ocorreu um erro critico na aplicacao. Tente recarregar a pagina.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1.5rem",
              border: "1px solid #ccc",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontFamily: "monospace",
            }}
          >
            Recarregar
          </button>
        </div>
      </body>
    </html>
  );
}
