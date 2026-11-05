import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabaseUrl(): string {
  // If an external database URL is explicitly configured (e.g. Postgres, Supabase, Neon)
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:")) {
    return process.env.DATABASE_URL;
  }

  // Detect serverless environment (Vercel, AWS Lambda, Netlify)
  const isServerless =
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.LAMBDA_TASK_ROOT);

  if (isServerless) {
    const tmpDbPath = path.join("/tmp", "dev.db");

    // Copy the database file to /tmp on cold start if not already there
    if (!fs.existsSync(/*turbopackIgnore: true*/ tmpDbPath)) {
      const candidates = [
        path.join(process.cwd(), "prisma", "dev.db"),
        path.join(process.cwd(), "dev.db"),
        path.join(__dirname, "prisma", "dev.db"),
        path.join(__dirname, "..", "prisma", "dev.db"),
        path.join(__dirname, "..", "..", "prisma", "dev.db"),
        path.join(__dirname, "..", "..", "..", "prisma", "dev.db"),
        path.join(__dirname, "..", "..", "..", "..", "prisma", "dev.db"),
      ];

      let copied = false;
      for (const candidate of candidates) {
        if (fs.existsSync(/*turbopackIgnore: true*/ candidate)) {
          try {
            fs.copyFileSync(/*turbopackIgnore: true*/ candidate, tmpDbPath);
            copied = true;
            console.log(`[db] Successfully copied database from ${candidate} to ${tmpDbPath}`);
            break;
          } catch (err) {
            console.error(`[db] Error copying database from ${candidate}:`, err);
          }
        }
      }

      if (!copied) {
        console.warn("[db] Source dev.db not found in candidate paths. Initializing empty DB at /tmp/dev.db");
        try {
          fs.writeFileSync(tmpDbPath, "");
        } catch (e) {
          console.error("[db] Error creating /tmp/dev.db:", e);
        }
      }
    }

    return `file:${tmpDbPath}`;
  }

  // Local development / server environment
  const localPrismaDb = path.join(process.cwd(), "prisma", "dev.db");
  if (fs.existsSync(/*turbopackIgnore: true*/ localPrismaDb)) {
    return `file:${localPrismaDb.replace(/\\/g, "/")}`;
  }

  return process.env.DATABASE_URL || "file:./dev.db";
}

const dbUrl = getDatabaseUrl();

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
