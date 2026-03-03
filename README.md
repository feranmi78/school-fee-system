# SchoolPay — School Fee Management System

A production-ready, mobile-first fee management system built with Next.js 14, TypeScript, Prisma, PostgreSQL, NextAuth, and Paystack.

---

## 🚀 Features

- **Role-based authentication** (Admin / Student) using NextAuth JWT
- **Student management** with individual & bulk CSV import
- **Term-based fee structures** (First, Second, Third Term per academic session)
- **Paystack payment integration** with webhook verification
- **Automatic payment reconciliation** (callback + webhook double-verification)
- **CSV export** of all payment records
- **Printable PDF receipts** for paid transactions
- **Real-time analytics dashboard** for admin
- **Mobile-first design** with bottom navigation (mobile) + sidebar (desktop)
- **Dark mode support** via Tailwind CSS
- **Server components** for fast, low-bandwidth loading

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── (auth)/login/           # Login page
│   ├── (dashboard)/
│   │   ├── admin/              # Admin pages (dashboard, students, fees, payments)
│   │   └── student/            # Student pages (dashboard, payments)
│   ├── api/
│   │   ├── auth/               # NextAuth handler
│   │   ├── admin/              # Admin API routes (students, fees, payments)
│   │   ├── payment/            # Paystack (initialize, verify callback, webhook)
│   │   ├── export/             # CSV export
│   │   └── receipt/[id]/       # HTML receipt generator
│   ├── layout.tsx
│   └── page.tsx                # Root redirect
├── components/
│   ├── admin/                  # Admin UI components
│   └── student/                # Student UI components
├── lib/
│   ├── auth.ts                 # NextAuth config
│   ├── db.ts                   # Prisma singleton
│   ├── paystack.ts             # Paystack utilities
│   ├── utils.ts                # Shared helpers
│   └── validations.ts          # Zod schemas
├── middleware.ts               # Route protection
└── types/
    └── next-auth.d.ts          # Type extensions
prisma/
├── schema.prisma               # Database schema
└── seed.ts                     # Initial data seed
```

---

## ⚙️ Local Setup

### 1. Clone & Install

```bash
git clone <your-repo>
cd school-fee-system
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Fill in your values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/school_fees"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
PAYSTACK_SECRET_KEY="sk_test_..."
PAYSTACK_PUBLIC_KEY="pk_test_..."
PAYSTACK_WEBHOOK_SECRET="your-webhook-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_..."
```

### 3. Database Setup

```bash
# Push schema to DB
npm run db:push

# Or run migrations (preferred for production)
npm run db:migrate

# Seed with sample admin + student
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

**Default credentials (after seed):**
- Admin: `admin@schoolpay.edu.ng` / `Admin@123456`
- Student: `john.doe@student.edu.ng` / `Student@123`

---

## 🌐 Deploying to Vercel

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/school-fee-system.git
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repository
3. Set **Framework Preset** to `Next.js`

### Step 3: Configure Environment Variables

In Vercel dashboard → Settings → Environment Variables, add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your PostgreSQL connection string |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `PAYSTACK_SECRET_KEY` | From Paystack dashboard |
| `PAYSTACK_PUBLIC_KEY` | From Paystack dashboard |
| `PAYSTACK_WEBHOOK_SECRET` | From Paystack webhook settings |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | From Paystack dashboard |

### Step 4: Recommended PostgreSQL Providers

- **Neon** (serverless, Vercel-native): [neon.tech](https://neon.tech) — Free tier available
- **Supabase**: [supabase.com](https://supabase.com) — Free tier available  
- **PlanetScale**: MySQL (change Prisma provider)

For Neon, your `DATABASE_URL` format:
```
postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Step 5: Run Migrations on Deploy

Add a `postinstall` or use Vercel's build command:

```json
// package.json
"scripts": {
  "build": "prisma generate && prisma migrate deploy && next build"
}
```

Or in Vercel dashboard, set Build Command to:
```
prisma generate && prisma migrate deploy && next build
```

### Step 6: Configure Paystack Webhook

In your Paystack dashboard → Settings → API Keys & Webhooks:

1. Set webhook URL to: `https://your-app.vercel.app/api/payment/webhook`
2. Events to listen to: `charge.success`, `charge.failed`
3. Copy the webhook secret to your env variable

---

## 💳 Payment Flow

```
Student clicks "Pay Now"
→ POST /api/payment/initialize
  → Creates PENDING payment record
  → Calls Paystack API → Gets authorization_url
→ Browser redirects to Paystack checkout
→ Student completes payment
→ Paystack redirects to /api/payment/verify?reference=...
  → Verifies with Paystack API
  → Updates payment to PAID
→ Webhook (backup): POST /api/payment/webhook
  → Verifies HMAC signature
  → Idempotent update (no double-processing)
```

---

## 📊 CSV Import Format

To bulk import students, create a CSV with headers:

```csv
name,email,admissionnumber,classlevel,parentphone,password
John Doe,john@email.com,SCH/2024/001,JSS 3,+2348012345678,MyPass@123
Jane Smith,jane@email.com,SCH/2024/002,SSS 1,+2348098765432,
```

> Password is optional — defaults to `School@123` if not provided.

---

## 🔒 Security Features

- Passwords hashed with bcrypt (cost factor 12)
- JWT sessions (30-day expiry)
- Role-based middleware on all routes
- Zod validation on all API inputs
- Paystack webhook HMAC-SHA512 verification
- Rate limiting on payment init (5 req/min) and student creation
- CSRF protection via NextAuth
- Environment variables for all secrets

---

## 🏗️ Scaling Beyond MVP

For 500+ students in production:

1. **Use Redis** for rate limiting (replace in-memory map in `utils.ts`)
2. **Add Prisma connection pooling** with [PgBouncer or Prisma Accelerate](https://www.prisma.io/docs/accelerate)
3. **Add job queue** (e.g. Bull/BullMQ) for webhook processing
4. **Add monitoring** (Sentry, Vercel Analytics)
5. **Add email notifications** (Resend, Nodemailer) for payment confirmations

---

## 📝 License

MIT
