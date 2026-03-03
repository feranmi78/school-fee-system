import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAdmin, unauthorizedResponse, generateCSV, formatDate } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "payments";

  try {
    if (type === "payments") {
      const payments = await prisma.payment.findMany({
        include: {
          student: { include: { user: true } },
          feeStructure: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const data = payments.map((p) => ({
        reference: p.reference,
        student_name: p.student.user.name,
        student_email: p.student.user.email,
        admission_number: p.student.admissionNumber,
        class_level: p.student.classLevel,
        parent_phone: p.student.parentPhone,
        term: p.feeStructure.term,
        session: p.feeStructure.session,
        amount_ngn: p.amount,
        status: p.status,
        paid_at: p.paidAt ? formatDate(p.paidAt) : "",
        created_at: formatDate(p.createdAt),
      }));

      const headers = [
        "reference",
        "student_name",
        "student_email",
        "admission_number",
        "class_level",
        "parent_phone",
        "term",
        "session",
        "amount_ngn",
        "status",
        "paid_at",
        "created_at",
      ];

      const csv = generateCSV(data, headers);
      const filename = `payments-export-${new Date().toISOString().split("T")[0]}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    if (type === "students") {
      const students = await prisma.student.findMany({
        include: {
          user: true,
          payments: { where: { status: "PAID" } },
        },
        orderBy: { createdAt: "asc" },
      });

      const data = students.map((s) => ({
        admission_number: s.admissionNumber,
        name: s.user.name,
        email: s.user.email,
        class_level: s.classLevel,
        parent_phone: s.parentPhone,
        total_payments: s.payments.length,
        total_paid: s.payments.reduce((sum, p) => sum + p.amount, 0),
        created_at: formatDate(s.createdAt),
      }));

      const headers = [
        "admission_number",
        "name",
        "email",
        "class_level",
        "parent_phone",
        "total_payments",
        "total_paid",
        "created_at",
      ];

      const csv = generateCSV(data, headers);
      const filename = `students-export-${new Date().toISOString().split("T")[0]}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
  } catch (error) {
    console.error("[GET /api/export]", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
