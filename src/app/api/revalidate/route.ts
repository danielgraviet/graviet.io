import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

interface SanityWebhookPayload {
  _type: string;
  slug?: { current: string };
}

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  try {
    const body: SanityWebhookPayload = await request.json();

    if (body._type === "post") {
      revalidatePath("/blog");

      if (body.slug?.current) {
        revalidatePath(`/blog/${body.slug.current}`);
      }
    }

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch {
    return NextResponse.json(
      { message: "Error revalidating" },
      { status: 500 },
    );
  }
}
