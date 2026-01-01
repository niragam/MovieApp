import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Pages
import LandingPage from './pages/LandingPage';
import BrowsePage from './pages/BrowsePage';
import SearchPage from './pages/SearchPage';
import VideoPlayer from './pages/VideoPlayer';
import AdminPanel from './pages/AdminPanel';

// Auth Components
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginForm />} />
                    <Route path="/signup" element={<SignupForm />} />

                    {/* Protected routes - require authentication */}
                    <Route
                        path="/browse"
                        element={
                            <ProtectedRoute>
                                <BrowsePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/search"
                        element={
                            <ProtectedRoute>
                                <SearchPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/watch/:id"
                        element={
                            <ProtectedRoute>
                                <VideoPlayer />
                            </ProtectedRoute>
                        }
                    />

                    {/* Admin routes - require admin role */}
                    <Route
                        path="/admin"
                        element={
                            <AdminRoute>
                                <AdminPanel />
                            </AdminRoute>
                        }
                    />

                    {/* Fallback redirect */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
