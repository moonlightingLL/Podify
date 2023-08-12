import { Request } from "express";

/**
 * 在TypeScript中，用于声明全局的类型扩展，以扩展Express框架的Request对象的属性。
 * 这样做可以使你在整个应用程序中访问这些属性，而无需每次都进行类型断言。
 */
declare global {
  namespace Express {
    interface Request {
      user: {
        id: any;
        name: string;
        email: string;
        verified: boolean;
        avatar?: string;
        followers: number;
        followings: number;
      };
      token: string;
    }
  }
}

export interface CreateUser extends Request {
  body: {
    name: string;
    email: string;
    password: string;
  };
}

export interface VerifyEmailRequest extends Request {
  body: {
    token: string;
    userId: string;
  };
}
