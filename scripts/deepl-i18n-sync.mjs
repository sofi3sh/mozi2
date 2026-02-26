import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const UA_PATH = path.join(root, "src/i18n/site.ua.json");
const RU_PATH = path.join(root, "src/i18n/site.ru.json");

const key = process.env.DEEPL_API_KEY;
if (!key) {
  console.error("Missing DEEPL_API_KEY in env");
  process.exit(1);
}

const args = process.argv.slice(2);
const mode = args[0] || "ua2ru"; // ua2ru | ru2ua | both

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function protectPlaceholders(text) {
  const placeholders = [];
  let out = text;
  out = out.replace(/\{\w+\}/g, (m) => {
    const token = `__PH${placeholders.length}__`;
    placeholders.push(m);
    return token;
  });
  return { out, placeholders };
}

function restorePlaceholders(text, placeholders) {
  let out = text;
  placeholders.forEach((ph, i) => {
    out = out.replaceAll(`__PH${i}__`, ph);
  });
  return out;
}

async function deeplTranslate(texts, sourceLang, targetLang) {
  // DeepL expects: source_lang = UK/RU, target_lang = RU/UK
  const params = new URLSearchParams();
  for (const t of texts) params.append("text", t);
  params.set("source_lang", sourceLang);
  params.set("target_lang", targetLang);

  const res = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      "Authorization": `DeepL-Auth-Key ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DeepL error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.translations.map((x) => x.text);
}

async function syncOne(srcPath, dstPath, sourceLang, targetLang) {
  const src = readJson(srcPath);
  const dst = readJson(dstPath);

  const missing = Object.keys(src).filter((k) => !dst[k] || String(dst[k]).trim() === "");
  if (!missing.length) {
    console.log(`${path.basename(dstPath)}: nothing to translate`);
    return;
  }

  console.log(`${path.basename(dstPath)}: translating ${missing.length} keys...`);

  // Translate in batches to avoid request limits
  const BATCH = 40;
  for (let i = 0; i < missing.length; i += BATCH) {
    const keys = missing.slice(i, i + BATCH);

    const protectedItems = keys.map((k) => protectPlaceholders(String(src[k])));
    const texts = protectedItems.map((x) => x.out);

    const translated = await deeplTranslate(texts, sourceLang, targetLang);

    keys.forEach((k, idx) => {
      const restored = restorePlaceholders(translated[idx], protectedItems[idx].placeholders);
      dst[k] = restored;
    });

    console.log(`  batch ${Math.floor(i / BATCH) + 1}: done`);
  }

  writeJson(dstPath, dst);
  console.log(`${path.basename(dstPath)}: updated`);
}

if (mode === "ua2ru") {
  await syncOne(UA_PATH, RU_PATH, "UK", "RU");
} else if (mode === "ru2ua") {
  await syncOne(RU_PATH, UA_PATH, "RU", "UK");
} else {
  await syncOne(UA_PATH, RU_PATH, "UK", "RU");
  await syncOne(RU_PATH, UA_PATH, "RU", "UK");
}
