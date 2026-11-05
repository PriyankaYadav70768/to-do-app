import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

export async function GET(req: Request) {
  const info: Record<string, any> = {
    status: "ok",
    timestamp: new Date().toISOString(),
    isVercel: Boolean(process.env.VERCEL),
    nodeEnv: process.env.NODE_ENV,
    cwd: process.cwd(),
  };

  try {
    const tmpDb = "/tmp/dev.db";
    info.tmpDbExists = fs.existsSync(tmpDb);
    if (info.tmpDbExists) {
      info.tmpDbSize = fs.statSync(tmpDb).size;
    }
  } catch (e: any) {
    info.tmpError = e.message;
  }

  try {
    const userCount = await db.user.count();
    info.dbStatus = "connected";
    info.userCount = userCount;
  } catch (e: any) {
    info.dbStatus = "error";
    info.dbError = e.message;
  }

  return NextResponse.json(info);
}

