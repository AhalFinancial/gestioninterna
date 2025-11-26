"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, X, FileVideo, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadComplete: () => void;
    currentFolderId: string;
}

export default function UploadModal({ isOpen, onClose, onUploadComplete, currentFolderId }: UploadModalProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type.startsWith("video/")) {
                setFile(droppedFile);
                setError(null);
            } else {
                setError("Please upload a video file.");
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type.startsWith("video/")) {
                setFile(selectedFile);
                setError(null);
            } else {
                setError("Please upload a video file.");
            }
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setError(null);
        setUploadProgress(0); // Reset progress

        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", file.name.replace(/\.[^/.]+$/, "")); // Remove extension for title
        if (currentFolderId) {
            formData.append("folderId", currentFolderId);
        }

        try {
            // Using XMLHttpRequest for progress tracking since fetch doesn't support it easily
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener("progress", (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(percentComplete);
                }
            });

            xhr.addEventListener("load", () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    setSuccess(true);
                    setTimeout(() => {
                        onUploadComplete();
                        onClose();
                        // Reset state
                        setFile(null);
                        setSuccess(false);
                        setIsUploading(false);
                    }, 1500);
                } else {
                    let errorMessage = `Upload failed (${xhr.status})`;
                    try {
                        const response = JSON.parse(xhr.responseText);
                        errorMessage = response.error || errorMessage;
                    } catch (e) { }
                    setError(errorMessage);
                    setIsUploading(false);
                }
            });

            xhr.addEventListener("error", () => {
                setError("Network error occurred during upload.");
                setIsUploading(false);
            });

            xhr.open("POST", "/api/drive/upload");
            xhr.send(formData);

        } catch (err) {
            console.error("Upload error:", err);
            setError("Failed to upload video.");
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <UploadCloud className="text-blue-400" size={24} />
                        Upload Video
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition">
                        <X size={24} />
                    </button>
                </div>

                {!file ? (
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition ${isDragging
                                ? "border-blue-500 bg-blue-500/10"
                                : "border-white/10 hover:border-blue-500/50 hover:bg-slate-800/50"
                            }`}
                    >
                        <UploadCloud size={48} className={`mb-4 ${isDragging ? "text-blue-400" : "text-slate-500"}`} />
                        <p className="text-white font-medium mb-2">Click or drag video here</p>
                        <p className="text-slate-500 text-sm">Supports MP4, WebM, MOV</p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="video/*"
                            className="hidden"
                        />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-white/5">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileVideo className="text-blue-400" size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">{file.name}</p>
                                <p className="text-slate-500 text-xs">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                            {!isUploading && !success && (
                                <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-400 transition">
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        {isUploading && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>Uploading...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {success && (
                            <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                                <CheckCircle2 size={16} />
                                <span>Upload complete!</span>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="btn btn-secondary"
                                disabled={isUploading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                className="btn btn-primary"
                                disabled={isUploading || success}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Uploading...
                                    </>
                                ) : success ? (
                                    <>
                                        <CheckCircle2 size={16} />
                                        Done
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud size={16} />
                                        Upload
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
