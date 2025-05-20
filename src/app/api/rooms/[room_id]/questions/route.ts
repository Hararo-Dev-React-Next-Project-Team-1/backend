// src/api/rooms/[room_id]/questions/route.ts : 
// [room_id] 방에 질문 생성(POST)
// [room_id] 방의 질문 목록 조회(GET)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // 싱글톤 패턴 적용

export async function POST(
    // middleware.ts를 거쳐 전달받은 요청 객체
    req: NextRequest,
    // 동적 라우팅 파라미터를 context.params로 넘겨줌
    // ex) api/questions/1 이면 context.params.room_id 값은 "1"
    context: {params: {room_id: string}}
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

    // Next.js 15+ 변경사항으로 context 객체안의 params 속성 접근하기 전에 await 해야함 
    const awaitedParams = await context.params;
    const roomId = Number(awaitedParams.room_id);
    if (isNaN(roomId)) {
        return NextResponse.json(
            { message: '숫자로 된 room_id를 입력해주세요'},
            { status: 400 }
        );
    }

    try {
        const room = await prisma.room.findUnique({ where: {id: roomId} });

        if (!room) {
            return NextResponse.json(
                { message: `방 #${roomId} 을 찾을 수 없습니다.`},
                { status: 404 }
            );
        }

        // 요청 body를 json으로 파싱
        // ex) "text": "질문할 내용" 이면 const {text} : "질문할 내용"
        const {text} = await req.json();

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
                created_at: new Date().toLocaleString('sv-SE', {timeZone: 'Asia/Seoul',}),
                text: text.trim(),
            }
        });

        const responseBody = {
            message: '질문 생성 성공!',
            room_id: newQuestion.room_id.toString(),
            question_id: newQuestion.question_id.toString(),
            creator_id: newQuestion.creator_id,
            created_at: newQuestion.created_at,
            text: newQuestion.text,
            likes: newQuestion.likes.toString(),
            is_answered: newQuestion.is_answered
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

export async function GET(
    // middleware.ts를 거쳐 전달받은 요청 객체
    req: NextRequest,
    // 동적 라우팅 파라미터를 context.params로 넘겨줌
    // ex) api/questions/1 이면 context.params.room_id 값은 "1"
    context: {params: {room_id: string}}
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

    // Next.js 15+ 변경사항으로 context 객체안의 params 속성 접근하기 전에 await 해야함 
    const awaitedParams = await context.params;
    const roomId = Number(awaitedParams.room_id);
    if (isNaN(roomId)) {
        return NextResponse.json(
            { message: '숫자로 된 room_id를 입력해주세요'},
            { status: 400 }
        );
    }

    try {
        const room = await prisma.room.findUnique({ where: {id: roomId} });

        if (!room) {
            return NextResponse.json(
                { message: `방 #${roomId} 을 찾을 수 없습니다.`},
                { status: 404 }
            );
        }

        // [room_id]로 받아온 roomId를 id로 갖고있는 room과 
        // include 옵션으로 가져온 관계 데이터(관계 필드이름:questions)를 가져옴
        const allQuestionsInThisRoom = await prisma.room.findUnique({
            where: { id: roomId },
            include: { questions: true }
        });

        if (!allQuestionsInThisRoom) {
            return NextResponse.json(
                { message: `방 # ${roomId} 의 질문 목록 조회 실패!`},
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
        //질문이 0개면 404 return
        if (!questionsCount) {
            return NextResponse.json(
                { message: `방 #${roomId} 에 생성된 질문이 없습니다.`},
                { status: 404 }
            );
        }

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
        console.error('질문 생성 중 오류:', error);
        return NextResponse.json(
            { message: '질문 생성 중 서버 오류 발생' },
            { status: 500 }
        );
    }
}