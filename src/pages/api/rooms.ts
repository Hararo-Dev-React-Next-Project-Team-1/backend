import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import formidable, { Fields, Files } from "formidable";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false,
  },
};

const prisma = new PrismaClient();

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
    uploadDir: path.join(process.cwd(), "/public/uploads"),
    keepExtensions: true,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

// ✅ 꼭 있어야 함!
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { fields, files } = await parseForm(req);

    const titleField = fields.title as string | string[] | undefined;

    const title = Array.isArray(titleField)
      ? titleField[0].toString().trim()
      : titleField?.toString().trim();
    if (!title) return res.status(400).json({ message: "제목은 필수입니다." });

    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!uploadedFile)
      return res.status(400).json({ message: "파일은 필수입니다." });

    const fileBuffer = fs.readFileSync(uploadedFile.filepath);
    const code = await generateRoomCode();

    const now = new Date().toLocaleString("sv-SE", {
      timeZone: "Asia/Seoul",
    }); // e.g. "2025-05-14 17:52:01"

    const room = await prisma.room.create({
      data: {
        title,
        code,
        is_closed: false,
        file: fileBuffer,
        created_at: now, // ✅ 문자열 그대로 넣기
      },
    });

    return res.status(201).json({
      room_id: Number(room.id),
      code: Number(room.code),
    });
  } catch (error) {
    console.error("방 생성 실패:", error);
    return res.status(500).json({ message: "방 생성 중 오류", error });
  }
}
