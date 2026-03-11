'use client';

import { ErrorState } from '@/components/common/states';

export default function Error({ error }: { error: Error & { digest?: string } }) {
  return <ErrorState message={error.message} />;
}
