import "server-only";
import { createHash, randomBytes, randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hash, verify } from "@node-rs/argon2";
import { sql } from "./db";
import { WORDS } from "./words";

export const SESSION_COOKIE = "tempo_session";
const SESSION_DAYS = 90;
const MAX_FAILURES = 5;
const LOCKOUT_MINUTES = 15;

/** Forgiving normalisation: case, spaces, hyphens and underscores do not matter. */
export function normalisePassphrase(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .split(/[\s\-_.]+/)
    .filter(Boolean)
    .join("-");
}

export function passphraseProblem(input: string): string | null {
  const p = normalisePassphrase(input);
  const words = p.split("-").filter(Boolean);
  if (p.length < 16) return "Use at least 16 characters, for example five or six words.";
  if (words.length < 4) return "Use at least four words, so it is both strong and memorable.";
  return null;
}

export function generatePassphrase(words = 6): string {
  return Array.from({ length: words }, () => WORDS[randomInt(WORDS.length)]).join("-");
}

function generateRecoveryCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const groups = Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => alphabet[randomInt(alphabet.length)]).join(""),
  );
  return groups.join("-");
}

function normaliseRecovery(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function userExists(): Promise<boolean> {
  const rows = await sql<{ n: number }>("SELECT COUNT(*)::int AS n FROM users");
  return Number(rows[0]?.n ?? 0) > 0;
}

async function startSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  await sql("INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)", [
    sha256(token),
    userId,
    expires.toISOString(),
  ]);
  await sql("DELETE FROM auth_sessions WHERE expires_at < now()");
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export type AuthResult = { ok: true; recoveryCode?: string } | { ok: false; error: string };

/** Sign-up works exactly once: when no account exists. */
export async function signUp(passphrase: string): Promise<AuthResult> {
  if (await userExists()) return { ok: false, error: "Tempo already has its owner. Please sign in." };
  const problem = passphraseProblem(passphrase);
  if (problem) return { ok: false, error: problem };
  const recoveryCode = generateRecoveryCode();
  const rows = await sql<{ id: number }>(
    "INSERT INTO users (passphrase_hash, recovery_hash) SELECT $1, $2 WHERE NOT EXISTS (SELECT 1 FROM users) RETURNING id",
    [await hash(normalisePassphrase(passphrase)), await hash(normaliseRecovery(recoveryCode))],
  );
  if (!rows[0]) return { ok: false, error: "Tempo already has its owner. Please sign in." };
  // No session yet: the learner first sees and saves the recovery code, then signs in.
  return { ok: true, recoveryCode };
}

async function lockedOut(): Promise<number> {
  const rows = await sql<{ n: number; first: string | null }>(
    `SELECT COUNT(*)::int AS n, MIN(at) AS first FROM sign_in_failures
     WHERE at > now() - interval '${LOCKOUT_MINUTES} minutes'`,
  );
  const n = Number(rows[0]?.n ?? 0);
  if (n < MAX_FAILURES || !rows[0]?.first) return 0;
  const unlock = new Date(rows[0].first).getTime() + LOCKOUT_MINUTES * 60e3;
  return Math.max(1, Math.ceil((unlock - Date.now()) / 60e3));
}

export async function signIn(passphrase: string): Promise<AuthResult> {
  const wait = await lockedOut();
  if (wait) return { ok: false, error: `Too many attempts. Try again in ${wait} minute${wait === 1 ? "" : "s"}.` };
  const rows = await sql<{ id: number; passphrase_hash: string }>("SELECT id, passphrase_hash FROM users LIMIT 1");
  const user = rows[0];
  if (user && (await verify(user.passphrase_hash, normalisePassphrase(passphrase)))) {
    await sql("DELETE FROM sign_in_failures");
    await startSession(user.id);
    return { ok: true };
  }
  await sql("INSERT INTO sign_in_failures DEFAULT VALUES");
  return { ok: false, error: "That passphrase does not match." };
}

/** Recovery: the one-time code resets the passphrase and issues a fresh code. */
export async function recover(code: string, newPassphrase: string): Promise<AuthResult> {
  const wait = await lockedOut();
  if (wait) return { ok: false, error: `Too many attempts. Try again in ${wait} minute${wait === 1 ? "" : "s"}.` };
  const problem = passphraseProblem(newPassphrase);
  if (problem) return { ok: false, error: problem };
  const rows = await sql<{ id: number; recovery_hash: string }>("SELECT id, recovery_hash FROM users LIMIT 1");
  const user = rows[0];
  if (!user || !(await verify(user.recovery_hash, normaliseRecovery(code)))) {
    await sql("INSERT INTO sign_in_failures DEFAULT VALUES");
    return { ok: false, error: "That recovery code does not match." };
  }
  const recoveryCode = generateRecoveryCode();
  await sql("UPDATE users SET passphrase_hash = $1, recovery_hash = $2 WHERE id = $3", [
    await hash(normalisePassphrase(newPassphrase)),
    await hash(normaliseRecovery(recoveryCode)),
    user.id,
  ]);
  await sql("DELETE FROM auth_sessions WHERE user_id = $1", [user.id]);
  await sql("DELETE FROM sign_in_failures");
  return { ok: true, recoveryCode };
}

export async function signOut() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await sql("DELETE FROM auth_sessions WHERE token_hash = $1", [sha256(token)]);
  jar.delete(SESSION_COOKIE);
}

/** Returns the signed-in user's id, or null. */
export async function currentUserId(): Promise<number | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await sql<{ user_id: number }>(
    "SELECT user_id FROM auth_sessions WHERE token_hash = $1 AND expires_at > now()",
    [sha256(token)],
  );
  return rows[0]?.user_id ?? null;
}

export async function requireUser(): Promise<number> {
  const id = await currentUserId();
  if (id === null) redirect("/sign-in");
  return id;
}
