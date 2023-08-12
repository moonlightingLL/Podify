import {
  create,
  generateForgetPasswordLink,
  grantValid,
  logOut,
  sendProfile,
  sendVerificationToken,
  signIn,
  updatePassWord,
  updateProfile,
  verifyEmail,
} from "#/controllers/auth";
import { isValidPassResetToken, mustAuth } from "#/middleware/auth";
import { validate } from "#/middleware/validator";
import {
  CreateUserSchema,
  SignInValidationSchema,
  TokenAndIDValidation,
  UpdatePasswordSchema,
} from "#/utils/validationSchema";
import { Router } from "express";
import fileParser from "#/middleware/fileParser";

const router = Router();

router.post("/create", validate(CreateUserSchema), create);
router.post("/verify-email", validate(TokenAndIDValidation), verifyEmail);
router.post("/re-verify-email", sendVerificationToken);
router.post("/forget-password", generateForgetPasswordLink);
router.post(
  "/verify-pass-reset-token",
  validate(TokenAndIDValidation), //看token是否符合schema
  isValidPassResetToken,
  grantValid
);
router.post(
  "/update-password",
  validate(UpdatePasswordSchema),
  isValidPassResetToken,
  updatePassWord
);
router.post("/sign-in", validate(SignInValidationSchema), signIn);

router.get("/is-auth", mustAuth, sendProfile);

router.post("/log-out", mustAuth, logOut);

router.post("/update-profile2", mustAuth, fileParser, updateProfile);

export default router;
