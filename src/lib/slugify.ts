const map: Record<string, string> = {
  // UA
  "а":"a","б":"b","в":"v","г":"h","ґ":"g","д":"d","е":"e","є":"ie","ж":"zh","з":"z","и":"y","і":"i","ї":"i","й":"i",
  "к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"kh","ц":"ts","ч":"ch",
  "ш":"sh","щ":"shch","ь":"","ю":"iu","я":"ia",
  // RU (додаємо відмінні літери)
  "ё":"e","ы":"y","э":"e","ъ":"",
};

export function slugify(input: string) {
  const s = input.trim().toLowerCase();
  const translit = Array.from(s).map((ch) => map[ch] ?? ch).join("");
  return translit
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
