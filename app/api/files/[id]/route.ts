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

    const authClient = await auth.getClient() as any;
    console.log('Auth client keys:', Object.keys(authClient));
    console.log('Auth client.credentials:', authClient.credentials);
    const accessToken = authClient.accessToken || authClient.credentials?.access_token;

    if (!accessToken) {
      console.log('No access token found, full authClient:', JSON.stringify(authClient));
      return NextResponse.json({ error: 'No access token' }, { status: 401 });
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${id}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: err }, { status: response.status });
    }

    const headers = new Headers();
    headers.set('Content-Type', 'audio/mp4');
    headers.set('Content-Disposition', `inline; filename="${name}"`);
    headers.set('Cache-Control', 'public, max-age=3600');

    const data = await response.arrayBuffer();

    return new NextResponse(data, { headers });
  } catch (error: any) {
    console.error('Error getting file:', error);
    return NextResponse.json({ error: error.message || 'Failed to get file' }, { status: 500 });
  }
}