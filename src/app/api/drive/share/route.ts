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
        const { fileId } = await req.json();

        if (!fileId) {
            return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
        }

        // Check if file is already shared
        const existingPermissions = await drive.permissions.list({
            fileId: fileId,
            fields: "permissions(id, type, role)",
            supportsAllDrives: true,
        });

        // Check if "anyone with link" permission already exists
        const hasPublicPermission = existingPermissions.data.permissions?.some(
            (p) => p.type === "anyone"
        );

        if (hasPublicPermission) {
            console.log("File is already publicly shared");
            return NextResponse.json({
                success: true,
                alreadyShared: true,
                message: "File is already shared with anyone who has the link"
            });
        }

        // Create permission for "anyone with the link can view"
        await drive.permissions.create({
            fileId: fileId,
            supportsAllDrives: true,
            requestBody: {
                role: "reader",
                type: "anyone",
            },
        });

        console.log(`Successfully shared file ${fileId} with anyone who has the link`);

        return NextResponse.json({
            success: true,
            message: "File is now shared with anyone who has the link"
        });

    } catch (error: any) {
        console.error("Share file error:", error);

        if (error.code === 401) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }
        if (error.code === 403) {
            return NextResponse.json({ error: "Permission denied. You may not have permission to share this file." }, { status: 403 });
        }
        if (error.code === 404) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        return NextResponse.json({
            error: "Failed to share file",
            details: error.message
        }, { status: 500 });
    }
}
