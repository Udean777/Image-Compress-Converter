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
- **📦 Batch Download**: Download multiple processed images as a ZIP archive.
- **🖼️ Gallery**: Personal gallery for storing and managing processed images.
- **☁️ S3 Storage**: Secure, high-performance file storage using S3-compatible APIs (MinIO/AWS).
- **📂 Google Drive Sync**: Automatically upload processed images to your Google Drive account.
- **🔗 Cloud Connectors**: Integration with external cloud storage providers (S3, Google Drive).
- **🌓 Dark Mode**: Sleek dark-mode interface by default for a premium creative experience.

### Billing & Subscription

- **💳 Stripe Integration**: Secure payment processing with Stripe for subscription management.
- **📋 Subscription Plans**: Multiple pricing tiers (Starter, Pro, Enterprise) with different credit allocations.
- **🧾 Invoice System**: Professional invoice generation with print-ready PDF support.
- **💰 Credit System**: Atomic credit tracking with configurable credits per plan.
- **🔄 Auto-renewal**: Automatic subscription renewal with Stripe webhooks.
- **💾 Saved Payment Methods**: Store and reuse payment methods for quick upgrades.

### Admin Features

- **👑 Admin Dashboard**: Comprehensive administration panel with analytics.
- **👥 User Management**: View, edit, and manage user accounts and subscriptions.
- **🚫 Ban System**: Ability to ban/unban users from the platform.
- **📊 Transaction History**: View all platform transactions and revenue.
- **💵 Pricing Management**: Configure and update subscription plan pricing.
- **📢 Announcements**: Create and manage platform-wide announcements.
- **🔧 Maintenance Mode**: Enable maintenance mode for platform updates.
- **📈 Activity Logs**: Track user and system activities.
- **💾 Storage Management**: Monitor and manage S3 storage usage.
- **🏥 System Health**: Monitor system health and performance metrics.
- **👤 User Impersonation**: Admin can impersonate users for debugging.
- **⚙️ Admin Settings**: Configure platform-wide settings.

## 🛠️ Tech Stack

| Layer                | Technology                                    |
| -------------------- | --------------------------------------------- |
| **Frontend**         | SvelteKit 2, Svelte 5 (Runes), Tailwind CSS 4 |
| **UI Components**    | Shadcn-Svelte + Bits UI (Headless)            |
| **Backend**          | SvelteKit Server, Bun Runtime                 |
| **Database**         | PostgreSQL + Prisma ORM                       |
| **Storage**          | S3 / MinIO, Google Drive                      |
| **Payments**         | Stripe (Subscriptions, Webhooks)              |
| **Image Processing** | Sharp, @imgly/background-removal-node         |
| **Google APIs**      | googleapis (Drive v3)                         |
| **Charts**           | Chart.js                                      |
| **Animations**       | svelte-motion, canvas-confetti                |
| **Date Handling**    | date-fns                                      |
| **Authentication**   | Arctic (OAuth), Jose (JWT), bcryptjs          |

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
   # - Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)
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

# Clean up volumes
docker compose down -v
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Docker Scripts

```bash
bun run docker:up      # Start containers
bun run docker:down    # Stop containers
bun run docker:logs    # View logs
bun run docker:build   # Rebuild and start
bun run docker:clean   # Stop and remove volumes
```

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
│   │   │   ├── AdminService.ts
│   │   │   ├── AIService.ts
│   │   │   ├── AuthService.ts
│   │   │   ├── CloudConnectorService.ts
│   │   │   ├── CreditService.ts
│   │   │   ├── GoogleDriveService.ts
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
│   │   ├── activity/     # Activity logs
│   │   ├── announcements/# Platform announcements
│   │   ├── health/       # System health monitoring
│   │   ├── maintenance/  # Maintenance mode
│   │   ├── pricing/      # Pricing management
│   │   ├── settings/     # Admin settings
│   │   ├── storage/      # Storage management
│   │   ├── transactions/ # Transaction history
│   │   └── users/        # User management
│   ├── checkout/         # Stripe checkout flow
│   ├── dashboard/
│   │   ├── billing/      # Subscription & invoices
│   │   │   └── invoice/  # Invoice detail pages
│   │   ├── connectors/   # Cloud connectors
│   │   ├── gallery/      # Image gallery
│   │   ├── history/      # Processing history
│   │   ├── settings/     # User settings
│   │   └── upgrade/      # Plan upgrade page
│   ├── maintenance/      # Maintenance page
│   └── api/
│       ├── auth/         # OAuth endpoints
│       │   └── google/   # Google Drive OAuth
│       │       ├── login/
│       │       └── callback/
│       ├── checkout/     # Checkout session
│       ├── download/     # Single file download
│       ├── download-batch/ # Batch ZIP download
│       ├── impersonate/  # Admin impersonation
│       ├── pricing/      # Pricing API
│       ├── subscription/ # Subscription status
│       ├── webhook/      # General webhooks
│       └── stripe/       # Stripe API endpoints
│           ├── create-subscription/
│           ├── payment-methods/
│           ├── portal/
│           ├── setup-intent/
│           └── subscribe-with-saved/
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

### Download API

- `GET /api/download?key=<s3-key>` - Download single file
- `POST /api/download-batch` - Download multiple files as ZIP

### Billing & Subscription

- `GET /api/subscription` - Get subscription status
- `POST /api/stripe/create-subscription` - Create Stripe subscription
- `POST /api/stripe/subscribe-with-saved` - Subscribe with saved payment method
- `GET /api/stripe/portal` - Redirect to Stripe customer portal
- `POST /api/stripe/setup-intent` - Create setup intent for saving cards
- `GET /api/stripe/payment-methods` - Get saved payment methods
- `POST /dashboard/billing?/cancel` - Cancel subscription

### Admin Actions

- `POST /admin/users?/toggleBan` - Ban/unban user
- `POST /admin/users?/delete` - Delete user account
- `GET /api/impersonate?userId=<id>` - Impersonate user (admin only)

## 💳 Subscription Plans

| Plan     | Credits | Price      | Features                        |
| -------- | ------- | ---------- | ------------------------------- |
| Free     | 15      | Rp 0       | Max 10MB, Basic transformations |
| Starter  | 100     | Rp 39,000  | Max 10MB, All Basic features    |
| Pro      | 300     | Rp 79,000  | Max 20MB, Remove BG, Watermark  |
| Business | 1000    | Rp 199,000 | Max 20MB, Batch Processing      |

> [!NOTE]
> Every image processing action costs **5 credits**.

## 🧾 Invoice System

- Professional invoice layout with company branding
- Print-ready format optimized for A4 paper
- Includes payment details, subscription info, and transaction ID
- Accessible from Dashboard → Billing → Payment History

## 📜 Available Scripts

```bash
# Development
bun run dev            # Start development server
bun run build          # Build for production
bun run preview        # Preview production build

# Code Quality
bun run check          # Type checking
bun run check:watch    # Type checking in watch mode
bun run format         # Format code with Prettier
bun run lint           # Lint check

# Testing
bun run test           # Run unit tests
bun run test:unit      # Run unit tests in watch mode

# Database
bunx prisma migrate dev    # Run migrations
bunx prisma studio         # Open Prisma Studio
bun run db:seed            # Seed database

# Docker
bun run docker:up      # Start Docker services
bun run docker:down    # Stop Docker services
bun run docker:build   # Build and start
bun run docker:clean   # Clean up Docker volumes
bun run docker:logs    # View Docker logs

# Stripe
bun run stripe:listen  # Forward Stripe webhooks to local server
```

## 📄 License

MIT © 2026 Image Studio
