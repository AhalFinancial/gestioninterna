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
        const { fileId, newName } = await req.json();

        if (!fileId || !newName) {
            return NextResponse.json({ error: "Missing fileId or newName" }, { status: 400 });
        }

        await drive.files.update({
            fileId: fileId,
            requestBody: {
                name: newName,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Rename error:", error);
        return NextResponse.json({ error: "Rename failed" }, { status: 500 });
    }
}
