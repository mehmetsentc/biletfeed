import { z } from 'zod';

export const seatPlanSchema = z.object({
  layout: z.enum(['general', 'sections', 'tables']),
  rows: z.number().int().min(1).max(200).optional(),
  seatsPerRow: z.number().int().min(1).max(500).optional(),
  sections: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        capacity: z.number().int().min(1)
      })
    )
    .optional(),
  zones: z
    .array(
      z.object({
        code: z.string().min(1).max(8),
        label: z.string().min(1).max(80),
        seatsPerUnit: z.number().int().min(1).max(50),
        color: z.string().max(32).optional(),
        units: z.array(
          z.object({
            id: z.string().min(1).max(24),
            label: z.string().min(1).max(40),
            ticketTypeHint: z.string().max(40).optional()
          })
        )
      })
    )
    .optional(),
  mapImageUrl: z.string().min(1).max(500).optional(),
  notes: z.string().max(500).optional()
});
