import { Router } from "express";
import { logout, signin_via_password, signup } from "../controllers/authControllers";

export const AuthRouter = Router();

AuthRouter.post("/signup", signup);
AuthRouter.post("/signin-password" , signin_via_password);
AuthRouter.post("/logout" , logout);