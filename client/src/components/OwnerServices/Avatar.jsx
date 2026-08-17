import { useState, useEffect, useMemo, useRef } from "react";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
import { useToast } from "../Toast";
import { Camera, Loader2 } from "lucide-react";
import { updateProfile as apiUpdateProfile } from "../../firebase/cloudFunctions";

// Reusable Avatar Component with fallback chain: image → initials
const Avatar = ({
  image,
  name,
  size = "md",
  rounded = "xl",
  user,
  objectFit = "cover",
  className,
  email,
  editable = false,
  uid,
  collections = ["users"],
  onUpload,
}) => {
  // If user prop is provided, extract image and name from it
  const directImage = image || user?.photoURL || user?.image;
  const providedName  = name || user?.displayName || user?.name;
  const resolvedEmail = email || user?.email;
  const resolvedUid = uid || user?.uid || auth.currentUser?.uid;

  const randomName = useMemo(() => {
    const firstNames = ["Alex","Jordan","Taylor","Morgan","Casey","Riley","Avery","Skylar","Quinn","Reese","Sage","Rowan","Phoenix","River","Dakota","Harper","Emerson","Finley","Kai","Eden","Charlie","Drew","Blair","Cameron"];
    const lastNames  = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Wilson","Anderson","Thomas"];
    return `${firstNames[Math.floor(Math.random()*firstNames.length)]} ${lastNames[Math.floor(Math.random()*lastNames.length)]}`;
  }, []);
  const avatarName = providedName || randomName;

  const [imageError, setImageError]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoURL, setPhotoURL] = useState(directImage || null);
  const fileRef = useRef(null);
  const uploadedUrlRef = useRef(null);
  const toast = useToast();

  // The final image to attempt: direct photoURL only (Gravatar removed to avoid noisy 404s)
  const avatarImage = photoURL || directImage;

  // Reset error whenever the resolved URL changes
  useEffect(() => {
    setImageError(false);
  }, [avatarImage]);

  useEffect(() => {
    if (directImage === uploadedUrlRef.current) return;
    setPhotoURL(directImage || null);
  }, [directImage]);


  const sizeClasses = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
  };

  const roundedClasses = {
    full: "rounded-full",
    "2xl": "rounded-2xl",
    xl: "rounded-xl",
    lg: "rounded-lg",
    md: "rounded-md",
  };

  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-orange-500",
    "bg-cyan-500",
  ];

  const getColorFromName = (name) => {
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getInitials = (name) => {
    if (!name) return "NA"; // Fallback to NA if somehow still no name
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 3);
  };
  const getHighQualityImage = (url) => {
    if (!url) return url;
    if (url.includes("googleusercontent.com")) {
      // Replace any existing size param, or append one — use s400 (safe max for Google profile photos)
      if (/=s\d+(-c)?/.test(url)) {
        return url.replace(/=s\d+(-c)?/g, "=s400-c");
      }
      // No size param in URL, just return as-is
      return url;
    }
    return url;
  };

  // Determine if we should show custom initials
  const shouldShowInitials = !avatarImage || imageError;
  const initials = getInitials(avatarName);

  // If className is passed (e.g. "w-full h-full"), use it instead of the size preset
  const sizeClass = className || sizeClasses[size];

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !resolvedUid) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2 MB");
      return;
    }

    setUploading(true);
    try {
      const storage = getStorage();
      const ext = file.name.split(".").pop();
      const storageRef = ref(storage, `profiles/${resolvedUid}/avatar-${Date.now()}.${ext}`);
      const task = uploadBytesResumable(storageRef, file);

      task.on(
        "state_changed",
        null,
        () => {
          toast.error("Upload failed");
          setUploading(false);
        },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);

          if (auth.currentUser) {
            await updateProfile(auth.currentUser, { photoURL: url });
          }

          await apiUpdateProfile({ avatarUrl: url }).catch(() => {});

          uploadedUrlRef.current = url;
          setPhotoURL(url);
          onUpload?.(url);
          toast.success("Photo updated");
          setUploading(false);
        }
      );
    } catch {
      toast.error("Upload failed");
      setUploading(false);
    }
  };

  const avatarNode = shouldShowInitials ? (
    <div
      className={`${sizeClass} ${getColorFromName(avatarName)} ${roundedClasses[rounded] || roundedClasses.xl} flex items-center justify-center font-semibold text-white ring-2 ring-white/50`}
    >
      {initials}
    </div>
  ) : (
    <img
      src={getHighQualityImage(avatarImage)}
      alt={avatarName}
      referrerPolicy="no-referrer"
      onError={() => setImageError(true)}
      width={100}
      height={100}
      className={`${sizeClass} ${roundedClasses[rounded] || roundedClasses.xl} object-${objectFit} ring-2 ring-white/50`}
    />
  );

  if (!editable) {
    return avatarNode;
  }

  return (
    <div
      className="relative group inline-block cursor-pointer flex-shrink-0"
      onClick={() => !uploading && fileRef.current?.click()}
      title="Click to change photo"
    >
      {avatarNode}

      <div
        className={`absolute inset-0 ${roundedClasses[rounded] || roundedClasses.xl} bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1 pointer-events-none`}
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        ) : (
          <>
            <Camera className="w-5 h-5 text-white drop-shadow" />
            <span className="text-[9px] font-semibold text-white/90 uppercase tracking-wider leading-none">
              Upload
            </span>
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  )
};

export default Avatar;
