import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { panelServerPath } from '@/lib/auth/panel-paths';

export default async function OrganizatorPanelIndex() {
  const host = (await headers()).get('host');
  redirect(panelServerPath('/baslangic', host));
}
