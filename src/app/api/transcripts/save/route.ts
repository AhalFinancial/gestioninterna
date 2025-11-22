import { google } from "googleapis";
import { oauth2Client } from "@/lib/google";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Readable } from "stream";

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
        const { videoId, transcript, videoName } = await req.json();

        if (!videoId || !transcript) {
            return NextResponse.json({ error: "Missing videoId or transcript" }, { status: 400 });
        }

        // Get video file to find its parent folder
        const videoFile = await drive.files.get({
            fileId: videoId,
            fields: "parents",
            supportsAllDrives: true,
        });

        const parentId = videoFile.data.parents?.[0];

        // Create JSON content
        const jsonContent = JSON.stringify(transcript, null, 2);
        const buffer = Buffer.from(jsonContent);
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        const fileMetadata: any = {
            name: `${videoName || 'transcript'}_transcript.json`,
            mimeType: "application/json",
        };

        if (parentId) {
            fileMetadata.parents = [parentId];
        }

        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: {
                mimeType: "application/json",
                body: stream,
            },
            fields: "id, name",
            supportsAllDrives: true,
        });

        return NextResponse.json({ file: response.data });
    } catch (error) {
        console.error("Save transcript error:", error);
        return NextResponse.json({ error: "Failed to save transcript" }, { status: 500 });
    }
}
