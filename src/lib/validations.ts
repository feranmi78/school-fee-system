import { z } from "zod";

export const createStudentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  admissionNumber: z.string().min(3, "Admission number required"),
  classLevel: z.string().min(1, "Class level required"),
  parentPhone: z
    .string()
    .min(10, "Valid phone number required")
    .max(15, "Phone number too long"),
});

export const createFeeStructureSchema = z.object({
  term: z.enum(["First Term", "Second Term", "Third Term"]),
  session: z
    .string()
    .regex(/^\d{4}\/\d{4}$/, "Session must be in format YYYY/YYYY"),
  amount: z.number().positive("Amount must be positive"),
});

export const initPaymentSchema = z.object({
  feeStructureId: z.string().uuid("Invalid fee structure ID"),
});

export const csvStudentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  admissionnumber: z.string().min(3),
  classlevel: z.string().min(1),
  parentphone: z.string().min(10),
  password: z.string().optional().default("School@123"),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type CreateFeeStructureInput = z.infer<typeof createFeeStructureSchema>;
export type InitPaymentInput = z.infer<typeof initPaymentSchema>;
