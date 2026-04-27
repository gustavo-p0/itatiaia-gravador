import { NextResponse } from "next/server";
import { google } from "googleapis";

function getServiceAccountAuth() {
  const credsStr = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!credsStr) {
    console.error('GOOGLE_SERVICE_ACCOUNT_KEY not set');
    return null;
  }
  let creds;
  try {
    creds = JSON.parse(credsStr);
  } catch (e) {
    console.error('Failed to parse credentials:', e);
    return null;
  }
  if (!creds.client_email || !creds.private_key) {
    console.error('Missing client_email or private_key');
    return null;
  }
  return new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = getServiceAccountAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Credentials not configured' }, { status: 500 });
    }

    const drive = google.drive({ version: 'v3', auth });
    
    const fileResponse = await drive.files.get({
      fileId: id,
      fields: 'name,mimeType',
    });

    const name = fileResponse.data.name || 'audio';

    const mediaResponse = await drive.files.get({
      fileId: id,
      alt: 'media',
    }, {
      responseType: 'stream',
    });

    const headers = new Headers();
    headers.set('Content-Type', 'audio/aac');
    headers.set('Content-Disposition', `inline; filename="${name}"`);

    return new NextResponse(mediaResponse.data as any, { headers });
  } catch (error: any) {
    console.error('Error getting file URL:', error);
    return NextResponse.json({ error: error.message || 'Failed to get file' }, { status: 500 });
  }
}