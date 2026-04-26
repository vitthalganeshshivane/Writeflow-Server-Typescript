# WriteFlow Server

**A production-grade blogging platform API built with TypeScript, Express 5, and MongoDB — featuring role-based publishing, real-time notifications, queue-driven email digests, and S3 media uploads.**

---

## 🚀 Features

### Authentication & Identity
- Email/password signup & signin with bcrypt-hashed credentials
- Google OAuth via Firebase Admin SDK (ID token verification)
- JWT-based session management (7-day expiry, role-aware payloads)
- Password change flow with current-password verification
- Auto-generated unique usernames derived from email (nanoid collision handling)
- Random avatar assignment via DiceBear API on registration

### Blog Engine
- Full CRUD for blog posts with draft/publish lifecycle
- SEO-friendly slug generation (`title + nanoid`)
- Tag system (max 10, auto-lowercased)
- Inline content validation (title, description ≤ 200 chars, banner, block content)
- Read-count tracking at both blog and author level
- Trending blogs endpoint sorted by likes → reads → recency
- Paginated search by tag, title (regex), or author
- Blog count endpoints for pagination metadata
- Admin-only blog creation (role gating via JWT payload)

### Comments & Replies
- Threaded comment system with parent/child relationships
- Nested reply support with recursive depth
- Comment deletion with cascading cleanup (children, notifications, blog counters)
- Author or commenter can delete (ownership check)
- Paginated comment and reply retrieval

