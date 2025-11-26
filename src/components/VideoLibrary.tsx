"use client";

import React, { useState, useEffect } from "react";
import { Folder, Video, Clock, Search, Grid, List, ChevronRight, Plus, Sparkles, UploadCloud } from "lucide-react";
import VideoMenu from "./VideoMenu";
import MoveModal from "./MoveModal";
import UploadModal from "./UploadModal";

interface VideoItem {
    id: string;
    title: string;
    thumbnail?: string;
    duration: string;
    date: string;
    views: number;
    mimeType?: string;
    src?: string;
    hasTranscript?: boolean;
}

const TEAM_FOLDER_ID = "1d9EunRM7JqeH27W48SGu8ndvl1zHBsp7";

interface VideoLibraryProps {
    onSelectVideo: (video: VideoItem) => void;
    currentFolderId: string;
    setCurrentFolderId: (id: string) => void;
    folderHistory: { id: string, name: string }[];
    setFolderHistory: (history: { id: string, name: string }[]) => void;
    activeSection: "my-videos" | "team" | "recent";
    setActiveSection: (section: "my-videos" | "team" | "recent") => void;
    rootFolderId?: string;
}

export default function VideoLibrary({
    onSelectVideo,
    currentFolderId,
    setCurrentFolderId,
    folderHistory,
    setFolderHistory,
    activeSection,
    setActiveSection,
    rootFolderId
}: VideoLibraryProps) {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedVideoForMove, setSelectedVideoForMove] = useState<VideoItem | null>(null);
    const [draggedVideoId, setDraggedVideoId] = useState<string | null>(null);

    useEffect(() => {
        if (activeSection === "my-videos") {
            if (!rootFolderId) {
                return;
            }
            if (folderHistory.length === 0 && currentFolderId !== rootFolderId) {
                setCurrentFolderId(rootFolderId);
            }
        } else if (activeSection === "team") {
            if (folderHistory.length === 0 && currentFolderId !== TEAM_FOLDER_ID) {
                setCurrentFolderId(TEAM_FOLDER_ID);
            }
        } else if (activeSection === "recent" && currentFolderId !== "") {
            setCurrentFolderId("");
        }
    }, [activeSection, folderHistory.length, rootFolderId, currentFolderId, setCurrentFolderId]);

    useEffect(() => {
        if (currentFolderId) {
            fetchVideos(currentFolderId);
        } else if (activeSection === "recent") {
            fetchVideos("recent");
        }
    }, [currentFolderId, activeSection]);

    const fetchVideos = async (folderId: string) => {
        setLoading(true);
        try {
            const res = await fetch("/api/drive/list", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ folderId: folderId === "recent" ? undefined : folderId }),
            });
            const data = await res.json();

            if (data.files) {
                // Filter out JSON files client-side as a double check
                const filteredFiles = data.files.filter((f: any) => f.mimeType !== 'application/json');

                // Load metadata for each video
                const videosWithMetadata = await Promise.all(
                    filteredFiles.map(async (file: any) => {
                        let duration = file.duration || "0:00";
                        let hasTranscript = false;

                        // Try to load metadata from JSON file
                        if (file.mimeType !== "application/vnd.google-apps.folder") {
                            try {
                                const metaRes = await fetch("/api/drive/load-metadata", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ videoId: file.id }),
                                });
                                if (metaRes.ok) {
                                    const metaData = await metaRes.json();
                                    if (metaData.metadata) {
                                        if (metaData.metadata.duration) duration = metaData.metadata.duration;
                                        if (metaData.metadata.transcript) hasTranscript = true;
                                    }
                                }
                            } catch (e) {
                                // Ignore metadata load errors for list view
                            }
                        }

                        return {
                            id: file.id,
                            title: file.name,
                            thumbnail: file.thumbnailLink,
                            duration: duration,
                            date: new Date(file.createdTime).toLocaleDateString(),
                            views: 0,
                            mimeType: file.mimeType,
                            src: `/api/drive/fetch-video?fileId=${file.id}`,
                            hasTranscript: hasTranscript
                        };
                    })
                );

                setVideos(videosWithMetadata);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFolderClick = (folder: VideoItem) => {
        setFolderHistory([...folderHistory, { id: folder.id, name: folder.title }]);
        setCurrentFolderId(folder.id);
    };

    const handleBreadcrumbClick = (index: number) => {
        if (index === -1) {
            setFolderHistory([]);
            const rootId = activeSection === "team" ? TEAM_FOLDER_ID : rootFolderId || "";
            setCurrentFolderId(rootId);
        } else {
            const newHistory = folderHistory.slice(0, index + 1);
            setFolderHistory(newHistory);
            setCurrentFolderId(newHistory[newHistory.length - 1].id);
        }
    };

    const handleRename = async (video: VideoItem) => {
        const newName = prompt("Enter new name:", video.title);
        if (newName && newName !== video.title) {
            try {
                await fetch("/api/drive/rename", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fileId: video.id, newName }),
                });
                fetchVideos(currentFolderId);
            } catch (err) {
                console.error("Rename failed", err);
            }
        }
    };

    const handleDelete = async (video: VideoItem) => {
        if (confirm(`Are you sure you want to delete "${video.title}"?`)) {
            try {
                await fetch("/api/drive/delete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fileId: video.id }),
                });
                fetchVideos(currentFolderId);
            } catch (err) {
                console.error("Delete failed", err);
            }
        }
    };

    const handleShare = (video: VideoItem) => {
        if (video.src) {
            navigator.clipboard.writeText(video.src);
            alert("Link copied to clipboard!");
        }
    };

    const handleMoveClick = (video: VideoItem) => {
        setSelectedVideoForMove(video);
        setShowMoveModal(true);
    };

    const handleMoveComplete = async (targetFolderId: string) => {
        if (!selectedVideoForMove) return;

        try {
            await fetch("/api/drive/move", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fileId: selectedVideoForMove.id,
                    newParentId: targetFolderId,
                    oldParentId: currentFolderId
                }),
            });
            fetchVideos(currentFolderId);
            setShowMoveModal(false);
            setSelectedVideoForMove(null);
        } catch (err) {
            console.error("Move failed", err);
            alert("Failed to move video");
        }
    };

    const handleCreateFolder = async () => {
        const folderName = prompt("Enter folder name:");
        if (!folderName) return;

        const parentId = currentFolderId || (activeSection === "team" ? TEAM_FOLDER_ID : rootFolderId);

        try {
            await fetch("/api/drive/create-folder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ folderName, parentId }),
            });
            fetchVideos(currentFolderId);
        } catch (err) {
            console.error("Create folder failed", err);
            alert("Failed to create folder");
        }
    };

    const handleDragStart = (e: React.DragEvent, videoId: string) => {
        e.dataTransfer.setData("videoId", videoId);
        setDraggedVideoId(videoId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Allow drop
    };

    const handleDropOnFolder = async (e: React.DragEvent, targetFolderId: string) => {
        e.preventDefault();
        const videoId = e.dataTransfer.getData("videoId");
        if (!videoId) return;

        // Optimistic update or just loading state could be good here
        try {
            await fetch("/api/drive/move", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fileId: videoId,
                    newParentId: targetFolderId,
                    oldParentId: currentFolderId
                }),
            });
            fetchVideos(currentFolderId); // Refresh to show moved item is gone
            setDraggedVideoId(null);
        } catch (err) {
            console.error("Drag move failed", err);
            alert("Failed to move video");
        }
    };

    return (
        <>
            <div className="flex h-full min-h-[600px] bg-slate-900/50 rounded-3xl border border-white/5 overflow-hidden">
                <aside className="w-64 bg-slate-900/80 border-r border-white/5 p-6 flex flex-col gap-6 hidden md:flex">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-xl mb-4">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                            <Video size={18} />
                        </div>
                        Ahal Clips
                    </div>

                    <nav className="flex flex-col gap-2">
                        <NavItem
                            icon={<Video size={18} />}
                            label="My Videos"
                            active={activeSection === "my-videos"}
                            onClick={() => { setActiveSection("my-videos"); setFolderHistory([]); setCurrentFolderId(rootFolderId || ""); }}
                        />
                        <NavItem
                            icon={<Folder size={18} />}
                            label="Team Library"
                            active={activeSection === "team"}
                            onClick={() => { setActiveSection("team"); setFolderHistory([]); setCurrentFolderId(TEAM_FOLDER_ID); }}
                        />
                        <NavItem
                            icon={<Clock size={18} />}
                            label="Recent"
                            active={activeSection === "recent"}
                            onClick={() => { setActiveSection("recent"); setFolderHistory([]); setCurrentFolderId(""); }}
                        />
                    </nav>
                </aside>

                <main className="flex-1 flex flex-col">
                    <header className="h-20 border-b border-white/5 flex items-center justify-between px-8">
                        <div className="flex items-center gap-2 text-white font-medium overflow-hidden">
                            <button onClick={() => handleBreadcrumbClick(-1)} className="hover:text-blue-400 transition">
                                {activeSection === "team" ? "Team Library" : "My Videos"}
                            </button>
                            {folderHistory.map((folder, index) => (
                                <React.Fragment key={folder.id}>
                                    <ChevronRight size={16} className="text-slate-500" />
                                    <button onClick={() => handleBreadcrumbClick(index)} className="hover:text-blue-400 transition truncate max-w-[150px]">
                                        {folder.name}
                                    </button>
                                </React.Fragment>
                            ))}
                        </div>

                        <div className="flex items-center gap-4">
                            <button onClick={handleCreateFolder} className="btn btn-secondary text-sm">
                                <Plus size={16} />
                                New Folder
                            </button>
                            <button onClick={() => setShowUploadModal(true)} className="btn btn-primary text-sm">
                                <UploadCloud size={16} />
                                Upload Video
                            </button>
                            <div className="relative">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="bg-slate-800/50 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 w-64 transition"
                                />
                            </div>
                            <div className="flex bg-slate-800/50 rounded-lg p-1 border border-white/10">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-2 rounded-md transition ${viewMode === "grid" ? "bg-blue-500 text-white" : "text-slate-400 hover:text-white"}`}
                                >
                                    <Grid size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`p-2 rounded-md transition ${viewMode === "list" ? "bg-blue-500 text-white" : "text-slate-400 hover:text-white"}`}
                                >
                                    <List size={18} />
                                </button>
                            </div>
                        </div>
                    </header>

                    <div className="p-8 overflow-y-auto flex-1">
                        {loading ? (
                            <div className="text-center text-slate-400 mt-10">Loading...</div>
                        ) : videos.length === 0 ? (
                            <div className="text-center text-slate-400 mt-10">No items found.</div>
                        ) : (
                            <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
                                {videos.map((video, index) => (
                                    video.mimeType === "application/vnd.google-apps.folder" ? (
                                        <FolderCard
                                            key={`${video.id}-${index}`}
                                            folder={video}
                                            onClick={() => handleFolderClick(video)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDropOnFolder(e, video.id)}
                                        />
                                    ) : (
                                        <VideoCard
                                            key={`${video.id}-${index}`}
                                            video={video}
                                            onClick={() => onSelectVideo(video)}
                                            viewMode={viewMode}
                                            onRename={() => handleRename(video)}
                                            onDelete={() => handleDelete(video)}
                                            onShare={() => handleShare(video)}
                                            onMove={() => handleMoveClick(video)}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, video.id)}
                                        />
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <MoveModal
                isOpen={showMoveModal}
                onClose={() => { setShowMoveModal(false); setSelectedVideoForMove(null); }}
                onMove={handleMoveComplete}
                videoTitle={selectedVideoForMove?.title || ""}
            />

            <UploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onUploadComplete={() => fetchVideos(currentFolderId)}
                currentFolderId={currentFolderId || (activeSection === "team" ? TEAM_FOLDER_ID : rootFolderId || "")}
            />
        </>
    );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
    return (
        <button onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${active ? "bg-blue-500/10 text-blue-400" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
            {icon}
            {label}
        </button>
    );
}

function FolderCard({ folder, onClick, onDragOver, onDrop }: {
    folder: VideoItem,
    onClick: () => void,
    onDragOver: (e: React.DragEvent) => void,
    onDrop: (e: React.DragEvent) => void
}) {
    return (
        <div
            onClick={onClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className="group flex flex-col gap-3 cursor-pointer"
        >
            <div className="aspect-[4/3] bg-slate-800/50 rounded-xl border border-white/5 group-hover:border-blue-500/50 transition flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition duration-500" />
                <Folder size={48} className="text-blue-400 group-hover:scale-110 transition duration-300" />
            </div>
            <h3 className="text-white font-medium text-center group-hover:text-blue-400 transition">{folder.title}</h3>
        </div>
    );
}

function VideoCard({ video, onClick, viewMode, onRename, onDelete, onShare, onMove, draggable, onDragStart }: {
    video: VideoItem,
    onClick: () => void,
    viewMode: "grid" | "list",
    onRename: () => void,
    onDelete: () => void,
    onShare: () => void,
    onMove: () => void,
    draggable?: boolean,
    onDragStart?: (e: React.DragEvent) => void
}) {
    if (viewMode === "list") {
        return (
            <div
                onClick={onClick}
                draggable={draggable}
                onDragStart={onDragStart}
                className="group flex items-center gap-4 p-4 rounded-xl bg-slate-800/30 border border-white/5 hover:border-blue-500/50 hover:bg-slate-800/50 transition cursor-pointer active:cursor-grabbing"
            >
                <div className="w-40 aspect-video bg-slate-900 rounded-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-mono">
                        {video.duration}
                    </div>
                    {video.hasTranscript && (
                        <div className="absolute top-2 right-2 bg-blue-500/90 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1" title="Has transcript">
                            <Sparkles size={10} />
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <h3 className="text-white font-medium mb-1 group-hover:text-blue-400 transition">{video.title}</h3>
                    <div className="text-slate-400 text-sm flex items-center gap-3">
                        <span>{video.date}</span>
                        <span>•</span>
                        <span>{video.views} views</span>
                    </div>
                </div>
                <VideoMenu onRename={onRename} onDelete={onDelete} onShare={onShare} onMove={onMove} />
            </div>
        );
    }

    return (
        <div
            onClick={onClick}
            draggable={draggable}
            onDragStart={onDragStart}
            className="group flex flex-col gap-3 cursor-pointer relative active:cursor-grabbing"
        >
            <div className="aspect-video bg-slate-900 rounded-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-mono">
                    {video.duration}
                </div>
                {video.hasTranscript && (
                    <div className="absolute top-2 right-2 bg-blue-500/90 text-white text-xs px-2 py-1 rounded flex items-center gap-1" title="Has transcript">
                        <Sparkles size={12} />
                    </div>
                )}
            </div>
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-white font-medium leading-tight mb-1 group-hover:text-blue-400 transition line-clamp-2">{video.title}</h3>
                    <div className="text-slate-500 text-xs">{video.date}</div>
                </div>
                <VideoMenu onRename={onRename} onDelete={onDelete} onShare={onShare} onMove={onMove} />
            </div>
        </div>
    );
}
