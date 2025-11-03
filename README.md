# 🏓 42_ft_transcendence

**Graduation Project – 42 Ecole Common Core**  
Web based multiplayer game platform built with full-stack modern technologies and containerised microservices.

---

## 🚀 Project Overview

This project implements a **multiplayer Pong-style web game platform**, allowing authenticated users to play real-time matches, chat, manage friends, view match history and statistics.  
The architecture is divided into frontend, backend and infrastructure layers, all containerised using Docker Compose for portability and reproducibility.

---

## 🧱 Tech Stack & Architecture

### 🖥️ Frontend
- **Framework:** Vue 3 + TypeScript  
- **Build Tool:** Vite  
- **UI Styling:** TailwindCSS  
- **Communication:** WebSocket (real-time) + REST API  
- **Structure:** `frontend/src/components/`, `views/`, `store/`, `router/`

### ⚙️ Backend
- **Framework:** Fastify (Node.js)  
- **ORM:** TypeORM  
- **Auth:** JWT + OAuth2 (42 Intra integration)  
- **Security:** bcrypt for password hashing  
- **Database:** PostgreSQL (production) / SQLite (development)  
- **Modules:** auth, user, game, chat, match history  
- **Real-time:** WebSocket event handling for multiplayer sync

### 🧩 Infrastructure
- **Containerisation:** Docker + Docker Compose  
- **Reverse Proxy:** Nginx (SSL termination & routing)  
- **Environment Files:** `.env` for service-specific configs  
- **Makefile:** Simplifies build/run/clean commands  
- **CI/CD (optional):** GitHub Actions for lint/test/build

## 🔧 Setup Instructions

### 1️⃣ Clone the repository
```bash
git clone https://github.com/Tubbanurr/42_ft_transcendence.git
cd 42_ft_transcendence
```

### Build and run via Docker Compose
```bash
docker-compose up --build
```

### Access the application

🌐 Frontend UI → http://localhost:8080
⚙️ Backend API → http://localhost:3000/api
🔄 WebSocket endpoint → ws://localhost:3000/ws

🧠 Technical Details
🔐 Authentication & User Flow

-OAuth2 login via 42 Intra
-JWT token-based authentication
-Protected routes (e.g., /api/user/profile)
-Optional 2FA (Google Authenticator)

🎮 Game Engine & Real-Time Flow
WebSocket Events:

-playerJoinGame
-playerMove
-ballUpdate
-scoreUpdate
-gameOver
-Backend maintains game state for fairness
-Results stored in DB
-Canvas rendering for paddles, ball, and scoreboard

| Table            | Description                                                       |
| ---------------- | ----------------------------------------------------------------- |
| **Users**        | id, username, email, hashed_password, avatar_url, created_at      |
| **Profiles**     | user_id, wins, losses, rank, twofa_enabled, twofa_secret          |
| **Matches**      | id, player1_id, player2_id, winner_id, score1, score2, created_at |
| **Friendships**  | user_id, friend_id, status (pending/accepted)                     |
| **ChatMessages** | id, sender_id, room_id, content, timestamp                        |


🧰 Deployment Notes

-Use PostgreSQL in production
-Configure Nginx for WebSocket proxying
-Keep .env secrets secure
-Run DB migrations with TypeORM CLI
-Enable CORS only for frontend origin
-Use Sentry for logging (optional)
-Scale real-time layer using Redis Pub/Sub if needed

📈 Future Improvements

🤖 AI opponent (single-player mode)
🏆 Global leaderboard with ELO ranking
🎨 Player avatars & themes
📱 Mobile-responsive UI / PWA
👀 Spectator mode
🗓️ Tournament system


## 💬 Acknowledgments

I would like to express my gratitude to **@seykaraca** for the teamwork, dedication, and valuable support during the development of this project.  
Your contribution made the ft_transcendence project stronger. 🚀

