import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  admissionNumber: z.string().min(3),
  classLevel: z.string().min(1),
  parentPhone: z.string().min(10),
  sex: z.string().optional(),
  state: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { name, email, password, admissionNumber, classLevel, parentPhone, sex, state, dateOfBirth } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const existingAdmission = await prisma.student.findUnique({ where: { admissionNumber } });
    if (existingAdmission) return NextResponse.json({ error: "Admission number already exists" }, { status: 409 });

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "STUDENT",
        student: {
          create: { admissionNumber, classLevel, parentPhone, sex, state, dateOfBirth },
        },
      },
    });

    return NextResponse.json({ message: "Account created successfully" }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/auth/register]", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}