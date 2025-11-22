import { oauth2Client } from "@/lib/google";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const { code, redirectUri } = await req.json();
        
        if (!code) {
            console.error("No authorization code provided");
            return NextResponse.json({ error: "No authorization code provided" }, { status: 400 });
        }

        // Verify environment variables are set
        if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            console.error("Missing Google OAuth credentials");
            return NextResponse.json({ error: "OAuth credentials not configured" }, { status: 500 });
        }

        // If redirectUri is provided, set it in the client
        if (redirectUri) {
            console.log("Using custom redirect URI:", redirectUri);
            oauth2Client.redirectUri = redirectUri;
        } else {
            console.log("Using default redirect URI from config");
        }

        console.log("Exchanging authorization code for tokens...");
        const { tokens } = await oauth2Client.getToken(code);
        console.log("Tokens received successfully");

        oauth2Client.setCredentials(tokens);

        // Store tokens in HTTP-only cookie
        const cookieStore = await cookies();
        cookieStore.set("google_tokens", JSON.stringify(tokens), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Auth error details:", {
            message: error.message,
            code: error.code,
            response: error.response?.data,
        });
        return NextResponse.json({ 
            error: "Authentication failed",
            details: error.message 
        }, { status: 500 });
    }
}
