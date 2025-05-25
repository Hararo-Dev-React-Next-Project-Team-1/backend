// src/app/api/admin/rooms/[room_id]/route.ts
// 관리자 시점 room_id 방의 전체 질문(답변완료 포함) 조회 (GET)
// room_id 방의 특정 질문(question_id) is_selected 상태 변경 (PATCH)

import { getIO } from '@/lib/socketInstance'; // 전역 socket 인스턴스
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // 싱글톤 패턴 적용

export async function GET(
    // middleware.ts를 거쳐 전달받은 요청 객체
    req: NextRequest,
    // 동적 라우팅 파라미터를 context.params로 넘겨줌
    // ex) api/questions/1 이면 context.params.room_id 값은 "1"
    context: { params: { room_id: string } }
) {
    // middleware.ts에서 헤더에 visitor-id 값을 설정했으므로 값을 가져와서 확인
    const visitorId = req.headers.get('visitor-id');
    if (visitorId === null || visitorId === undefined) {
        console.error('미들웨어에서 visitorId 헤더가 전달되지 않았습니다');
        return NextResponse.json(
            { message: '내부 서버 오류: visitorId 식별 불가' },
            { status: 500 }
        );
    }

    // Next.js 15+ 변경사항으로 context 객체안의 params 속성 접근하기 전에 await 해야함 
    const awaitedParams = await context.params;
    const roomId = Number(awaitedParams.room_id);
    if (isNaN(roomId)) {
        return NextResponse.json(
            { message: '숫자로 된 room_id를 입력해주세요' },
            { status: 400 }
        );
    }

    try {
        const room = await prisma.room.findUnique({ where: { id: roomId } });

        if (!room) {
            return NextResponse.json(
                { message: `방 #${roomId} 을 찾을 수 없습니다.` },
                { status: 404 }
            );
        }

        // [room_id]로 받아온 roomId를 id로 갖고있는 room과 
        const allQuestionsInThisRoom = await prisma.room.findUnique({
            where: { id: roomId },
            // include 옵션으로 가져온 관계 데이터(관계 필드이름:questions)를 가져옴
            include: { questions: true }
        });

        if (!allQuestionsInThisRoom) {
            return NextResponse.json(
                { message: `방 # ${roomId} 의 질문 목록 조회 실패!` },
                { status: 400 }
            );
        }

        //질문들을 map에 담아서 가져옴
        const questionsMap = allQuestionsInThisRoom.questions.map(question => ({
            room_id: question.room_id.toString(),
            question_id: question.question_id.toString(),
            creator_id: question.creator_id,
            created_at: question.created_at,
            text: question.text,
            likes: question.likes.toString(),
            is_answered: question.is_answered,
        }));

        //편의를 위해 질문 몇개인지 같이 보냄
        const questionsCount = questionsMap.length;

        const responseBody = {
            message: `방 #${roomId} 의 전체 질문 목록 조회 성공!`,
            count: questionsCount.toString(),
            questions: questionsMap,
        }

        return NextResponse.json(
            responseBody,
            { status: 200 },
        );
    } catch (error) {
        console.error('질문 목록 조회 중 오류:', error);
        return NextResponse.json(
            { message: '질문 목록 조회 중 서버 오류 발생' },
            { status: 500 }
        );
    }
}


export async function PATCH(
    // middleware.ts를 거쳐 전달받은 요청 객체
    req: NextRequest,
    // 동적 라우팅 파라미터를 context.params로 넘겨줌
    // ex) /api/rooms/1/questions/11 이면
    // context.params.room_id : "1"
    context: { params: { room_id: string } }
) {
    // middleware.ts에서 헤더에 visitor-id 값을 설정했으므로 값을 가져와서 확인
    const visitorId = req.headers.get('visitor-id');
    if (visitorId === null || visitorId === undefined) {
        console.error('미들웨어에서 visitorId 헤더가 전달되지 않았습니다');
        return NextResponse.json(
            { message: '내부 서버 오류: visitorId 식별 불가' },
            { status: 500 }
        );
    }

    // Next.js 15+ 변경사항으로 context 객체안의 params 속성 접근하기 전에 await 해야함 
    const awaitedParams = await context.params;
    const roomId = Number(awaitedParams.room_id);
    if (isNaN(roomId)) {
        return NextResponse.json(
            { message: '숫자로 된 room_id를 입력해주세요' },
            { status: 400 }
        )
    };

    const { question_id } = await req.json();

    const questionId = Number(question_id);
    if (isNaN(questionId)) {
        return NextResponse.json(
            { message: '숫자로 된 question_id를 입력해주세요' },
            { status: 400 }
        );
    }

    try {
        const room = await prisma.room.findUnique({ where: { id: roomId } });
        if (!room) {
            return NextResponse.json(
                { message: `방 #${roomId} 을 찾을 수 없습니다.` },
                { status: 404 }
            );
        }

        const question = await prisma.question.findUnique({
            where: {
                room_id: roomId,
                question_id: questionId,
            },
        });

        if (!question) {
            return NextResponse.json(
                { message: `방 #${roomId} 에서 질문 #${questionId} 을 찾을 수 없습니다.` },
                { status: 404 }
            );
        }

        // 트랜잭션을 사용하여 질문의 is_selected 상태를 변경
        const result = await prisma.$transaction(async (tx) => {
            // 해당 방의 모든 질문들의 is_selected를 false로 변경
            await tx.question.updateMany({
                where: { room_id: roomId },
                data: { is_selected: false },
            });

            // 선택된 질문의 is_selected를 true로 변경
            const selectedQuestion = await tx.question.update({
                where: { room_id: roomId, question_id: questionId },
                data: { is_selected: true },
            });
            return selectedQuestion;
        });

        const responseBody = {
            message: `질문 #${questionId} 이 선택됨!`,
            room_id: result.room_id.toString(),
            selected: result.question_id.toString(),
        }

        // 질문 하이라이트 - 소켓 처리
        const io = getIO();
        if (!io) {
            console.error('Socket.IO 서버가 아직 초기화되지 않았습니다.');
            return NextResponse.json({ message: '소켓 서버 미초기화' }, { status: 500 });
        }

        io.to(`room_${roomId}`).emit('receiveHighlight', {
            question_id: questionId.toString(),
        });

        return NextResponse.json(
            responseBody,
            { status: 200 },
        );
    } catch (error) {
        console.error('질문 선택 중 오류:', error);
        return NextResponse.json(
            { message: '질문 선택 중 서버 오류 발생' },
            { status: 500 }
        );
    }
}