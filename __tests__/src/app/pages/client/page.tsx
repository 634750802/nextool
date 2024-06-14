'use client';

import { usePathname, useSearchParams } from 'next/navigation';

export default function Page () {
  return usePathname() + ' ' + useSearchParams()?.toString();
}