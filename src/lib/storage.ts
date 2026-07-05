import app from './firebase';

// firebase/storage is dynamically imported below so it ships as its own
// chunk instead of the shared vendor bundle every page loads — only the
// job-post image upload flow ever touches Cloud Storage.
async function getStorageApi() {
  const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = await import('firebase/storage');
  return { storage: getStorage(app), ref, uploadBytes, getDownloadURL, deleteObject };
}

const THUMBNAIL_MAX = 320;
const FULL_MAX = 800;

// Compress an image File to JPEG using Canvas (max `maxSize` on the longest
// edge, 75% quality). Returns a Blob ready for Firebase Storage upload.
function compressToBlob(file: File, maxSize: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = Math.round(height * maxSize / width); width = maxSize; }
          else { width = Math.round(width * maxSize / height); height = maxSize; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas unavailable')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Compression failed')),
          'image/jpeg',
          0.75
        );
      };
      img.onerror = () => reject(new Error('Image load error'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a job image to Firebase Storage, in both a full (800px) size and a
 * small (320px) thumbnail. Collapsed job cards used to load the full 800px
 * image just to display it at 144px — a 20-job board could pull 2-4MB of
 * images it never actually needed at that resolution (audit P3).
 */
export async function uploadJobImage(jobId: string, file: File): Promise<{ url: string; thumbUrl: string }> {
  const [{ storage, ref, uploadBytes, getDownloadURL }, fullBlob, thumbBlob] = await Promise.all([
    getStorageApi(),
    compressToBlob(file, FULL_MAX),
    compressToBlob(file, THUMBNAIL_MAX),
  ]);
  const baseName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const fullRef = ref(storage, `jobs/${jobId}/${baseName}`);
  const thumbRef = ref(storage, `jobs/${jobId}/thumb_${baseName}`);

  const [fullSnap, thumbSnap] = await Promise.all([
    uploadBytes(fullRef, fullBlob, { contentType: 'image/jpeg' }),
    uploadBytes(thumbRef, thumbBlob, { contentType: 'image/jpeg' }),
  ]);
  const [url, thumbUrl] = await Promise.all([
    getDownloadURL(fullSnap.ref),
    getDownloadURL(thumbSnap.ref),
  ]);
  return { url, thumbUrl };
}

// Delete a job image from Firebase Storage by its download URL
export async function deleteJobImage(url: string): Promise<void> {
  try {
    const { storage, ref, deleteObject } = await getStorageApi();
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch {
    // Ignore errors (e.g. already deleted or not a Storage URL)
  }
}
