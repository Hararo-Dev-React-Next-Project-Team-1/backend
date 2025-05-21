//src/app/api/rooms/[room_id]/questions/[question_id]/route.ts
// [room_id] 방의 [question_id] 질문 수정(PATCH)
// [room_id] 방의 [question_id] 질문 삭제(DELETE)

import { getIO } from '@/lib/socketInstance'; // // 전역 socket 인스턴스
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // 싱글톤 패턴 적용

export async function PATCH(
    // middleware.ts를 거쳐 전달받은 요청 객체
    req: NextRequest,
    // 동적 라우팅 파라미터를 context.params로 넘겨줌
    // ex) /api/rooms/1/questions/11 이면
    // context.params.room_id : "1", context.params.question_id : "11"
    context: { params: { room_id: string, question_id: string } }
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

    const questionId = Number(awaitedParams.question_id);
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

        if (question.creator_id !== visitorId) {
            return NextResponse.json(
                { message: '권한이 없습니다!' },
                { status: 403 }
            );
        }

        // 요청 body를 json으로 파싱
        // ex) "text": "수정할 내용" 이면 const {text} : "수정할 내용"
        const { text } = await req.json();

        if (typeof text !== 'string' || !text.trim()) {
            return NextResponse.json(
                { message: '수정할 질문을 입력해주세요' },
                { status: 400 }
            );
        }

        const updatedQuestion = await prisma.question.update({
            where: { question_id: questionId },
            data: { text: text.trim() },
        });

        const responseBody = {
            message: '질문 수정 성공!',
            room_id: updatedQuestion.room_id.toString(),
            question_id: updatedQuestion.question_id.toString(),
            creator_id: updatedQuestion.creator_id,
            created_at: updatedQuestion.created_at,
            text: updatedQuestion.text,
            likes: updatedQuestion.likes.toString(),
            is_answered: updatedQuestion.is_answered
        }

        // 질문 수정 시
        const io = getIO();
        if (io) {
            const sanitized = JSON.parse(
              JSON.stringify(updatedQuestion, (_key, value) =>
                typeof value === "bigint" ? value.toString() : value
              )
            );
          
            io.to(`room_${roomId}`).emit("updateQuestion", {
              question: sanitized,
            });
          }

        return NextResponse.json(
            responseBody,
            { status: 200 },
        );
    } catch (error) {
        console.error('질문 수정 중 오류:', error);
        return NextResponse.json(
            { message: '질문 생성 중 서버 오류 발생' },
            { status: 500 }
        );
    }
}


export async function DELETE(
    // middleware.ts를 거쳐 전달받은 요청 객체
    req: NextRequest,
    // 동적 라우팅 파라미터를 context.params로 넘겨줌
    // ex) /api/rooms/1/questions/11 이면
    // context.params.room_id : "1", context.params.question_id : "11"
    context: { params: { room_id: string, question_id: string } }
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

    const questionId = Number(awaitedParams.question_id);
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

        if (question.creator_id !== visitorId) {
            return NextResponse.json(
                { message: '권한이 없습니다!' },
                { status: 403 }
            );
        }

        const deletedQuestion = await prisma.question.delete({
            where: { question_id: questionId },
        });

        const responseBody = {
            message: '질문 삭제 성공!',
            room_id: deletedQuestion.room_id.toString(),
            question_id: deletedQuestion.question_id.toString(),
            creator_id: deletedQuestion.creator_id,
            created_at: deletedQuestion.created_at,
            text: deletedQuestion.text,
            likes: deletedQuestion.likes.toString(),
            is_answered: deletedQuestion.is_answered,
        }

        // 질문 삭제 시
        const io = getIO();
        if (io) {
            // 서버
            io.to(`room_${roomId}`).emit('deleteQuestion', { question_id: questionId });
        }


        return NextResponse.json(
            responseBody,
            { status: 200 },
        );
    } catch (error) {
        console.error('질문 수정 중 오류:', error);
        return NextResponse.json(
            { message: '질문 생성 중 서버 오류 발생' },
            { status: 500 }
        );
    }
}
