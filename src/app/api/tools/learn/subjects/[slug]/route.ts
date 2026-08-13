import { getSubjectDetail } from "@/lib/learn/learn";
import { requirePassword, unauthorized } from "@/lib/learn/http";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!requirePassword(request)) return unauthorized();
  const { slug } = await params;

  try {
    const detail = await getSubjectDetail(slug);
    if (!detail) {
      return Response.json({ error: "Subject not found." }, { status: 404 });
    }
    return Response.json(detail);
  } catch (error) {
    console.error("learn subject GET failed", error);
    return Response.json({ error: "Failed to load subject." }, { status: 500 });
  }
}
