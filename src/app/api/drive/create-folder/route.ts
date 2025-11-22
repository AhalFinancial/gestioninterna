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
        const { folderName, parentId } = await req.json();

        if (!folderName) {
            return NextResponse.json({ error: "Missing folderName" }, { status: 400 });
        }

        const fileMetadata: any = {
            name: folderName,
            mimeType: "application/vnd.google-apps.folder",
        };

        if (parentId) {
            fileMetadata.parents = [parentId];
        }

        const response = await drive.files.create({
            requestBody: fileMetadata,
            fields: "id, name",
            supportsAllDrives: true,
        });

        return NextResponse.json({ folder: response.data });
    } catch (error) {
        console.error("Create folder error:", error);
        return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
    }
}
