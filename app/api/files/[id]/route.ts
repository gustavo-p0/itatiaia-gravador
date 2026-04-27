import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = JSON.parse(process.env.GDRIVE_ACCESS_TOKEN || '{}');

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials(token);

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const file = await drive.files.get({
      fileId: id,
      fields: 'name',
    });

    const url = `https://www.googleapis.com/drive/v3/files/${id}?alt=media`;

    return NextResponse.json({ 
      url,
      name: file.data.name 
    });
  } catch (error) {
    console.error('Error getting file URL:', error);
    return NextResponse.json({ error: 'Failed to get file' }, { status: 500 });
  }
}