import type { Message, Chat } from "./db";

export function exportChatAsMarkdown(chat: Chat, messages: Message[]): string {
  const lines: string[] = [];

  lines.push(`# ${chat.title}`);
  lines.push("");
  lines.push(`*Exported on ${new Date().toLocaleString()}*`);
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const message of messages) {
    const roleLabel = message.role === "user" ? "**You**" : "**Assistant**";
    const timestamp = message.createdAt.toLocaleString();

    lines.push(`### ${roleLabel}`);
    lines.push(`*${timestamp}*`);
    lines.push("");
    lines.push(message.content);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

export function downloadMarkdown(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-z0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 50);
}
