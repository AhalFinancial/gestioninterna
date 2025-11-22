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
        const { videoId, metadata } = await req.json();

        if (!videoId || !metadata) {
            return NextResponse.json({ error: "Missing videoId or metadata" }, { status: 400 });
        }

        // Get video file info to find its name and parent folder
        const videoFile = await drive.files.get({
            fileId: videoId,
            fields: "name, parents",
            supportsAllDrives: true,
        });

        const videoName = videoFile.data.name || "video";
        const parentFolder = videoFile.data.parents?.[0];
        const metadataFileName = `${videoName}.json`;

        // Search for existing metadata file
        const escapedFileName = metadataFileName.replace(/'/g, "\\'");
        const searchQuery = `name='${escapedFileName}' and '${parentFolder}' in parents and trashed=false`;
        const existingFiles = await drive.files.list({
            q: searchQuery,
            fields: "files(id, name)",
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        });

        const metadataContent = JSON.stringify({
            videoId,
            videoName,
            ...metadata,
            lastModified: new Date().toISOString(),
        }, null, 2);

        let metadataFileId;

        if (existingFiles.data.files && existingFiles.data.files.length > 0) {
            // Update existing metadata file
            metadataFileId = existingFiles.data.files[0].id!;

            // Fetch existing content first to merge
            try {
                const existingContentRes = await drive.files.get({
                    fileId: metadataFileId,
                    alt: "media",
                    supportsAllDrives: true,
                }, { responseType: "text" });

                const existingMetadata = JSON.parse(existingContentRes.data as string);

                // Merge existing metadata with new metadata
                const mergedMetadata = {
                    ...existingMetadata,
                    ...metadata,
                    videoId, // Ensure these are always correct
                    videoName,
                    lastModified: new Date().toISOString(),
                };

                const mergedContent = JSON.stringify(mergedMetadata, null, 2);

                await drive.files.update({
                    fileId: metadataFileId,
                    media: {
                        mimeType: "application/json",
                        body: mergedContent,
                    },
                    supportsAllDrives: true,
                });
                console.log("Updated metadata file (merged):", metadataFileId);
            } catch (readError) {
                console.error("Error reading existing metadata for merge:", readError);
                // Fallback to overwrite if read fails (should be rare)
                await drive.files.update({
                    fileId: metadataFileId,
                    media: {
                        mimeType: "application/json",
                        body: metadataContent,
                    },
                    supportsAllDrives: true,
                });
                console.log("Updated metadata file (overwrite fallback):", metadataFileId);
            }
        } else {
            // Create new metadata file
            const fileMetadata = {
                name: metadataFileName,
                parents: [parentFolder!],
                mimeType: "application/json",
            };

            const media = {
                mimeType: "application/json",
                body: metadataContent,
            };

            const response = await drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: "id",
                supportsAllDrives: true,
            });

            metadataFileId = response.data.id!;
            console.log("Created metadata file:", metadataFileId);
        }

        return NextResponse.json({
            success: true,
            metadataFileId,
            message: "Metadata saved successfully"
        });

    } catch (error) {
        console.error("Save metadata error:", error);
        return NextResponse.json({ error: "Failed to save metadata" }, { status: 500 });
    }
}
