import { google } from "googleapis";
import { oauth2Client } from "@/lib/google";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Readable } from "stream";

export const maxDuration = 300; // 5 minutes

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

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const folderId = formData.get("folderId") as string;
        const title = formData.get("title") as string;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Convert Web Stream to Node Stream to avoid buffering entire file in memory again
        // @ts-ignore - Readable.fromWeb is available in Node 16+
        const stream = Readable.fromWeb(file.stream());

        const fileMetadata: any = {
            name: title ? `${title}.${file.name.split('.').pop()}` : file.name,
            mimeType: file.type || "video/mp4",
            parents: folderId ? [folderId] : [],
        };

        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: {
                mimeType: file.type || "video/mp4",
                body: stream,
            },
            fields: "id, name, webViewLink, webContentLink",
        });

        return NextResponse.json({ file: response.data });
    } catch (error: any) {
        console.error("Upload error details:", error);

        // Return specific error message
        const errorMessage = error.message || "Upload failed";
        const status = error.code || 500;
        return NextResponse.json({ error: errorMessage }, { status: status >= 100 && status < 600 ? status : 500 });
    }
}
