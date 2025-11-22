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

        // Create a ReadableStream from the node stream
        const stream = new ReadableStream({
            start(controller) {
                response.data.on("data", (chunk: Buffer) => controller.enqueue(chunk));
                response.data.on("end", () => controller.close());
                response.data.on("error", (err: Error) => controller.error(err));
            },
        });

        return new NextResponse(stream, {
            headers: {
                "Content-Type": "video/webm",
                // Add range support headers if needed in future, but basic streaming works
            },
        });
    } catch (error) {
        console.error("Fetch video error:", error);
        return NextResponse.json({ error: "Failed to fetch video" }, { status: 500 });
    }
}
