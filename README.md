# 🖼️ Image Studio - Mini SaaS

A modern image compression and conversion SaaS application built with SvelteKit, Prisma, and Bun.

## ✨ Features

- **Image Compression**: Reduce file sizes up to 90% without quality loss
- **Format Conversion**: Convert between PNG, JPG, and WebP formats
- **Credit System**: Pay-per-use model with credit tracking
- **Processing History**: Track all your processed images
- **Secure Storage**: S3-compatible storage with presigned URLs

## 🛠️ Tech Stack

| Layer                | Technology                            |
| -------------------- | ------------------------------------- |
| **Frontend**         | SvelteKit 2, Svelte 5, Tailwind CSS 4 |
| **Backend**          | SvelteKit Server, Bun Runtime         |
| **Database**         | PostgreSQL + Prisma ORM               |
| **Storage**          | S3 / MinIO                            |
| **Image Processing** | Sharp                                 |

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) v1.0+
- [Docker](https://docker.com) & Docker Compose
- PostgreSQL (or use Docker)

### Development Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd mini-saas-vivnio
   ```

2. **Start infrastructure services**

   ```bash
   docker compose up -d postgres minio createbuckets
   ```

3. **Install dependencies**

   ```bash
   bun install
   ```

4. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Setup database**

   ```bash
   bunx prisma migrate dev
   ```

6. **Start development server**

   ```bash
   bun run dev
   ```

   Open [http://localhost:5173](http://localhost:5173)

## 🐳 Docker Deployment

### Full Stack with Docker Compose

```bash
# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f app

# Stop all services
docker compose down
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Services

| Service    | Port | Description               |
| ---------- | ---- | ------------------------- |
| `app`      | 3000 | SvelteKit application     |
| `postgres` | 5432 | PostgreSQL database       |
| `minio`    | 9000 | S3-compatible storage API |
| `minio`    | 9001 | MinIO Console             |

## ⚙️ Environment Variables

| Variable        | Description                  | Default                 |
| --------------- | ---------------------------- | ----------------------- |
| `DATABASE_URL`  | PostgreSQL connection string | -                       |
| `S3_ENDPOINT`   | S3/MinIO endpoint            | `http://localhost:9000` |
| `S3_REGION`     | S3 region                    | `us-east-1`             |
| `S3_ACCESS_KEY` | S3 access key                | -                       |
| `S3_SECRET_KEY` | S3 secret key                | -                       |
| `S3_BUCKET`     | S3 bucket name               | `saas-bucket`           |

## 📁 Project Structure

```
src/
├── lib/
│   ├── components/       # UI components
│   │   ├── dashboard/    # Dashboard-specific components
│   │   └── ui/           # Reusable UI components
│   ├── server/
│   │   └── services/     # Business logic
│   │       ├── AuthService.ts
│   │       ├── ImageService.ts
│   │       └── UserService.ts
│   └── types/            # TypeScript definitions
├── routes/
│   ├── (auth)/           # Auth pages (login, register)
│   ├── dashboard/        # Protected dashboard
│   └── api/              # API endpoints
└── hooks.server.ts       # Auth middleware
```

## 🔐 API Endpoints

### Authentication

- `POST /login` - User login
- `POST /register` - User registration
- `POST /dashboard?/logout` - User logout

### Image Processing (Form Actions)

- `POST /dashboard?/process` - Compress or convert image
- `POST /dashboard?/delete` - Delete history item

## 💳 Credit System

- New users receive **10 free credits**
- Each image operation costs **1 credit**
- Credits are deducted atomically with history recording

## 📄 License

MIT
