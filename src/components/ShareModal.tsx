"use client";

import React, { useState } from "react";
import { Share2, Copy, Check, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoUrl: string;
    videoTitle: string;
    videoId: string;
}

export default function ShareModal({ isOpen, onClose, videoUrl, videoTitle, videoId }: ShareModalProps) {
    const [copied, setCopied] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [shareError, setShareError] = useState<string | null>(null);
    const [shareSuccess, setShareSuccess] = useState(false);

    // Auto-share when modal opens
    React.useEffect(() => {
        if (isOpen && videoId) {
            handleShare();
        }
    }, [isOpen, videoId]);

    const handleShare = async () => {
        setIsSharing(true);
        setShareError(null);
        try {
            const res = await fetch("/api/drive/share", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileId: videoId }),
            });

            const data = await res.json();

            if (res.ok) {
                setShareSuccess(true);
                console.log(data.message);
            } else {
                setShareError(data.error || "Failed to share video");
            }
        } catch (error) {
            console.error("Share error:", error);
            setShareError("Failed to share video. Please try again.");
        } finally {
            setIsSharing(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(videoUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Share2 className="text-blue-400" size={24} />
                        Share Video
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="mb-6">
                    {isSharing && (
                        <div className="flex items-center gap-2 text-blue-400 text-sm mb-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                            <Loader2 size={16} className="animate-spin" />
                            <span>Enabling public access...</span>
                        </div>
                    )}

                    {shareSuccess && (
                        <div className="flex items-center gap-2 text-green-400 text-sm mb-4 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                            <CheckCircle2 size={16} />
                            <span>Video is now publicly accessible!</span>
                        </div>
                    )}

                    {shareError && (
                        <div className="flex items-center gap-2 text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                            <AlertCircle size={16} />
                            <span>{shareError}</span>
                        </div>
                    )}

                    <p className="text-slate-400 text-sm mb-4">
                        Share this video with your team. Anyone with the link can view it.
                    </p>

                    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 mb-4">
                        <p className="text-white font-medium mb-2 truncate">{videoTitle}</p>
                        <p className="text-slate-500 text-xs">View-only access</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={videoUrl}
                            readOnly
                            className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-4 py-3 text-sm text-slate-300 focus:outline-none"
                        />
                        <button
                            onClick={handleCopy}
                            className="btn btn-primary px-4 py-3"
                        >
                            {copied ? (
                                <>
                                    <Check size={16} />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy size={16} />
                                    Copy
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button onClick={onClose} className="btn btn-secondary">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
