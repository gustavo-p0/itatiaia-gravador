import { NextResponse } from "next/server";
import { google } from "googleapis";

const FOLDER_ID = '1kByEbTVDBijyihxl2BNBN1sTFK8be8e4';

export async function GET() {
  try {
    const token = JSON.parse(process.env.GDRIVE_ACCESS_TOKEN || '{}');
    
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials(token);

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const response = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and name contains '.aac'`,
      fields: 'files(id, name, createdTime, size)',
      orderBy: 'createdTime desc',
      pageSize: 100,
    });

    const files = (response.data.files || []).map((f) => ({
      id: f.id,
      name: f.name,
      createdTime: f.createdTime,
      size: f.size ? parseInt(f.size as string, 10) : null,
    }));

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}