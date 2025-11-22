import { google } from "googleapis";
import { oauth2Client } from "@/lib/google";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const tokensStr = cookieStore.get("google_tokens")?.value;

        if (!tokensStr) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const tokens = JSON.parse(tokensStr);
        oauth2Client.setCredentials(tokens);

        const drive = google.drive({ version: "v3", auth: oauth2Client });
        const { searchParams } = new URL(req.url);
        const fileId = searchParams.get("fileId");

        if (!fileId) {
            return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
        }

        // Get file content as stream
        const response = await drive.files.get(
            {
                fileId: fileId,
                alt: "media",
                supportsAllDrives: true,
            },
            { responseType: "stream" }
        );

        // Stream the video directly
        const headers = new Headers();
        headers.set("Content-Type", "video/webm");
        headers.set("Accept-Ranges", "bytes");

        return new NextResponse(response.data as any, {
            headers,
        });
    } catch (error) {
        console.error("Stream error:", error);
        return NextResponse.json({ error: "Stream failed" }, { status: 500 });
    }
}
