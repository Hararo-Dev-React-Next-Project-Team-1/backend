// src/app/api/admin/rooms/route.ts
// 관리자 시점 전체 rooms 목록 조회 (GET)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // 싱글톤 패턴 적용

export async function GET(
    // middleware.ts를 거쳐 전달받은 요청 객체
    req: NextRequest
) {
    // middleware.ts에서 헤더에 visitor-id 값을 설정했으므로 값을 가져와서 확인
    const visitorId = req.headers.get('visitor-id');
    if (visitorId === null || visitorId === undefined) {
        console.error('미들웨어에서 visitorId 헤더가 전달되지 않았습니다');
        return NextResponse.json(
            { message: '내부 서버 오류: visitorId 식별 불가'},
            { status: 500 }
        );
    }

    try {
        //allRooms : Room 객체들의 배열이 반환됨
        const allRooms = await prisma.room.findMany({
            orderBy: { created_at: 'asc' }
        })
    
        //질문들을 map에 담아서 가져옴
        const roomsMap = allRooms.map(room => ({
            room_id: room.id.toString(),
            title: room.title,
            code: room.code.toString(),
            created_at: room.created_at,
        }));
        
        const responseBody = {
            message: '모든 방 목록 조회 성공!',
            count: roomsMap.length.toString(),
            rooms: roomsMap,
        }

        return NextResponse.json(
            responseBody,
            { status: 200 },
        );
    } catch (error) {
        console.error('방 목록 조회 중 오류:', error);
        return NextResponse.json(
            { message: '방 목록 조회회 중 서버 오류 발생' },
            { status: 500 }
        );
    }
}