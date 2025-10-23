import { Request, Response } from "express";
import { signupValidationSchema } from "../utils/zodSchema";
import bcrypt from "bcrypt";
import prisma from "../db/prisma";

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

