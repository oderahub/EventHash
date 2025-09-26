import { z } from 'zod';

const envSchema = z.object({
  OPENAI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
