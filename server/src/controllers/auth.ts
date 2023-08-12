import { RequestHandler } from "express";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { CreateUser, VerifyEmailRequest } from "#/@types/user";
import User from "#/models/user";
import EmailVerificationToken from "#/models/emailVerificationToken";
import PasswordResetToken from "#/models/passwordResetToken";
import {
  JWT_SECRET,
  MAILTRAP_PASS,
  MAILTRAP_USER,
  PASSWORD_RESET_LINK,
} from "#/utils/variables";
import { formatProfile, generateToken } from "#/utils/helper";
import { generateTemplate } from "#/mail/template";
import path from "path";
import {
  sendForgetPasswordLink,
  sendPassResetSuccessEmail,
  sendVerificationMail,
} from "#/utils/mail";
import { isValidObjectId } from "mongoose";
import crypto from "crypto";
import passwordResetToken from "#/models/passwordResetToken";
import cloudinary from "#/cloud";
import { RequestWithFiles } from "#/middleware/fileParser";
import formidable from "formidable";

export const create: RequestHandler = async (req: CreateUser, res) => {
  const { email, password, name } = req.body;

  const user = await User.create({ name, email, password });

  //send verification email
  const token = generateToken();
  //将token存到数据库中
  await EmailVerificationToken.create({
    owner: user._id,
    token,
  });

  sendVerificationMail(token, { name, email, userId: user._id.toString() });

  res.status(201).json({ user: { id: user._id, name, email } });
};

//验证user提供的邮箱token的是否和数据库中的一致
export const verifyEmail: RequestHandler = async (
  //VerifyEmailRequest用于指定verifyEmail控制器函数的请求对象参数类型。
  req: VerifyEmailRequest,
  res
) => {
  const { token, userId } = req.body;

  //使用 Mongoose 查询 EmailVerificationTokens
  // 集合中是否存在一个 owner 字段值等于 userId 的文档。
  const verificationToken = await EmailVerificationToken.findOne({
    owner: userId,
  });
  //如果不存在，则错误
  if (!verificationToken)
    return res.status(403).json({ error: "Invalid token!" });
  //存在的话，通过compareToken方法比较
  const matched = await verificationToken.compareToken(token);

  if (!matched) return res.status(403).json({ error: "Invalid token!" });
  //比对成功后，将User的verified改为true
  await User.findByIdAndUpdate(userId, {
    verified: true,
  });
  //删除MongoDB中EmailVerificationToken的这一条，通过_id删除
  await EmailVerificationToken.findByIdAndDelete(verificationToken._id);

  res.json({ message: "Your email is verified!" });
};

export const sendVerificationToken: RequestHandler = async (req, res) => {
  const { userId } = req.body;
  //验证这个userId是否存在
  if (!isValidObjectId(userId))
    res.status(403).json({ error: "Invalid request!" });

  //验证这个user是否存在
  const user = await User.findById(userId);
  if (!user) return res.status(403).json({ error: "Invalid request!" });

  await EmailVerificationToken.findOneAndDelete({
    //这个查询条件表示查找 EmailVerificationTokens 集合中的 owner 字段值等于 userId 的文档。
    owner: userId,
  });

  const token = generateToken();

  await EmailVerificationToken.create({
    owner: userId,
    token,
  });

  sendVerificationMail(token, {
    name: user?.name,
    email: user?.email,
    userId: user?._id.toString(),
  });

  res.json({ message: "Please check your mail" });
};

export const generateForgetPasswordLink: RequestHandler = async (req, res) => {
  const { email } = req.body;

  //验证这个email是否存在
  const user = await User.findOne({ email }); //find,save,remove都需要await
  if (!user) return res.status(404).json({ error: "Account not found!" });

  await passwordResetToken.findOneAndDelete({
    owner: user._id,
  });

  //通过crypto来创建随机token
  const token = crypto.randomBytes(36).toString("hex");

  //该token的PasswordResetToken保存到数据库中
  await PasswordResetToken.create({
    owner: user._id,
    token,
  });

  //生成链接
  const resetLink = `${PASSWORD_RESET_LINK}?token=${token}&userId=${user._id}`;

  sendForgetPasswordLink({ email: user.email, link: resetLink });

  res.json({ message: "Check you registered mail." });
};

