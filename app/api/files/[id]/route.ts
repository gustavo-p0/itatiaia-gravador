import { NextResponse } from "next/server";
import { google } from "googleapis";

function createServiceAccountAuth() {
  const credsStr = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!credsStr) return null;

  try {
    const creds = JSON.parse(credsStr);
    if (!creds.client_email || !creds.private_key) return null;

    return new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
  } catch {
    return null;
  }
}

const MAX_CHUNK_SIZE = 2 * 1024 * 1024;
let cachedAuth: ReturnType<typeof createServiceAccountAuth> | undefined;

function getServiceAccountAuth() {
  if (cachedAuth === undefined) cachedAuth = createServiceAccountAuth();
  return cachedAuth;
}

function getBoundedRange(rangeHeader: string | null, fileSize: number) {
  if (!Number.isSafeInteger(fileSize) || fileSize <= 0) return null;

  if (!rangeHeader) {
    return { start: 0, end: Math.min(fileSize - 1, MAX_CHUNK_SIZE - 1) };
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match || (!match[1] && !match[2])) return null;

  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return null;
    const length = Math.min(suffixLength, MAX_CHUNK_SIZE, fileSize);
    return { start: fileSize - length, end: fileSize - 1 };
  }

  const start = Number(match[1]);
  if (!Number.isSafeInteger(start) || start < 0 || start >= fileSize) return null;

  const requestedEnd = match[2] ? Number(match[2]) : fileSize - 1;
  if (!Number.isSafeInteger(requestedEnd) || requestedEnd < start) return null;

  return {
    start,
    end: Math.min(requestedEnd, start + MAX_CHUNK_SIZE - 1, fileSize - 1),
  };
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

    const drive = google.drive({ version: 'v3', auth });
    const metaResponse = await drive.files.get({
      fileId: id,
      fields: 'mimeType,size',
    });

    const mimeType = metaResponse.data.mimeType || 'audio/mpeg';
    const fileSize = Number(metaResponse.data.size);
    const boundedRange = getBoundedRange(request.headers.get('Range'), fileSize);

    if (!boundedRange) {
      return new NextResponse(null, {
        status: 416,
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Range': Number.isSafeInteger(fileSize) && fileSize > 0
            ? `bytes */${fileSize}`
            : 'bytes */*',
        },
      });
    }

    const driveUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`;
    const driveResponse = await fetch(driveUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Range: `bytes=${boundedRange.start}-${boundedRange.end}`,
      },
      signal: request.signal,
    });

    if (!driveResponse.ok || !driveResponse.body) {
      console.error('Drive error:', driveResponse.status, driveResponse.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch audio' },
        { status: driveResponse.status === 416 ? 416 : 502 }
      );
    }

    const contentRange = driveResponse.headers.get('Content-Range');
    if (!contentRange) {
      await driveResponse.body.cancel();
      console.error('Drive returned an unbounded response');
      return NextResponse.json({ error: 'Invalid Drive response' }, { status: 502 });
    }

    return new NextResponse(driveResponse.body, {
      status: 206,
      headers: {
        'Content-Type': mimeType,
        'Content-Range': contentRange,
        'Content-Length': driveResponse.headers.get('Content-Length') ||
          String(boundedRange.end - boundedRange.start + 1),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return new NextResponse(null, { status: 499 });
    }
    console.error('Error getting file:', error);
    return NextResponse.json({ error: error.message || 'Failed to get file' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';