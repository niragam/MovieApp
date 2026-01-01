import { Link } from 'react-router-dom';

interface Feature {
    icon: string;
    title: string;
    description: string;
}

const LandingPage = () => {
    const features: Feature[] = [
        {
            icon: '🎬',
            title: 'Vast Library',
            description: 'Access thousands of movies across every genre imaginable.',
        },
        {
            icon: '🎯',
            title: 'Smart Recommendations',
            description: 'Our AI learns your taste and suggests movies you\'ll love.',
        },
        {
            icon: '📱',
            title: 'Watch Anywhere',
            description: 'Stream on any device, anytime, anywhere you want.',
        },
    ];

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#000' }}>
            {/* Hero Section */}
            <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Background gradient with animated elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-gray-900 to-black"></div>
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                {/* Floating movie cards background */}
                <div className="absolute inset-0 overflow-hidden opacity-20">
                    {[...Array(12)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-32 h-48 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900"
                            style={{
                                left: `${(i % 4) * 28 + 5}%`,
                                top: `${Math.floor(i / 4) * 35 + 10}%`,
                                transform: `rotate(${(i % 2 ? 1 : -1) * (5 + i)}deg)`,
                            }}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                    {/* Logo */}
                    <h1 className="font-bold text-6xl md:text-8xl tracking-tight mb-6 animate-slideUp" style={{ color: '#E50914' }}>
                        MOVIEAPP
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-300 mb-8 animate-slideUp" style={{ animationDelay: '0.1s' }}>
                        Unlimited movies, recommendations, and more.
                    </p>

                    <p className="text-lg text-gray-400 mb-12 animate-slideUp" style={{ animationDelay: '0.2s' }}>
                        Ready to watch? Join now to create your personalized experience.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slideUp" style={{ animationDelay: '0.3s' }}>
                        <Link
                            to="/signup"
                            className="btn-primary text-lg px-8 py-4 rounded-lg shadow-lg hover:scale-105 transition-all duration-300"
                            style={{ boxShadow: '0 10px 25px -5px rgba(229, 9, 20, 0.3)' }}
                        >
                            Get Started
                        </Link>
                        <Link
                            to="/login"
                            className="btn-secondary text-lg px-8 py-4 rounded-lg hover:scale-105 transition-all duration-300"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-24 px-4 bg-gradient-to-b from-gray-900 to-black">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
                        Why Choose MovieApp?
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {features.map((feature, i) => (
                            <div
                                key={i}
                                className="glass rounded-2xl p-8 text-center hover:scale-105 transition-transform duration-300"
                            >
                                <div className="text-5xl mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                                <p className="text-gray-400">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-8 px-4 border-t border-white/10">
                <div className="max-w-6xl mx-auto text-center text-gray-500">
                    <p>&copy; {new Date().getFullYear()} MovieApp. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
