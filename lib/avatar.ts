export const AVATAR_GRADIENTS = [
  "from-cyan-400 to-blue-600",
  "from-blue-400 to-indigo-600",
  "from-teal-400 to-cyan-600",
  "from-sky-400 to-blue-700",
  "from-cyan-500 to-teal-700",
  "from-indigo-400 to-violet-600",
] as const;

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}
