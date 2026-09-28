import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const TopNav = () => {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const handleSearch = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setShowSearch(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const toggleSearch = () => {
        setShowSearch(!showSearch);
        if (!showSearch) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    };

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 glass-dark">
                <div className="w-full px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
                            aria-label="Toggle menu"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {showMobileMenu ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>

                        {/* Logo */}
                        <Link to="/browse" className="flex items-center">
                            <span className="text-red-600 font-bold text-2xl tracking-tight">
                                MOVIEAPP
                            </span>
                        </Link>

                        {/* Right side */}
                        <div className="flex items-center space-x-2 md:space-x-4">
                            {isAdmin && (
                                <Link
                                    to="/admin"
                                    className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text font-bold hover:opacity-80 transition-opacity text-sm"
                                >
                                    Admin
                                </Link>
                            )}
                            {/* Search */}
                            <div className="relative">
                                <form onSubmit={handleSearch} className="flex items-center">
                                    <div className={`flex items-center transition-all duration-300 ${showSearch ? 'w-48 md:w-64' : 'w-10'
                                        }`}>
                                        <button
                                            type="button"
                                            onClick={toggleSearch}
                                            className="p-2 text-gray-300 hover:text-white transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </button>
                                        {showSearch && (
                                            <input
                                                ref={searchInputRef}
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                                                placeholder="Search movies..."
                                                className="w-full bg-black/50 border border-white/20 rounded px-3 py-1.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-600"
                                            />
                                        )}
                                    </div>
                                </form>
                            </div>


                            {/* Profile Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="flex items-center space-x-2 p-2 rounded hover:bg-white/10 transition-colors"
                                >
                                    {user?.avatarUrl ? (
                                        <img
                                            src={user.avatarUrl}
                                            alt={user.name}
                                            className="w-8 h-8 rounded object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white font-semibold text-sm">
                                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                    )}
                                    <svg className={`w-4 h-4 text-gray-300 transition-transform hidden md:block ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {showDropdown && (
                                    <div className="absolute right-0 mt-2 w-48 glass rounded-lg py-2 animate-fadeIn">
                                        <div className="px-4 py-2 border-b border-white/10">
                                            <p className="text-sm font-medium text-white">{user?.name}</p>
                                            <p className="text-xs text-gray-400">@{user?.username}</p>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {showMobileMenu && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setShowMobileMenu(false)}
                />
            )}

            {/* Mobile Menu Drawer */}
            <div className={`fixed top-16 left-0 bottom-0 w-64 z-40 glass-dark transform transition-transform duration-300 md:hidden ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-4 space-y-2">
                    <Link
                        to="/browse"
                        onClick={() => setShowMobileMenu(false)}
                        className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${location.pathname === '/browse' ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        🏠 Home
                    </Link>
                    {isAdmin && (
                        <Link
                            to="/admin"
                            onClick={() => setShowMobileMenu(false)}
                            className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${location.pathname === '/admin' ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            ⚙️ Admin Panel
                        </Link>
                    )}
                </div>
            </div>
        </>
    );
};

export default TopNav;
