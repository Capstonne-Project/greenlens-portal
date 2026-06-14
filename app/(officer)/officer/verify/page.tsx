import { VerifyDeoOnly } from '@/components/officer/VerifyDeoOnly';
import { VerifyQueueClient } from '@/components/officer/VerifyQueueClient';

export default function OfficerVerifyPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <VerifyDeoOnly>
        <VerifyQueueClient />
      </VerifyDeoOnly>
    </div>
  );
}
