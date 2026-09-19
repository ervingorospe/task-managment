import Image from "next/image";
import clsx from "clsx";

type AvatarSize = "sm" | "md" | "lg" | "xl";

const sizeMap: Record<
  AvatarSize,
  { box: string; text: string; pixels: number }
> = {
  sm: { box: "h-6 w-6", text: "text-[10px]", pixels: 24 },
  md: { box: "h-8 w-8", text: "text-sm", pixels: 32 },
  lg: { box: "h-11 w-11", text: "text-base", pixels: 44 },
  xl: { box: "h-20 w-20", text: "text-2xl", pixels: 80 },
};

interface AvatarProps {
  firstName: string;
  lastName?: string;
  src?: string;
  size?: AvatarSize;
  className?: string;
}

export default function Avatar({
  firstName,
  lastName = "",
  src,
  size = "md",
  className,
}: AvatarProps) {
  const { box, text, pixels } = sizeMap[size];

  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  const name = `${firstName} ${lastName}`.trim();

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={pixels}
        height={pixels}
        className={clsx(box, "rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={clsx(
        box,
        text,
        "flex items-center justify-center rounded-full bg-ink font-medium leading-none text-accent",
        className,
      )}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
