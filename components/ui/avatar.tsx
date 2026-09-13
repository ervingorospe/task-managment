import clsx from "clsx";

type AvatarSize = "sm" | "md" | "lg";

const sizeMap: Record<AvatarSize, { box: string; text: string }> = {
  sm: { box: "h-6 w-6", text: "text-[10px]" },
  md: { box: "h-8 w-8", text: "text-sm" },
  lg: { box: "h-11 w-11", text: "text-base" },
};

interface AvatarProps {
  firstName: string;
  lastName?: string;
  src?: string; // if provided, renders an image instead of initials
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
  const { box, text } = sizeMap[size];
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={`${firstName} ${lastName}`.trim()}
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
    >
      {initials}
    </div>
  );
}
