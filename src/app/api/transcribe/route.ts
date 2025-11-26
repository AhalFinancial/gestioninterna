import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);

export const maxDuration = 300; // 5 minutes timeout for the route itself

export async function POST(req: Request) {
    let tempFilePath = "";
    let uploadResult = null;

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const language = formData.get("language") as string || "auto";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        console.log(`\n📹 Transcribing file: ${file.name}`);
        console.log(`📊 Size: ${(file.size / (1024 * 1024)).toFixed(2)}MB, Type: ${file.type}`);

        // Save file to temporary directory
        const buffer = Buffer.from(await file.arrayBuffer());
        const tempDir = os.tmpdir();
        const fileName = `upload-${Date.now()}-${file.name}`;
        tempFilePath = path.join(tempDir, fileName);

        await writeFile(tempFilePath, buffer);
        console.log(`💾 Saved to temp file: ${tempFilePath}`);

        // Upload to Gemini
        console.log("🚀 Uploading to Gemini File API...");
        uploadResult = await fileManager.uploadFile(tempFilePath, {
            mimeType: file.type || "video/webm",
            displayName: file.name,
        });

        console.log(`✅ Uploaded to Gemini: ${uploadResult.file.uri}`);

        // Wait for processing to complete
        let fileState = uploadResult.file.state;
        console.log(`⏳ Processing state: ${fileState}`);

        while (fileState === FileState.PROCESSING) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const fileStatus = await fileManager.getFile(uploadResult.file.name);
            fileState = fileStatus.state;
            console.log(`⏳ Processing state: ${fileState}`);
        }

        if (fileState === FileState.FAILED) {
            throw new Error("Video processing failed on Gemini servers.");
        }

        console.log("✅ Video processing complete. Generating transcript...");

        const prompt = `Transcribe this video accurately. The audio may be in Spanish or English. 
Generate a timestamped transcript as a JSON array with objects containing:
- "time": timestamp in MM:SS format
- "text": the spoken text
- "language": detected language code (es/en)

Be very accurate with the transcription. Listen carefully to what is actually being said.
Return ONLY the JSON array, no additional text or markdown.`;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent([
            prompt,
            {
                fileData: {
                    fileUri: uploadResult.file.uri,
                    mimeType: uploadResult.file.mimeType,
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();

        console.log("✅ Received response from Gemini");

        // Clean up markdown code blocks if present
        const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
            const transcript = JSON.parse(cleanJson);
            console.log(`✅ Transcript parsed successfully: ${transcript.length} segments`);
            return NextResponse.json({ transcript });
        } catch (e) {
            console.error("❌ Failed to parse JSON:", text.substring(0, 200));
            throw new Error("Failed to parse transcript JSON");
        }

    } catch (error: any) {
        console.error("\n=== ❌ TRANSCRIPTION ERROR ===");
        console.error("Error:", error);

        return NextResponse.json({
            error: "Failed to transcribe",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });

    } finally {
        // Cleanup
        try {
            if (tempFilePath) {
                await unlink(tempFilePath).catch(() => { }); // Ignore error if file doesn't exist
                console.log("🧹 Deleted temp file");
            }
            if (uploadResult) {
                await fileManager.deleteFile(uploadResult.file.name).catch(() => { });
                console.log("🧹 Deleted remote file from Gemini");
            }
        } catch (cleanupError) {
            console.error("Cleanup error:", cleanupError);
        }
    }
}
