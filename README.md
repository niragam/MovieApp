# MovieApp

A movie streaming and recommendation platform: a React frontend, a Node.js/Express API backed by MongoDB, and a separate multithreaded C++ recommendation server that the API talks to over TCP.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Running](#installation--running)
- [API Reference](#api-reference)
- [Recommendation Server](#recommendation-server)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Environment Variables](#environment-variables)

---

## Overview

1. **API Server**: Node.js/Express. Handles authentication, movies, categories, viewing history and search. MongoDB is the source of truth for all data.
2. **Recommendation Server**: a C++ TCP service with a thread pool. It keeps each user's watched movies and computes recommendations. The API keeps it in sync: every watch sends the user's full history, and the API replays all histories at startup.
3. **Frontend**: React, Vite and TailwindCSS, with a Netflix-style UI.

---

## Features

| Feature | Description |
|---------|-------------|
| **Accounts** | Registration (with optional profile image URL) and JWT login; passwords are hashed with scrypt (Node's built-in crypto) |
| **Browsing** | Featured movie, one row per promoted category (up to 20 random unwatched movies), and a Watch History row (the 20 most recently watched, in random order) |
| **Search** | Case-insensitive search: a movie matches when the query appears in any of its fields |
| **Playback** | Video player with play/pause, seeking, volume and fullscreen; opening the player records the view |
| **Recommendations** | "More Like This" from the C++ engine, based on similar users' histories |
| **Admin** | Manage categories and movies (including poster, backdrop and video URLs) |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 7, TailwindCSS 4, React Router 7 |
| API | Node.js, Express, Mongoose, jsonwebtoken |
| Database | MongoDB |
| Recommendations | C++17, CMake, POSIX sockets, thread pool |
| Tests | Jest, supertest, mongodb-memory-server; GoogleTest |
| Infrastructure | Docker, Docker Compose |

---

## Prerequisites

- **Docker** and **Docker Compose** (to run the backend)
- **Node.js** v18+ and npm (frontend development and API tests)
- **CMake** 3.10+ and a C++17 compiler (only to build or test the C++ server outside Docker)

---

## Installation & Running

### Quick start

```bash
cp .env.example .env
docker-compose up --build
./seed_database.sh
./populate_history.sh

cd src/frontend
npm install
npm run dev
```

Or run `./start.sh`, which does all of the above (it creates `.env` with a random secret if it is missing).

Only the API is published to the host (port 3000). MongoDB and the recommendation server are reachable only inside the Docker network. Their data lives in the named volumes `mongodb_data` and `recserver_data`.

Sample accounts after seeding: `admin / Admin123!`, `john_doe / Password1`, `jane_smith / Password2`, `movie_fan / Movies123`, `cinephile / Cinema99`.

### Upgrading an existing database

Older versions stored passwords in plaintext, watch history as plain id strings, and the category flag as `isPromoted`. To migrate:

```bash
MONGO_URI=mongodb://localhost:27017/netflix node src/apiServer/scripts/hash-passwords.js
MONGO_URI=mongodb://localhost:27017/netflix node src/apiServer/scripts/migrate-watch-history.js
MONGO_URI=mongodb://localhost:27017/netflix node src/apiServer/scripts/migrate-category-promoted.js
```

---

## API Reference

All responses with a body are JSON. Errors look like `{ "error": "..." }`.
- 400: invalid input or malformed JSON
- 401: missing or invalid token
- 403: not an admin
- 404: not found (an id that isn't a valid id is also 404, e.g. `GET /api/categories/foo`)
- 409: duplicate
- 502/503: the recommendation server failed or is unavailable

Authenticated routes need `Authorization: Bearer <token>`.

### Users and tokens

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/users` | POST | none | Register: `{ username, password, name, avatarUrl? }`. Returns 201 with the profile |
| `/api/users/:id` | GET | user | Profile (never includes the password) |
| `/api/tokens` | POST | none | Login: `{ username, password }`. Returns `{ token, userId, username, name, avatarUrl, role }` |

### Categories

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/categories` | GET | none | All categories: `[{ id, name, promoted }]` |
| `/api/categories` | POST | admin | Create `{ name, promoted? }` (names are unique); 201 with `Location` and no body |
| `/api/categories/:id` | GET | none | One category |
| `/api/categories/:id` | PATCH | admin | Partial update of `name` / `promoted` |
| `/api/categories/:id` | DELETE | admin | Delete (also removed from movies) |

### Movies

A movie is `{ id, title, description, categories: [names], releaseDate, releaseYear, duration, posterUrl, backdropUrl, videoUrl }`.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/movies` | GET | user | Homepage rows: `[{ category, movies }]` for each promoted category (up to 20 random movies the user hasn't watched), plus `"Watch History"` (the 20 most recently watched, in random order) |
| `/api/movies` | POST | admin | Create; `categories` is an array of category names |
| `/api/movies/all` | GET | admin | Every movie |
| `/api/movies/:id` | GET | none | One movie |
| `/api/movies/:id` | PUT | admin | Replace (omitted optional fields are cleared) |
| `/api/movies/:id` | DELETE | admin | Delete (also removed from histories) |
| `/api/movies/:id/recommend` | GET | user | Up to 10 recommended movies for the current user |
| `/api/movies/:id/recommend` | POST | user | Record that the current user watched the movie (204) |
| `/api/movies/search/:query` | GET | none | Movies where the query is contained in any field (id, title, description, URLs, duration, release date `YYYY-MM-DD`, category names) |

---

## Recommendation Server

### Protocol

Plain text over TCP, as specified in assignment part 2:
- Each request is one line ending in `\n`. Fields are separated by one or more spaces, and only spaces: a tab or any other whitespace makes the command invalid.
- Every reply ends with `\n`.
- The server handles every complete line it receives. Several requests may arrive in one packet, and one request may be split across several.

| Command | Reply |
|---------|-------|
| `POST <user> <movie>...` | `201 Created`; `404 Not Found` if the user already exists |
| `PATCH <user> <movie>...` | `204 No Content`; `404 Not Found` if the user was never created with `POST` |
| `DELETE <user> <movie>...` | `204 No Content`; `404 Not Found` if the user or any of the movies is missing (then nothing is deleted) |
| `GET <user> <movie>` | `200 Ok`, an empty line, then the recommendations separated by spaces; `404 Not Found` for an unknown user |
| `help` | The command list (below) |
| anything else | `400 Bad Request` |

`help` replies with:

```
DELETE, arguments: [userid] [movieid1] [movieid2] ...
GET, arguments: [userid] [movieid]
PATCH, arguments: [userid] [movieid1] [movieid2] ...
POST, arguments: [userid] [movieid1] [movieid2] ...
help
```

Lines longer than 64 KiB are rejected, and idle connections are closed after 30 seconds.

The API keeps the server in sync with MongoDB:
- When recording a watch, it sends the user's full history with `PATCH`. If that returns 404 (a new user, or the server lost its data), it sends `POST` instead.
- If a movie is deleted while the server is unreachable, the removal is stored and retried at startup and on that user's next watch.
- At startup, it replays every user's history.

### Algorithm

For user U and reference movie M:
- `similarity(U, V)` is the number of movies both U and V watched.
- For every other user V who watched M and has similarity > 0, each movie V watched (other than M and movies U already watched) gains `similarity(U, V)`.
- Results are sorted by score descending, then movie id ascending, and at most 10 are returned.

Users with similarity 0 contribute nothing, so they are not candidates. A user who shares no movies with anyone who watched M gets no recommendations.

---

## Testing

```bash
# API (Jest, in-memory MongoDB, fake recommendation server)
npm ci
npm test

# C++ (GoogleTest), plus a ThreadSanitizer build
cmake -S . -B build && cmake --build build && ctest --test-dir build --output-on-failure
cmake -S . -B build-tsan -DSANITIZE=thread && cmake --build build-tsan && ctest --test-dir build-tsan
# (on kernels with high ASLR entropy TSAN may need: setarch -R ctest --test-dir build-tsan)

# Frontend
cd src/frontend && npx tsc --noEmit && npm run lint && npm run build
```

---

## Project Structure

```
MovieApp/
├── src/
│   ├── apiServer/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── auth/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── scripts/
│   │   └── tests/
│   ├── frontend/
│   └── recServer/
│       ├── commands/
│       ├── threadpool/
│       ├── tests/
│       ├── App.cpp
│       ├── MovieManager.cpp
│       └── main.cpp
├── docker-compose.yml
├── Dockerfile.web-ser
├── Dockerfile.recserver
├── .env.example
├── start.sh, seed_database.sh, populate_history.sh
└── README.md
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `start.sh` | Stops everything, optionally wipes data, starts the Docker services and the frontend dev server |
| `seed_database.sh` | Creates sample users, categories and movies (with artwork and sample video URLs) |
| `populate_history.sh` | Watches random movies as each sample user |

---

## Environment Variables

### API Server

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | none (required) | Secret for signing tokens; the server refuses to start without it |
| `MONGO_URI` | `mongodb://localhost:27017/netflix` | MongoDB connection string (compose sets `mongodb://mongodb:27017/netflix`) |
| `PORT` | `3000` | HTTP port |
| `RECSERVER_HOST` | `recserver` | Recommendation server hostname |
| `RECSERVER_PORT` | `8000` | Recommendation server port |
| `RECSERVER_TIMEOUT_MS` | `3000` | Per-request timeout for the recommendation server |

The frontend calls the API through the relative path `/api`. Vite proxies it to `http://localhost:3000` in development.
