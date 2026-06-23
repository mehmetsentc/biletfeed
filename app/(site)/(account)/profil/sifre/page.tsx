import { redirect } from 'next/navigation';

export default function ChangePasswordRedirect() {
  redirect('/profil/ayarlar?sifre=1');
}
