import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const language = formData.get("language") as string || "auto";
        const chunkIndex = formData.get("chunkIndex") as string;
        const totalChunks = formData.get("totalChunks") as string;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const chunkInfo = chunkIndex ? ` (chunk ${parseInt(chunkIndex) + 1}/${totalChunks})` : "";
        console.log(`\n📹 Transcribing file: ${file.name}${chunkInfo}`);
        console.log(`📊 Size: ${(file.size / (1024 * 1024)).toFixed(2)}MB, Type: ${file.type}`);

        // Check file size (Gemini API has ~20MB limit for inline data)
        const MAX_SIZE = 20 * 1024 * 1024; // 20MB
        if (file.size > MAX_SIZE) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            console.error(`❌ File too large: ${sizeMB}MB (max: 20MB)`);
            return NextResponse.json({
                error: "File too large",
                details: `File size is ${sizeMB}MB. Maximum supported size is 20MB. Please use a shorter video.`
            }, { status: 400 });
        }

        // Convert file to base64
        console.log("🔄 Converting to base64...");
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString("base64");
        console.log(`✅ Base64 size: ${(base64.length / (1024 * 1024)).toFixed(2)}MB`);

        const prompt = `Transcribe this ${file.type.startsWith('audio/') ? 'audio' : 'video'} accurately. The audio may be in Spanish or English. 
Generate a timestamped transcript as a JSON array with objects containing:
- "time": timestamp in MM:SS format
- "text": the spoken text
- "language": detected language code (es/en)

Be very accurate with the transcription. Listen carefully to what is actually being said.
Return ONLY the JSON array, no additional text or markdown.`;

        const models = ["gemini-2.5-flash", "gemini-1.5-flash"];
        let lastError;

        for (const modelName of models) {
            console.log(`\n🤖 Using Gemini model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const maxRetries = 2; // Reduced retries per model since we have multiple models

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`🚀 Sending to Gemini API (${modelName}, Attempt ${attempt}/${maxRetries})...`);

                    const result = await model.generateContent([
                        prompt,
                        {
                            inlineData: {
                                data: base64,
                                mimeType: file.type || (file.name.endsWith('.webm') ? "audio/webm" : "video/webm"),
                            },
                        },
                    ]);

                    const response = await result.response;
                    const text = response.text();

                    console.log(`✅ Received response from Gemini (${modelName})`);

                    // Clean up markdown code blocks if present
                    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();

                    try {
                        const transcript = JSON.parse(cleanJson);
                        console.log(`✅ Transcript parsed successfully: ${transcript.length} segments`);
                        return NextResponse.json({ transcript });
                    } catch (e) {
                        console.error(`❌ Failed to parse JSON from ${modelName}:`, text.substring(0, 200));
                        // If JSON parsing fails, it might be the model's fault, try next model? 
                        // Or maybe just throw to retry? 
                        // Let's throw to trigger retry or next model
                        throw new Error("JSON parse error");
                    }
                } catch (error: any) {
                    lastError = error;

                    console.error(`\n=== ❌ TRANSCRIPTION ERROR (${modelName}, Attempt ${attempt}/${maxRetries}) ===`);
                    console.error("Error message:", error.message);

                    const is500Error = error.message?.includes("500") || error.message?.includes("Internal");

                    if (is500Error && attempt < maxRetries) {
                        const waitTime = 1000 * attempt;
                        console.log(`🔄 500 error detected, retrying in ${waitTime}ms...`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        continue;
                    }

                    // If it's not a 500 error, or we ran out of retries for this model, break inner loop to try next model
                    break;
                }
            }
        }

        // If we get here, all models failed
        if (lastError) throw lastError;

        throw lastError;

    } catch (error: any) {
        console.error("\n=== ❌ FINAL TRANSCRIPTION ERROR ===");
        console.error("Error:", error);
        console.error("=== END ===\n");

        return NextResponse.json({
            error: "Failed to transcribe",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
