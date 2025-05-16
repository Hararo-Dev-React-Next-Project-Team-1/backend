import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ✨ Next.js 미들웨어 함수 - CORS 헤더 직접 설정 ✨
export async function middleware(req: NextRequest) {
    // NextResponse.next()를 사용하여 다음 미들웨어 또는 라우트 핸들러로 응답 객체 전달
    const res = NextResponse.next();
    
    // ✨ 응답 헤더에 CORS 관련 정보 추가 ✨
    // '*' 대신 허용할 특정 출처를 설정하는 것이 보안상 더 좋음.
    // 여러 출처를 허용해야 한다면 req.headers.get('Origin') 값을 확인해서 동적으로 설정.
    const origin = req.headers.get('Origin') || ''; // 요청 Origin 가져오기
    const allowedOrigins = ['http://localhost:5173']; // ✨ 허용할 출처 목록 ✨
    
    if (allowedOrigins.includes(origin)) {
        res.headers.set('Access-Control-Allow-Origin', origin);
    } else {
        // 허용되지 않은 출처의 경우, CORS 헤더를 설정하지 않거나 기본값으로 둡니다.
        // 브라우저는 Access-Control-Allow-Origin 헤더가 없거나 일치하지 않으면 CORS 에러를 발생시킵니다.
        // res.headers.set('Access-Control-Allow-Origin', 'null'); // 또는 다른 기본값 설정
    }
    
    
    // 허용할 메서드 설정 (실제 API 라우트에서 사용하는 메서드들 포함)
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    // 허용할 요청 헤더 설정 (프론트엔드에서 보낼 수 있는 헤더들 포함)
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    // 자격 증명 (쿠키 등) 포함 요청 허용
    res.headers.set('Access-Control-Allow-Credentials', 'true'); // ✨ 'true'는 문자열이어야 함 ✨
    // Preflight 응답을 브라우저가 캐시할 시간 (초)
    res.headers.set('Access-Control-Max-Age', '86400'); // 예: 24시간
    
    
    // OPTIONS 요청 (Preflight)에 대한 특별 처리
    // middleware.ts에서 OPTIONS 요청을 처리하고 싶다면 여기서 바로 응답을 반환.
    // 이 경우 route.ts 파일에는 OPTIONS 핸들러를 만들 필요가 없음.
    if (req.method === 'OPTIONS') {
        // OPTIONS 요청에 필요한 CORS 헤더들은 위에서 이미 추가되었으므로,
        // 성공 상태 코드 200 (또는 204)와 함께 헤더만 설정된 응답을 바로 반환.
        return NextResponse.json({}, { status: 200, headers: res.headers });
     // 여기서 반환하면 다음 미들웨어 체인이나 라우트 핸들러(route.ts 파일의 OPTIONS 함수)는 실행되지 않음.
  }

  // OPTIONS 요청이 아니면, 수정된 응답 객체를 다음 미들웨어 체인 또는 라우트 핸들러로 전달.
  return res;
}

// ✨ 미들웨어를 적용할 경로 설정 (API 라우트만 대상으로) ✨
export const config = {
  matcher: '/api/:path*', // /api/ 로 시작하는 모든 경로에 미들웨어 적용
};

