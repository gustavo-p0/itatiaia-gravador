import { NextResponse } from "next/server";

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzyUC-ZhcWUuCBTbnMAVi9YuxUoSCP4cHP0fZ-nUU65Jyooc-z-Hve8Rf1QFnPd86A/exec";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const id = searchParams.get("id");

  try {
    let url = `${APPS_SCRIPT_URL}?action=${action}`;
    if (id) url += `&id=${id}`;

    const response = await fetch(url);
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Proxy failed' }, { status: 500 });
  }
}