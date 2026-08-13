import { z } from 'zod';

export const applicationSchema = z.object({
    batch: z.string().min(1, 'Please select a batch.'),
    firstName: z.string().min(1, 'First name is required.'),
    lastName: z.string().min(1, 'Last name is required.'),
    indexNumber: z.string().min(1, 'Index number is required.'),
    faculty: z.string().min(1, 'Please select a faculty.'),
    department: z.string().min(1, 'Department is required.'),
    university: z.string().min(1, 'Please select your university.'),
    email: z.string().email('Please enter a valid email address.'),
    whatsappNumber: z.string()
        .min(7, 'Phone number is required.')
        .refine(
            (val) => {
                const normalized = val.replace(/[\s\-().]/g, '');
                return /^\+?\d{7,15}$/.test(normalized);
            },
            'Please enter a valid phone number (e.g., 0712345678 or +94712345678).'
        ),
    dob: z.string().min(1, 'Date of birth is required.'),
    address: z.string().min(1, 'Address is required.'),
    pillars: z.array(z.string())
        .min(1, 'Select at least 1 pillar.')
        .max(3, 'You can only select up to 3 pillars.'),
    portfolioUrl: z.string().url('Must be a valid URL.').optional().or(z.literal('')),
    interests: z.string().optional(),
    clubs: z.string().optional(),
});

export type ApplicationFormValues = z.infer<typeof applicationSchema>;
