import { NextResponse } from "next/server";
import { processDueReminders } from "@/lib/reminderScheduler";
import { isPrerenderBailoutError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    // Optional secret key check for Vercel Cron or external triggers
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key") || req.headers.get("x-cron-key");
    const expectedKey = process.env.CRON_SECRET;

    if (expectedKey && key !== expectedKey) {
      return NextResponse.json({ error: "Unauthorized cron access" }, { status: 401 });
    }

    const result = await processDueReminders();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error: any) {
    if (isPrerenderBailoutError(error)) {
      throw error;
    }
    console.error("Cron reminders error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error?.message },
      { status: 500 }
    );
  }
}
