export async function uploadImage(file: File, folder: "cities" | "categories" | "venues" | "dishes") {
  const fd = new FormData();
  fd.append("folder", folder);
  fd.append("file", file);

  const res = await fetch("/api/uploads", {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Upload failed");
  }

  const data = (await res.json()) as { url: string };
  if (!data?.url) throw new Error("Upload failed");
  return data.url;
}
