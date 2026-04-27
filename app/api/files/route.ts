import { NextResponse } from "next/server";
import { google } from "googleapis";

const FOLDER_ID = '1kByEbTVDBijyihxl2BNBN1sTFK8be8e4';

export async function GET() {
  try {
    const token = JSON.parse(process.env.GDRIVE_ACCESS_TOKEN || '{}');
    const accessToken = token.access_token;

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token' }, { status: 401 });
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents+and+name+contains+'.aac'&fields=files(id,name,createdTime,size)&orderBy=createdTime+desc&pageSize=100`,
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

    const files = (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      createdTime: f.createdTime,
      size: f.size ? parseInt(f.size, 10) : null,
    }));

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}