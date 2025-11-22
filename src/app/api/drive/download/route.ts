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

        // Get file metadata first
        const file = await drive.files.get({
            fileId: fileId,
            fields: "name, mimeType",
            supportsAllDrives: true,
        });

        // Get file content
        const response = await drive.files.get(
            {
                fileId: fileId,
                alt: "media",
                supportsAllDrives: true,
            },
            { responseType: "stream" }
        );

        // Convert stream to buffer
        const chunks: Buffer[] = [];
        for await (const chunk of response.data as any) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": file.data.mimeType || "video/webm",
                "Content-Disposition": `attachment; filename="${file.data.name}"`,
            },
        });
    } catch (error) {
        console.error("Download error:", error);
        return NextResponse.json({ error: "Download failed" }, { status: 500 });
    }
}
