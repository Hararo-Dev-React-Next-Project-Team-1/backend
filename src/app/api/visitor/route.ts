import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
  

export async function GET(req: NextRequest) {
  const visitorCookie = await cookies();
  const visitorId = visitorCookie.get('visitor_id')?.value; // 기존 쿠키 있는지 확인

  // 기존 Visitor ID 쿠키가 없으면 새로 생성
  if (!visitorId) {
    const newVisitorId = uuidv4();

    // Visitor ID 쿠키 설정 (session 쿠키로 만료일 설정 X)
    visitorCookie.set('visitor_id', newVisitorId, {
      httpOnly: true, // 클라이언트에서 접근 불가 (보안)
      secure: process.env.NODE_ENV === 'production', // HTTPS 에서만 전송
    //   maxAge: 60 * 60 * 24 * 365, // 예: 1년 유효
      path: '/', // 모든 경로에서 쿠키 사용
      sameSite: 'lax', // CSRF 방지
    });

    // console.log('새로운 Visitor');
    return NextResponse.json(
        { message: 'New Visitor'},
        { status: 201 } 
    );
  } else {
    // console.log('기존 Visitor');
    return NextResponse.json(
        { message: 'Existing Visitor'},
        { status: 200 }
    );
  }
}




