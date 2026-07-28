import { z } from 'zod';

export const profileFormSchema = z.object({
  fullName: z.string().min(1, 'Vui lòng nhập họ tên').max(160, 'Tối đa 160 ký tự'),
  phoneNumber: z.string().refine(
    val => {
      const t = val.trim();
      return t === '' || /^0\d{8,10}$/.test(t.replace(/\s/g, ''));
    },
    { message: 'Số điện thoại không hợp lệ (VD: 0955633245)' }
  ),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const PROFILE_AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const PROFILE_AVATAR_ACCEPT = ['image/jpeg', 'image/png', 'image/webp'] as const;
