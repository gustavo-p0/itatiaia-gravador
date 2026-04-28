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

    const url = `https://www.googleapis.com/drive/v3/files/${id}?alt=media`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
    };

    const range = request.headers.get('range');
    let start = 0;
    let end = fileSize - 1;
    let isPartial = false;

    if (range) {
      const rangeMatch = range.match(/bytes=(\d+)-(\d*)/);
      if (rangeMatch) {
        start = parseInt(rangeMatch[1], 10);
        if (rangeMatch[2]) {
          end = Math.min(parseInt(rangeMatch[2], 10), fileSize - 1);
        }
        if (start > 0 || end < fileSize - 1) {
          isPartial = true;
        }
        headers['Range'] = `bytes=${start}-${end}`;
      }
    }

    const response = await fetch(url, { headers });

    if (!response.ok && response.status !== 206) {
      console.error('Drive response:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to fetch audio' }, { status: 500 });
    }

    const stream = response.body;
    if (!stream) {
      return NextResponse.json({ error: 'Empty response' }, { status: 500 });
    }

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'audio/mp4');
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Cache-Control', 'public, max-age=3600');

    const actualSize = response.headers.get('content-length');
    if (actualSize) {
      responseHeaders.set('Content-Length', actualSize);
    }

    if (isPartial) {
      responseHeaders.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      return new NextResponse(stream as any, {
        status: 206,
        headers: responseHeaders,
      });
    }

    if (actualSize) {
      responseHeaders.set('Content-Length', actualSize);
    } else {
      responseHeaders.set('Content-Length', fileSize.toString());
    }

    return new NextResponse(stream as any, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('Error getting file:', error);
    return NextResponse.json({ error: error.message || 'Failed to get file' }, { status: 500 });
  }
}