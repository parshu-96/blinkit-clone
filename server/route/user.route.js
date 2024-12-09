import { Router } from "express";
import {
  LoginController,
  logoutController,
  registerUserController,
  verifyEmailController,
} from "../controllers/users.controller.js";
import auth from "../middleware/auth.js";

const userRouter = Router();

userRouter.post("/register", registerUserController);

userRouter.post("/verify-email", verifyEmailController);

userRouter.post("/login", LoginController);

userRouter.get("/logout", auth, logoutController);

export default userRouter;
