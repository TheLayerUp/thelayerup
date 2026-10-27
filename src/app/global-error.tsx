"use client";

// Replaces the root layout when it fails, so it can't rely on globals.css.
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f5ece5", color: "#1c120c" }}>
        <title>Something went wrong | TheLayerUp</title>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div>
            <h1 style={{ fontSize: 32, margin: 0 }}>Something went wrong</h1>
            <p style={{ color: "#705a4b" }}>We&apos;re on it. Please try again in a moment.</p>
            <button
              onClick={() => retry()}
              style={{
                marginTop: 16,
                background: "#fe5a35",
                color: "#fff",
                border: 0,
                borderRadius: 12,
                padding: "12px 20px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
