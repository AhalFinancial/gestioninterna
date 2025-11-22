"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Recorder from "@/components/Recorder";
import VideoLibrary from "@/components/VideoLibrary";
import VideoPlayer from "@/components/VideoPlayer";
import Transcript from "@/components/Transcript";
import ConfigModal from "@/components/ConfigModal";
import SettingsModal from "@/components/SettingsModal";
import MoveModal from "@/components/MoveModal";
import ShareModal from "@/components/ShareModal";
import { Plus, ArrowLeft, UploadCloud, LogIn, Settings as SettingsIcon, Download, Trash2, FolderInput, Share2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

function HomeContent() {
  const { t } = useI18n();
  const [currentView, setCurrentView] = useState<"library" | "recorder" | "player">("library");
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);

  // Library State Persistence
  const [currentFolderId, setCurrentFolderId] = useState<string>("");
  const [folderHistory, setFolderHistory] = useState<{ id: string, name: string }[]>([]);
  const [activeSection, setActiveSection] = useState<"my-videos" | "team" | "recent">("my-videos");

  // Auto-generate transcript state
  const [autoGenerateTranscript, setAutoGenerateTranscript] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [rootFolderId, setRootFolderId] = useState<string>("");

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      fetch("/api/auth/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      }).then(() => {
        window.history.replaceState({}, "", "/");
        window.location.reload();
      });
      return;
    }

    // Check authentication and root folder
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/drive/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (res.ok) {
          setIsAuthenticated(true);
          const rootFolderId = localStorage.getItem("ahal_root_folder");
          if (rootFolderId) {
            setRootFolderId(rootFolderId);
          } else {
            setShowConfig(true);
          }
        }
      } catch (err) {
        console.error("Auth check failed", err);
      }
    };

    checkAuth();
  }, []);

  const handleSaveConfig = (folderId: string) => {
    setRootFolderId(folderId);
    localStorage.setItem("ahal_root_folder", folderId);
    setShowConfig(false);
  };

  const handleLogin = () => {
    try {
      console.log("Login button clicked");
      console.log("Environment check:", {
        hasWindow: typeof window !== 'undefined',
        origin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
      });
      
      // Redirect to Google Auth
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      console.log("Client ID check:", clientId ? "Set" : "NOT SET");
      
      if (!clientId) {
        console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set!");
        alert("Google OAuth is not configured. Please check environment variables.\n\nCheck Vercel → Settings → Environment Variables → NEXT_PUBLIC_GOOGLE_CLIENT_ID");
        return;
      }

      // Get redirect URI and remove trailing slash if present
      let redirectUri = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : "http://localhost:3000");
      redirectUri = redirectUri.replace(/\/$/, ''); // Remove trailing slash
      
      console.log("Redirect URI:", redirectUri);
      
      const scope = "https://www.googleapis.com/auth/drive.file";
      const redirectPath = '/api/auth/exchange';
      const finalRedirectUri = redirectUri + redirectPath;
      
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(finalRedirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
      
      console.log("Full OAuth URL:", url);
      console.log("Redirecting to Google OAuth...");
      
      window.location.href = url;
    } catch (error: any) {
      console.error("Login error:", error);
      alert(`Error connecting to Google Drive: ${error.message}\n\nCheck browser console for details.`);
    }
  };

  const handleStartRecording = () => {
    setCurrentView("recorder");
  };

  const autoUpload = async (blob: Blob, title: string, durationStr: string) => {
    setIsUploading(true);
    const formData = new FormData();
    const safeFilename = title.replace(/[^a-zA-Z0-9-_ ]/g, "-");
    formData.append("file", blob, `${safeFilename}.webm`);
    formData.append("title", title);

    // Use rootFolderId to match handleUpload behavior and ensure consistency
    const parentId = rootFolderId;
    if (parentId) {
      formData.append("folderId", parentId);
    }

    try {
      const res = await fetch("/api/drive/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const videoId = data.file?.id; // Fix: access id from file object

        // Save metadata
        if (videoId) {
          try {
            await fetch("/api/drive/save-metadata", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                videoId,
                metadata: {
                  duration: durationStr || "0:00",
                  durationSeconds: (() => {
                    try {
                      const safeDuration = durationStr || "0:00";
                      const parts = safeDuration.split(":");
                      if (parts.length !== 2) return 0;
                      return Math.floor(parseInt(parts[0]) * 60 + parseInt(parts[1]));
                    } catch (e) {
                      return 0;
                    }
                  })(),
                  createdAt: new Date().toISOString(),
                  createdBy: "You",
                  description: "Recorded with Ahal Clips",
                },
              }),
            });
            console.log("Metadata saved for uploaded video");
          } catch (saveError) {
            console.error("Error saving metadata:", saveError);
          }

          // Update selected video with real ID and trigger transcript
          setSelectedVideo((prev: any) => ({
            ...prev,
            id: videoId,
            duration: durationStr,
          }));
          setAutoGenerateTranscript(true);
        }
      } else {
        alert("Auto-upload failed. Please try manually.");
      }
    } catch (err) {
      console.error("Auto-upload error:", err);
      alert("Auto-upload error.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRecordingComplete = (blob: Blob, title: string, duration: string) => {
    setRecordedBlob(blob);
    const url = URL.createObjectURL(blob);

    // Set video immediately with trusted duration from recorder
    setSelectedVideo({
      id: "temp",
      title: title,
      src: url,
      date: new Date().toLocaleDateString(),
      duration: duration,
    });

    setCurrentView("player");

    // Trigger auto-upload with the correct duration
    autoUpload(blob, title, duration);

    // We don't need to calculate duration from blob anymore as we get it from the recorder timer
    // But we can still create a temp video to verify if needed, but let's trust the timer for now
    // to avoid the Infinity issue.
  };

  const handleUpload = async () => {
    if (!recordedBlob) return;
    setIsUploading(true);

    const formData = new FormData();
    const safeFilename = selectedVideo.title.replace(/[^a-zA-Z0-9-_ ]/g, "-");
    formData.append("file", recordedBlob, `${safeFilename}.webm`);
    formData.append("title", selectedVideo.title); // Send title separately if needed by API
    if (rootFolderId) {
      formData.append("folderId", rootFolderId);
    }

    try {
      const res = await fetch("/api/drive/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const videoId = data.file?.id; // Fix: access id from file object

        // Save metadata for uploaded video
        if (videoId && selectedVideo.duration) {
          try {
            await fetch("/api/drive/save-metadata", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                videoId,
                metadata: {
                  duration: selectedVideo.duration,
                  durationSeconds: Math.floor(
                    parseInt(selectedVideo.duration.split(":")[0]) * 60 +
                    parseInt(selectedVideo.duration.split(":")[1])
                  ),
                  createdAt: new Date().toISOString(),
                  createdBy: "You",
                  description: "",
                },
              }),
            });
            console.log("Metadata saved for uploaded video");
          } catch (saveError) {
            console.error("Error saving metadata:", saveError);
          }
        }

        alert("Uploaded successfully!");
        setCurrentView("library");
        window.location.reload();
      } else {
        alert("Upload failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Upload error.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectVideo = async (video: any) => {
    setSelectedVideo(video);
    setCurrentView("player");

    // Load metadata for Drive videos
    if (video.id && video.id !== "temp") {
      try {
        const res = await fetch("/api/drive/load-metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: video.id }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.metadata) {
            // Update video with metadata
            setSelectedVideo((prev: any) => ({
              ...prev,
              duration: data.metadata.duration || prev.duration,
              date: data.metadata.createdAt ? new Date(data.metadata.createdAt).toLocaleDateString() : prev.date,
            }));
            console.log("Loaded metadata for video:", video.id);
          }
        }
      } catch (error) {
        console.error("Error loading video metadata:", error);
      }
    }
  };

  const handleBackToLibrary = () => {
    setCurrentView("library");
    setSelectedVideo(null);
    setAutoGenerateTranscript(false);
  };

  const handleDownload = async () => {
    if (!selectedVideo || selectedVideo.id === "temp") return;
    try {
      const res = await fetch(`/api/drive/download?fileId=${selectedVideo.id}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedVideo.title}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
      alert("Failed to download video");
    }
  };

  const handleDeleteFromPlayer = async () => {
    if (!selectedVideo || selectedVideo.id === "temp") return;
    if (confirm(`Are you sure you want to delete "${selectedVideo.title}"?`)) {
      try {
        await fetch("/api/drive/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId: selectedVideo.id }),
        });
        handleBackToLibrary();
      } catch (err) {
        console.error("Delete failed", err);
        alert("Failed to delete video");
      }
    }
  };

  const handleMoveFromPlayer = async (targetFolderId: string) => {
    if (!selectedVideo || selectedVideo.id === "temp") return;
    try {
      await fetch("/api/drive/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: selectedVideo.id, newParentId: targetFolderId }),
      });
      setShowMoveModal(false);
      alert("Video moved successfully!");
    } catch (err) {
      console.error("Move failed", err);
      alert("Failed to move video");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50 flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="h-16 border-b border-white/5 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {currentView !== "library" && (
            <button onClick={handleBackToLibrary} className="p-2 hover:bg-white/10 rounded-full transition">
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Ahal Clips
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!isAuthenticated ? (
            <button onClick={handleLogin} className="btn btn-secondary text-sm py-2 px-4">
              <LogIn size={18} />
              {t("nav.connectDrive")}
            </button>
          ) : (
            <>
              <button onClick={handleStartRecording} className="btn btn-primary text-sm py-2 px-4 shadow-lg shadow-indigo-500/20">
                <Plus size={18} />
                {t("nav.newVideo")}
              </button>
              <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-white/10 rounded-full transition">
                <SettingsIcon size={20} className="text-slate-400 hover:text-white" />
              </button>
            </>
          )}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border-2 border-slate-800" />
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        {currentView === "library" && (
          <div className="animate-fade-in h-full">
            <VideoLibrary
              onSelectVideo={handleSelectVideo}
              currentFolderId={currentFolderId}
              setCurrentFolderId={setCurrentFolderId}
              folderHistory={folderHistory}
              setFolderHistory={setFolderHistory}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
            />
          </div>
        )}

        {currentView === "recorder" && (
          <div className="flex-1 flex items-center justify-center animate-fade-in">
            <Recorder onRecordingComplete={handleRecordingComplete} />
          </div>
        )}

        {currentView === "player" && selectedVideo && (
          <div className="flex flex-col lg:flex-row gap-6 h-full animate-fade-in max-w-7xl mx-auto w-full">
            <div className="flex-1 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">{selectedVideo.title}</h1>
                  <p className="text-slate-400 text-sm">{selectedVideo.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  {recordedBlob && selectedVideo.id === "temp" ? (
                    <button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="btn btn-secondary text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10"
                    >
                      <UploadCloud size={18} />
                      {isUploading ? "Uploading..." : "Save to Drive"}
                    </button>
                  ) : selectedVideo.id !== "temp" && (
                    <>
                      <button onClick={() => setShowShareModal(true)} className="btn btn-secondary text-sm">
                        <Share2 size={16} />
                        Share
                      </button>
                      <button onClick={handleDownload} className="btn btn-secondary text-sm">
                        <Download size={16} />
                        Download
                      </button>
                      <button onClick={() => setShowMoveModal(true)} className="btn btn-secondary text-sm">
                        <FolderInput size={16} />
                        Move
                      </button>
                      <button onClick={handleDeleteFromPlayer} className="btn btn-secondary text-sm text-red-400 border-red-500/20 hover:bg-red-500/10">
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              <VideoPlayer src={selectedVideo.src} />

              <div className="p-6 bg-slate-900/50 rounded-2xl border border-white/5">
                <h3 className="font-semibold text-white mb-3">Description</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Recorded with Ahal Clips.
                </p>
                <div className="flex items-center gap-4 text-sm text-slate-500 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Duration: {(!selectedVideo.duration || selectedVideo.duration.includes("Infinity") || selectedVideo.duration.includes("NaN")) ? "0:00" : selectedVideo.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Recorded by: You</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{selectedVideo.date}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar / Transcript */}
            <div className="lg:h-[calc(100vh-8rem)] sticky top-6">
              <Transcript
                videoId={selectedVideo.id}
                videoBlob={selectedVideo.id === "temp" && recordedBlob ? recordedBlob : undefined}
                autoGenerate={autoGenerateTranscript}
              />
            </div>
          </div>
        )}
      </div>

      <ConfigModal
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        onSave={handleSaveConfig}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onLogout={() => setIsAuthenticated(false)}
        onChangeFolder={() => { setShowSettings(false); setShowConfig(true); }}
      />

      <MoveModal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        onMove={handleMoveFromPlayer}
        videoTitle={selectedVideo?.title || ""}
      />

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        videoUrl={selectedVideo?.src || ""}
        videoTitle={selectedVideo?.title || ""}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="text-slate-400">Loading...</div>
    </div>}>
      <HomeContent />
    </Suspense>
  );
}
