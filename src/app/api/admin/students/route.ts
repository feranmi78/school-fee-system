import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { requireAdmin, unauthorizedResponse, rateLimit } from "@/lib/utils";
import { createStudentSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  // Rate limiting
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`create-student-${ip}`, 20, 60000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = createStudentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, admissionNumber, classLevel, parentPhone } =
      parsed.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    // Check if admission number exists
    const existingStudent = await prisma.student.findUnique({
      where: { admissionNumber },
    });
    if (existingStudent) {
      return NextResponse.json(
        { error: "Admission number already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "STUDENT",
        student: {
          create: {
            admissionNumber,
            classLevel,
            parentPhone,
          },
        },
      },
      include: { student: true },
    });

    return NextResponse.json(
      {
        message: "Student created successfully",
        student: { id: user.id, name: user.name, email: user.email },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/admin/students]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const skip = (page - 1) * limit;

    const students = await prisma.student.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.student.count();

    return NextResponse.json({ students, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("[GET /api/admin/students]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
