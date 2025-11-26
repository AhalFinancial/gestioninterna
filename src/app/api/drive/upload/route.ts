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
            }
