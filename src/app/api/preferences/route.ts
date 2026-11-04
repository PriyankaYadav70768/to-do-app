import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let prefs = await db.userPreference.findUnique({
      where: { userId: user.id },
    });

    if (!prefs) {
      prefs = await db.userPreference.create({
        data: {
          userId: user.id,
          theme: "dark",
          timezone: "UTC",
          weekStartDay: 1,
          emailReminders: true,
          inAppReminders: true,
        },
      });
    }

    return NextResponse.json({ preferences: prefs });
  } catch (error) {
    console.error("Preferences GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const updated = await db.userPreference.upsert({
      where: { userId: user.id },
      update: {
        ...(body.theme !== undefined && { theme: body.theme }),
        ...(body.timezone !== undefined && { timezone: body.timezone }),
        ...(body.weekStartDay !== undefined && { weekStartDay: Number(body.weekStartDay) }),
        ...(body.emailReminders !== undefined && { emailReminders: Boolean(body.emailReminders) }),
        ...(body.inAppReminders !== undefined && { inAppReminders: Boolean(body.inAppReminders) }),
      },
      create: {
        userId: user.id,
        theme: body.theme || "dark",
        timezone: body.timezone || "UTC",
        weekStartDay: body.weekStartDay ? Number(body.weekStartDay) : 1,
        emailReminders: body.emailReminders ?? true,
        inAppReminders: body.inAppReminders ?? true,
      },
    });

    return NextResponse.json({ preferences: updated });
  } catch (error) {
    console.error("Preferences PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

