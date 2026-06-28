import { notFound } from 'next/navigation';
import { EventJoyInvitationGuest } from '@/components/eventjoy/eventjoy-invitation-guest';
import { getEventJoyInvitation } from '@/lib/eventjoy/invitations';
import { createPageMetadata } from '@/lib/seo/metadata';

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { token } = await params;
  const invitation = await getEventJoyInvitation(token);
  if (!invitation) {
    return createPageMetadata({
      title: 'Davetiye Bulunamadı',
      description: 'EventJoy davetiyesi',
      path: `/eventjoy/i/${token}`
    });
  }
  return createPageMetadata({
    title: invitation.title,
    description: `${invitation.hostName} tarafından gönderilen EventJoy davetiyesi`,
    path: `/eventjoy/i/${token}`,
    image: invitation.coverImage
  });
}

export default async function EventJoyPublicInvitationPage({ params }: Props) {
  const { token } = await params;
  const invitation = await getEventJoyInvitation(token);
  if (!invitation) notFound();

  return <EventJoyInvitationGuest invitation={invitation} />;
}
