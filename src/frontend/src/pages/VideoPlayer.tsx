import { useState, useEffect, useRef, type MouseEvent, type ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMovie } from '../services/api';
import type { Movie } from '../types';
import type { VendorDocument, VendorElement } from '../types/vendor';

const VideoPlayer = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [movie, setMovie] = useState<Movie | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const controlsTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.play().catch(() => { });
            } else {
                videoRef.current.pause();
            }
        }
    }, [isPlaying]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = volume;
            videoRef.current.muted = isMuted;
        }
    }, [volume, isMuted]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const doc = document as unknown as VendorDocument;
            const isFullscreen = !!(doc.fullscreenElement ||
                doc.webkitFullscreenElement ||
                doc.mozFullScreenElement ||
                doc.msFullscreenElement);
            setIsFullscreen(isFullscreen);
        };

        const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'msfullscreenchange'];
        events.forEach(event => document.addEventListener(event, handleFullscreenChange));

        return () => {
            events.forEach(event => document.removeEventListener(event, handleFullscreenChange));
        };
    }, []);

    const handleSeek = (e: MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (!videoRef.current || !videoRef.current.duration) return;

        const progressBar = e.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const percentage = Math.max(0, Math.min(100, (clickX / width) * 100));

        const newTime = (percentage / 100) * videoRef.current.duration;
        videoRef.current.currentTime = newTime;
        setProgress(percentage);
    };

    useEffect(() => {
        if (id) {
            fetchMovie();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchMovie = async () => {
        if (!id) return;
        try {
            const data = await getMovie(id);
            setMovie(data);
        } catch (err) {
            console.error('Failed to load movie:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = window.setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    };

    const togglePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleBack = () => {
        navigate(-1);
    };

    const toggleMute = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (!videoRef.current) return;
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        videoRef.current.muted = newMuted;
    };

    const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        if (!videoRef.current) return;
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        videoRef.current.volume = newVolume;
        setIsMuted(newVolume === 0);
        videoRef.current.muted = newVolume === 0;
    };

    const toggleFullscreen = async (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        const container = videoContainerRef.current as unknown as VendorElement;
        if (!container) return;

        const doc = document as unknown as VendorDocument;
        const isFullscreen = doc.fullscreenElement ||
            doc.webkitFullscreenElement ||
            doc.mozFullScreenElement ||
            doc.msFullscreenElement;

        if (!isFullscreen) {
            try {
                if (container.requestFullscreen) {
                    await container.requestFullscreen();
                } else if (container.webkitRequestFullscreen) {
                    await container.webkitRequestFullscreen();
                } else if (container.mozRequestFullScreen) {
                    await container.mozRequestFullScreen();
                } else if (container.msRequestFullscreen) {
                    await container.msRequestFullscreen();
                }
            } catch (err) {
                console.error('Fullscreen error:', err);
            }
        } else {
            if (doc.exitFullscreen) {
                await doc.exitFullscreen();
            } else if (doc.webkitExitFullscreen) {
                await doc.webkitExitFullscreen();
            } else if (doc.mozCancelFullScreen) {
                await doc.mozCancelFullScreen();
            } else if (doc.msExitFullscreen) {
                await doc.msExitFullscreen();
            }
        }
    };

    const formatTime = (timeInSeconds: number): string => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div
            ref={videoContainerRef}
            className={`fixed inset-0 bg-black ${showControls ? '' : 'cursor-none'}`}
            onMouseMove={handleMouseMove}
            onClick={togglePlayPause}
        >
            {/* Placeholder video player */}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                autoPlay={isPlaying}
                muted={false}
                loop
                playsInline
                onLoadedMetadata={(e) => {
                    const video = e.target as HTMLVideoElement;
                    setDuration(video.duration);
                }}
                onTimeUpdate={(e) => {
                    const video = e.target as HTMLVideoElement;
                    if (video.duration) {
                        setCurrentTime(video.currentTime);
                        setProgress((video.currentTime / video.duration) * 100);
                    }
                }}
                onEnded={() => {
                    setIsPlaying(false);
                    setProgress(100);
                }}
            />

            {/* Overlay for movie title (visible when paused) */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-6xl font-bold text-white/80">{movie?.title}</h1>
                        {progress >= 100 && (
                            <div className="mt-8">
                                <button
                                    onClick={(e: MouseEvent<HTMLButtonElement>) => {
                                        e.stopPropagation();
                                        setProgress(0);
                                        setIsPlaying(true);
                                    }}
                                    className="btn-primary text-lg px-8 py-4"
                                >
                                    Replay
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Controls overlay */}
            <div className={`absolute inset-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                {/* Top gradient */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent"></div>

                {/* Bottom gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/80 to-transparent"></div>

                {/* Back button */}
                <button
                    onClick={(e: MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        handleBack();
                    }}
                    className="absolute top-6 left-6 flex items-center gap-2 text-white hover:text-gray-300 transition-colors cursor-pointer"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="text-lg font-medium">Back</span>
                </button>

                {/* Title (top) */}
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
                    <h2 className="text-xl font-medium text-white">{movie?.title}</h2>
                </div>

                {/* Bottom controls */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                    {/* Progress bar */}
                    <div className="mb-4">
                        <div
                            className="relative h-1 bg-white/30 rounded-full overflow-hidden cursor-pointer group"
                            onClick={handleSeek}
                        >
                            <div
                                className="absolute inset-y-0 left-0 bg-blue-600 transition-all"
                                style={{ width: `${progress}%` }}
                            ></div>
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-600 rounded-full shadow-md transform hover:scale-125 transition-transform"
                                style={{ left: `calc(${progress}% - 8px)` }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-sm text-gray-400 mt-2">
                            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* Control buttons */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Play/Pause */}
                            <button
                                onClick={(e: MouseEvent<HTMLButtonElement>) => {
                                    e.stopPropagation();
                                    togglePlayPause();
                                }}
                                className="text-white hover:text-gray-300 transition-colors cursor-pointer"
                            >
                                {isPlaying ? (
                                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                    </svg>
                                ) : (
                                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                )}
                            </button>

                            {/* Volume */}
                            <div className="flex items-center gap-2 group/volume">
                                <button
                                    onClick={toggleMute}
                                    className="text-white hover:text-gray-300 transition-colors cursor-pointer"
                                >
                                    {isMuted || volume === 0 ? (
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                        </svg>
                                    ) : (
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        </svg>
                                    )}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125"
                                    style={{
                                        background: `linear-gradient(to right, white ${(isMuted ? 0 : volume) * 100}%, rgba(255, 255, 255, 0.3) ${(isMuted ? 0 : volume) * 100}%)`
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Fullscreen */}
                            <button
                                onClick={toggleFullscreen}
                                className="text-white hover:text-gray-300 transition-colors cursor-pointer"
                            >
                                {isFullscreen ? (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4M4 8V4m0 0h4M4 4l5 5M16 4h4m0 0v4m0-4l-5 5" />
                                    </svg>
                                ) : (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;
