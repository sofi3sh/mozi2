import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { badRequest } from "../_util";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_FOLDERS = new Set(["cities", "categories", "venues", "dishes"]);
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function safeExt(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
}

function uid() {
  return `${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;
}

export async function POST(req: Request) {
  const form = await req.formData();
  const folderRaw = (form.get("folder") ?? "").toString();
  const folder = folderRaw.trim();
  if (!ALLOWED_FOLDERS.has(folder)) return badRequest("Невірна папка");

  const file = form.get("file");
  if (!(file instanceof File)) return badRequest("Файл не знайдено");
  if (!ALLOWED_TYPES.has(file.type)) return badRequest("Невірний тип файлу");
  if (file.size > MAX_BYTES) return badRequest("Файл занадто великий (max 5MB)");

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = safeExt(file.type);
  const name = `${uid()}.${ext}`;

  const uploadsDir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, name), bytes);

  const url = `/uploads/${folder}/${name}`;
  return new Response(JSON.stringify({ url }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}