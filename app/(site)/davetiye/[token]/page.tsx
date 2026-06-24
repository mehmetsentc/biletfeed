import { notFound } from 'next/navigation';
import { InvitationGuestClient } from '@/components/invitations/invitation-guest-client';
import { getPublicInvitation } from '@/lib/services/event-invitations';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function PublicInvitationPage({ params }: Props) {
  const { token } = await params;
  const invitation = await getPublicInvitation(token);
  if (!invitation) notFound();

  return <InvitationGuestClient invitation={invitation} inviteToken={token} />;
}
