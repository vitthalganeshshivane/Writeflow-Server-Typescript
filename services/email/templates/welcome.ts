import fs from "fs";
import path from "path";

const templatePath = path.join(__dirname, "welcome.html");

export const welcomeTemplate = (
  username: string,
  appUrl = "https://writeflow-blogs.vercel.app",
) => {
  let html = fs.readFileSync(templatePath, "utf-8");
  html = html.replace(/{{username}}/g, username);
  html = html.replace(/{{app_url}}/g, appUrl);
  return html;
};
