#!/usr/bin/env node
/**
 * Build script to generate entries.json from the entries/*.md files.
 * Titles come from the first level-1 heading.
 * Tags come from a line that starts with "Tags:" (comma separated).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ENTRIES_DIR = path.join(ROOT, "entries");
const OUTPUT = path.join(ROOT, "entries.json");

function extractTitle(markdown) {
  const lines = markdown.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ")) {
      return trimmed.replace(/^#\s+/, "").trim();
    }
  }
  return "Untitled";
}

function extractTags(markdown) {
  const lines = markdown.split("\n");
  for (const line of lines) {
    const match = /^tags:\s*(.+)$/i.exec(line.trim());
    if (match) {
      return match[1]
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function buildEntries() {
  if (!fs.existsSync(ENTRIES_DIR)) {
    console.error("entries directory not found.");
    process.exit(1);
  }

  const files = fs
    .readdirSync(ENTRIES_DIR)
    .filter((file) => file.toLowerCase().endsWith(".md"));

  const entries = files.map((file) => {
    const fullPath = path.join(ENTRIES_DIR, file);
    const markdown = fs.readFileSync(fullPath, "utf-8");
    const title = extractTitle(markdown);
    const tags = extractTags(markdown);
    const slug = path.basename(file, path.extname(file));
    return {
      slug,
      title,
      tags,
      path: `entries/${file}`
    };
  });

  const payload = { generatedAt: new Date().toISOString(), entries };
  fs.writeFileSync(OUTPUT, JSON.stringify(payload, null, 2), "utf-8");
  console.log(`Wrote ${entries.length} entries to ${path.relative(ROOT, OUTPUT)}`);
}

buildEntries();

