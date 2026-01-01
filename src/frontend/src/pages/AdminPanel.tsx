import { useState } from 'react';
import TopNav from '../components/TopNav';
import CategoryManager from '../components/admin/CategoryManager';
import MovieManager from '../components/admin/MovieManager';

type TabType = 'categories' | 'movies';

const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState<TabType>('categories');

    return (
        <div className="min-h-screen bg-gray-900">
            <TopNav />

            <div className="pt-24 px-4 md:px-12 pb-16">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
                    <p className="text-gray-400">Manage your movies and categories</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-white/10">
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`pb-4 px-2 text-lg font-medium transition-colors relative ${activeTab === 'categories'
                            ? 'text-white'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Categories
                        {activeTab === 'categories' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-netflix-red"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('movies')}
                        className={`pb-4 px-2 text-lg font-medium transition-colors relative ${activeTab === 'movies'
                            ? 'text-white'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Movies
                        {activeTab === 'movies' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-netflix-red"></div>
                        )}
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'categories' && <CategoryManager />}
                {activeTab === 'movies' && <MovieManager />}
            </div>
        </div>
    );
};

export default AdminPanel;
