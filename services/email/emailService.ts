import { sendMail } from "./mailer";
import { welcomeTemplate } from "./templates/welcome";

export const sendWelcomeEmail = async (user: {
  name: string;
  email: string;
}) => {
  const html = welcomeTemplate(user.name);

  await sendMail({
    to: user.email,
    subject: "Welcome to Writeflow 🚀",
    html,
  });
};
