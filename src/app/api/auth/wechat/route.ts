import { NextResponse } from "next/server";

export async function GET() {
  const appId = process.env.WECHAT_APP_ID;
  if (!appId) {
    return NextResponse.json({ error: "WeChat AppID not configured" }, { status: 500 });
  }

  const redirectUri = encodeURIComponent(process.env.WECHAT_REDIRECT_URI || `${process.env.VERCEL_URL || "http://localhost:3000"}/api/auth/wechat/callback`);
  const state = crypto.randomUUID?.() || Math.random().toString(36).slice(2);

  // WeChat Open Platform QR code login
  const authUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`;

  return NextResponse.json({ url: authUrl, state });
}