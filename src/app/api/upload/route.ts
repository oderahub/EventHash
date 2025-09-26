import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Add interface for Cloudinary response
interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  error?: {
    message: string;
  };
}

export async function GET() {
  return NextResponse.json({ ok: true, message: 'Upload API ready' });
}

export async function POST(req: NextRequest) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET; // unsigned preset

    if (!cloudName || !uploadPreset) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing CLOUDINARY_CLOUD_NAME or CLOUDINARY_UPLOAD_PRESET in environment. Create an unsigned preset in Cloudinary Dashboard and set it in .env.',
        },
        { status: 500 },
      );
    }

    const form = await req.formData();
    const file = form.get('file') as File | null;
    const folder = (form.get('folder') as string | null) ?? undefined;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Forward the file to Cloudinary using unsigned upload
    const cloudForm = new FormData();
    cloudForm.append('file', file);
    cloudForm.append('upload_preset', uploadPreset);
    if (folder) cloudForm.append('folder', folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
      method: 'POST',
      body: cloudForm,
    });

    const data: CloudinaryResponse = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data?.error?.message ?? 'Cloudinary upload failed' },
        { status: 502 },
      );
    }

    // Return the important fields
    return NextResponse.json({
      success: true,
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
      format: data.format,
    });
  } catch (error) {
    // Line 62: Replace any with proper error handling
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err?.message ?? 'Upload failed' },
      { status: 500 },
    );
  }
}
