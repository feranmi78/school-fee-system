import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        student: { include: { user: true } },
        feeStructure: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Authorization: students can only see their own receipts
    if (
      session.user.role === "STUDENT" &&
      payment.student.userId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (payment.status !== "PAID") {
      return NextResponse.json(
        { error: "Receipt only available for paid transactions" },
        { status: 400 }
      );
    }

    // Generate HTML receipt (printable)
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt - ${payment.reference}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; display: flex; justify-content: center; padding: 40px 20px; }
    .receipt { background: white; width: 100%; max-width: 480px; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0369a1, #0ea5e9); padding: 32px; text-align: center; }
    .header .logo { width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px; }
    .header h1 { color: white; font-size: 20px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.8); font-size: 13px; margin-top: 4px; }
    .badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.2); color: white; padding: 6px 14px; border-radius: 100px; font-size: 12px; font-weight: 600; margin-top: 16px; }
    .body { padding: 32px; }
    .amount-section { text-align: center; padding: 24px; background: #f0f9ff; border-radius: 12px; margin-bottom: 24px; }
    .amount-label { color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .amount { font-size: 40px; font-weight: 800; color: #0369a1; margin-top: 4px; }
    .divider { height: 1px; background: #e2e8f0; margin: 20px 0; }
    .row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
    .label { color: #94a3b8; font-size: 12px; font-weight: 500; }
    .value { color: #1e293b; font-size: 13px; font-weight: 600; text-align: right; max-width: 60%; }
    .reference { font-family: monospace; font-size: 11px; color: #64748b; word-break: break-all; }
    .footer { padding: 20px 32px; background: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #94a3b8; font-size: 11px; line-height: 1.6; }
    @media print {
      body { background: white; padding: 0; }
      .receipt { box-shadow: none; max-width: 100%; border-radius: 0; }
      .print-btn { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>SchoolPay</h1>
      <p>Official Payment Receipt</p>
      <div class="badge">✓ Payment Confirmed</div>
    </div>

    <div class="body">
      <div class="amount-section">
        <p class="amount-label">Amount Paid</p>
        <p class="amount">${formatCurrency(payment.amount)}</p>
      </div>

      <div class="row">
        <span class="label">Student Name</span>
        <span class="value">${payment.student.user.name}</span>
      </div>
      <div class="row">
        <span class="label">Admission Number</span>
        <span class="value">${payment.student.admissionNumber}</span>
      </div>
      <div class="row">
        <span class="label">Class Level</span>
        <span class="value">${payment.student.classLevel}</span>
      </div>

      <div class="divider"></div>

      <div class="row">
        <span class="label">Term</span>
        <span class="value">${payment.feeStructure.term}</span>
      </div>
      <div class="row">
        <span class="label">Academic Session</span>
        <span class="value">${payment.feeStructure.session}</span>
      </div>

      <div class="divider"></div>

      <div class="row">
        <span class="label">Payment Date</span>
        <span class="value">${formatDate(payment.paidAt)}</span>
      </div>
      <div class="row">
        <span class="label">Status</span>
        <span class="value" style="color: #059669;">PAID</span>
      </div>
      <div class="row">
        <span class="label">Reference</span>
        <span class="value reference">${payment.reference}</span>
      </div>
    </div>

    <div class="footer">
      <p>This is an official payment receipt from SchoolPay.<br>Keep this for your records. Generated on ${formatDate(new Date())}.</p>
    </div>
  </div>

  <button class="print-btn" onclick="window.print()" style="position:fixed;bottom:20px;right:20px;background:#0369a1;color:white;border:none;padding:12px 24px;border-radius:10px;font-weight:600;cursor:pointer;font-size:14px;">
    🖨️ Print Receipt
  </button>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[GET /api/receipt/[id]]", error);
    return NextResponse.json({ error: "Failed to generate receipt" }, { status: 500 });
  }
}
