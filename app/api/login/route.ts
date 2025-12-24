import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "jkct_auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { password } = body as { password?: string };

    const envPassword = process.env.PASSWORD;

    if (!envPassword) {
      return NextResponse.json(
        {
          error: "Authentication not configured",
          message: "The PASSWORD environment variable is not set on the server.",
        },
        { status: 500 }
      );
    }

    if (!password || password !== envPassword) {
      return NextResponse.json(
        {
          error: "Invalid password",
          message: "The password you entered is incorrect.",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(AUTH_COOKIE_NAME, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        error: "Login failed",
        message: "An unexpected error occurred while logging in.",
      },
      { status: 500 }
    );
  }
}


