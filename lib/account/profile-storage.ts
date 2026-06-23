export type UserBillingInfo = {
  taxOffice: string;
  taxNumber: string;
  companyName: string;
  billingAddress: string;
};

export type UserProfileExtras = {
  phone: string;
  birthDate: string;
  city: string;
  gender: string;
  nationalId: string;
  billing: UserBillingInfo;
};

export const EMPTY_PROFILE_EXTRAS: UserProfileExtras = {
  phone: '',
  birthDate: '',
  city: '',
  gender: '',
  nationalId: '',
  billing: {
    taxOffice: '',
    taxNumber: '',
    companyName: '',
    billingAddress: ''
  }
};

const STORAGE_PREFIX = 'bf-user-profile:';

export function loadProfileExtras(uid: string): UserProfileExtras {
  if (typeof window === 'undefined') return { ...EMPTY_PROFILE_EXTRAS };

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${uid}`);
    if (!raw) return { ...EMPTY_PROFILE_EXTRAS };
    const parsed = JSON.parse(raw) as Partial<UserProfileExtras>;
    return {
      ...EMPTY_PROFILE_EXTRAS,
      ...parsed,
      billing: {
        ...EMPTY_PROFILE_EXTRAS.billing,
        ...parsed.billing
      }
    };
  } catch {
    return { ...EMPTY_PROFILE_EXTRAS };
  }
}

export function saveProfileExtras(uid: string, data: UserProfileExtras) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${STORAGE_PREFIX}${uid}`, JSON.stringify(data));
}
