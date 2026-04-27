import { NextResponse } from "next/server";
import { google } from "googleapis";

function getServiceAccountAuth() {
  const credsStr = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!credsStr) return null;
  let creds;
  try {
    creds = JSON.parse(credsStr);
  } catch (e) {
    return null;
  }
  if (!creds.client_email || !creds.private_key) return null;
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
      fields: 'name,mimeType,size',
    });

    const name = fileResponse.data.name || 'audio';
    const fileSize = parseInt(fileResponse.data.size || '0', 10);

    const authClient = await auth.getClient() as any;
    const accessToken = authClient.accessToken || authClient.credentials?.access_token;

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token' }, { status: 401 });
    }

    const rangeHeader = request.headers.get('range') ?? 'bytes=0-';

    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${id}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Range: rangeHeader,
        },
      }
    );

    const headers = new Headers();
    headers.set('Content-Type', driveRes.headers.get('Content-Type') ?? 'audio/aac');
    headers.set('Accept-Ranges', 'bytes');

    const contentRange = driveRes.headers.get('Content-Range');
    if (contentRange) headers.set('Content-Range', contentRange);

    const contentLength = driveRes.headers.get('Content-Length');
    if (contentLength) headers.set('Content-Length', contentLength);

    return new NextResponse(driveRes.body, {
      status: driveRes.status,
      headers,
    });
  } catch (error: any) {
    console.error('Error getting file:', error);
    return NextResponse.json({ error: error.message || 'Failed to get file' }, { status: 500 });
  }
}