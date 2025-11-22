"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";
import Transcript from "@/components/Transcript";
import { Download, LogIn, ArrowLeft } from "lucide-react";

export default function SharedVideoPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [video, setVideo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // Changed from false to null for loading state

    useEffect(() => {
        const checkAuthAndLoad = async () => {
            try {
                // Check auth first
                const listRes = await fetch("/api/drive/list", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                });

                if (listRes.ok) {
                    setIsAuthenticated(true);
                    loadVideoMetadata();
                } else {
                    setIsAuthenticated(false);
                    setLoading(false);
                }
            } catch (err) {
                console.error("Auth check failed", err);
                setIsAuthenticated(false);
                setLoading(false);
            }
        };

        checkAuthAndLoad();
    }, [id]);

    const loadVideoMetadata = async () => {
        try {
            // Load metadata
            const res = await fetch("/api/drive/load-metadata", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoId: id }),
            });

            if (res.ok) {
                const data = await res.json();
                setVideo({
                    id: id,
                    title: data.metadata?.title || "Shared Video", // Fallback title if not in metadata
                    src: `/api/drive/fetch-video?fileId=${id}`,
                    duration: data.metadata?.duration || "0:00",
                    date: data.metadata?.createdAt ? new Date(data.metadata.createdAt).toLocaleDateString() : "",
                    description: data.metadata?.description || ""
                });
            } else {
                // If metadata fails, we might still try to play the video if it exists
                // But for now, let's assume we at least need to verify it exists.
                // We can try to fetch the video stream head or something, but let's just set basic info.
                console.warn("Metadata load failed, using basic info");
                setVideo({
                    id: id,
                    title: "Shared Video",
                    src: `/api/drive/fetch-video?fileId=${id}`,
                    duration: "0:00",
                    date: "",
                    description: ""
                });
            }
        } catch (err) {
            console.error("Error loading metadata", err);
            setError("Failed to load video info");
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = () => {
        try {
            // Redirect to Google Auth
            const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
            
            if (!clientId) {
                console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set!");
                alert("Google OAuth is not configured.");
                return;
            }

            // Use current location origin
            let redirectUri = window.location.origin;
            redirectUri = redirectUri.replace(/\/$/, '');
            
            // Use 'drive' scope
            const scope = "https://www.googleapis.com/auth/drive";
            
            // Redirect to main page with state to return here after login?
            // Actually, the main page handles the auth code exchange. 
            // If we redirect to Google with redirect_uri = origin, it will come back to origin/?code=...
            // The main page (page.tsx) handles the code exchange.
            // After code exchange, it reloads the page (/).
            // So we lose the deep link context unless we persist it.
            
            // For now, let's just redirect the user to login at the root, 
            // and they might have to navigate back or we can try to be smarter.
            // A simple improvement: store the intended return URL in localStorage before redirecting.

            localStorage.setItem("ahal_return_url", window.location.pathname);

            const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
            
            window.location.href = url;
        } catch (error: any) {
            console.error("Login error:", error);
            alert("Error connecting to Google Drive");
        }
    };

    const handleDownload = async () => {
        if (!video) return;
        try {
            const res = await fetch(`/api/drive/download?fileId=${video.id}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${video.title}.webm`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download failed", err);
            alert("Failed to download video");
        }
    };

    if (loading || isAuthenticated === null) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="text-slate-400">Loading shared video...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 text-center">
                <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
                <p className="text-slate-400 mb-8">You need to be signed in to view this shared video.</p>
                <button onClick={handleLogin} className="btn btn-primary py-3 px-6 flex items-center gap-2">
                    <LogIn size={20} />
                    Sign in to Ahal Clips
                </button>
            </div>
        );
    }

    if (!video) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="text-red-400">Video not found or access denied.</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-50 flex flex-col">
            {/* Navbar */}
            <nav className="h-16 border-b border-white/5 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Ahal Clips <span className="text-slate-500 text-sm font-normal ml-2">Shared View</span>
                    </div>
                </div>
                <div>
                     {/* Maybe show user avatar? Keeping it simple. */}
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-hidden flex flex-col">
                <div className="flex flex-col lg:flex-row gap-6 h-full animate-fade-in max-w-7xl mx-auto w-full">
                    <div className="flex-1 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-1">{video.title}</h1>
                                <p className="text-slate-400 text-sm">{video.date}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={handleDownload} className="btn btn-secondary text-sm">
                                    <Download size={16} />
                                    Download
                                </button>
                            </div>
                        </div>

                        <VideoPlayer src={video.src} />

                        <div className="p-6 bg-slate-900/50 rounded-2xl border border-white/5">
                            <h3 className="font-semibold text-white mb-3">Description</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                {video.description || "No description available."}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-slate-500 pt-3 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Duration: {video.duration}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Transcript */}
                    <div className="lg:h-[calc(100vh-8rem)] sticky top-6">
                         <Transcript
                            videoId={video.id}
                            autoGenerate={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

