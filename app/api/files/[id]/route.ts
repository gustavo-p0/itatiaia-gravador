import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = JSON.parse(process.env.GDRIVE_ACCESS_TOKEN || '{}');
    const accessToken = token.access_token;

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token' }, { status: 401 });
    }

    const fileResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${id}?fields=name`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const fileData = await fileResponse.json();

    if (fileData.error) {
      return NextResponse.json({ error: fileData.error.message || 'API error' }, { status: 500 });
    }

    const url = `https://www.googleapis.com/drive/v3/files/${id}?alt=media`;

    return NextResponse.json({ 
      url,
      name: fileData.name 
    });
  } catch (error) {
    console.error('Error getting file URL:', error);
    return NextResponse.json({ error: 'Failed to get file' }, { status: 500 });
  }
}