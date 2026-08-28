// Lightweight self-ping to prevent Render free tier sleep (15m inactivity)
// Uses Render's auto-injected RENDER_EXTERNAL_URL or manual KEEP_ALIVE_URL
// No extra dependencies - uses native fetch (Node 18+)

const DEFAULT_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes
let interval: NodeJS.Timeout | null = null;

export function startSelfPing(): void {
  // Allow disabling via env
  if (process.env.KEEP_ALIVE_DISABLED === "true") {
    console.log("[keep-alive] disabled via KEEP_ALIVE_DISABLED=true");
    return;
  }

  // Only in production (Render) - skip locally unless explicitly enabled
  const isProduction = process.env.NODE_ENV === "production";
  const forceEnabled = process.env.KEEP_ALIVE_ENABLED === "true";

  if (!isProduction && !forceEnabled) {
    console.log("[keep-alive] skipped (not production, set KEEP_ALIVE_ENABLED=true to force)");
    return;
  }

  if (interval) {
    console.log("[keep-alive] already running");
    return;
  }

  // Render auto-injects RENDER_EXTERNAL_URL (e.g., https://your-app.onrender.com)
  // Fallback to manual KEEP_ALIVE_URL / BACKEND_URL for flexibility
  const baseUrl = (
    process.env.RENDER_EXTERNAL_URL ||
    process.env.KEEP_ALIVE_URL ||
    process.env.BACKEND_URL ||
    ""
  ).trim().replace(/\/$/, "");

  if (!baseUrl) {
    console.log("[keep-alive] no URL found - set RENDER_EXTERNAL_URL or KEEP_ALIVE_URL to enable");
    return;
  }

  const intervalMs = parseInt(process.env.KEEP_ALIVE_INTERVAL_MS || "", 10) || DEFAULT_INTERVAL_MS;
  const healthUrl = `${baseUrl}/health`;

  console.log(`[keep-alive] enabled -> pinging ${healthUrl} every ${intervalMs / 60000} min`);

  const ping = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      // Use HEAD to minimize bandwidth, server supports both HEAD and GET
      const res = await fetch(healthUrl, {
        method: "HEAD",
        signal: controller.signal,
      });
      if (res.ok) {
        console.log(`[keep-alive] ping ok ${res.status} ${healthUrl}`);
      } else {
        console.warn(`[keep-alive] ping failed ${res.status} ${healthUrl}`);
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        console.error("[keep-alive] ping timeout", healthUrl);
      } else {
        console.error("[keep-alive] ping error", (err as Error).message);
      }
    } finally {
      clearTimeout(timeout);
    }
  };

  // Stagger first ping by 60s to avoid pinging during cold start
  setTimeout(ping, 60_000);
  interval = setInterval(ping, intervalMs);
  // Don't block process exit
  if (interval.unref) interval.unref();
}

export function stopSelfPing(): void {
  if (interval) {
    clearInterval(interval);
    interval = null;
    console.log("[keep-alive] stopped");
  }
}
