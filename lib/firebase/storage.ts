import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirebaseStorage, isFirebaseConfigured } from '@/lib/firebase/client';

export async function uploadFile(
  path: string,
  file: Blob | Uint8Array | ArrayBuffer,
  contentType?: string
): Promise<string> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase Storage yapılandırılmamış');
  }

  const storage = getFirebaseStorage();
  const storageRef = ref(storage, path);
  const metadata = contentType ? { contentType } : undefined;
  await uploadBytes(storageRef, file, metadata);
  return getDownloadURL(storageRef);
}

export async function uploadUserAvatar(
  userId: string,
  file: Blob,
  contentType: string
): Promise<string> {
  const ext = contentType.split('/')[1] || 'jpg';
  return uploadFile(`users/${userId}/avatar.${ext}`, file, contentType);
}

export async function uploadEventImage(
  eventId: string,
  file: Blob,
  contentType: string,
  index = 0
): Promise<string> {
  const ext = contentType.split('/')[1] || 'jpg';
  return uploadFile(
    `events/${eventId}/cover-${index}.${ext}`,
    file,
    contentType
  );
}

export async function deleteFile(path: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const storage = getFirebaseStorage();
  await deleteObject(ref(storage, path));
}
