import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma'; // 싱글톤 패턴 적용
import formidable, { Fields, Files } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const generateRoomCode = async (): Promise<number> => {
  let code: number;
  while (true) {
    code = Math.floor(1000 + Math.random() * 9000);
    const exists = await prisma.room.findUnique({ where: { code } });
    if (!exists) break;
  }
  return code;
};

const parseForm = (
  req: NextApiRequest
): Promise<{ fields: Fields; files: Files }> => {
  const form = new formidable.IncomingForm({
    uploadDir: path.join(process.cwd(), '/public/uploads'),
    keepExtensions: true,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const visitorId = req.headers['visitor-id'];
  if (!visitorId || Array.isArray(visitorId)) {
    console.error('미들웨어에서 visitorId 헤더가 전달되지 않았습니다');
    return res.status(500).json({
      message: '내부 서버 오류: visitorId 식별 불가',
    });
  }

  if (req.method === 'GET') {
    const rawEnterCode = req.query['enter-code'];
    const parsedCode = Number(rawEnterCode);

    if (isNaN(parsedCode)) {
      return res.status(400).json({
        message: '코드 값이 숫자가 아닙니다.',
        room_id: null,
      });
    }

    const enterCode = BigInt(parsedCode);

    const room = await prisma.room.findUnique({
      where: { code: enterCode },
      select: {
        id: true,
        title: true,
        code: true,
        created_at: true,
        file_name: true,
        file_type: true,
        creator_id: true,
        is_closed: true,
      },
    });

    if (room) {
      return res.status(200).json({
        message: '성공',
        room_id: room.id.toString(),
        title: room.title,
        code: room.code.toString(),
        created_at: room.created_at.toString(),
        file_name: room.file_name,
        file_type: room.file_type,
        creator_id: room.creator_id,
        is_closed: room.is_closed,
        visitor_id: visitorId,
      });
    } else {
      return res.status(404).json({
        message: '방이 존재하지 않습니다',
        room_id: null,
      });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { fields, files } = await parseForm(req);

    const titleField = fields.title as string | string[] | undefined;
    const title = Array.isArray(titleField)
      ? titleField[0].toString().trim()
      : titleField?.toString().trim();

    if (!title) {
      return res.status(400).json({ message: '제목은 필수입니다.' });
    }

    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!uploadedFile) {
      return res.status(400).json({ message: '파일은 필수입니다.' });
    }

    const fileType = uploadedFile.mimetype || 'application/octet-stream';
    const originalFileName = uploadedFile.originalFilename || 'unknown_file';

    const fileBuffer = fs.readFileSync(uploadedFile.filepath);
    fs.unlinkSync(uploadedFile.filepath); // 임시 파일 삭제

    const code = await generateRoomCode();

    const now = new Date().toLocaleString('sv-SE', {
      timeZone: 'Asia/Seoul',
    });

    const room = await prisma.room.create({
      data: {
        title,
        code,
        is_closed: false,
        file: fileBuffer,
        file_type: fileType,
        file_name: originalFileName,
        created_at: now,
        creator_id: visitorId
      },
    });

    return res.status(201).json({
      room_id: Number(room.id),
      code: Number(room.code),
      creator_id: room.creator_id,
    });
  } catch (error) {
    console.error('방 생성 실패:', error);
    return res.status(500).json({ message: '방 생성 중 오류', error });
  }
}
