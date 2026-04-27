# UNO Multiplayer Setup Guide

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + Socket.io-client
- **Backend**: Node.js + Socket.io + Express + @libsql/client (Turso)
- **Database**: Turso (SQLite Edge DB)

## Prerequisites
1. Create a Turso database at [turso.tech](https://turso.tech)
2. Get your `TURSO_DB_URL` and `TURSO_AUTH_TOKEN`

## Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file in the root:
```env
TURSO_DB_URL=your_turso_url
TURSO_AUTH_TOKEN=your_turso_token
VITE_SOCKET_URL=http://localhost:3001
```

### 3. Run Backend
```bash
npx ts-node server/index.ts
```

### 4. Run Frontend
```bash
npm run dev
```

## Free Deployment Guide

### Database (Turso)
- Use the **Free Starter Plan** (up to 9GB storage, 1B rows/mo).

### Backend (Railway / Render)
1. Push your code to GitHub.
2. Connect to **Railway** or **Render**.
3. Set environment variables (`TURSO_DB_URL`, `TURSO_AUTH_TOKEN`).
4. Build command: `npm install`
5. Start command: `npx ts-node server/index.ts`

### Frontend (Netlify / Vercel)
1. Connect GitHub to **Netlify**.
2. Set `VITE_SOCKET_URL` to your deployed backend URL.
3. Build command: `npm run build`
4. Publish directory: `dist`

## Features
- Real-time multiplayer across devices
- Room creation and joining with short codes
- Guest and User authentication
- Responsive PWA support
- High-quality UNO card animations
- Turn-based logic with special cards (Skip, Reverse, Draw 2, Wild, Wild 4)
