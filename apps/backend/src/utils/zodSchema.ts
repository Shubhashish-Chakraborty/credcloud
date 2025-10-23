import { z } from "zod";

export const signupValidationSchema = z.object({
    username: z.string().min(3),
    password: z.string().min(6),
    authQuestions: z.array(z.object({
        question: z.string().min(10),
        answer: z.string().min(1),
    }))
});