import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { connectDB } from "@/lib/db/connection";
import { Profile } from "@/lib/db/models";
import { moderatePhoto } from "@/lib/security/photo-moderation";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PHOTOS_PER_USER = 10;
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

// Magic byte signatures for image formats
const MAGIC_BYTES: { ext: string; bytes: number[]; offset?: number }[] = [
  { ext: "jpg", bytes: [0xff, 0xd8, 0xff] },
  { ext: "png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { ext: "webp", bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // "RIFF" then check "WEBP" at offset 8
];

function validateMagicBytes(buffer: Buffer): boolean {
  for (const sig of MAGIC_BYTES) {
    const offset = sig.offset ?? 0;
    const match = sig.bytes.every((b, i) => buffer[offset + i] === b);
    if (match) {
      // Extra check for WEBP: bytes 8-11 must be "WEBP"
      if (sig.ext === "webp") {
        const webpTag = buffer.slice(8, 12).toString("ascii");
        if (webpTag === "WEBP") return true;
        continue;
      }
      return true;
    }
  }
  return false;
}

function sanitizeExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return ALLOWED_EXTENSIONS.has(ext) ? ext : "jpg";
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Check existing photo count
    await connectDB();
    const profile = await Profile.findOne({ userId: session.user.id })
      .select("photos")
      .lean();
    const existingCount = (profile as any)?.photos?.length || 0;

    if (existingCount >= MAX_PHOTOS_PER_USER) {
      return NextResponse.json(
        { error: `Maximum ${MAX_PHOTOS_PER_USER} photos allowed. Please remove some before uploading.` },
        { status: 400 }
      );
    }

    const allowedCount = MAX_PHOTOS_PER_USER - existingCount;
    const skipped: string[] = [];
    const uploaded: { url: string; fileName: string }[] = [];

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    for (const file of files.slice(0, allowedCount)) {
      // Validate MIME type
      if (!file.type.startsWith("image/")) {
        skipped.push(`${file.name}: not an image file`);
        continue;
      }

      // Validate extension
      const ext = sanitizeExtension(file.name);
      if (!ALLOWED_EXTENSIONS.has(ext) && ext === "jpg") {
        const originalExt = file.name.split(".").pop()?.toLowerCase() || "";
        if (!ALLOWED_EXTENSIONS.has(originalExt)) {
          skipped.push(`${file.name}: unsupported format (use JPG, PNG, or WebP)`);
          continue;
        }
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        skipped.push(`${file.name}: exceeds 5MB limit`);
        continue;
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Validate magic bytes (actual file content)
      if (!validateMagicBytes(buffer)) {
        skipped.push(`${file.name}: file content does not match an image format`);
        continue;
      }

      // NSFW / photo moderation check
      const modResult = await moderatePhoto({ fileName: file.name, fileSize: file.size, buffer });
      if (!modResult.approved) {
        skipped.push(`${file.name}: photo rejected by content policy`);
        console.warn(`[PhotoMod] Rejected upload from ${session.user.id}: ${file.name} — ${modResult.reason}`);
        continue;
      }
      if (modResult.requiresReview) {
        console.info(`[PhotoMod] Photo queued for review: user=${session.user.id} file=${file.name}`);
      }

      // Generate safe filename (no user-supplied characters)
      const fileName = `${session.user.id}_${randomUUID()}.${ext}`;
      const filePath = join(uploadDir, fileName);

      await writeFile(filePath, buffer);

      uploaded.push({
        url: `/uploads/${fileName}`,
        fileName,
      });
    }

    if (uploaded.length === 0) {
      return NextResponse.json(
        {
          error: "No valid image files uploaded.",
          skipped,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      files: uploaded,
      ...(skipped.length > 0 && { skipped }),
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
