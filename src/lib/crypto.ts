import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function newId(bytes = 12): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 32);
  return `${salt.toString("base64url")}.${hash.toString("base64url")}`;
}

export function checkPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(".").map((p) => Buffer.from(p, "base64url"));
  if (!salt || !hash) return false;
  return timingSafeEqual(scryptSync(password, salt, 32), hash);
}
