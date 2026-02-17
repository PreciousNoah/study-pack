import { z } from 'zod';
import { insertStudyPackSchema, studyPacks, flashcards, quizzes } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  studyPacks: {
    list: {
      method: 'GET' as const,
      path: '/api/study-packs' as const,
      responses: {
        200: z.array(z.custom<typeof studyPacks.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/study-packs/:id' as const,
      responses: {
        200: z.object({
            // Using custom types to represent the joined data
            ...z.custom<typeof studyPacks.$inferSelect>().shape,
            flashcards: z.array(z.custom<typeof flashcards.$inferSelect>()),
            quizzes: z.array(z.custom<typeof quizzes.$inferSelect>())
        }),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    create: {
        method: 'POST' as const,
        path: '/api/study-packs/generate' as const,
        // The input is FormData, so we don't strictly define the Zod schema for the *body* here 
        // in a way that Express middleware can easily parse if it expects JSON.
        // But we can define the response.
        responses: {
            201: z.custom<typeof studyPacks.$inferSelect>(),
            400: errorSchemas.validation,
            500: errorSchemas.internal,
            401: errorSchemas.unauthorized,
        }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/study-packs/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPE HELPERS
// ============================================
export type StudyPackResponse = z.infer<typeof api.studyPacks.get.responses[200]>;
export type StudyPackListResponse = z.infer<typeof api.studyPacks.list.responses[200]>;
