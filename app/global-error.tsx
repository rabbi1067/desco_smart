"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary for ROOT crashes (root layout / providers).
 *
 * Unlike `app/error.tsx` (which lives INSIDE the root layout and its
 * providers), this renders standalone with its own <html>/<body> and ZERO
 * app dependencies — no theme, no i18n, no UI kit. That guarantees a crash
 * in a provider can never blank the screen silently again: the user always
 * sees this message plus a digest to report.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0f1a",
          color: "#e5e7eb",
          fontFamily: "system-ui, sans-serif",
          padding: 24,
        }}
      >
        <main style={{ textAlign: "center", maxWidth: 480 }}>
          <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, opacity: 0.7, margin: "0 0 4px" }}>
            The page crashed while loading. Please try again — if it persists,
            report this code.
          </p>
          {error.digest ? (
            <p
              style={{
                fontSize: 12,
                opacity: 0.5,
                fontFamily: "monospace",
                margin: "8px 0 0",
              }}
            >
              Error ref: {error.digest}
            </p>
          ) : null}
          <button
            onClick={() => reset()}
            style={{
              marginTop: 20,
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              background: "#10b981",
              color: "#04120c",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
