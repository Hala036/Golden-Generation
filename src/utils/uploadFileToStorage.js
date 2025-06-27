import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param {File} file - The file object from an <input type="file" />.
 * @param {string} path - The storage path (e.g., 'settlements/myfile.json').
 * @returns {Promise<string>} - The download URL of the uploaded file.
 */
export async function uploadFileToStorage(file, path) {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
} 