'use client';

import {
  getMyProfile,
  updateMyProfile,
  type UpdateProfileBody,
  uploadMyAvatar,
} from '@/lib/api/services/fetchUser';
import { useAuthStore } from '@/lib/store/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const userKeys = {
  all: ['users'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: async () => {
      const envelope = await getMyProfile();
      return envelope.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore(s => s.updateUser);

  return useMutation({
    mutationFn: (body: UpdateProfileBody) => updateMyProfile(body),
    onSuccess: (_envelope, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
      updateUser({ name: variables.fullName });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore(s => s.updateUser);

  return useMutation({
    mutationFn: (file: File) => uploadMyAvatar(file),
    onSuccess: envelope => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
      updateUser({ avatarUrl: envelope.data.avatarUrl });
    },
  });
}
