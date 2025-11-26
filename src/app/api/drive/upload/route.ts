import { google } from "googleapis";
import { oauth2Client } from "@/lib/google";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import Busboy from "busboy";
import { Readable } from "stream";

export const maxDuration = 300; // 5 minutes

// Disable Next.js body parsing to handle the stream manually
// Note: In App Router, we just consume the stream, but we need to ensure we don't access req.formData() or req.json() before this.

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

        const contentType = req.headers.get("content-type");
        if (!contentType || !contentType.includes("multipart/form-data")) {
            return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
        }

        const busboy = Busboy({ headers: { "content-type": contentType } });

        const fields: Record<string, string> = {};
        let fileStream: Readable | null = null;
        let fileMimeType = "video/mp4";
        let fileName = "video.mp4";

        const uploadPromise = new Promise<any>((resolve, reject) => {
            busboy.on("field", (name, value) => {
                fields[name] = value;
            });

            busboy.on("file", (name, file, info) => {
                fileMimeType = info.mimeType;
                fileName = info.filename;
                fileStream = file;

                // We have the file stream. Now we can start the upload to Drive.
                // We assume fields (title, folderId) have been parsed already because we reordered the client to send them first.

                const title = fields.title || fileName;
                const folderId = fields.folderId;

                const fileMetadata: any = {
                    name: title ? `${title}.${fileName.split('.').pop()}` : fileName,
                    mimeType: fileMimeType,
                    parents: folderId ? [folderId] : [],
                };

                drive.files.create({
                    requestBody: fileMetadata,
                    media: {
                        mimeType: fileMimeType,
                        body: file, // Pass the busboy file stream directly
                    },
                    fields: "id, name, webViewLink, webContentLink",
                }).then((response) => {
                    resolve(response.data);
                }).catch((err) => {
                    reject(err);
                });
            });

            busboy.on("error", (err) => {
                reject(err);
            });

            // If no file was found
            busboy.on("finish", () => {
                if (!fileStream) {
                    reject(new Error("No file uploaded"));
                }
            });
        });

        // Convert Web Stream to Node Stream and pipe to busboy
        // @ts-ignore
        const nodeStream = Readable.fromWeb(req.body);
        nodeStream.pipe(busboy);

        const fileData = await uploadPromise;

        return NextResponse.json({ file: fileData });

    } catch (error: any) {
        console.error("Upload error details:", error);
        const errorMessage = error.message || "Upload failed";
        const status = error.code || 500;
        return NextResponse.json({ error: errorMessage }, { status: status >= 100 && status < 600 ? status : 500 });
    }
}
