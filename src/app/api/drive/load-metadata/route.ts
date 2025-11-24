import { google } from "googleapis";
import { oauth2Client } from "@/lib/google";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

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
        const { videoId } = await req.json();

        if (!videoId) {
            return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
        }

        // Get video file info
        const videoFile = await drive.files.get({
            fileId: videoId,
            fields: "name, parents",
            supportsAllDrives: true,
        });

        const videoName = videoFile.data.name || "video";
        const parentFolder = videoFile.data.parents?.[0];
        const metadataFileName = `${videoName}.json`;

        // Search for metadata file
        const escapedFileName = metadataFileName.replace(/'/g, "\\'");
        const searchQuery = `name='${escapedFileName}' and '${parentFolder}' in parents and trashed=false`;
        const existingFiles = await drive.files.list({
            q: searchQuery,
            fields: "files(id, name)",
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });

        if (!existingFiles.data.files || existingFiles.data.files.length === 0) {
            return NextResponse.json({ metadata: null });
        }

        const metadataFileId = existingFiles.data.files[0].id!;

        // Get metadata file content
        const response = await drive.files.get({
            fileId: metadataFileId,
            alt: "media",
            supportsAllDrives: true,
        }, { responseType: "text" });

        const metadata = JSON.parse(response.data as string);

        return NextResponse.json({ metadata });

    } catch (error: any) {
        console.error("Load metadata error:", error);

        // Handle specific Google API errors
        if (error.code === 401 || (error.errors && error.errors[0]?.reason === 'authError')) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }
        if (error.code === 403) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
        if (error.code === 404) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        return NextResponse.json({ error: "Failed to load metadata" }, { status: 500 });
    }
}
