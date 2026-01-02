import { useEffect } from "react";

export function usePolling(callback: () => Promise<void>, interval = 3000) {
  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function runOnce() {
      if (!mounted) return;
      try {
        await callback();
      } catch (err) {
        // Log instead of silence to avoid unused var lint and help debugging
        console.error("usePolling callback error:", err);
      }
    }

    runOnce();
    timer = setInterval(runOnce, interval);

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [callback, interval]);
}
