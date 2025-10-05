import { z } from 'zod';

export const PostSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(5).max(90),
  arte: z.string().min(1).max(200),
  legenda: z.string().min(1).max(500),
  cta: z.string().max(150).optional().or(z.literal('').transform(() => undefined)),
  status: z.literal('A criar')
});

export const ScheduleSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  client: z.string().min(2),
  posts: z.array(PostSchema).min(1),
  suggested_holidays: z.array(z.object({ 
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), 
    name: z.string().min(2)
  })).optional()
});

export function validateSchedule(json) {
  const parsed = ScheduleSchema.parse(json);
  // regra extra: todas as datas devem pertencer ao month
  const prefix = parsed.month + '-';
  parsed.posts.forEach(p => { 
    if (!p.date.startsWith(prefix)) { 
      throw new Error(`Post fora do mês: ${p.date}`); 
    } 
  });
  return parsed;
}
