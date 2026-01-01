# MovieApp Frontend

A Netflix-styled React web application with glassmorphism design for the Movie Recommendation System.

## Features

- 🎬 **Netflix-style UI** - Hero section, category rows, movie cards
- 🔐 **JWT Authentication** - Login, signup with validation
- 🎨 **Glassmorphism Design** - Frosted glass effects throughout
- 🔍 **Search** - Find movies by title, description, or category
- 🎥 **Video Player** - Simulated playback experience
- 👨‍💼 **Admin Panel** - CRUD for movies and categories
- 📱 **Responsive** - Works on all screen sizes

## Tech Stack

- React 18 + Vite
- React Router v6
- Tailwind CSS
- JWT Authentication

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running on port 3000

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will run at `http://localhost:5173` with API proxy to `http://localhost:3000`.

### Production Build

```bash
npm run build
```

The built files will be in `dist/` and served by the backend.

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── admin/         # Admin-specific components
│   ├── TopNav.jsx     # Navigation bar
│   ├── HeroPlayer.jsx # Hero section with preview
│   ├── CategoryRow.jsx # Horizontal movie row
│   ├── MovieCard.jsx   # Movie poster card
│   └── ...
├── pages/             # Route pages
│   ├── LandingPage.jsx
│   ├── BrowsePage.jsx
│   ├── SearchPage.jsx
│   ├── VideoPlayer.jsx
│   └── AdminPanel.jsx
├── context/           # React contexts
│   └── AuthContext.jsx
├── services/          # API service layer
│   └── api.js
└── App.jsx            # Router setup
```

## User Roles

- **Guest**: Landing page, login, signup
- **User**: Browse, search, watch movies
- **Admin**: All user features + CRUD management

## Test Accounts

Create an admin user by setting `role: 'admin'` directly in MongoDB, or modify the user record after creation.
