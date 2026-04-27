import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.AUDD_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('file') as Blob | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const auddFormData = new FormData();
    auddFormData.append('file', audioFile);
    auddFormData.append('api_token', apiKey);

    const response = await fetch('https://api.audd.io/', {
      method: 'POST',
      body: auddFormData,
    });

    const data = await response.json();

    if (data.result) {
      return NextResponse.json({
        success: true,
        song: {
          title: data.result.title,
          artist: data.result.artist,
          album: data.result.album || null,
          releaseDate: data.result.release_date || null,
          spotify: data.result.spotify || null,
          appleMusic: data.result.apple_music || null,
        }
      });
    }

    return NextResponse.json({ success: false, error: 'No match found' });
  } catch (error: any) {
    console.error('Recognition error:', error);
    return NextResponse.json({ error: error.message || 'Failed to recognize' }, { status: 500 });
  }
}