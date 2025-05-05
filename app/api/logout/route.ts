import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const url: URL = new URL('/', request.url);
    const res: NextResponse = NextResponse.redirect(url)
    res.cookies.delete('token')
    return res
  }