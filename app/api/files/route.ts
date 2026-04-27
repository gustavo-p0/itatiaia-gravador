import { NextResponse } from "next/server";
import { google } from "googleapis";

function getServiceAccountAuth() {
  const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
  return new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
}

export async function GET() {
  try {
    const auth = getServiceAccountAuth();
    const authClient = await auth.getClient() as any;
    const accessToken = authClient.credentials?.access_token;

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token' }, { status: 401 });
    }

    const folderId = '1kByEbTVDBijyihxl2BNBN1sTFK8be8e4';

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+name+contains+'.aac'&fields=files(id,name,createdTime,size)&orderBy=createdTime desc`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message || 'API error' }, { status: 500 });
    }

    return NextResponse.json({ files: data.files || [] });
  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}