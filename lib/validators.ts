import { z } from 'zod';

export const applicationSchema = z.object({
  batch: z.enum([
    'Batch 21', 
    'Batch 22', 
    'Batch 23', 
    'Batch 24', 
    'Batch 25'
  ], { 
    message: 'Please select a batch.' 
  }),
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  indexNumber: z.string().min(1, 'Index number is required.'),
  faculty: z.enum([
    'Faculty of Engineering',
    'Faculty of Information Technology',
    'Faculty of Architecture',
    'Faculty of Business',
    'Faculty of Medicine',
    'NDT'
  ], { 
    message: 'Please select a faculty.' 
  }),
  department: z.string().min(1, 'Department is required.'),
  university: z.string().default('University of Moratuwa'),
  email: z.string().email('Please enter a valid email address.'),
  whatsappNumber: z.string().regex(/^(0|\+94)\d{9}$/, 'Must be a valid 10-digit number or +94 format.'),
  dob: z.string().min(1, 'Date of birth is required.'),
  address: z.string().min(1, 'Address is required.'),
  
  // Pillars must be an array of strings matching the allowed dropdown items between 1 and 3 items
  pillars: z.array(z.enum([
    'Announcing and Hosting Pillar',
    'Corporate Development Pillar',
    'Creative Design Pillar',
    'Editorial Pillar',
    'Financial Controlling Panel',
    'Human Resources Management Pillar',
    'Marketing Pillar',
    'Photography Pillar',
    'Special Projects Pillar',
    'Video Editing & Live Streaming Pillar',
    'Web and Technology Pillar'
  ]))
    .min(1, 'Select at least 1 pillar.')
    .max(3, 'You can only select up to 3 pillars.'),
  
  portfolioUrl: z.string().url('Must be a valid URL.').optional().or(z.literal('')),
  interests: z.string().optional(),
  clubs: z.string().optional(),
});

export type ApplicationFormValues = z.infer<typeof applicationSchema>;