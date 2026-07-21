import { redirect } from 'next/navigation';
import { adminHref } from '@/lib/config/domain';

export default function AdminReportsRedirect() {
  redirect(adminHref('/muhasebe'));
}
