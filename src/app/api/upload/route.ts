import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { uploadImage } from '@/lib/cloudinaryUpload';

interface JWTPayload {
  userId: string;
  userType: 'seller' | 'buyer';
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const url = new URL(request.url);
    const folder = url.searchParams.get('folder') || 'scraplink'; 

    if (folder !== 'profiles') {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const token = authHeader.substring(7);
      jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    const imageUrl = await uploadImage(file, folder); 

    return NextResponse.json({ url: imageUrl }, { status: 200 }); 
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};