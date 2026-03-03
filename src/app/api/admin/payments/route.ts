import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin, unauthorizedResponse } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const status = searchParams.get("status") || "";
    const classLevel = searchParams.get("class") || "";
    const limit = 25;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && ["PAID", "PENDING", "FAILED"].includes(status)) {
      where.status = status;
    }
    if (classLevel) {
      where.student = { classLevel };
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          student: { include: { user: true } },
          feeStructure: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({ payments, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("[GET /api/admin/payments]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
