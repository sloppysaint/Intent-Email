// utils/emailUtils.ts
export function decodeHTML(str: string) {
  if (!str) return "";
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

export function extractSender(from: string) {
  const match = from.match(/^(.*?)(?:\s*<(.+?)>)?$/);
  return match ? (match[1] || match[2] || from) : from;
}

export function decodeBase64(str: string): string {
  if (!str) return "";
  const decodedStr = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
  try {
    return decodeURIComponent(escape(decodedStr));
  } catch {
    return decodedStr;
  }
}

export function getEmailBody(payload: any): string {
  if (!payload) return "";
  if (payload.parts && payload.parts.length > 0) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64(part.body.data);
      }
      if (part.mimeType === "text/html" && part.body?.data) {
        return decodeBase64(part.body.data).replace(/<[^>]+>/g, " ");
      }
      if (part.parts) {
        const nested = getEmailBody(part);
        if (nested) return nested;
      }
    }
  }
  if (payload.body && payload.body.data) {
    return decodeBase64(payload.body.data);
  }
  return "";
}
