import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyPayment, koboToNaira } from "@/lib/paystack";
import { redirect } from "next/navigation";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.redirect(new URL("/student?error=invalid_reference", req.url));
  }

  try {
    // Get payment record
    const payment = await prisma.payment.findUnique({
      where: { reference },
    });

    if (!payment) {
      return NextResponse.redirect(
        new URL("/student?error=payment_not_found", req.url)
      );
    }

    // Prevent double processing
    if (payment.status === "PAID") {
      return NextResponse.redirect(
        new URL("/student/payments?success=already_paid", req.url)
      );
    }

    // Verify with Paystack
    const verification = await verifyPayment(reference);

    if (
      verification.status &&
      verification.data.status === "success"
    ) {
      // Update payment to PAID
      await prisma.payment.update({
        where: { reference },
        data: {
          status: "PAID",
          paidAt: new Date(verification.data.paid_at),
          amount: koboToNaira(verification.data.amount),
        },
      });

      return NextResponse.redirect(
        new URL("/student/payments?success=true", req.url)
      );
    } else {
      // Mark as failed
      await prisma.payment.update({
        where: { reference },
        data: { status: "FAILED" },
      });

      return NextResponse.redirect(
        new URL("/student?error=payment_failed", req.url)
      );
    }
  } catch (error) {
    console.error("[GET /api/payment/verify]", error);
    return NextResponse.redirect(
      new URL("/student?error=verification_failed", req.url)
    );
  }
}
