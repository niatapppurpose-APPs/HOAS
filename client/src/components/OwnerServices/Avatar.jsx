import { useState, useMemo } from "react";

// Random name generator for users without names
const generateRandomName = () => {
  const firstNames = [
    "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Skylar",
    "Quinn", "Reese", "Sage", "Rowan", "Phoenix", "River", "Dakota", "Harper",
    "Emerson", "Finley", "Kai", "Eden", "Charlie", "Drew", "Blair", "Cameron"
  ];
  
  const lastNames = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas"
  ];
  
  const randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
  const randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return `${randomFirst} ${randomLast}`;
};

// Reusable Avatar Component with fallback to initials
const Avatar = ({ image, name, size = "md", rounded = "xl", user, objectFit = "cover" }) => {
  // If user prop is provided, extract image and name from it
  const avatarImage = image || user?.photoURL || user?.image;
  const providedName = name || user?.displayName || user?.name;
  
  // Generate a random name only once if no name is provided
  const randomName = useMemo(() => generateRandomName(), []);
  const avatarName = providedName || randomName;
  
  const [imageError, setImageError] = useState(false);


  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
  };

  const roundedClasses = {
    full: "rounded-full",
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
      return url.replace(/=s\d+(-c)?/g, "=s2000-c");
    }

    return url;
  };

  // Determine if we should show custom initials
  const shouldShowInitials = !avatarImage || imageError;
  const initials = getInitials(avatarName);

  return (
    <>
      {shouldShowInitials ? (
        <div
          className={`${sizeClasses[size]} ${getColorFromName(
            avatarName
          )} ${roundedClasses[rounded]} flex items-center justify-center font-semibold p-8 text-white ring-2 ring-white/50`}
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
          className={`${sizeClasses[size]} ${roundedClasses[rounded]} object-${objectFit} ring-2 ring-white/50`}
        />
      )}
    </>
  )
};

export default Avatar;
