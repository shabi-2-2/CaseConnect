import React from 'react';
import { InstitutionProvider } from '@/lib/institution-context';

export default function InstitutionDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <InstitutionProvider>{children}</InstitutionProvider>;
}
