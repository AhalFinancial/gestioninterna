/**
 * Audio extraction and processing utilities for transcription
 */

const MAX_AUDIO_SIZE = 15 * 1024 * 1024; // 15MB in bytes
const CHUNK_DURATION = 300; // 5 minutes per chunk in seconds

/**
 * Extract audio from a video blob
 */
export async function extractAudioFromVideo(videoBlob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const videoElement = document.createElement('video');
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        videoElement.src = URL.createObjectURL(videoBlob);
        videoElement.muted = true;

        videoElement.onloadedmetadata = async () => {
            try {
                const source = audioContext.createMediaElementSource(videoElement);
                const destination = audioContext.createMediaStreamDestination();
                source.connect(destination);

                // Use MediaRecorder to capture audio
                const mediaRecorder = new MediaRecorder(destination.stream, {
                    mimeType: 'audio/webm;codecs=opus',
                    audioBitsPerSecond: 64000 // 64kbps for good quality at small size
                });

                const audioChunks: Blob[] = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunks.push(event.data);
                    }
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    URL.revokeObjectURL(videoElement.src);
                    audioContext.close();
                    resolve(audioBlob);
                };

                mediaRecorder.onerror = (error) => {
                    URL.revokeObjectURL(videoElement.src);
                    audioContext.close();
                    reject(error);
                };

                // Start recording and play video
                mediaRecorder.start(1000);
                await videoElement.play();

                // Stop when video ends
                videoElement.onended = () => {
                    mediaRecorder.stop();
                };

            } catch (error) {
                URL.revokeObjectURL(videoElement.src);
                audioContext.close();
                reject(error);
            }
        };

        videoElement.onerror = () => {
            URL.revokeObjectURL(videoElement.src);
            reject(new Error('Failed to load video'));
        };
    });
}

/**
 * Split audio blob into chunks if it exceeds max size
 */
export async function chunkAudioIfNeeded(audioBlob: Blob): Promise<Blob[]> {
    if (audioBlob.size <= MAX_AUDIO_SIZE) {
        return [audioBlob];
    }

    // For large files, we need to split them
    // This is a simplified approach - in production you'd want to split at audio boundaries
    const chunks: Blob[] = [];
    const chunkSize = MAX_AUDIO_SIZE;
    let offset = 0;

    while (offset < audioBlob.size) {
        const chunk = audioBlob.slice(offset, offset + chunkSize);
        chunks.push(chunk);
        offset += chunkSize;
    }

    return chunks;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Validate audio file size
 */
export function validateAudioSize(audioBlob: Blob): { valid: boolean; message?: string; size: string } {
    const size = formatFileSize(audioBlob.size);

    if (audioBlob.size > MAX_AUDIO_SIZE * 10) { // 150MB limit
        return {
            valid: false,
            message: `Audio file is too large (${size}). Maximum supported size is ${formatFileSize(MAX_AUDIO_SIZE * 10)}.`,
            size
        };
    }

    if (audioBlob.size > MAX_AUDIO_SIZE) {
        return {
            valid: true,
            message: `Large audio file detected (${size}). It will be processed in ${Math.ceil(audioBlob.size / MAX_AUDIO_SIZE)} chunks.`,
            size
        };
    }

    return { valid: true, size };
}
