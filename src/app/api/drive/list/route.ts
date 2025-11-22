import { google } from "googleapis";
import { oauth2Client } from "@/lib/google";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const tokensStr = cookieStore.get("google_tokens")?.value;

        if (!tokensStr) {
            return NextResponse.json({ files: [] }); // Return empty files array
        }

        const tokens = JSON.parse(tokensStr);
        oauth2Client.setCredentials(tokens);

        const drive = google.drive({ version: "v3", auth: oauth2Client });

        const { folderId, mimeType } = await req.json();

        let query = "trashed = false";

        if (folderId) {
            query += ` and '${folderId}' in parents`;
        }

        if (mimeType) {
            query += ` and mimeType = '${mimeType}'`;
        }
        // Don't filter by default - return both folders and videos, but exclude JSON metadata files
        query += " and mimeType != 'application/json'";

        const response = await drive.files.list({
            q: query,
            fields: "files(id, name, webViewLink, webContentLink, createdTime, videoMediaMetadata, mimeType, thumbnailLink)",
            orderBy: "createdTime desc",
            pageSize: 50,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });

        // Return raw files, mapping happens in frontend now or we can map here if needed.
        // The frontend expects "files" array based on my previous read of VideoLibrary.tsx
        // Wait, VideoLibrary.tsx expects "files" in the response?
        // Let's check VideoLibrary.tsx again.
        // "const data = await res.json(); if (data.files) { ... }"
        // So yes, it expects { files: [...] }

        return NextResponse.json({ files: response.data.files || [] });
    } catch (error) {
        console.error("List error:", error);
        return NextResponse.json({ files: [] });
    }
}
