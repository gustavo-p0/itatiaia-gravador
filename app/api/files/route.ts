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

export async function GET() {
  try {
    const auth = getServiceAccountAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Invalid credentials config' }, { status: 500 });
    }
    
    const drive = google.drive({ version: 'v3', auth });
    const folderId = '1kByEbTVDBijyihxl2BNBN1sTFK8be8e4';

    const response = await drive.files.list({
      q: `'${folderId}' in parents and name contains '.aac'`,
      fields: 'files(id,name,createdTime,size)',
      orderBy: 'createdTime desc',
    });

    return NextResponse.json({ files: response.data.files || [] });
  } catch (error: any) {
    console.error('Error listing files:', error);
    return NextResponse.json({ error: error.message || 'Failed to list files' }, { status: 500 });
  }
}