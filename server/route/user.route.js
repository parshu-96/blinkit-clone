import { Router } from "express";
import {
  forgotPasswordController,
  LoginController,
  logoutController,
  refreshToken,
  registerUserController,
  resetPassword,
  updateUserDetails,
  uploadAvatar,
  verifyEmailController,
  verifyForgotPasswordOTP,
} from "../controllers/users.controller.js";
import auth from "../middleware/auth.js";
import upload from "../middleware/multer.js";

const userRouter = Router();

userRouter.post("/register", registerUserController);

userRouter.post("/verify-email", verifyEmailController);

userRouter.post("/login", LoginController);

userRouter.get("/logout", auth, logoutController);

userRouter.put("/upload-avatar", auth, upload.single("avatar"), uploadAvatar);

userRouter.put("/update-user", auth, updateUserDetails);

userRouter.put("/forgot-password", forgotPasswordController);

userRouter.put("/verify-forgot-password-otp", verifyForgotPasswordOTP);

userRouter.put("/reset-password", resetPassword);

userRouter.post("/refresh-token", refreshToken);

export default userRouter;
