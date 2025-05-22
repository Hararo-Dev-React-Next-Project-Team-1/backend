// src/app/api/rooms/[room_id]/route.ts
// room_id 방의 파일 다운로드 (GET)
// room_id 방 닫힘 (DELETE)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // 싱글톤 패턴으로 prisma 클라이언트 가져오기

export const dynamic = "force-dynamic"; // Turbopack 경고 제거

// 파일 다운로드
export async function GET(
  req: NextRequest,
  { params }: { params: { room_id: string } }
) {
  try {
    const roomId = Number(params.room_id);

    if (isNaN(roomId)) {
      return NextResponse.json(
        { message: "유효하지 않은 방 ID입니다" },
        { status: 400 }
      );
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: {
        file: true,
        title: true,
        file_type: true,
        file_name: true,
      },
    });

    if (!room) {
      return NextResponse.json(
        { message: "해당 방을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (!room.file) {
      return NextResponse.json(
        { message: "파일이 존재하지 않습니다" },
        { status: 404 }
      );
    }

    // 파일명 설정
    const fileName =
      room.file_name || `${room.title.replace(/[^a-zA-Z0-9가-힣]/g, "_")}`;

    // 다운로드 응답 생성
    const response = new NextResponse(room.file);

    // Content-Type 설정
    response.headers.set(
      "Content-Type",
      room.file_type || "application/octet-stream"
    );

    // 다운로드 설정
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );

    return response;
  } catch (error) {
    console.error("파일 다운로드 실패:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 방 닫힘
export async function DELETE(
  req: NextRequest,
  context: { params: { room_id: string } }
) {
  try {
    // params 전체를 먼저 await 처리
    const params = await context.params;
    const roomId = Number(params.room_id);

    if (isNaN(roomId)) {
      return NextResponse.json(
        { message: "유효하지 않은 방 ID입니다" },
        { status: 400 }
      );
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });

    if (!room) {
      return NextResponse.json(
        { message: "해당 방을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (room.is_closed) {
      return NextResponse.json(
        { message: "이미 닫힌 방입니다" },
        { status: 400 }
      );
    }

    await prisma.room.update({
      where: { id: roomId },
      data: { is_closed: true },
    });

    return NextResponse.json(
      { message: "방이 성공적으로 닫혔습니다" },
      { status: 200 }
    );
  } catch (error) {
    console.error("방 닫기 실패:", error);
    return NextResponse.json(
      {
        message: "서버 오류가 발생했습니다",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
