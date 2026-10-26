"use client";

// Boundary de error global: evita que un error no capturado muestre la pantalla
// genérica de Next. Debe incluir <html>/<body> porque reemplaza el layout raíz.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0b",
          color: "#f2ede6",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: 440 }}>
          <p style={{ fontSize: "0.8rem", letterSpacing: "0.2em", color: "#c6a15b", textTransform: "uppercase" }}>
            Algo salió mal
          </p>
          <h1 style={{ fontSize: "1.6rem", margin: "0.5rem 0 0.75rem" }}>Error inesperado</h1>
          <p style={{ color: "rgba(242,237,230,0.7)", margin: "0 0 1.5rem" }}>
            Ha ocurrido un problema al cargar esta página. Puedes reintentar o volver más tarde.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#c6a15b",
              color: "#0a0a0b",
              border: "none",
              borderRadius: 999,
              padding: "0.65rem 1.25rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
