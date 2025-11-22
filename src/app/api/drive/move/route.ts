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
        const { fileId, newParentId } = await req.json();

        if (!fileId || !newParentId) {
            return NextResponse.json({ error: "Missing fileId or newParentId" }, { status: 400 });
        }

        // Get current file to find its parents
        const file = await drive.files.get({
            fileId: fileId,
            fields: "parents",
            supportsAllDrives: true,
        });

        const previousParents = file.data.parents?.join(',') || '';

        // Move file by updating parents
        await drive.files.update({
            fileId: fileId,
            addParents: newParentId,
            removeParents: previousParents,
            fields: "id, parents",
            supportsAllDrives: true,
        });

        // Also try to move the associated metadata file
        try {
            // Get video name to find metadata file
            const videoFile = await drive.files.get({
                fileId: fileId,
                fields: "name",
                supportsAllDrives: true,
            });

            const videoName = videoFile.data.name;
            const metadataFileName = `${videoName}.json`;

            // Search for metadata file in the same previous parent folder
            const parentId = previousParents.split(',')[0]; // Assuming single parent for simplicity
            const escapedFileName = metadataFileName.replace(/'/g, "\\'");
            const metaQuery = `name='${escapedFileName}' and '${parentId}' in parents and trashed=false`;

            const metaFiles = await drive.files.list({
                q: metaQuery,
                fields: "files(id, parents)",
                supportsAllDrives: true,
                includeItemsFromAllDrives: true,
            });

            if (metaFiles.data.files && metaFiles.data.files.length > 0) {
                const metaFile = metaFiles.data.files[0];
                const metaPreviousParents = metaFile.parents?.join(',') || '';

                await drive.files.update({
                    fileId: metaFile.id!,
                    addParents: newParentId,
                    removeParents: metaPreviousParents,
                    fields: "id, parents",
                    supportsAllDrives: true,
                });
                console.log("Moved associated metadata file:", metaFile.id);
            }
        } catch (metaError) {
            console.error("Error moving metadata file (non-fatal):", metaError);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Move error:", error);
        return NextResponse.json({ error: "Move failed" }, { status: 500 });
    }
}
