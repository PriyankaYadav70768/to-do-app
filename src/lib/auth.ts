import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-production-grade";
export const COOKIE_NAME = "task_session_token";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

export function isPrerenderBailoutError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const digest = (error as { digest?: unknown }).digest;
  if (typeof digest === "string") {
    if (
      digest === "HANGING_PROMISE_REJECTION" ||
      digest.startsWith("NEXT_") ||
      digest.startsWith("DYNAMIC_SERVER_USAGE")
    ) {
      return true;
    }
  }
  return false;
}

export function getTokenFromCookieHeader(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === COOKIE_NAME) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(user: SessionUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
  } catch {
    return null;
  }
}

export async function getCurrentUser(req?: Request): Promise<SessionUser | null> {
  let token: string | undefined | null;

  if (req) {
    const cookieHeader = req.headers.get("cookie");
    token = getTokenFromCookieHeader(cookieHeader);
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    } catch (error) {
      if (isPrerenderBailoutError(error)) {
        throw error;
      }
      return null;
    }
  }

  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  const user = await db.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, email: true, name: true },
  });

  return user;
}

export async function setSessionCookie(user: SessionUser) {
  const token = signToken(user);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

