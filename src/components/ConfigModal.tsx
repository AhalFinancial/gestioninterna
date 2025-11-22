"use client";

import React, { useState, useEffect } from "react";
import { Folder, Save, X } from "lucide-react";

interface ConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (folderId: string) => void;
}

export default function ConfigModal({ isOpen, onClose, onSave }: ConfigModalProps) {
    const [folderId, setFolderId] = useState("");
    const [folders, setFolders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchFolders();
        }
    }, [isOpen]);

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

                <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-2">
                    {loading ? (
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
                        disabled={!folderId}
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
