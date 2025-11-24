"use client";

import React, { useState, useRef, useEffect } from "react";
import { Video, Square, Play, Pause, Trash2, Check, X, Monitor, Camera as CameraIcon } from "lucide-react";

export default function Recorder({ onRecordingComplete }: { onRecordingComplete: (blob: Blob, title: string, duration: string) => void }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [showPreview, setShowPreview] = useState(false);
    const [showNameModal, setShowNameModal] = useState(false);
    const [videoTitle, setVideoTitle] = useState("");
    const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
    const [previewCameraStream, setPreviewCameraStream] = useState<MediaStream | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const cameraRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewVideoRef = useRef<HTMLVideoElement>(null);
    const previewCameraRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const animationFrameRef = useRef<number | null>(null);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isRecordingRef = useRef(false); // Ref to track recording state synchronously
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        return () => {
            stopStreams();
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, []);

    // Effect to set preview video sources when streams are ready
    useEffect(() => {
        if (previewStream && previewVideoRef.current) {
            previewVideoRef.current.srcObject = previewStream;
            previewVideoRef.current.play().catch(e => console.error("Preview video play error:", e));
        }
    }, [previewStream]);

    useEffect(() => {
        if (previewCameraStream && previewCameraRef.current) {
            previewCameraRef.current.srcObject = previewCameraStream;
            previewCameraRef.current.play().catch(e => console.error("Preview camera play error:", e));
        }
    }, [previewCameraStream]);

    const updateIsRecording = (status: boolean) => {
        setIsRecording(status);
        isRecordingRef.current = status;
    };

    const requestStreams = async () => {
        try {
            setError(null);

            // Request screen share with audio
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: { frameRate: 30 },
                audio: true,
            });

            // Request camera
            const userStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240, facingMode: "user" },
                audio: true,
            });

            setPreviewStream(screenStream);
            setPreviewCameraStream(userStream);
            setShowPreview(true);

        } catch (err) {
            console.error("Error requesting streams:", err);
            setError("Failed to access screen or camera. Please allow permissions.");
        }
    };

    const startRecording = async () => {
        if (!previewStream || !previewCameraStream) return;

        try {
            setShowPreview(false);

            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            if (!canvas || !ctx) return;

            const screenTrack = previewStream.getVideoTracks()[0];
            const { width, height } = screenTrack.getSettings();
            canvas.width = width || 1920;
            canvas.height = height || 1080;

            // Create a Web Worker to handle the timing loop
            // This prevents the browser from throttling the loop when the tab is in the background
            const workerBlob = new Blob([`
                let intervalId;
                self.onmessage = function(e) {
                    if (e.data === 'start') {
                        intervalId = setInterval(() => {
                            postMessage('tick');
                        }, 1000 / 30); // 30 FPS
                    } else if (e.data === 'stop') {
                        clearInterval(intervalId);
                    }
                };
            `], { type: 'application/javascript' });

            const worker = new Worker(URL.createObjectURL(workerBlob));

            const draw = () => {
                if (!ctx || !videoRef.current || !cameraRef.current) return;

                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

                const bubbleSize = canvas.height * 0.2;
                const padding = 20;
                const x = padding;
                const y = canvas.height - bubbleSize - padding;

                ctx.save();
                ctx.beginPath();
                ctx.arc(x + bubbleSize / 2, y + bubbleSize / 2, bubbleSize / 2, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(cameraRef.current, x, y, bubbleSize, bubbleSize);
                ctx.restore();

                ctx.beginPath();
                ctx.arc(x + bubbleSize / 2, y + bubbleSize / 2, bubbleSize / 2, 0, Math.PI * 2);
                ctx.lineWidth = 5;
                ctx.strokeStyle = "#6366f1";
                ctx.stroke();
            };
            worker.onmessage = () => {
                draw();
            };

            worker.postMessage('start');
            workerRef.current = worker;

            if (videoRef.current) {
                videoRef.current.srcObject = previewStream;
                videoRef.current.play();
            }
            if (cameraRef.current) {
                cameraRef.current.srcObject = previewCameraStream;
                cameraRef.current.play();
            }

            const canvasStream = canvas.captureStream(30);
            previewCameraStream.getAudioTracks().forEach(track => canvasStream.addTrack(track));
            previewStream.getAudioTracks().forEach(track => canvasStream.addTrack(track));

            setStream(canvasStream);
            setCameraStream(previewCameraStream);

            const mediaRecorder = new MediaRecorder(canvasStream, {
                mimeType: "video/webm;codecs=vp9",
            });

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                // Handled in finishRecording
            };

            mediaRecorder.start(1000);
            mediaRecorderRef.current = mediaRecorder;
            updateIsRecording(true);
            setElapsedTime(0);
            startTimer();

            // IMPORTANT: Use the ref in the event listener to get fresh state
            screenTrack.onended = () => {
                console.log("Screen sharing ended, isRecording:", isRecordingRef.current);
                if (isRecordingRef.current) {
                    finishRecording();
                }
            };

        } catch (err) {
            console.error("Error starting recording:", err);
            setError("Failed to start recording.");
        }
    };

    const cancelPreview = () => {
        if (previewStream) {
            previewStream.getTracks().forEach(track => track.stop());
        }
        if (previewCameraStream) {
            previewCameraStream.getTracks().forEach(track => track.stop());
        }
        setPreviewStream(null);
        setPreviewCameraStream(null);
        setShowPreview(false);
    };

    const startTimer = () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);
    };

    const pauseTimer = () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };

    const togglePause = () => {
        if (!mediaRecorderRef.current) return;

        if (isPaused) {
            mediaRecorderRef.current.resume();
            startTimer();
        } else {
            mediaRecorderRef.current.pause();
            pauseTimer();
        }
        setIsPaused(!isPaused);
    };

    const finishRecording = () => {
        // Check ref instead of state to avoid stale closure
        if (mediaRecorderRef.current && isRecordingRef.current) {
            mediaRecorderRef.current.stop();
            pauseTimer();
            updateIsRecording(false);
            setShowNameModal(true);
            setVideoTitle(`Ahal Clip - ${new Date().toLocaleString()}`);
        }
    };

    const saveRecording = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        chunksRef.current = [];
        onRecordingComplete(blob, videoTitle, formatTime(elapsedTime));
        stopStreams();
        setShowNameModal(false);
    };

    const discardRecording = () => {
        chunksRef.current = [];
        stopStreams();
        setShowNameModal(false);
        updateIsRecording(false);
        setElapsedTime(0);
    };

    const stopStreams = () => {
        if (stream) stream.getTracks().forEach(track => track.stop());
        if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
        if (previewStream) previewStream.getTracks().forEach(track => track.stop());
        if (previewCameraStream) previewCameraStream.getTracks().forEach(track => track.stop());
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(t => t.stop());
        }
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
        }

        setStream(null);
        setCameraStream(null);
        setPreviewStream(null);
        setPreviewCameraStream(null);
        updateIsRecording(false);
        setIsPaused(false);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center gap-6 p-8 w-full max-w-4xl mx-auto">
            <video ref={videoRef} className="hidden" muted playsInline />
            <video ref={cameraRef} className="hidden" muted playsInline />
            <canvas ref={canvasRef} className="hidden" />

            {!isRecording && !showPreview && !showNameModal && (
                <div className="glass-panel p-8 rounded-3xl flex flex-col items-center gap-6 animate-fade-in text-center max-w-md">
                    <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-2">
                        <CameraIcon size={40} className="text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Start Recording</h2>
                        <p className="text-slate-400">Select your screen and camera to preview before recording.</p>
                    </div>
                    <button onClick={requestStreams} className="btn btn-primary text-lg w-full justify-center py-4 shadow-xl shadow-indigo-500/20">
                        <Monitor size={20} />
                        Select Screen & Camera
                    </button>
                </div>
            )}

            {/* Preview Modal */}
            {showPreview && !isRecording && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl p-6 shadow-2xl animate-fade-in">
                        <h2 className="text-xl font-bold text-white mb-6">Preview Your Recording</h2>

                        <div className="relative bg-black rounded-xl overflow-hidden mb-6">
                            <video ref={previewVideoRef} autoPlay muted playsInline className="w-full" />
                            <div className="absolute bottom-4 left-4 w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-500 shadow-2xl">
                                <video ref={previewCameraRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                            </div>
                        </div>

                        <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
                            <div className="flex items-center gap-3 text-sm text-slate-300">
                                <Monitor size={16} className="text-indigo-400" />
                                <span>Screen sharing active</span>
                                <span className="text-slate-600">•</span>
                                <CameraIcon size={16} className="text-indigo-400" />
                                <span>Camera active</span>
                                <span className="text-slate-600">•</span>
                                <span>🎤 Microphone active</span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={cancelPreview} className="btn btn-secondary text-slate-400">
                                <X size={16} />
                                Cancel
                            </button>
                            <button onClick={startRecording} className="btn btn-primary">
                                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                                Start Recording
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Control Bar */}
            {isRecording && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl border border-white/10 p-2 rounded-full flex items-center gap-2 shadow-2xl z-50 animate-slide-up">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-500 mx-2">
                        <VideoPreview stream={cameraStream} />
                    </div>

                    <div className="h-8 w-[1px] bg-white/10 mx-2" />

                    <button onClick={togglePause} className="p-3 rounded-full hover:bg-white/10 text-white transition">
                        {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
                    </button>

                    <div className="font-mono text-white font-bold min-w-[60px] text-center">
                        {formatTime(elapsedTime)}
                    </div>

                    <button onClick={discardRecording} className="p-3 rounded-full hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition">
                        <Trash2 size={20} />
                    </button>

                    <button onClick={finishRecording} className="btn btn-primary rounded-full px-6 py-2 ml-2">
                        <Square size={16} fill="currentColor" />
                        Finish
                    </button>
                </div>
            )}

            {/* Name Modal */}
            {showNameModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
                        <h2 className="text-xl font-bold text-white mb-6">Name your video</h2>

                        <input
                            type="text"
                            value={videoTitle}
                            onChange={(e) => setVideoTitle(e.target.value)}
                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition mb-6"
                            placeholder="Enter video title..."
                            autoFocus
                        />

                        <div className="flex justify-end gap-3">
                            <button onClick={discardRecording} className="btn btn-secondary text-red-400 border-red-500/20 hover:bg-red-500/10">
                                <Trash2 size={16} />
                                Discard
                            </button>
                            <button onClick={saveRecording} className="btn btn-primary">
                                <Check size={16} />
                                Save Video
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg animate-fade-in">
                    {error}
                </div>
            )}
        </div>
    );
}

function VideoPreview({ stream }: { stream: MediaStream | null }) {
    const ref = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (ref.current && stream) {
            ref.current.srcObject = stream;
        }
    }, [stream]);
    return <video ref={ref} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />;
}
