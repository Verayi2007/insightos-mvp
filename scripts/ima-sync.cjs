#!/usr/bin/env node
const fs = require("fs");
const os = require("os");
const path = require("path");

const DEFAULT_BASE_URL = "https://ima.qq.com";
const root = path.resolve(__dirname, "..");
const outFile = path.join(root, "data", "local-snapshot.json");

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8").trim();
  } catch {
    return "";
  }
}

function credentials() {
  const clientId =
    process.env.IMA_OPENAPI_CLIENTID ||
    process.env.IMA_CLIENT_ID ||
    readText(path.join(os.homedir(), ".config", "ima", "client_id"));
  const apiKey =
    process.env.IMA_OPENAPI_APIKEY ||
    process.env.IMA_API_KEY ||
    readText(path.join(os.homedir(), ".config", "ima", "api_key"));
  if (!clientId || !apiKey) {
    throw new Error("Missing IMA credentials. Configure ~/.config/ima/client_id and ~/.config/ima/api_key.");
  }
  return { clientId, apiKey };
}

async function ima(pathname, body) {
  const { clientId, apiKey } = credentials();
  const response = await fetch(`${process.env.IMA_BASE_URL || DEFAULT_BASE_URL}/${pathname}`, {
    method: "POST",
    headers: {
      "ima-openapi-clientid": clientId,
      "ima-openapi-apikey": apiKey,
      "ima-openapi-ctx": "skill_version=insightos-mvp",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  const json = JSON.parse(text);
  if (json.code !== 0) {
    throw new Error(`${pathname} failed: ${json.code} ${json.msg || text}`);
  }
  return json.data;
}

async function findKnowledgeBase(name) {
  const data = await ima("openapi/wiki/v1/search_knowledge_base", { query: name, cursor: "", limit: 20 });
  const match = (data.info_list || []).find((item) => item.kb_name === name) || (data.info_list || [])[0];
  if (!match) throw new Error(`Knowledge base not found: ${name}`);
  return match;
}

async function listFolder(knowledgeBaseId, folderId, trail, limit) {
  let cursor = "";
  const notes = [];
  do {
    const data = await ima("openapi/wiki/v1/get_knowledge_list", {
      knowledge_base_id: knowledgeBaseId,
      folder_id: folderId,
      cursor,
      limit: 50
    });
    for (const item of data.knowledge_list || []) {
      if (notes.length >= limit) return notes;
      if (item.media_type === 99) {
        const childNotes = await listFolder(knowledgeBaseId, item.media_id, [...trail, item.title], limit - notes.length);
        notes.push(...childNotes);
      } else if (item.media_type === 11) {
        notes.push({
          media_id: item.media_id,
          title: item.title,
          folder_path: trail.join(" / "),
          media_type: item.media_type
        });
      }
    }
    cursor = data.is_end ? "" : data.next_cursor;
  } while (cursor && notes.length < limit);
  return notes;
}

async function enrichNote(note) {
  const info = await ima("openapi/wiki/v1/get_media_info", { media_id: note.media_id });
  const noteId = info.notebook_ext_info && info.notebook_ext_info.notebook_id;
  let contentChars = null;
  if (process.env.INSIGHTOS_COUNT_CONTENT === "1" && noteId) {
    const content = await ima("openapi/note/v1/get_doc_content", {
      note_id: noteId,
      target_content_format: 0
    });
    contentChars = (content.content || "").length;
  }
  return {
    ...note,
    note_id: noteId || null,
    content_chars: contentChars
  };
}

async function main() {
  const kbName = argValue("--kb-name") || process.env.INSIGHTOS_KB_NAME;
  if (!kbName) {
    throw new Error("Missing knowledge base name. Set INSIGHTOS_KB_NAME or pass --kb-name \"Your Knowledge Base\".");
  }
  const sampleLimit = Number(argValue("--limit") || process.env.INSIGHTOS_SAMPLE_LIMIT || 20);
  const kb = await findKnowledgeBase(kbName);
  const notes = await listFolder(kb.kb_id, "", [kb.kb_name], sampleLimit);
  const enriched = [];
  for (const note of notes.slice(0, sampleLimit)) {
    enriched.push(await enrichNote(note));
  }
  const snapshot = {
    source: {
      kb_name: kb.kb_name,
      kb_id: kb.kb_id,
      content_count: kb.content_count,
      synced_at: new Date().toISOString(),
      privacy: "No note body is stored in this snapshot."
    },
    notes: enriched
  };
  fs.writeFileSync(outFile, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(`Wrote ${enriched.length} notes to ${outFile}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
