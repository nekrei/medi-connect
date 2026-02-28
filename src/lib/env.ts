import 'server-only'

import {z} from 'zod'

const envSchema = z.object({
    DATABASE_URL: z.url('DATABASE_URL must be a valid URL'),

    AUTH_SECRET: z
        .string()
        .min(32, 'AUTH_SECRET must be at least 32 characters long'),
    AUTH_COOKIE_NAME: z.string().min(1).default('app_session'),
    NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .default('development'),
});


export const env = envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_COOKIE_NAME: process.env.AUTH_COOKIE_NAME,
    NODE_ENV: process.env.NODE_ENV,
});