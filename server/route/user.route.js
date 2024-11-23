import { Router } from "express";
import {
  registerUserController,
  verifyEmailController,
} from "../controllers/users.controller.js";

const userRouter = Router();

userRouter.post("/register", registerUserController);

userRouter.post("/verify-email", verifyEmailController);

export default userRouter;
