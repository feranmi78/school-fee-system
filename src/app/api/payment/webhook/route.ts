import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyWebhookSignature, koboToNaira } from "@/lib/paystack";

// Disable body parsing - need raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-paystack-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 401 });
    }

    const rawBody = await req.text();

    // Verify webhook signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.warn("[Webhook] Invalid signature attempt");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    console.log(`[Webhook] Event: ${event.event}`);

    if (event.event === "charge.success") {
      const { reference, amount, paid_at, status } = event.data;

      if (status !== "success") {
        return NextResponse.json({ received: true });
      }

      // Find payment by reference
      const payment = await prisma.payment.findUnique({
        where: { reference },
      });

      if (!payment) {
        console.warn(`[Webhook] Payment not found for reference: ${reference}`);
        return NextResponse.json({ received: true });
      }

      // Idempotency check - don't reprocess
      if (payment.status === "PAID") {
        console.log(`[Webhook] Payment already processed: ${reference}`);
        return NextResponse.json({ received: true });
      }

      // Update payment status
      await prisma.payment.update({
        where: { reference },
        data: {
          status: "PAID",
          paidAt: new Date(paid_at),
          amount: koboToNaira(amount),
        },
      });

      console.log(`[Webhook] Payment confirmed: ${reference}`);
    }

    if (event.event === "charge.failed") {
      const { reference } = event.data;

      const payment = await prisma.payment.findUnique({ where: { reference } });

      if (payment && payment.status === "PENDING") {
        await prisma.payment.update({
          where: { reference },
          data: { status: "FAILED" },
        });
        console.log(`[Webhook] Payment failed: ${reference}`);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[Webhook] Processing error:", error);
    // Return 200 to prevent Paystack from retrying malformed requests
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
