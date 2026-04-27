import { NextResponse } from "next/server";
import { google } from "googleapis";

function getServiceAccountAuth() {
  const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
  return new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = getServiceAccountAuth();
    const authClient = await auth.getClient() as any;
    const accessToken = authClient.credentials?.access_token;

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token' }, { status: 401 });
    }

    const fileResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${id}?fields=name`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const fileData = await fileResponse.json();

    if (fileData.error) {
      return NextResponse.json({ error: fileData.error.message || 'API error' }, { status: 500 });
    }

    const url = `https://www.googleapis.com/drive/v3/files/${id}?alt=media`;

    return NextResponse.json({ 
      url,
      name: fileData.name 
    });
  } catch (error) {
    console.error('Error getting file URL:', error);
    return NextResponse.json({ error: 'Failed to get file' }, { status: 500 });
  }
}