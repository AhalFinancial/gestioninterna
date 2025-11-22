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

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const folderId = formData.get("folderId") as string;
        const title = formData.get("title") as string;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        const fileMetadata: any = {
            name: title || `Ahal Clip - ${new Date().toLocaleString()}`,
            mimeType: "video/webm",
        };

        if (folderId) {
            fileMetadata.parents = [folderId];
        }

        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: {
                mimeType: "video/webm",
                body: stream,
            },
            fields: "id, name, webViewLink, webContentLink",
        });

        return NextResponse.json({ file: response.data });
    } catch (error: any) {
        console.error("Upload error details:", {
            message: error.message,
            stack: error.stack,
            response: error.response?.data
        });

        // Return specific error message if available
        const errorMessage = error.response?.data?.error?.message || error.message || "Upload failed";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
