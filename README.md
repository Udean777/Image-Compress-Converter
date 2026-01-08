# 🖼️ Image Studio - Mini SaaS

A modern, premium image compression and conversion SaaS application built with SvelteKit, Prisma, and Bun runtime. Featuring a high-end dashboard with advanced image processing capabilities.

## ✨ Features

- **🚀 Professional Dashboard**: Modern sidebar navigation with collapsible interface and responsive design.
- **📉 Intelligent Compression**: Reduce image file sizes up to 90% while maintaining visual quality.
- **🔄 Multi-format Conversion**: Lightning-fast conversion between PNG, JPG, and WebP formats.
- **👤 Profile Management**: Custom avatar uploads with an interactive cropping editor.
- **💳 Credit System**: Atomic credit tracking system with 10 free credits for new users.
- **⏳ Processing History**: Complete history logs for all image operations with instant download links.
- **☁️ S3 Storage**: Secure, high-performance file storage using S3-compatible APIs (MinIO/AWS).
- **🌓 Dark Mode**: Sleek dark-mode interface by default for a premium creative experience.

## 🛠️ Tech Stack

| Layer                | Technology                                    |
| -------------------- | --------------------------------------------- |
| **Frontend**         | SvelteKit 2, Svelte 5 (Runes), Tailwind CSS 4 |
| **UI Components**    | Shadcn-Svelte + Bits UI (Headless)            |
| **Backend**          | SvelteKit Server, Bun Runtime                 |
| **Database**         | PostgreSQL + Prisma ORM                       |
| **Storage**          | S3 / MinIO                                    |
| **Image Processing** | Sharp                                         |

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) v1.1+
- [Docker](https://docker.com) & Docker Compose
- PostgreSQL (Local or Docker)

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
   # Edit .env with your specific database and S3 credentials
   ```

5. **Setup database**

   ```bash
   bunx prisma migrate dev
   ```

6. **Start development server**

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
│   ├── components/       # UI Components
│   │   ├── dashboard/    # Sidebar, Header, and logic components
│   │   ├── ui/           # Reusable base UI (Shadcn-Svelte)
│   │   └── icons/        # Centralized Lucide icon exports
│   ├── server/           # Backend Logic
│   │   ├── services/     # Business services (Image, User, Auth)
│   │   ├── s3.ts         # S3 Client configuration
│   │   └── auth.ts       # Authentication helpers
│   └── types/            # TypeScript schemas and definitions
├── routes/
│   ├── (auth)/           # Auth views (Login, Register)
│   ├── dashboard/        # Protected User Dashboard
│   │   ├── history/      # Image processing history
│   │   └── settings/     # Profile and security settings
│   └── api/              # JSON API endpoints
└── hooks.server.ts       # Server-side auth middleware
```

## 🔐 API & Form Actions

### Authentication

- `POST /login` - User login
- `POST /register` - User registration
- `POST ?/logout` - Secure logout with confirmation (available on all dashboard pages)

### Dashboard Actions

- `POST /dashboard?/process` - Upload and process images (Compress/Convert)
- `POST /dashboard?/delete` - Remove item from history
- `POST /dashboard/settings?/updateProfile` - Change name
- `POST /dashboard/settings?/updateAvatar` - Upload new cropped avatar

## 💳 Credit System

- Each account starts with **10 credits**.
- Every successful image processing task costs **1 credit**.
- Failed operations do not deduct credits.
- Credits are tracked atomically to ensure balance integrity.

## 📄 License

MIT © 2026 Image Studio