### Notifications
- Real-time notification checks (unseen count)
- Notification types: `like`, `comment`, `reply`
- Filterable notification feed with pagination
- Auto-mark-as-seen on fetch
- Self-notification exclusion (users don't receive their own actions)

### User Profiles
- Public profile retrieval (excludes password and auth fields)
- Username search with regex matching
- Profile editing: username, bio (≤ 150 chars), social links
- Social link validation (YouTube, Instagram, Facebook, Twitter, GitHub, website)
- Profile image update via S3 URL
- Account stats: total posts, total reads

### Email System
- Transactional welcome email on signup (both email/password and Google OAuth)
- Weekly digest email with top 5 trending articles + author spotlight
- HTML templates with variable interpolation and XSS-safe escaping
- Batched sending (25 users/batch with 1s throttle) for digest delivery

### File Uploads
- AWS S3 pre-signed URL generation for direct client-side uploads
- JPEG image uploads with unique nanoid + timestamp filenames
- URL expiry: 1000 seconds

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Express Server                       │
│                                                             │
│  Routes → Middleware (JWT) → Controllers → Models (Mongo)   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                     Service Layer                           │
│  Email Service ─→ Mailer (Nodemailer) ─→ HTML Templates     │
│  Upload Util  ─→ AWS S3 (Signed URLs)                       │
├─────────────────────────────────────────────────────────────┤
│                  Background Processing                      │
│  BullMQ Queue ─→ Redis ─→ Worker (email-queue)              │
│  Job Scheduler ─→ Weekly Digest (7-day interval)            │
└─────────────────────────────────────────────────────────────┘
```

The architecture follows a **layered separation of concerns**:

- **Routes** define endpoint signatures and wire middleware
- **Middleware** (`verifyJWT`) handles auth extraction and role assignment
- **Controllers** contain request/response logic and validation
- **Models** define Mongoose schemas with TypeScript interfaces
- **Services** encapsulate business logic (email composition, template rendering)
- **Queues/Workers** decouple long-running tasks (digest emails) from the request cycle
- **Jobs** register scheduled tasks via BullMQ's `upsertJobScheduler`

The email worker runs as a **separate process** (`npm run email:worker`), enabling independent scaling and fault isolation from the main API server.

---

## 📂 Folder Structure

```
backend-ts/
├── config/
│   ├── aws.ts                  # S3 client configuration
│   ├── db.ts                   # MongoDB connection (Mongoose)
│   ├── firebase.ts             # Firebase Admin SDK init (base64 credential)
│   └── redis.ts                # IORedis connection (URL or host/port/password)
├── controllers/
│   ├── authController.ts       # Signup, signin, Google OAuth, change password
│   ├── blogController.ts       # CRUD, search, likes, comments, trending
│   ├── notificationController.ts  # Notification feed, counts, seen status
│   ├── uploadController.ts     # S3 signed URL generation
│   └── userController.ts       # Profile CRUD, search, social links
├── jobs/
│   └── registerWeeklyDigestScheduler.ts  # BullMQ repeatable job registration
├── middlewares/
│   └── verifyJWT.ts            # Bearer token extraction + role decoding
├── models/
│   ├── Blog.ts                 # Blog schema (activity counters, draft flag)
│   ├── Comment.ts              # Threaded comments (parent/children refs)
│   ├── Notification.ts         # Like/comment/reply notifications
│   └── User.ts                 # User profile, social links, account stats
├── queues/
│   └── email.queue.ts          # BullMQ queue with retry + exponential backoff
├── routes/
│   ├── authRoutes.ts           # /api/auth/*
│   ├── blogRoutes.ts           # /api/blog/*
│   ├── notificationRoutes.ts   # /api/notification/*
│   ├── uploadRoutes.ts         # /api/upload/*
│   └── userRoutes.ts           # /api/user/*
├── scripts/
│   └── runEmailWorker.ts       # Standalone worker process entry point
├── services/
│   └── email/
│       ├── digest.ts           # Weekly digest builder (top 5 blogs, batched send)
│       ├── emailService.ts     # Transactional email dispatcher (welcome)
│       ├── mailer.ts           # Nodemailer transport (Gmail SMTP)
│       ├── types.ts            # Email-related type definitions
│       └── templates/
│           ├── welcome.html    # Welcome email HTML template
│           ├── welcome.ts      # Template loader with variable interpolation
│           ├── weeklyDigest.html   # Digest email HTML template
│           └── weeklyDigest.ts     # Template loader with XSS-safe escaping
├── types/
│   └── express/
│       └── index.d.ts          # AuthRequest interface (user, admin fields)
├── utils/
│   └── generateUploadURL.ts    # S3 putObject signed URL generator
├── workers/
│   └── email.worker.ts         # BullMQ worker (processes weekly-digest jobs)
├── server.ts                   # Application entry point
├── package.json
└── tsconfig.json
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js + TypeScript (ES2020 target) |
| **Framework** | Express 5 |
| **Database** | MongoDB via Mongoose 9 |
| **Authentication** | JWT (jsonwebtoken) + bcrypt |
| **OAuth** | Firebase Admin SDK (Google ID token verification) |
| **File Storage** | AWS S3 (pre-signed URLs via aws-sdk) |
| **Queue** | BullMQ + IORedis |
| **Email** | Nodemailer (Gmail SMTP) |
| **Scheduling** | BullMQ Job Scheduler (repeatable jobs) |
| **ID Generation** | nanoid |
| **Dev Tooling** | nodemon, ts-node |

---

## 🔐 Authentication & Authorization

### Flow

1. **Registration** — Password hashed with bcrypt (10 rounds), unique username generated from email prefix + nanoid fallback
2. **Login** — Email lookup → Google auth check → bcrypt comparison → JWT issued
3. **Google OAuth** — Firebase Admin verifies the ID token, creates or retrieves user, issues JWT
4. **JWT Payload** — `{ id, admin }` with 7-day expiry
5. **Middleware** — `verifyJWT` extracts `Bearer` token, decodes payload, attaches `req.user` (ID) and `req.admin` (boolean)

### Authorization

- **Admin role** is checked at the controller level (e.g., `createBlog` requires `req.admin === true`)
- Comment deletion is authorized by either the comment author or the blog author
- Password change is blocked for Google OAuth accounts

---

## 📧 Email System

### Architecture

```
emailService.ts ──→ mailer.ts (Nodemailer transport)
                       ↑
              templates/*.html (raw HTML with {{placeholders}})
              templates/*.ts   (loaders with interpolation)
```

### Templates

| Template | Trigger | Variables |
|---|---|---|
| **Welcome** | User signup (email or Google) | `{{username}}`, `{{app_url}}` |
| **Weekly Digest** | Scheduled job (every 7 days) | Featured article, top 5 articles, author spotlight, date range |

### Security

- The weekly digest template uses `escapeHtml()` for all interpolated values (prevents XSS in email clients)
- Welcome emails are fire-and-forget (`void` + `.catch()`) to avoid blocking the signup response

### Delivery

- Welcome emails are sent synchronously via Nodemailer
- Digest emails are queued through BullMQ and processed by a dedicated worker
- Digest batching: 25 recipients per batch with 1-second inter-batch delay

---

## 📤 File Upload System

The upload system uses **AWS S3 pre-signed URLs** for direct client-to-S3 uploads:

1. Client requests a signed URL via `GET /api/upload/get-upload-url` (JWT required)
2. Server generates a `putObject` signed URL with a unique filename (`nanoid-timestamp.jpeg`)
3. Client uploads the file directly to S3 using the signed URL
4. The S3 object URL is then stored in the blog/profile document

**Configuration:**
- Bucket: `mern-blog-webapp45`
- Region: `ap-south-1`
- Content type: `image/jpeg`
- URL expiry: 1000 seconds

---

## 🧵 Queue & Background Jobs

### Infrastructure

- **Queue**: BullMQ `email-queue` backed by Redis (IORedis)
- **Worker**: Separate process (`npm run email:worker`) for fault isolation
- **Scheduler**: `upsertJobScheduler` registers a repeatable `weekly-digest` job every 7 days

### Job Configuration

```typescript
{
  attempts: 3,
  backoff: { type: "exponential", delay: 3000 },
  removeOnComplete: true,
  removeOnFail: true,
}
```

### Worker Lifecycle

The `runEmailWorker.ts` script:
1. Loads environment variables
2. Connects to MongoDB (needed for digest data queries)
3. Registers the weekly digest scheduler
4. Imports the worker module (starts processing)

---

## 🛠️ Setup & Installation

### Prerequisites

- Node.js ≥ 18
- MongoDB instance (Atlas or local)
- Redis instance (local or cloud)
- AWS S3 bucket with appropriate CORS/IAM configuration
- Firebase project with service account
- Gmail account with App Password for SMTP

### Install

```bash
git clone https://github.com/vitthalganeshshivane/Writeflow-Server-Typescript.git
cd Writeflow-Server-Typescript
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<dbname>

# Authentication
JWT_SECRET=<your-jwt-secret>

# AWS S3
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>

# Firebase (base64-encoded service account JSON)
FIREBASE_SERVICE_ACCOUNT_BASE64=<base64-encoded-json>

# Email (Gmail SMTP)
EMAIL_USER=<your-email@gmail.com>
EMAIL_PASS=<gmail-app-password>

# Redis (option A — connection URL)
REDIS_URL=redis://<host>:<port>

# Redis (option B — individual fields)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=<optional>

# App
PORT=8000
FRONTEND_URL=https://your-frontend-url.com
```

### Run

```bash
# Development server (with hot reload)
npm run dev

# Email worker (separate terminal)
npm run email:worker

# Production build
npm run build
npm start
```

---

## 📡 API Overview

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/signup` | — | Register with email/password |
| `POST` | `/signin` | — | Login with email/password |
| `POST` | `/google-auth` | — | Login/register with Google |
| `POST` | `/change-password` | JWT | Change password |

### Blog — `/api/blog`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/create-blog` | JWT (admin) | Create or update a blog post |
| `POST` | `/get-blog` | — | Fetch a single blog (increments reads) |
| `POST` | `/latest-blogs` | — | Paginated latest published blogs |
| `GET` | `/trending-blogs` | — | Top 5 blogs by engagement |
| `POST` | `/search-blogs` | — | Search by tag, title, or author |
| `POST` | `/all-latest-blogs-count` | — | Total published blog count |
| `POST` | `/search-blogs-count` | — | Filtered blog count |
| `POST` | `/like-blog` | JWT | Toggle like on a blog |
| `POST` | `/isLiked-by-user` | JWT | Check if user liked a blog |
| `POST` | `/add-comment` | JWT | Add comment or reply |
| `POST` | `/get-blog-comments` | — | Paginated root comments |
| `POST` | `/get-replies` | — | Paginated replies for a comment |
| `POST` | `/delete-comment` | JWT | Delete comment (cascading) |
| `POST` | `/user-written-blogs` | JWT | Author's own blogs (with draft filter) |
| `POST` | `/user-written-blogs-count` | JWT | Author's blog count |

### User — `/api/user`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/search-users` | — | Search users by username |
| `POST` | `/get-profile` | — | Fetch public profile |
| `POST` | `/update-profile-img` | JWT | Update profile image URL |
| `POST` | `/update-profile` | JWT | Update username, bio, social links |

### Notification — `/api/notification`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/new-notification` | JWT | Check for unseen notifications |
| `POST` | `/all-notifications-count` | JWT | Count notifications (with filter) |
| `POST` | `/notifications` | JWT | Paginated notification feed |

### Upload — `/api/upload`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/get-upload-url` | JWT | Generate S3 pre-signed upload URL |

---

## 🧪 Future Improvements

- **Rate limiting** — Add express-rate-limit or Redis-based throttling on auth and public endpoints
- **Input validation layer** — Introduce Zod or Joi schemas at the route level for consistent request validation
- **Blog deletion** — Implement full blog deletion with cascading comment/notification cleanup
- **Pagination cursors** — Replace offset-based pagination with cursor-based for better performance at scale
- **Email unsubscribe** — Add per-user opt-out for weekly digest emails
- **Image optimization** — Integrate image resizing/compression before S3 upload (e.g., Sharp)
- **Caching** — Add Redis caching for trending blogs, user profiles, and blog read endpoints
- **Testing** — Add integration and unit tests using Vitest or Jest
- **Logging** — Structured logging with Pino or Winston instead of `console.log`
- **API documentation** — Auto-generate OpenAPI/Swagger spec from route definitions
- **Containerization** — Add Dockerfile and docker-compose for the API server, worker, Redis, and MongoDB

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "feat: add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

<p align="center">
  Built with TypeScript · Powered by Express 5 · Backed by MongoDB
</p>
