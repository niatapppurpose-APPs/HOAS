// UploadLogo.jsx (simplified)
import { useState } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from "../../../../firebase/firebaseConfig";


export default function UploadLogo({ onDone }) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleFile = (e) => setFile(e.target.files[0]);

  const upload = async () => {
    if (!file) return;
    const storage = getStorage();
    const path = `branding/logo-${Date.now()}-${file.name}`;
    const sRef = ref(storage, path);
    const task = uploadBytesResumable(sRef, file);

    task.on('state_changed',
      (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err) => console.error(err),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        await setDoc(doc(db, 'settings', 'branding'), { logoUrl: url, updatedAt: serverTimestamp() }, { merge: true });
        onDone && onDone(url);
      }
    );
  };

  return (
    <div>
      <input accept="image/*" type="file" onChange={handleFile} />
      {file && <img src={URL.createObjectURL(file)} alt="preview" style={{ width: 120 }} />}
      <button onClick={upload}>Upload</button>
      {progress > 0 && <div>Progress: {progress}%</div>}
    </div>
  );
}