import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({ ok: true, message: 'Upload API ready' })
}

export async function POST(req: NextRequest) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET // unsigned preset

    if (!cloudName || !uploadPreset) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing CLOUDINARY_CLOUD_NAME or CLOUDINARY_UPLOAD_PRESET in environment. Create an unsigned preset in Cloudinary Dashboard and set it in .env.',
        },
        { status: 500 },
      )
    }

    const form = await req.formData()
    const file = form.get('file') as File | null
    const folder = (form.get('folder') as string | null) ?? undefined

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    // Forward the file to Cloudinary using unsigned upload
    const cloudForm = new FormData()
    cloudForm.append('file', file)
    cloudForm.append('upload_preset', uploadPreset)
    if (folder) cloudForm.append('folder', folder)

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
      method: 'POST',
      body: cloudForm,
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: data?.error?.message ?? 'Cloudinary upload failed' },
        { status: 502 },
      )
    }

    // Return the important fields
    return NextResponse.json({
      success: true,
      url: data.secure_url as string,
      publicId: data.public_id as string,
      width: data.width as number,
      height: data.height as number,
      format: data.format as string,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Upload failed' },
      { status: 500 },
    )
  }
}
