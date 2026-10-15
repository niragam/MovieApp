import { useState, type FormEvent, type ChangeEvent, type FocusEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/api';

interface FormData {
    username: string;
    password: string;
    confirmPassword: string;
    name: string;
    avatarUrl: string;
}

interface FormErrors {
    username?: string;
    password?: string;
    confirmPassword?: string;
    name?: string;
    avatarUrl?: string;
}

const isHttpUrl = (value: string): boolean => {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

const SignupForm = () => {
    const [formData, setFormData] = useState<FormData>({
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        avatarUrl: '',
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const validateField = (name: keyof FormData, value: string): string => {
        switch (name) {
            case 'username':
                if (!value) return 'Username is required';
                if (value.length < 3) return 'Username must be at least 3 characters';
                if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
                return '';
            case 'password':
                if (!value) return 'Password is required';
                if (value.length < 8) return 'Password must be at least 8 characters';
                if (!/[a-zA-Z]/.test(value)) return 'Password must contain at least one letter';
                if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
                return '';
            case 'confirmPassword':
                if (!value) return 'Confirm password is required';
                if (value !== formData.password) return 'Passwords do not match';
                return '';
            case 'name':
                if (!value) return 'Display name is required';
                return '';
            case 'avatarUrl':
                if (value && !isHttpUrl(value)) return 'Profile image must be an http(s) URL';
                return '';
            default:
                return '';
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const error = validateField(name as keyof FormData, value);
        if (error) {
            setErrors(prev => ({ ...prev, [name]: error }));
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setServerError('');

        // Validate all fields
        const newErrors: FormErrors = {};
        (Object.keys(formData) as Array<keyof FormData>).forEach(key => {
            const error = validateField(key, formData[key]);
            if (error) newErrors[key] = error;
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);

        try {
            await register(formData.username, formData.password, formData.name, formData.avatarUrl.trim());
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setServerError((err as Error).message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
                <div className="glass rounded-2xl p-8 max-w-md w-full text-center animate-slideUp">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold text-white mb-2">Account Created!</h2>
                    <p className="text-gray-400">Redirecting you to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-8">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-netflix-dark"></div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHoiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvZz48L3N2Zz4=')] opacity-30"></div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-red-600 font-bold text-4xl tracking-tight">MOVIEAPP</h1>
                </div>

                {/* Signup Card */}
                <div className="glass rounded-2xl p-8 animate-slideUp">
                    <h2 className="text-2xl font-bold text-white mb-6">Sign Up</h2>

                    {serverError && (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-3 mb-6 animate-fadeIn">
                            <p className="text-red-400 text-sm">{serverError}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                                Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                value={formData.username}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={`input-field ${errors.username ? 'input-error' : ''}`}
                                placeholder="Choose a username"
                                disabled={loading}
                            />
                            {errors.username && <p className="error-text">{errors.username}</p>}
                        </div>

                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                                Display Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={`input-field ${errors.name ? 'input-error' : ''}`}
                                placeholder="Your display name"
                                disabled={loading}
                            />
                            {errors.name && <p className="error-text">{errors.name}</p>}
                        </div>

                        <div>
                            <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-300 mb-2">
                                Profile image URL <span className="text-gray-500">(optional)</span>
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    id="avatarUrl"
                                    name="avatarUrl"
                                    type="url"
                                    value={formData.avatarUrl}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={`input-field ${errors.avatarUrl ? 'input-error' : ''}`}
                                    placeholder="https://example.com/me.png"
                                    disabled={loading}
                                />
                                {formData.avatarUrl && isHttpUrl(formData.avatarUrl) && (
                                    <img
                                        src={formData.avatarUrl}
                                        alt="Profile preview"
                                        className="w-10 h-10 rounded object-cover flex-shrink-0"
                                    />
                                )}
                            </div>
                            {errors.avatarUrl && <p className="error-text">{errors.avatarUrl}</p>}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={`input-field ${errors.password ? 'input-error' : ''}`}
                                placeholder="Create a password"
                                disabled={loading}
                            />
                            {errors.password && <p className="error-text">{errors.password}</p>}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className={`input-field ${errors.confirmPassword ? 'input-error' : ''}`}
                                placeholder="Confirm your password"
                                disabled={loading}
                            />
                            {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                'Sign Up'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-400">
                            Already have an account?{' '}
                            <Link to="/login" className="text-white hover:underline font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignupForm;
