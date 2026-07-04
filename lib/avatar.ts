export const AVATAR_GRADIENTS = [
  "from-[#1D4ED8] to-[#2563EB]",
  "from-[#2563EB] to-[#3B82F6]",
  "from-[#1E40AF] to-[#2563EB]",
  "from-[#1D4ED8] to-[#3B82F6]",
  "from-[#2563EB] to-[#1D4ED8]",
  "from-[#3B82F6] to-[#2563EB]",
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
