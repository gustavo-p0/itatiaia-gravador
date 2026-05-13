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

    const authClient = await auth.getClient();
    const accessToken = (await authClient.getAccessToken())?.token;
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token' }, { status: 401 });
    }

    // Fetch metadata first for proper Content-Type and size
    const drive = google.drive({ version: 'v3', auth });
    const metaResponse = await drive.files.get({
      fileId: id,
      fields: 'name,mimeType,size',
    });

    const mimeType = metaResponse.data.mimeType || 'audio/aac';
    const fileSize = parseInt(metaResponse.data.size || '0', 10);

    // Pass Range header from client to Google Drive
    const rangeHeader = request.headers.get('Range');
    const driveHeaders: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
    };
    if (rangeHeader) {
      driveHeaders['Range'] = rangeHeader;
    }

    const driveUrl = `https://www.googleapis.com/drive/v3/files/${id}?alt=media`;
    const driveResponse = await fetch(driveUrl, { headers: driveHeaders });

    if (!driveResponse.ok) {
      console.error('Drive error:', driveResponse.status, driveResponse.statusText);
      return NextResponse.json({ error: 'Failed to fetch audio' }, { status: 500 });
    }

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', mimeType);
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Cache-Control', 'public, max-age=3600');

    // Handle partial content (206) from Google Drive
    if (driveResponse.headers.get('Content-Range')) {
      responseHeaders.set('Content-Range', driveResponse.headers.get('Content-Range')!);
      responseHeaders.set('Content-Length', driveResponse.headers.get('Content-Length') || '0');
      return new NextResponse(driveResponse.body, {
        status: 206,
        headers: responseHeaders,
      });
    }

    // Full content (200)
    responseHeaders.set('Content-Length', fileSize.toString());
    return new NextResponse(driveResponse.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('Error getting file:', error);
    return NextResponse.json({ error: error.message || 'Failed to get file' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';