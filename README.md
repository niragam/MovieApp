# MovieApp

A comprehensive movie recommendation platform featuring a microservices architecture with a Node.js backend, C++ recommendation engine, and React frontend.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Running](#installation--running)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Environment Variables](#environment-variables)


---

## Overview

MovieApp is a full-stack movie recommendation platform that allows users to browse movies, manage their watch history, and receive personalized recommendations. The system leverages a modern microservices architecture with three core components:

1. **API Server** - A Node.js/Express backend handling authentication, movie data, and user management
2. **Recommendation Engine** - A high-performance C++ server that analyzes user behavior to generate personalized movie suggestions
3. **Frontend** - A sleek, modern React application built with Vite and TailwindCSS

---

## Features

| Feature | Description |
|---------|-------------|
| **User Authentication** | Secure JWT-based registration and login |
| **Movie Browsing** | Extensive catalog organized by categories |
| **Search** | Find movies quickly by title |
| **Personalized Recommendations** | C++ engine analyzes watch history for suggestions |
| **Watch History** | Track watched movies to improve recommendations |
| **Category Management** | Admin capabilities for managing movie categories |

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI Framework |
| TypeScript | Type Safety |
| Vite 7 | Build Tool & Dev Server |
| TailwindCSS 4 | Styling |
| React Router 7 | Client-side Routing |

### Backend (API Server)
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime Environment |
| Express | Web Framework |
| MongoDB | Database |
| Mongoose | ODM |
| JWT | Authentication |

### Recommendation Engine
| Technology | Purpose |
|------------|---------|
| C++ | Core Language |
| CMake | Build System |
| Thread Pool | Concurrent Request Handling |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Multi-container Orchestration |

---


## Prerequisites

- **Docker** & **Docker Compose** (for running the full stack)
- **Node.js** v18+ (for local frontend development)
- **npm** or **yarn** (package management)

---

## Installation & Running

### Quick Start (Docker)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MovieApp
   ```

2. **Start all backend services**
   ```bash
   docker-compose up --build
   ```
   This starts MongoDB, the API Server, and the Recommendation Server.

3. **Seed the database** (in a new terminal)
   ```bash
   ./seed_database.sh
   ```

4. **Start the frontend**
   ```bash
   cd src/frontend
   npm install
   npm run dev
   ```

5. **Access the application**
   - Frontend: `http://localhost:5173`
   - API Server: `http://localhost:3000`

### Using the Start Script

Alternatively, use the provided start script for an automated setup:
```bash
./start.sh
```

---

## API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users` | POST | Register a new user |
| `/api/tokens` | POST | Login and receive JWT token |

### Movies

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/movies` | GET | Get all movies |
| `/api/movies/:id` | GET | Get movie by ID |
| `/api/movies/:id/recommend` | GET | Get recommendations for a movie |

### Categories

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/categories` | GET | Get all categories |
| `/api/categories` | POST | Create new category (Admin) |
| `/api/categories/:id` | PUT | Update category (Admin) |
| `/api/categories/:id` | DELETE | Delete category (Admin) |

---

## Project Structure

```
ASP-EX3/
├── src/
│   ├── apiServer/          # Node.js backend
│   │   ├── controllers/    # Route handlers
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API routes
│   │   ├── auth/           # Authentication middleware
│   │   └── app.js          # Express app entry
│   │
│   ├── frontend/           # React application
│   │   ├── src/
│   │   │   ├── components/ # Reusable UI components
│   │   │   ├── pages/      # Page components
│   │   │   └── App.tsx     # Root component
│   │   └── package.json
│   │
│   └── recServer/          # C++ recommendation engine
│       ├── commands/       # Command pattern implementations
│       ├── threadpool/     # Thread pool for concurrency
│       ├── App.cpp         # Main application logic
│       └── main.cpp        # Entry point
│
├── docker-compose.yml      # Multi-container configuration
├── Dockerfile.web-ser      # API server container
├── Dockerfile.recserver    # Recommendation server container
├── seed_database.sh        # Database seeding script
├── start.sh                # Automated startup script
└── README.md
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `start.sh` | Automated setup and startup of all services |
| `seed_database.sh` | Populates the database with sample movies and categories |
| `populate_history.sh` | Adds sample watch history for testing recommendations |

### Frontend Scripts

```bash
cd src/frontend

npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

---

## Environment Variables

### API Server

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_URI` | `mongodb://mongodb:27017/netflix` | MongoDB connection string |
| `RECSERVER_HOST` | `recserver` | Recommendation server hostname |
| `RECSERVER_PORT` | `8000` | Recommendation server port |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3000` | Backend API URL |

---

