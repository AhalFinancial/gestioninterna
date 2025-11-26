import { google } from "googleapis";
import { oauth2Client } from "@/lib/google";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import Busboy from "busboy";
import { Readable } from "stream";

export const maxDuration = 300; // 5 minutes

// Disable Next.js body parsing to handle the stream manually
// Note: In App Router, we just consume the stream, but we need to ensure we don't access req.formData() or req.json() before this.

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const tokensStr = cookieStore.get("google_tokens")?.value;

        if (!tokensStr) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const tokens = JSON.parse(tokensStr);
        oauth2Client.setCredentials(tokens);

        const drive = google.drive({ version: "v3", auth: oauth2Client });

        const contentType = req.headers.get("content-type");
        if (!contentType || !contentType.includes("multipart/form-data")) {
            return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
        }

        // Check storage quota
        try {
            const about = await drive.about.get({
                fields: "storageQuota",
            });
            const quota = about.data.storageQuota;
            if (quota && quota.limit && quota.usage) {
                const remaining = parseInt(quota.limit) - parseInt(quota.usage);
                // Check if less than 100MB remaining (arbitrary buffer)
                if (remaining < 100 * 1024 * 1024) {
                    return NextResponse.json({ error: "Insufficient storage space in Google Drive" }, { status: 507 });
                }
            }
        } catch (quotaError) {
            console.warn("Failed to check storage quota:", quotaError);
            // Continue with upload even if quota check fails, Drive will reject if full
        }

        const busboy = Busboy({ headers: { "content-type": contentType } });

        const fields: Record<string, string> = {};
        let fileStream: Readable | null = null;
        let fileMimeType = "video/mp4";
        let fileName = "video.mp4";

        const uploadPromise = new Promise<any>((resolve, reject) => {
            busboy.on("field", (name, value) => {
                fields[name] = value;
            });

            busboy.on("file", async (name, file, info) => {
                fileMimeType = info.mimeType;
                fileName = info.filename;

                const title = fields.title || fileName;
                const folderId = fields.folderId;

                const fileMetadata = {
                    name: title ? `${title}.${fileName.split('.').pop()}` : fileName,
                    mimeType: fileMimeType,
                    parents: folderId ? [folderId] : [],
                };

                try {
                    // 1. Initiate Resumable Upload Session
                    const initiateResponse = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${tokens.access_token}`,
                            "Content-Type": "application/json",
                            "X-Upload-Content-Type": fileMimeType,
                        },
                        body: JSON.stringify(fileMetadata),
                    });

                    if (!initiateResponse.ok) {
                        throw new Error(`Failed to initiate upload: ${initiateResponse.statusText}`);
                    }

                    const uploadUrl = initiateResponse.headers.get("Location");
                    if (!uploadUrl) {
                        throw new Error("No upload location header received");
                    }

                    // 2. Stream file content to the upload URL
                    // Convert Node stream to Web stream for fetch
                    // @ts-ignore
                    const webStream = Readable.toWeb(file);

                    const uploadResponse = await fetch(uploadUrl, {
                        method: "PUT",
                        headers: {
                            "Content-Type": fileMimeType,
                        },
                        // @ts-ignore
                        body: webStream,
                        duplex: 'half'
                    });

                    if (!uploadResponse.ok) {
                        const errorText = await uploadResponse.text();
                        throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
                    }

                    const result = await uploadResponse.json();
                    resolve(result);

                } catch (err) {
                    reject(err);
                }
            });

            busboy.on("error", (err) => {
                reject(err);
            });

            busboy.on("finish", () => {
                // Wait for file processing
            });
        });

        // Convert Web Stream to Node Stream and pipe to busboy
        // @ts-ignore
        const nodeStream = Readable.fromWeb(req.body);
        nodeStream.pipe(busboy);

        const fileData = await uploadPromise;

        return NextResponse.json({ file: fileData });

    } catch (error: any) {
        console.error("Upload error details:", error);
        const errorMessage = error.message || "Upload failed";
        const status = error.code || 500;
        return NextResponse.json({ error: errorMessage }, { status: status >= 100 && status < 600 ? status : 500 });
    }
}
