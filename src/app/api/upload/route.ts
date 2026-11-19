/**
 * Place at: app/api/upload/route.ts
 *
 * Server-side ImgBB upload so the API key never reaches the browser.
 * Env: NEXT_PUBLIC_IMGBB_API_KEY=your_key   (do NOT prefix with NEXT_PUBLIC_)
 *
 * Note: sign-up happens before the user is logged in, so this route is public.
 * Add rate limiting (e.g. Upstash Ratelimit) before going to production.
 */

import { NextResponse } from "next/server";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  const key = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

  if (!key) {
    return NextResponse.json(
      { error: "Image upload is not configured" },
      { status: 500 },
    );
  }

  try {
    const form = await req.formData();
    const file = form.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Image must be smaller than 5 MB" },
        { status: 413 },
      );
    }

    const body = new FormData();
    body.append("image", file);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
      method: "POST",
      body,
    });

    const data = await res.json();

    if (!res.ok || !data?.data?.url) {
      return NextResponse.json(
        { error: "Image upload failed" },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: data.data.url as string });
  } catch {
    return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
  }
}
