import jwt from "jsonwebtoken";
import User from "../models/User";
import { nanoid } from "nanoid";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { firebaseAuth } from "../config/firebase";
import { AuthRequest } from "../types/express";
import { sendWelcomeEmail } from "../services/email/emailService";

const emailRegex: RegExp = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

const passwordRegex: RegExp = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

const formatDataToSend = (user: any) => {
  const access_token = jwt.sign(
    { id: user._id, admin: user.admin },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" },
  );

  return {
    access_token,
    profile_img: user.personal_info.profile_img,
    username: user.personal_info.username,
    fullname: user.personal_info.fullname,
    isAdmin: user.admin,
  };
};

const generateUsername = async (email: string): Promise<string> => {
  let username = email.split("@")[0];

  const exists = await User.exists({
    "personal_info.username": username,
  });

  if (exists) {
    username += nanoid().substring(0, 3);
  }

  return username;
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { fullname, email, password } = req.body;

    if (fullname.length < 3) {
      return res
        .status(403)
        .json({ error: "Fullname must be at least 3 letters long" });
    }

    if (!email.length) {
      return res.status(403).json({ error: "Enter email" });
    }

    if (!emailRegex.test(email)) {
      return res.status(403).json({ error: "Email is invalid" });
    }

    if (!passwordRegex.test(password)) {
      return res.status(403).json({
        error:
          "Password should be 6-20 chars with 1 number, 1 lowercase, 1 uppercase",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const username = await generateUsername(email);

    const user = new User({
      personal_info: {
        fullname,
        email,
        password: hashedPassword,
        username,
      },
    });

    const savedUser = await user.save();

    void sendWelcomeEmail({
      name: savedUser.personal_info.fullname,
      email: savedUser.personal_info.email,
    }).catch((err) => {
      console.error("Welcome email failed:", err);
    });

    return res.status(200).json(formatDataToSend(savedUser));
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(500).json({ error: "Email already exists" });
    }

    return res.status(500).json({ error: err.message });
  }
};

export const signin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      "personal_info.email": email,
    });

    if (!user) {
      return res.status(403).json({ error: "Email not found" });
    }

    if (user.google_auth) {
      return res.status(403).json({
        error: "Login using Google",
      });
    }

    if (!user.personal_info.password) {
      return res.status(403).json({
        error:
          "Account was created without a password. Please use Google Login.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.personal_info.password);

    if (!isMatch) {
      return res.status(403).json({ error: "Incorrect Password" });
    }

    return res.status(200).json(formatDataToSend(user));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { access_token } = req.body;

    const decodedUser = await firebaseAuth.verifyIdToken(access_token);

    const { email, name, picture } = decodedUser;

    const largePicture = picture?.replace("s96-c", "s384-c") || null;

    let user = await User.findOne({
      "personal_info.email": email,
    }).select(
      "personal_info.fullname personal_info.username personal_info.profile_img google_auth admin",
    );

    if (user) {
      if (!user.google_auth) {
        return res.status(403).json({
          error:
            "This email was registered without Google. Use password login.",
        });
      }
    } else {
      const username = await generateUsername(email!);

      user = new User({
        personal_info: {
          fullname: name,
          email,
          username,
          profile_img: largePicture,
        },
        google_auth: true,
      });

      await user.save();

      void sendWelcomeEmail({
        name: name || username,
        email: email!,
      }).catch((err) => {
        console.error("Welcome email failed:", err);
      });
    }

    return res.status(200).json(formatDataToSend(user));
  } catch (err) {
    console.error("Google auth error:", err);

    return res.status(500).json({
      error: "Google authentication failed",
    });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (
      !passwordRegex.test(currentPassword) ||
      !passwordRegex.test(newPassword)
    ) {
      return res.status(403).json({
        error:
          "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters",
      });
    }

    const user = await User.findById(req.user);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.google_auth) {
      return res.status(403).json({
        error: "You can't change password because you logged in with Google",
      });
    }

    if (!user.personal_info.password) {
      return res.status(400).json({
        error: "Password not set for this account",
      });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.personal_info.password,
    );

    if (!isMatch) {
      return res.status(403).json({ error: "Incorrect current password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(req.user, {
      "personal_info.password": hashedPassword,
    });

    return res.status(200).json({ status: "password changed" });
  } catch (err: any) {
    return res.status(500).json({
      error:
        "Some error occurred while changing the password, please try again later",
    });
  }
};
