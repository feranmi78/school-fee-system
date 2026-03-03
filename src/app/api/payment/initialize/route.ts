import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import {
  initializePayment,
  generateReference,
  nairaToKobo,
} from "@/lib/paystack";
import { initPaymentSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`init-payment-${session.user.id}`, 5, 60000)) {
    return NextResponse.json({ error: "Too many payment requests. Please wait." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = initPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid fee structure ID" },
        { status: 400 }
      );
    }

    const { feeStructureId } = parsed.data;

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    // Get fee structure
    const feeStructure = await prisma.feeStructure.findUnique({
      where: { id: feeStructureId },
    });

    if (!feeStructure) {
      return NextResponse.json(
        { error: "Fee structure not found" },
        { status: 404 }
      );
    }

    // Check if already paid for this term
    const existingPayment = await prisma.payment.findFirst({
      where: {
        studentId: student.id,
        feeStructureId,
        status: "PAID",
      },
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: "You have already paid for this term" },
        { status: 409 }
      );
    }

    // Generate unique reference
    const reference = generateReference("SCH");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const callbackUrl = `${appUrl}/api/payment/verify?reference=${reference}`;

    // Initialize Paystack payment
    const paystackResponse = await initializePayment({
      email: student.user.email,
      amount: nairaToKobo(feeStructure.amount),
      reference,
      metadata: {
        studentId: student.id,
        feeStructureId,
        studentName: student.user.name,
      },
      callbackUrl,
    });

    if (!paystackResponse.status) {
      throw new Error("Paystack initialization failed");
    }

    // Create pending payment record
    await prisma.payment.create({
      data: {
        studentId: student.id,
        feeStructureId,
        amount: feeStructure.amount,
        reference,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      authorizationUrl: paystackResponse.data.authorization_url,
      reference,
    });
  } catch (error) {
    console.error("[POST /api/payment/initialize]", error);
    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}
