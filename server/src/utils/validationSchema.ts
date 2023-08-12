import * as yup from "yup";
import { isValidObjectId } from "mongoose";
import { categories } from "./audio_category";

export const CreateUserSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .required("Name is missing!")
    .min(3, "Name is too short!")
    .max(20, "Name is too long"),
  email: yup.string().required("Email is missing!").email("Invalid email!"),
  password: yup
    .string()
    .trim()
    .required("Password is missing!")
    .min(8, "Password is too short!")
    .matches(
      /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#\$%\^&\*])[a-zA-Z\d!@#\$%\^&\*]+$/,
      "Password is too simple!"
    ),
});

export const TokenAndIDValidation = yup.object().shape({
  //.required()用于指定验证规则的必填性，并提供自定义的错误消息。
  //规定token 属性是必填的，如果验证失败，会返回错误消息 "Invalid token!"。
  token: yup.string().trim().required("Invalid token!"),
  userId: yup
    //yup.string(): 这是 yup 库提供的一个方法，用于定义字符串类型的验证规则。
    //在这里，我们正在定义 userId 属性为字符串类型。
    .string()
    //value 表示当前字段的实际值，它是在验证前传递给 .transform() 方法的参数
    .transform(function (value) {
      //.isType(value)用于检查当前值是否是字符串类型(上一句提过的）。
      if (this.isType(value) && isValidObjectId(value)) {
        return value;
      }
      return "";
    })
    .required("Invalid userId!"),
});

export const UpdatePasswordSchema = yup.object().shape({
  token: yup.string().trim().required("Invalid token!"),
  userId: yup
    //yup.string(): 这是 yup 库提供的一个方法，用于定义字符串类型的验证规则。
    //在这里，我们正在定义 userId 属性为字符串类型。
    .string()
    //value 表示当前字段的实际值，它是在验证前传递给 .transform() 方法的参数
    .transform(function (value) {
      //.isType(value)用于检查当前值是否是字符串类型(上一句提过的）。
      if (this.isType(value) && isValidObjectId(value)) {
        return value;
      }
      return "";
    })
    .required("Invalid userId!"),
  password: yup
    .string()
    .trim()
    .required("Password is missing!")
    .min(8, "Password is too short!")
    .matches(
      /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#\$%\^&\*])[a-zA-Z\d!@#\$%\^&\*]+$/,
      "Password is too simple!"
    ),
});

export const SignInValidationSchema = yup.object().shape({
  email: yup.string().required("Email is missing!").email("Invalid email!"),
  password: yup.string().trim().required("Password is missing!"),
});

export const AudioValidationSchema = yup.object().shape({
  title: yup.string().required("Title is missing!"),
  about: yup.string().required("About is missing!"),
  category: yup
    .string()
    .oneOf(categories, "Invalid category!")
    .required("Category is missing!"),
});
