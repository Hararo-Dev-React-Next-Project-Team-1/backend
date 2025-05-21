import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RawParams = {
  room_id: string;
  question_id: string;
};

type Params = {
  params: Promise<RawParams>;
};

//파라미터 검증 로직
async function getValidatedQuestion(
  req: NextRequest,
  context: { params: Promise<RawParams> }
) {
  const { room_id, question_id } = await context.params;

  const roomId = parseInt(room_id, 10);
  const questionId = parseInt(question_id, 10);

  const visitorId = req.headers.get('visitor-id');
  if (!visitorId) {
    return {
      error: NextResponse.json(
        { message: 'Missing visitor ID' },
        { status: 400 }
      ),
    };
  }

  const question = await prisma.question.findUnique({
    where: { room_id: roomId, question_id: questionId },
  });
  if (!question) {
    return {
      error: NextResponse.json(
        {
          message: `방 #${roomId} 에서 질문 #${questionId} 을 찾을 수 없습니다.`,
        },
        { status: 404 }
      ),
    };
  }

  return { roomId, questionId };
}

export async function POST(req: NextRequest, ctx: Params) {
  const validated = await getValidatedQuestion(req, ctx);
  if ('error' in validated) return validated.error!;

  const { roomId, questionId } = validated;
  const updated = await prisma.question.update({
    where: { room_id: roomId, question_id: questionId },
    data: { likes: { increment: 1 } },
  });

  return NextResponse.json({ message: 'Liked', likes: Number(updated.likes) });
}

export async function DELETE(req: NextRequest, ctx: Params) {
  const validated = await getValidatedQuestion(req, ctx);
  if ('error' in validated) return validated.error!;

  const { roomId, questionId } = validated;
  const updated = await prisma.question.update({
    where: { room_id: roomId, question_id: questionId },
    data: { likes: { decrement: 1 } },
  });

  return NextResponse.json({
    message: 'Unliked',
    likes: Number(updated.likes),
  });
}
