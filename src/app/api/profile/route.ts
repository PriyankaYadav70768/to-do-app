import { NextResponse } from "next/server";
import { getCurrentUser, verifyPassword, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileUpdateSchema, ChangePasswordSchema } from "@/lib/validations";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userProfile = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        preferences: true,
        _count: {
          select: {
            tasks: true,
            projects: true,
            categories: true,
          },
        },
      },
    });

    return NextResponse.json({ profile: userProfile });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // Check if password change request
    if (body.currentPassword && body.newPassword) {
      const validatedPw = ChangePasswordSchema.safeParse(body);
      if (!validatedPw.success) {
        return NextResponse.json(
          { error: validatedPw.error.issues[0]?.message || "Invalid password request" },
          { status: 400 }
        );
      }

      const dbUser = await db.user.findUnique({ where: { id: user.id } });
      if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

      const isValid = await verifyPassword(validatedPw.data.currentPassword, dbUser.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: "Current password does not match" }, { status: 400 });
      }

      const newHash = await hashPassword(validatedPw.data.newPassword);
      await db.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });

      return NextResponse.json({ success: true, message: "Password updated successfully" });
    }

    // Regular profile update
    const validated = ProfileUpdateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        name: validated.data.name,
        avatarUrl: validated.data.avatarUrl,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({ profile: updated });
  } catch (error) {
    console.error("Profile PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

