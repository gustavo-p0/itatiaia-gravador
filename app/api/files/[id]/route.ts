import { NextResponse } from "next/server";
import { google } from "googleapis";

function getServiceAccountAuth() {
  const credsStr = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}';
  let creds;
  try {
    creds = JSON.parse(credsStr);
  } catch (e) {
    return null;
  }
  if (!creds.client_email || !creds.private_key) {
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
      return NextResponse.json({ error: 'Invalid credentials config' }, { status: 500 });
    }

    const drive = google.drive({ version: 'v3', auth });
    
    const fileResponse = await drive.files.get({
      fileId: id,
      fields: 'name',
    });

    const url = `https://www.googleapis.com/drive/v3/files/${id}?alt=media`;

    return NextResponse.json({ 
      url,
      name: fileResponse.data.name 
    });
  } catch (error: any) {
    console.error('Error getting file URL:', error);
    return NextResponse.json({ error: error.message || 'Failed to get file' }, { status: 500 });
  }
}