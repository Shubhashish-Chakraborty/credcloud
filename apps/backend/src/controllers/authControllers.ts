import { Request, Response } from "express";
import { passwordSigninSchema, signupValidationSchema } from "../utils/zodSchema";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import prisma from "../db/prisma";
import { JWT_USER_SECRET } from "../config/envVariables";

export const signup = async (req: Request, res: Response) => {
    try {

        const result = signupValidationSchema.safeParse(req.body);

        // If validation fails, return an error
        if (!result.success) {
            res.status(400).json({
                message: 'Validation error',
                errors: result.error.flatten().fieldErrors,
            });
            return;
        }

        const { username, password, authQuestions } = result.data;

        // Check if user already exists, By username!

        // checking username uniquenessss
        const existingUserName = await prisma.user.findUnique({
            where: {
                username: username
            }
        });

        if (existingUserName) {
            res.status(400).json({
                message: "Username Already Taken!, Try another one"
            })
            return;
        }

        // Uptill here input validation is done!

        // HASHING THE PASSWORD:

        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Hash the answers to the auth questions
        const processedQuestions = await Promise.all(
            authQuestions.map(async (q: { question: string; answer: string }) => ({
                question: q.question,
                answer: await bcrypt.hash(q.answer, 10),
            }))
        );

        const USER = await prisma.user.create({
            data: {
                username: username,
                password: hashedPassword,
                authQuestions: {
                    create: processedQuestions,
                }
            }
        });

        res.status(201).json({
            message: `${USER.username} signed up successfully!`,
            success: true
        })

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Something Went Wrong, Please Try Again Later"
        });
    }
};

export const signin_via_password = async (req: Request, res: Response) => { // signin:01
    try {
        const result = passwordSigninSchema.safeParse(req.body);

        // If validation fails, return an error
        if (!result.success) {
            res.status(400).json({
                message: "Validation error",
                errors: result.error.flatten().fieldErrors,
            });
            return;
        }

        const { username, password } = result.data;

        // Find the user in the database
        const user = await prisma.user.findUnique({
            where: {
                username: username
            },
        });

        if (!user) {
            res.status(400).json({
                message: "User Not Found"
            });
            return;
        }

        // Compare password with hashed password in DB
        const matchPassword = await bcrypt.compare(password, user.password);
        if (!matchPassword) {
            res.status(401).json({
                message: "Incorrect Password!"
            });
            return;
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username
            },
            JWT_USER_SECRET,
            {
                expiresIn: "4d" // Token expires in 4 day
            }
        );

        // Set the JWT token as an HTTP-only cookie

        res.status(200)
            .cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== "development", // Secure in production
                sameSite: process.env.NODE_ENV === "development" ? "lax" : "none", // Allow cross-site cookies
                maxAge: 4 * 24 * 60 * 60 * 1000, // 4 days
                path: "/"
            })
            .json({
                success: true,
                message: "User Logged In Successfully!",
                user: {
                    id: user.id,
                    username: user.username
                }
            });

        return;

    } catch (error) {
        console.error("Signin Error:", error);
        res.status(500).json({
            message: "Something Went Wrong, Please Try Again Later"
        });
    }
}

export const logout = (req: Request, res: Response) => {
    try {
        res.clearCookie("token", { httpOnly: true, secure: true, sameSite: "none" });
        res.status(200).json({
            message: "User Logged Out Successfully!"
        });
        return
    } catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({
            error: "Something went wrong while logging out."
        });
        return
    }
};

export const getAuthQuestions = async (req: Request, res: Response) => {
    const { username } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: {
                username
            },
            include: {
                authQuestions: {
                    select: { id: true, question: true }, // Only send the questions, NOT the answers
                },
            },
        });

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // We will pick 2 random questions to ask
        const questions = user.authQuestions.sort(() => 0.5 - Math.random()).slice(0, 2);
        res.status(200).json({ questions });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};