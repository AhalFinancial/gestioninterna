"use client";

import React, { useState, useEffect } from "react";
import { Folder, Save, X, FolderOpen } from "lucide-react";

interface ConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (folderId: string) => void;
    isAuthenticated?: boolean;
}

export default function ConfigModal({ isOpen, onClose, onSave, isAuthenticated = false }: ConfigModalProps) {
    const [folderId, setFolderId] = useState("");
    const [folders, setFolders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && isAuthenticated) {
            fetchFolders();
        }
    }, [isOpen, isAuthenticated]);

    const fetchFolders = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/drive/list", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mimeType: "application/vnd.google-apps.folder" }),
            });
            const data = await res.json();
            if (data.files) {
                setFolders(data.files);
            }
        } catch (error) {
            console.error("Failed to fetch folders", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        if (folderId) {
            onSave(folderId);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Folder className="text-indigo-400" size={24} />
                        Select Root Folder
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition">
                        <X size={24} />
                    </button>
                </div>

                <p className="text-slate-400 text-sm mb-4">
                    Choose a Google Drive folder where your "My Videos" will be saved.
                </p>

                <div className="mb-4">
                    <button
                        onClick={() => onSave("root")}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/20 transition font-medium"
                    >
                        <FolderOpen size={18} />
                        Use "My Drive" Root Folder
                    </button>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center my-4">
                        <span className="bg-slate-900 px-2 text-xs text-slate-500 uppercase tracking-wider">Or select subfolder</span>
                    </div>
                </div>

                <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-2">
                    {!isAuthenticated ? (
                        <div className="text-center text-slate-400 py-4">
                            <p className="mb-2">Please connect to Google Drive first to view your folders.</p>
                            <p className="text-sm text-slate-500">Click "Connect to Google Drive" in the navigation bar.</p>
                        </div>
                    ) : loading ? (
                        <div className="text-center text-slate-500 py-4">Loading folders...</div>
                    ) : folders.length === 0 ? (
                        <div className="text-center text-slate-500 py-4">No folders found</div>
                    ) : (
                        folders.map((folder) => (
                            <button
                                key={folder.id}
                                onClick={() => setFolderId(folder.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition text-left ${folderId === folder.id
                                    ? "bg-indigo-500/20 border-indigo-500 text-white"
                                    : "bg-slate-800/50 border-white/5 text-slate-300 hover:bg-slate-800 hover:border-white/10"
                                    }`}
                            >
                                <Folder size={18} className={folderId === folder.id ? "text-indigo-400" : "text-slate-500"} />
                                <span className="truncate">{folder.name || folder.title}</span>
                            </button>
                        ))
                    )}
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="btn btn-secondary text-sm">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!folderId || !isAuthenticated}
                        className="btn btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={16} />
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
}
