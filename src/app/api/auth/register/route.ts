import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { RegisterSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = RegisterSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { email, password, name } = validated.data;

    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash,
        preferences: {
          create: {
            theme: "system",
            timezone: "UTC",
          },
        },
        // Seed default categories for great onboarding UX
        categories: {
          create: [
            { name: "Work", color: "#3b82f6" },
            { name: "Personal", color: "#10b981" },
            { name: "Health", color: "#f59e0b" },
          ],
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    await setSessionCookie(user);

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

