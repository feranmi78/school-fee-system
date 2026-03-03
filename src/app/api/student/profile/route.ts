import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(2),
  classLevel: z.string().min(1),
  parentPhone: z.string().optional(),
  sex: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  state: z.string().optional(),
  nationality: z.string().optional(),
  bio: z.string().optional(),
});

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { name, classLevel, parentPhone, sex, dateOfBirth, address, state, nationality, bio } = parsed.data;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
    });

    await prisma.student.update({
      where: { userId: session.user.id },
      data: { classLevel, parentPhone, sex, dateOfBirth, address, state, nationality, bio },
    });

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("[PUT /api/student/profile]", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}