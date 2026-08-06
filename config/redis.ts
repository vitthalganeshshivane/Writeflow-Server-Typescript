import IORedis from "ioredis";

const urls = [
  process.env.REDIS_URL,
  process.env.REDIS_URL_FALLBACK_1,
  process.env.REDIS_URL_FALLBACK_2,
  process.env.REDIS_URL_FALLBACK_3,
].filter(Boolean) as string[];

function createConnection(url: string) {
  const conn = new IORedis(url, {
    maxRetriesPerRequest: null,
    connectTimeout: 5000,
    lazyConnect: true,
    enableOfflineQueue: false,
  });
  conn.on("error", () => {});
  return conn;
}

async function isConnectionUsable(conn: IORedis): Promise<boolean> {
  try {
    await Promise.race([
      conn.connect(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("connect timeout")), 5000),
      ),
    ]);

    const pong = await conn.ping();
    if (pong !== "PONG") return false;

    const result = await conn.eval("return 1", 0);
    if (Number(result) !== 1) return false;

    return true;
  } catch {
    return false;
  }
}

async function resolveConnection(): Promise<IORedis> {
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const label = `REDIS_URL${i === 0 ? "" : `_FALLBACK_${i}`}`;
    console.log(`[REDIS] Trying ${label}...`);

    const conn = createConnection(url);
    const usable = await isConnectionUsable(conn);

    if (usable) {
      console.log(`[REDIS] ${label} OK`);
      return conn;
    }

    console.error(`[REDIS] ${label} failed, trying next...`);
    try { conn.disconnect(); } catch {}
  }

  console.error("[REDIS] All Redis connections failed");
  throw new Error("No Redis connection available");
}

const connectionPromise = resolveConnection();

export default connectionPromise;
