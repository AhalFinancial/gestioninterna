"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Copy, Download, Globe } from "lucide-react";

interface TranscriptSegment {
    time: string;
    text: string;
    language?: string;
}

export default function Transcript({ videoId, videoBlob, autoGenerate }: { videoId: string, videoBlob?: Blob, autoGenerate?: boolean }) {
    const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [language, setLanguage] = useState<"auto" | "es" | "en">("auto");

    // Auto-generate transcript when requested
    useEffect(() => {
        if (autoGenerate && videoId && videoId !== "temp" && !isGenerating && transcript.length === 0) {
            console.log("Auto-generating transcript for:", videoId);
            handleGenerate();
        }
    }, [autoGenerate, videoId]);

    // Load existing transcript from metadata on mount
    useEffect(() => {
        const loadTranscript = async () => {
            if (!videoId || videoId === "temp" || videoBlob || autoGenerate) return;

            setIsLoading(true);
            try {
                const res = await fetch("/api/drive/load-metadata", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ videoId }),
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.metadata?.transcript) {
                        setTranscript(data.metadata.transcript);
                        console.log("Loaded existing transcript:", data.metadata.transcript.length, "segments");
                    }
                }
            } catch (error) {
                console.error("Error loading transcript:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadTranscript();
    }, [videoId, videoBlob, autoGenerate]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            let videoFile: Blob;

            if (videoBlob) {
                // Use the recorded video blob
                videoFile = videoBlob;
                console.log("Using recorded video blob, size:", videoFile.size);
            } else if (videoId && videoId !== "temp") {
                // Fetch video from Drive
                console.log("Fetching video from Drive:", videoId);
                console.log("Fetching video from Drive:", videoId);
                const fetchRes = await fetch(`/api/drive/fetch-video?fileId=${videoId}`);

                if (!fetchRes.ok) {
                    const errorData = await fetchRes.json().catch(() => ({ error: "Unknown error" }));
                    console.error("Failed to fetch video from Drive:", errorData);
                    alert(`Failed to fetch video: ${errorData.error || 'Unknown error'}`);
                    return;
                }

                // Convert response to blob
                const arrayBuffer = await fetchRes.arrayBuffer();
                videoFile = new Blob([arrayBuffer], { type: "video/webm" });
                console.log("Video fetched successfully, size:", videoFile.size);
            } else {
                alert("No video available for transcription");
                return;
            }

            // Send to transcription API
            const formData = new FormData();
            formData.append("file", videoFile, "video.webm");
            formData.append("language", language);

            console.log("Sending to transcription API...");
            const res = await fetch("/api/transcribe", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                console.error("Transcription API error:", data);
                alert(`Transcription failed: ${data.error || 'Unknown error'}`);
                return;
            }

            if (data.transcript && Array.isArray(data.transcript)) {
                setTranscript(data.transcript);
                console.log("Transcript generated successfully:", data.transcript.length, "segments");

                // Auto-save transcript to metadata if video is from Drive
                if (videoId && videoId !== "temp") {
                    try {
                        const saveRes = await fetch("/api/drive/save-metadata", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                videoId,
                                metadata: {
                                    transcript: data.transcript,
                                },
                            }),
                        });

                        if (saveRes.ok) {
                            console.log("Transcript saved to metadata");
                        }
                    } catch (saveError) {
                        console.error("Error saving transcript:", saveError);
                    }
                }
            } else {
                console.error("Invalid transcript data:", data);
                alert("Transcription failed. Invalid response format.");
            }
        } catch (error) {
            console.error("Transcription error:", error);
            alert(`Transcription error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        const text = transcript.map(s => `${s.time} - ${s.text}`).join("\n");
        navigator.clipboard.writeText(text);
        alert("Transcript copied to clipboard!");
    };

    const handleDownload = () => {
        const text = transcript.map(s => `${s.time} - ${s.text}`).join("\n");
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "transcript.txt";
        a.click();
    };

    return (
        <div className="flex flex-col h-full bg-slate-900/50 border-l border-white/5 w-full md:w-80 lg:w-96">
            <div className="p-6 border-b border-white/5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Sparkles size={18} className="text-indigo-400" />
                        Transcript
                    </h2>
                    {transcript.length > 0 && (
                        <div className="flex gap-2">
                            <button onClick={handleCopy} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition">
                                <Copy size={16} />
                            </button>
                            <button onClick={handleDownload} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition">
                                <Download size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {transcript.length === 0 && (
                    <div className="flex items-center gap-2 mb-4">
                        <Globe size={14} className="text-slate-500" />
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as "auto" | "es" | "en")}
                            className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        >
                            <option value="auto">Auto-detect</option>
                            <option value="es">Spanish</option>
                            <option value="en">English</option>
                        </select>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isLoading ? (
                    <div className="text-center text-slate-400 mt-10">Loading transcript...</div>
                ) : transcript.length > 0 ? (
                    transcript.map((segment, index) => (
                        <div key={index} className="group flex gap-4 hover:bg-white/5 p-2 rounded-lg transition -mx-2">
                            <span className="text-indigo-400 font-mono text-xs pt-1 select-none cursor-pointer hover:underline">
                                {segment.time}
                            </span>
                            <div className="flex-1">
                                <p className="text-slate-300 text-sm leading-relaxed group-hover:text-white transition">
                                    {segment.text}
                                </p>
                                {segment.language && (
                                    <span className="text-xs text-slate-500 mt-1 inline-block">
                                        {segment.language === "es" ? "🇪🇸" : "🇺🇸"}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
                            <Sparkles size={24} className="text-indigo-500" />
                        </div>
                        <h3 className="text-white font-medium mb-2">No Transcript Yet</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            Generate a transcript using Gemini AI to make your video searchable and accessible.
                            {videoId && videoId !== "temp" && " This will download the video from Drive for processing."}
                        </p>
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? (
                                <>
                                    <Sparkles size={16} className="animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    Generate Transcript
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
