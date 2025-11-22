"use client";

import React, { useState, useEffect } from "react";
import { FolderInput, X, ChevronRight } from "lucide-react";

interface MoveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onMove: (folderId: string) => void;
    videoTitle: string;
}

export default function MoveModal({ isOpen, onClose, onMove, videoTitle }: MoveModalProps) {
    const [folders, setFolders] = useState<any[]>([]);
    const [selectedFolder, setSelectedFolder] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchFolders();
        }
    }, [isOpen]);

    const fetchFolders = async () => {
        setLoading(true);
        try {
            // Get My Videos root
            const rootId = localStorage.getItem("ahal_root_folder");
            const teamId = "1d9EunRM7JqeH27W48SGu8ndvl1zHBsp7";

            const folders = [];

            if (rootId) {
                folders.push({ id: rootId, title: "My Videos", isRoot: true });
            }

            folders.push({ id: teamId, title: "Team Library", isRoot: true });

            // Fetch subfolders for both
            const promises = [rootId, teamId].filter(Boolean).map(async (id) => {
                const res = await fetch("/api/drive/list", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        folderId: id,
                        mimeType: "application/vnd.google-apps.folder"
                    }),
                });
                const data = await res.json();
                return data.files || [];
            });

            const results = await Promise.all(promises);
            const subfolders = results.flat();

            setFolders([...folders, ...subfolders]);
        } catch (error) {
            console.error("Failed to fetch folders", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMove = () => {
        if (selectedFolder) {
            onMove(selectedFolder);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FolderInput className="text-indigo-400" size={24} />
                        Move Video
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition">
                        <X size={24} />
                    </button>
                </div>

                <p className="text-slate-400 text-sm mb-4">
                    Move <span className="text-white font-medium">"{videoTitle}"</span> to:
                </p>

                <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                    {loading ? (
                        <div className="text-center text-slate-500 py-4">Loading folders...</div>
                    ) : (
                        folders.map((folder) => (
                            <button
                                key={folder.id}
                                onClick={() => setSelectedFolder(folder.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition text-left ${selectedFolder === folder.id
                                    ? "bg-indigo-500/20 border-indigo-500 text-white"
                                    : "bg-slate-800/50 border-white/5 text-slate-300 hover:bg-slate-800 hover:border-white/10"
                                    }`}
                            >
                                {folder.isRoot ? (
                                    <FolderInput size={18} className={selectedFolder === folder.id ? "text-indigo-400" : "text-slate-500"} />
                                ) : (
                                    <>
                                        <ChevronRight size={14} className="text-slate-600" />
                                        <FolderInput size={16} className={selectedFolder === folder.id ? "text-indigo-400" : "text-slate-500"} />
                                    </>
                                )}
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
                        onClick={handleMove}
                        disabled={!selectedFolder}
                        className="btn btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Move Here
                    </button>
                </div>
            </div>
        </div>
    );
}
