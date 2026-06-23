import { prisma, isDatabaseConfigured } from '@/lib/db/prisma';

export const SUPPORT_SUBJECTS = {
  refund: {
    label: 'İptal/İade',
    description: 'Bilet iptal ve iade işlemleri'
  },
  other: {
    label: 'Diğer Talepler',
    description: 'Genel sorular ve öneriler'
  }
} as const;

export type SupportCategory = keyof typeof SUPPORT_SUBJECTS;

async function resolveUserId(firebaseUid: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { firebaseUid },
    select: { id: true }
  });
  return user?.id ?? null;
}

export async function createUserSupportTicket(
  firebaseUid: string,
  input: { category: SupportCategory; body: string }
) {
  if (!isDatabaseConfigured()) {
    throw new Error('Veritabanı yapılandırılmamış');
  }

  const userId = await resolveUserId(firebaseUid);
  if (!userId) throw new Error('Kullanıcı bulunamadı');

  const subject = SUPPORT_SUBJECTS[input.category].label;

  return prisma.userSupportTicket.create({
    data: {
      userId,
      subject,
      category: input.category,
      body: input.body.trim()
    }
  });
}
