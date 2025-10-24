import { Router } from "express";
import { getAuthQuestions, logout, signin_via_password, signup } from "../controllers/authControllers";
import { UserAuth } from "../middlewares/auth";

export const AuthRouter = Router();

AuthRouter.post("/signup", signup);
AuthRouter.post("/signin-password" , signin_via_password);
AuthRouter.post("/logout" , logout);

AuthRouter.get('/auth-questions/:username', UserAuth, getAuthQuestions);