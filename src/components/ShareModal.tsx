"use client";

import React, { useState } from "react";
import { Share2, Copy, Check, X } from "lucide-react";

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoUrl: string;
    videoTitle: string;
}

export default function ShareModal({ isOpen, onClose, videoUrl, videoTitle }: ShareModalProps) {
    const [copied, setCopied] = useState(false);

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
                        <Share2 className="text-indigo-400" size={24} />
                        Share Video
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="mb-6">
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
