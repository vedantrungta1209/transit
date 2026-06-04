# Transit — Ride-Hailing Platform

Built by Shankh Technologies Pvt Ltd.

## Stack
- **API**: Node.js 20 + Express + TypeScript + Prisma + PostgreSQL + Redis + Socket.IO
- **Admin**: React 18 + Vite + Tailwind CSS
- **Driver App**: React Native + Expo 51
- **Customer App**: React Native + Expo 51

## Quick Start (Local)

```bash
# 1. Start infrastructure
docker-compose up postgres redis -d

# 2. Install dependencies
npm install   # from repo root

# 3. Setup API
cd apps/api
cp .env.example .env   # fill in values
npx prisma migrate dev
npx prisma db seed     # creates admin users + seed data

# 4. Run API
npm run dev   # port 3000

# 5. Run Admin
cd apps/admin
cp .env.example .env
npm run dev   # port 3001

# 6. Run Driver App
cd apps/driver-app
cp .env.example .env
npx expo start

# 7. Run Customer App
cd apps/customer-app
cp .env.example .env
npx expo start
```

## Default Admin Credentials
- Super Admin: `admin@transitco.in` / `Admin@123!`
- Bangalore City Admin: `bangalore@transitco.in` / `Blr@123!`

## Environment Variables
See `.env.example` in each app directory.

## Keys Required for Go-Live
| Service | Where to Get |
|---------|-------------|
| Razorpay Key ID + Secret | dashboard.razorpay.com → API Keys |
| Razorpay Webhook Secret | Create webhook in Razorpay dashboard |
| Google Maps API Key | console.cloud.google.com |
| Exotel credentials | your.exotel.com |
| Firebase credentials | Firebase Console → Project Settings → Service Account |
| WhatsApp Access Token | developers.facebook.com → WhatsApp |
| AWS S3 credentials | AWS Console (region: ap-south-1) |
| JWT secrets | `openssl rand -hex 32` (run twice) |

## Architecture

```
transit/
  apps/
    api/          Express REST API + Socket.IO
    admin/        React web admin panel  
    driver-app/   React Native (Expo) — driver app
    customer-app/ React Native (Expo) — customer app
  packages/
    shared/       Shared types, utils, constants
  infra/          nginx, deployment configs
  docker-compose.yml
```

## Key Features
- **Dynamic Subscriptions**: Admin can change driver subscription prices in real-time, schedule future price changes, apply per-driver overrides
- **Real-time Ride Matching**: Socket.IO based driver matching with 5km radius, auto-expands to 8km after 3 rejections
- **Surge Pricing**: Admin-controlled surge multiplier with optional auto-revert
- **Multi-language**: English, Hindi, Kannada (i18n ready)
- **India-compliant**: Masked Aadhaar storage, GST invoicing, UPI payments, Indian phone validation
