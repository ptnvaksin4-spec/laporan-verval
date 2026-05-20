import { readFile, stat } from "fs/promises";
import path from "path";

export async function GET() {
  const csvPath = path.join(process.cwd(), "public", "laporan.csv");
  const data = await readFile(csvPath, "utf-8");
  const fileStat = await stat(csvPath);
  const lastModified = fileStat.mtime.toUTCString();

  return new Response(data, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "no-store",
      "Last-Modified": lastModified,
    },
  });
}