export const grantValid: RequestHandler = async (req, res) => {
  res.json({ valid: true });
};

export const updatePassWord: RequestHandler = async (req, res) => {
  const { password, userId } = req.body;

  const user = await User.findById(userId);
  if (!user) return res.status(403).json({ error: "Unauthorized access!" });

  //对比新旧密码，如果一样，则需要重新输入不同新密码
  const matched = await user.comparePassword(password);
  if (matched)
    return res
      .status(422)
      .json({ error: "The new password must be different!" });

  user.password = password;
  await user.save();

  //移除旧的token
  await PasswordResetToken.findOneAndDelete({ owner: user._id });

  sendPassResetSuccessEmail(user.name, user.email);

  res.json({ message: "Password resets successfully." });
};

export const signIn: RequestHandler = async (req, res) => {
  const { password, email } = req.body;

  //根据邮箱看是否存在user
  const user = await User.findOne({
    email,
  });
  if (!user) return res.status(403).json({ error: "Email/Password mismatch!" });

  //对比密码
  const matched = await user.comparePassword(password);
  if (!matched)
    return res.status(403).json({ error: "Email/Password mismatch!" });

  //使用jwt创建token
  const token = jwt.sign({ userId: user._id }, JWT_SECRET);
  user.tokens.push(token);

  await user.save();

  res.json({
    profile: {
      id: user._id,
      name: user.name,
      email: user.email,
      verified: user.verified,
      avatar: user.avatar?.url,
      followers: user.followers.length,
      followings: user.followings.length,
    },
    token,
  });
};

// export const updateProfile: RequestHandler = async (
//   req: RequestWithFiles,
//   res
// ) => {
//   const { name } = req.body;
//   const avatar = req.files?.avatar as formidable.File;

//   const user = await User.findById(req.user.id);
//   if (!user) throw new Error("something went wrong, user not found!");

//   console.log("name: ", name);
//   console.log(req.body);

//   if (typeof name !== "string")
//     return res.status(422).json({ error: "Invalid name1!" });

//   if (name.trim().length < 3)
//     return res.status(422).json({ error: "Invalid name2!" });

//   user.name = name;

//   if (avatar) {
//     // if there is already an avatar file, we want to remove that
//     if (user.avatar?.publicId) {
//       await cloudinary.uploader.destroy(user.avatar?.publicId);
//     }

//     // upload new avatar file
//     const { secure_url, public_id } = await cloudinary.uploader.upload(
//       avatar.filepath,
//       {
//         width: 300,
//         height: 300,
//         crop: "thumb",
//         gravity: "face",
//       }
//     );

//     user.avatar = { url: secure_url, publicId: public_id };
//   }

//   await user.save();

//   res.json({ profile: formatProfile(user) });
// };
export const updateProfile: RequestHandler = async (
  req: RequestWithFiles,
  res
) => {
  const { name } = req.body;
  const avatar = req.files?.avatar as formidable.File;

  const user = await User.findById(req.user.id);
  if (!user) throw new Error("something went wrong, user not found!");

  if (typeof name !== "string")
    return res.status(422).json({ error: "Invalid name1!" });

  if (name.trim().length < 3)
    return res.status(422).json({ error: "Invalid name2!" });

  user.name = name;

  if (avatar) {
    // if there is already an avatar file, we want to remove that
    if (user.avatar?.publicId) {
      await cloudinary.uploader.destroy(user.avatar?.publicId);
    }

    // upload new avatar file
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      avatar.filepath,
      {
        width: 300,
        height: 300,
        crop: "thumb",
        gravity: "face",
      }
    );
    console.log(avatar.filepath);

    user.avatar = { url: secure_url, publicId: public_id };
  }

  await user.save();

  res.json({ profile: formatProfile(user) });
};

export const sendProfile: RequestHandler = (req, res) => {
  res.json({ profile: req.user });
};

export const logOut: RequestHandler = async (req, res) => {
  const { fromAll } = req.query;

  const token = req.token;
  const user = await User.findById(req.user.id);
  if (!user) throw new Error("something went wrong, user not found!");

  // logout from all
  if (fromAll === "yes") user.tokens = [];
  else user.tokens = user.tokens.filter((t) => t !== token);

  await user.save();
  res.json({ success: true });
};
