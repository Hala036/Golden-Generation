import { ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase"; // adjust path if needed

export async function uploadImage(file) {
    if (!file) throw new Error("No file provided");

    const storageRef = ref(storage, `uploads/${file.name}`);
    await uploadBytes(storageRef, file);
    console.log('Uploaded a file!');
}
