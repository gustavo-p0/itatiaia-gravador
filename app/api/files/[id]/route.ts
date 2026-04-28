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

    const fileSize = parseInt(fileResponse.data.size || '0', 10);
    const authClient = await auth.getClient() as any;
    const accessToken = authClient.accessToken || authClient.credentials?.access_token;

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token' }, { status: 401 });
    }

    const rangeHeader = request.headers.get('range');
    let start = 0;
    let end = fileSize - 1;
    let isPartial = false;

    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        start = parseInt(match[1], 10);
        if (match[2]) {
          end = Math.min(parseInt(match[2], 10), fileSize - 1);
        }
        isPartial = true;
      }
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
    };

    if (isPartial) {
      headers['Range'] = `bytes=${start}-${end}`;
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${id}?alt=media`,
      { headers }
    );

    if (!response.ok && response.status !== 206) {
      console.error('Drive error:', response.status);
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    const contentLength = response.headers.get('content-length') || String(fileSize);
    
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'audio/mp4');
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Cache-Control', 'public, max-age=3600');

    if (isPartial) {
      responseHeaders.set('Content-Length', String(end - start + 1));
      responseHeaders.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      
      return new NextResponse(response.body, {
        status: 206,
        headers: responseHeaders,
      });
    }

    responseHeaders.set('Content-Length', contentLength);

    return new NextResponse(response.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('Error getting file:', error);
    return NextResponse.json({ error: error.message || 'Failed to get file' }, { status: 500 });
  }
}