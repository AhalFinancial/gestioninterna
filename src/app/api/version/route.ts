import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Read package.json from the project root
        const packageJsonPath = join(process.cwd(), "package.json");
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

        const versionInfo = {
            name: packageJson.name,
            version: packageJson.version,
            environment: process.env.NODE_ENV || "development",
            timestamp: new Date().toISOString(),
            nodeVersion: process.version,
        };

        return NextResponse.json(versionInfo, {
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store, no-cache, must-revalidate",
            },
        });
    } catch (error) {
        console.error("Version endpoint error:", error);
        return NextResponse.json(
            { error: "Failed to retrieve version information" },
            { status: 500 }
        );
    }
}

