# CineTrack

Enterprise-grade movie tracking and streaming platform built with the MERN stack.

## Architecture

- **Frontend (Consumer)**: React (Vite), Redux Toolkit, React Query, Tailwind CSS
- **Frontend (Admin)**: React (Vite), React Hook Form, Zod, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB (Mongoose), Redis (BullMQ)
- **Media Pipeline**: FFmpeg, Cloudinary

## Core Features

### Consumer App
- Browse and filter movies by categories and genres.
- Movie detail pages with actor cast, screenshots, and trailers.
- Netflix-style HLS video playback support.
- User reviews, ratings, and watchlist management.
- Google OAuth and JWT-based authentication.

### Admin Portal
- Advanced 6-step movie creation wizard with direct TMDB integration.
- Background video processing queue (BullMQ + Redis).
- User management, role-based access control (RBAC), and review moderation.
- System health monitoring, audit logs, and feature flag toggles.

## Local Development Setup

### Prerequisites
- Node.js (v18+)
- MongoDB running locally or via Atlas
- Redis running locally (required for BullMQ)

### 1. Clone & Install
```bash
git clone https://github.com/snehk555/CineTrack_MERN.git
cd CineTrack_MERN
```

### 2. Environment Variables
Create `.env` files in `Backend`, `Frontend`, and `Admin_Frontend`. 
Use the `.env.example` templates in each folder to fill in the required keys (MongoDB URI, JWT Secret, TMDB API Key, Cloudinary config).

### 3. Run the Services
You need three separate terminal windows to run the full stack:

**Terminal 1 (Backend API):**
```bash
cd Backend
npm install
npm run dev
```

**Terminal 2 (Consumer App):**
```bash
cd Frontend
npm install
npm run dev
```

**Terminal 3 (Admin App):**
```bash
cd Admin_Frontend
npm install
npm run dev
```

## Licensing
Proprietary software. All rights reserved.