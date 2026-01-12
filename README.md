# 🖼️ Image Studio - Mini SaaS

A modern, premium image compression and conversion SaaS application built with SvelteKit, Prisma, and Bun runtime. Featuring a high-end dashboard with advanced image processing capabilities and integrated Stripe payment system.

## ✨ Features

### Core Features

- **🚀 Professional Dashboard**: Modern sidebar navigation with collapsible interface and responsive design.
- **📉 Intelligent Compression**: Reduce image file sizes up to 90% while maintaining visual quality.
- **🔄 Multi-format Conversion**: Lightning-fast conversion between PNG, JPG, and WebP formats.
- **🎨 Background Removal**: AI-powered background removal for product photos and portraits.
- **👤 Profile Management**: Custom avatar uploads with an interactive cropping editor.
- **⏳ Processing History**: Complete history logs for all image operations with instant download links.
- **☁️ S3 Storage**: Secure, high-performance file storage using S3-compatible APIs (MinIO/AWS).
- **🌓 Dark Mode**: Sleek dark-mode interface by default for a premium creative experience.

### Billing & Subscription

- **💳 Stripe Integration**: Secure payment processing with Stripe for subscription management.
- **📋 Subscription Plans**: Multiple pricing tiers (Starter, Pro, Enterprise) with different credit allocations.
- **🧾 Invoice System**: Professional invoice generation with print-ready PDF support.
- **💰 Credit System**: Atomic credit tracking with configurable credits per plan.
- **🔄 Auto-renewal**: Automatic subscription renewal with Stripe webhooks.

### Admin Features

- **👑 Admin Dashboard**: User management panel for administrators.
- **👥 User Management**: View, edit, and manage user accounts and subscriptions.
- **🚫 Ban System**: Ability to ban/unban users from the platform.

## 🛠️ Tech Stack

| Layer                | Technology                                    |
| -------------------- | --------------------------------------------- |
| **Frontend**         | SvelteKit 2, Svelte 5 (Runes), Tailwind CSS 4 |
| **UI Components**    | Shadcn-Svelte + Bits UI (Headless)            |
| **Backend**          | SvelteKit Server, Bun Runtime                 |
| **Database**         | PostgreSQL + Prisma ORM                       |
| **Storage**          | S3 / MinIO                                    |
| **Payments**         | Stripe (Subscriptions, Webhooks)              |
| **Image Processing** | Sharp, @imgly/background-removal-node         |

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) v1.1+
- [Docker](https://docker.com) & Docker Compose
- PostgreSQL (Local or Docker)
- Stripe Account (for payment processing)

### Development Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd mini-saas-vivnio
   ```

2. **Start infrastructure services**

   ```bash
   docker compose up -d postgres minio
   ```

3. **Install dependencies**

   ```bash
   bun install
   ```

4. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env with your specific credentials:
   # - Database connection
   # - S3/MinIO credentials
   # - Stripe API keys (STRIPE_SECRET_KEY, PUBLIC_STRIPE_KEY)
   # - Stripe webhook secret
   ```

5. **Setup database**

   ```bash
   bunx prisma migrate dev
   ```

6. **Seed pricing plans and admin user**

   ```bash
   bun run db:seed
   ```

7. **Start development server**

   ```bash
   bun --bun run dev --port 1234
   ```

   Open [http://localhost:1234](http://localhost:1234)

## 🐳 Docker Deployment

### Full Stack with Docker Compose

```bash
# Build and start all services in detached mode
docker compose up -d --build

# View logs for the application
docker compose logs -f app

# Stop and remove containers
docker compose down
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── dashboard/    # Sidebar, Header, widgets
│   │   ├── ui/           # Reusable UI (Shadcn-Svelte)
│   │   └── icons/        # Lucide icon exports
│   ├── server/
│   │   ├── services/     # Business services
│   │   │   ├── AuthService.ts
│   │   │   ├── CreditService.ts
│   │   │   ├── ImageService.ts
│   │   │   ├── PricingService.ts
│   │   │   ├── SubscriptionService.ts
│   │   │   └── UserService.ts
│   │   ├── s3.ts         # S3 Client configuration
│   │   └── db.ts         # Prisma client
│   └── types/            # TypeScript definitions
├── routes/
│   ├── (auth)/           # Auth views (Login, Register)
│   ├── admin/            # Admin panel (protected)
│   │   └── users/        # User management
│   ├── checkout/         # Stripe checkout flow
│   ├── dashboard/
│   │   ├── billing/      # Subscription & invoices
│   │   │   └── invoice/  # Invoice detail pages
│   │   ├── history/      # Processing history
│   │   ├── settings/     # User settings
│   │   └── upgrade/      # Plan upgrade page
│   └── api/
│       └── stripe/       # Stripe API endpoints
│           ├── create-subscription/
│           └── webhooks (portal, etc.)
└── hooks.server.ts       # Auth middleware
```

## 🔐 API & Form Actions

### Authentication

- `POST /login` - User login
- `POST /register` - User registration
- `POST ?/logout` - Secure logout with confirmation

### Dashboard Actions

- `POST /dashboard?/process` - Upload and process images
- `POST /dashboard?/delete` - Remove item from history
- `POST /dashboard/settings?/updateProfile` - Update profile
- `POST /dashboard/settings?/updateAvatar` - Upload avatar

### Billing & Subscription

- `POST /api/stripe/create-subscription` - Create Stripe subscription
- `GET /api/stripe/portal` - Redirect to Stripe customer portal
- `POST /dashboard/billing?/cancel` - Cancel subscription

### Admin Actions

- `POST /admin/users?/toggleBan` - Ban/unban user
- `POST /admin/users?/delete` - Delete user account

## 💳 Subscription Plans

| Plan       | Credits | Price      | Features                        |
| ---------- | ------- | ---------- | ------------------------------- |
| Free       | 15      | Rp 0       | Basic compression & conversion  |
| Starter    | 100     | Rp 49,000  | All features + Priority support |
| Pro        | 500     | Rp 149,000 | Unlimited + API access          |
| Enterprise | 2000    | Rp 499,000 | Custom + Dedicated support      |

## 🧾 Invoice System

- Professional invoice layout with company branding
- Print-ready format optimized for A4 paper
- Includes payment details, subscription info, and transaction ID
- Accessible from Dashboard → Billing → Payment History

## 📄 License

MIT © 2026 Image Studio
