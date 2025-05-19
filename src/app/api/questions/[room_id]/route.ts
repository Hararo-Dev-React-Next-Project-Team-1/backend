import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // 싱글톤 패턴 적용

export async function POST(
    req: NextRequest,
    context: {params: {room_id: string}}
) {
    // middleware.ts에서 헤더에 visitor-id 값을 설정했으므로 값을 가져와서 확인인
    const visitorId = req.headers.get('visitor-id');
    if (visitorId === null || visitorId === undefined) {
        console.error('미들웨어에서 visitorId 헤더가 전달되지 않았습니다');
        return NextResponse.json(
            { message: '내부 서버 오류: visitorId 식별 불가'},
            { status: 500 }
        );
    }
    try {
        const awaitedParams = await context.params;
        const roomId = Number(awaitedParams.room_id);
        if (isNaN(roomId)) {
            return NextResponse.json(
                { message: '숫자로 된 room_id를 입력해주세요'},
                { status: 400 }
            );
        }

        const room = await prisma.room.findUnique({
            where: {id: roomId}
        });

        if (!room) {
            return NextResponse.json(
                { message: `${awaitedParams.room_id} 방을 찾을 수 없습니다.`},
                { status: 404 }
            );
        }

        const requestBody = await req.json();
        const {text} = requestBody;

        if (typeof text !== 'string' || !text.trim()) {
            return NextResponse.json(
                { message: '질문을 입력해주세요' },
                { status: 400 }
            );
        }

        const newQuestion = await prisma.question.create({
            data: {
                room_id: room.id,
                creator_id: visitorId,
                created_at: new Date().toLocaleString('sv-SE', {
                    timeZone: 'Asia/Seoul',
                  }),
                text: text.trim(),

            },
        });

        const responseBody = {
            messagae: '질문 생성 성공!',
            room_id: newQuestion.room_id.toString(),
            quesiton_id: newQuestion.question_id.toString(),
            creator_id: newQuestion.creator_id,
            created_at: newQuestion.created_at,
            text: newQuestion.text,
            likes: newQuestion.likes.toString(),
            is_selected: newQuestion.is_selected
        }

        return NextResponse.json(
            responseBody,
            { status: 201 },
        );
    } catch (error) {
        console.error('질문 생성 중 오류:', error);
        return NextResponse.json(
            { message: '질문 생성 중 서버 오류 발생' },
            { status: 500 }
        );
    }
}