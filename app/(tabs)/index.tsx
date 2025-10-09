import React from 'react';
import { useAuthStore } from '@/src/store/useAuthStore';
import { AccountType } from '@/src/types/enums';
import MemberHome from './member/MemberHome';
import TrainerHome from './trainer/TrainerHome';

export default function HomeScreen() {
  const { account } = useAuthStore();
  const accountType = account?.accountType;

  // Show member home for members
  if (accountType === AccountType.MEMBER) {
    return <MemberHome />;
  }

  // Show trainer home for trainers
  if (accountType === AccountType.TRAINER) {
    return <TrainerHome />;
  }

  // Loading or no account type yet
  return null;
}