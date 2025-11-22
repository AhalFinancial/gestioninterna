import { oauth2Client } from "@/lib/google";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const { code } = await req.json();
        const { tokens } = await oauth2Client.getToken(code);

        oauth2Client.setCredentials(tokens);

        // Store tokens in HTTP-only cookie
        const cookieStore = await cookies();
        cookieStore.set("google_tokens", JSON.stringify(tokens), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Auth error:", error);
        return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
    }
}
