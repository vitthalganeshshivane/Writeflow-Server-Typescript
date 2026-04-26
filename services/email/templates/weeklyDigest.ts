import fs from "fs";
import path from "path";

const templatePath = path.resolve(
  process.cwd(),
  "services/email/templates/weeklyDigest.html",
);

const escapeHtml = (value: string | number | null | undefined) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const replaceToken = (
  html: string,
  token: string,
  value: string | number | null | undefined,
) => html.replace(new RegExp(`{{${token}}}`, "g"), escapeHtml(value));

export type WeeklyDigestTemplateData = Record<
  string,
  string | number | null | undefined
>;

export const weeklyDigestTemplate = (data: WeeklyDigestTemplateData) => {
  let html = fs.readFileSync(templatePath, "utf-8");

  for (const [key, value] of Object.entries(data)) {
    html = replaceToken(html, key, value);
  }

  return html;
};
