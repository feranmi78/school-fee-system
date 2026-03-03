import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin, unauthorizedResponse } from "@/lib/utils";
import { createFeeStructureSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const body = await req.json();
    const parsed = createFeeStructureSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { term, session: acadSession, amount } = parsed.data;

    // Check for duplicate term+session
    const existing = await prisma.feeStructure.findUnique({
      where: { term_session: { term, session: acadSession } },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Fee structure for ${term} ${acadSession} already exists` },
        { status: 409 }
      );
    }

    const feeStructure = await prisma.feeStructure.create({
      data: { term, session: acadSession, amount },
    });

    return NextResponse.json(
      { message: "Fee structure created", feeStructure },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/admin/fees]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const fees = await prisma.feeStructure.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { payments: true } } },
    });
    return NextResponse.json({ fees });
  } catch (error) {
    console.error("[GET /api/admin/fees]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
