import fs from 'fs';
import path from 'path';

export type SupportedExtension = '.docx' | '.pdf' | '.txt';

const ALLOWED_EXTENSIONS: SupportedExtension[] = ['.docx', '.pdf', '.txt'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFile(filename: string, size: number): string | null {
  const ext = path.extname(filename).toLowerCase() as SupportedExtension;
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return '仅支持 .docx、.pdf、.txt 格式的文件';
  }
  if (size > MAX_FILE_SIZE) {
    return '文件大小不能超过 10MB';
  }
  return null;
}

export async function extractText(filePath: string, filename: string): Promise<string> {
  const ext = path.extname(filename).toLowerCase() as SupportedExtension;

  switch (ext) {
    case '.txt':
      return extractFromTxt(filePath);
    case '.docx':
      return extractFromDocx(filePath);
    case '.pdf':
      return extractFromPdf(filePath);
    default:
      throw new Error(`不支持的文件格式: ${ext}`);
  }
}

async function extractFromTxt(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  // Try UTF-8 first, then GBK
  try {
    return buffer.toString('utf-8');
  } catch {
    const iconv = await import('iconv-lite');
    return iconv.default.decode(buffer, 'gbk');
  }
}

async function extractFromDocx(filePath: string): Promise<string> {
  const mammoth = await import('mammoth');
  const buffer = fs.readFileSync(filePath);
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function extractFromPdf(filePath: string): Promise<string> {
  const pdfParse = await import('pdf-parse');
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse.default(buffer);

  // Detect scanned PDF (image-based, no text layer)
  if (data.text.trim().length < 50 && buffer.length > 100 * 1024) {
    throw new Error('该 PDF 可能是扫描版图片，无法提取文字。请使用 OCR 识别后再上传。');
  }

  return data.text;
}
