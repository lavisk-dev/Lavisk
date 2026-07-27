import "server-only";
import { cookies } from "next/headers";

const SESSION_COOKIE = "lavisk_admin_session";
const secret = process.env.ADMIN_SESSION_SECRET ?? "dev-insecure-secret";

// Uses Web Crypto (globalThis.crypto) instead of Node's `crypto` module so
// this file works in both the Node.js and Edge middleware runtimes.
async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Placeholder admin authentication. Validates a username/password pair
 * against environment variables and issues a signed session cookie.
 * Swap this for Supabase Auth or an SSO provider in production — the
 * admin routes only depend on isAdminAuthenticated().
 */
export function verifyCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME ?? "admin";
  const expectedPass = process.env.ADMIN_PASSWORD ?? "change-me";
  return username === expectedUser && password === expectedPass;
}

export async function makeSessionToken(username: string): Promise<string> {
  const payload = `${username}.${Date.now()}`;
  return `${Buffer.from(payload).toString("base64url")}.${await sign(payload)}`;
}

export async function isValidSessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return false;
  try {
    const payload = Buffer.from(encoded, "base64url").toString("utf8");
    return (await sign(payload)) === signature;
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  if (process.env.NODE_ENV === "development") return true;
  const store = await cookies();
  return isValidSessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function setAdminSession(username: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, await makeSessionToken(username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export const ADMIN_SESSION_COOKIE = SESSION_COOKIE;
