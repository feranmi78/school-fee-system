import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { requireAdmin, unauthorizedResponse, parseCSV } from "@/lib/utils";
import { csvStudentSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "File must be a CSV" }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "CSV file is empty or has no data rows" },
        { status: 400 }
      );
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const parsed = csvStudentSchema.safeParse(row);

      if (!parsed.success) {
        failed++;
        errors.push(`Row ${i + 2}: ${parsed.error.errors[0].message}`);
        continue;
      }

      const { name, email, admissionnumber, classlevel, parentphone, password } =
        parsed.data;

      try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
          data: {
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: "STUDENT",
            student: {
              create: {
                admissionNumber: admissionnumber,
                classLevel: classlevel,
                parentPhone: parentphone,
              },
            },
          },
        });

        success++;
      } catch (err: any) {
        failed++;
        if (err.code === "P2002") {
          errors.push(
            `Row ${i + 2}: ${email} or admission number already exists`
          );
        } else {
          errors.push(`Row ${i + 2}: Failed to create student`);
        }
      }
    }

    return NextResponse.json({ success, failed, errors });
  } catch (error) {
    console.error("[POST /api/admin/students/import]", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
