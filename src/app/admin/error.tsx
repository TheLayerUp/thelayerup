"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest = typeof error === "object" && error && "digest" in error ? String(error.digest) : null;
  return (
    <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8">
      <h1 className="text-xl font-bold">This admin page failed to load</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Try again. If it persists, check the server logs
        {digest && (
          <>
            {" "}
            for error <code className="font-mono">{digest}</code>
          </>
        )}
        .
      </p>
      <Button className="mt-6" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
