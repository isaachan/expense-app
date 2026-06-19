import { NextResponse } from "next/server";
import { db, ensureDb, setSession } from "@/lib/db";
import { cookies } from "next/headers";

interface WechatTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  openid: string;
  scope: string;
  unionid?: string;
}

interface WechatUserInfo {
  openid: string;
  nickname: string;
  sex: number;
  province: string;
  city: string;
  country: string;
  headimgurl: string;
  privilege: string[];
  unionid?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", request.url));
  }

  try {
    const appId = process.env.WECHAT_APP_ID;
    const appSecret = process.env.WECHAT_APP_SECRET;

    if (!appId || !appSecret) {
      return NextResponse.redirect(new URL("/?error=not_configured", request.url));
    }

    // Exchange code for access_token + openid
    const tokenRes = await fetch(
      `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`
    );
    const tokenData: WechatTokenResponse = await tokenRes.json();

    if (!tokenData.access_token || !tokenData.openid) {
      console.error("WeChat token error:", tokenData);
      return NextResponse.redirect(new URL("/?error=token_failed", request.url));
    }

    // Get user info
    let nickname = "";
    let avatar = "";
    try {
      const userRes = await fetch(
        `https://api.weixin.qq.com/sns/userinfo?access_token=${tokenData.access_token}&openid=${tokenData.openid}`
      );
      const userData: WechatUserInfo = await userRes.json();
      if (userData.nickname) {
        nickname = userData.nickname;
        avatar = userData.headimgurl || "";
      }
    } catch {
      // User info fetch failed, continue with openid only
    }

    // Check whitelist
    await ensureDb();
    const whitelisted = await db.whitelistUser.findUnique({
      where: { openid: tokenData.openid },
    });

    if (!whitelisted) {
      return NextResponse.redirect(
        new URL(`/?error=not_whitelisted&openid=${tokenData.openid}&nickname=${encodeURIComponent(nickname)}`, request.url)
      );
    }

    // Auto-add user to whitelist if they exist (update nickname/avatar)
    await db.whitelistUser.upsert({
      where: { openid: tokenData.openid },
      update: { nickname, avatar },
      create: { openid: tokenData.openid, nickname, avatar },
    });

    // Create session
    const sessionToken = crypto.randomUUID();
    setSession(sessionToken, { openid: tokenData.openid, nickname, avatar });

    // Set cookie and redirect
    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(new URL("/?error=server_error", request.url));
  }
}