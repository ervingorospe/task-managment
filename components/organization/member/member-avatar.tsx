import clsx from "clsx";
import Avatar from "@/components/ui/avatar";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";

type AvatarSize = "sm" | "md" | "lg" | "xl";

const sizeMap: Record<AvatarSize, { box: string; text: string }> = {
  sm: { box: "h-6 w-6", text: "text-[10px]" },
  md: { box: "h-8 w-8", text: "text-sm" },
  lg: { box: "h-11 w-11", text: "text-base" },
  xl: { box: "h-20 w-20", text: "text-2xl" },
};

interface MemberAvatarProps {
  member: MemberDetail;
  size?: AvatarSize;
  className?: string;
}

/**
 * Avatar for a MemberDetail (an assignee, client, or @mention target) —
 * falls back to a plain "?" glyph instead of initials when `user` is
 * null. MemberDetail's own firstName/lastName/email are a point-in-time
 * snapshot kept around only so a removed member's name can still be
 * displayed as text (see getMemberName()) after their org membership —
 * and with it, the `user` link — is gone. Rendering their old initials
 * in a normal colored avatar here would visually pass them off as still
 * being a real, active member.
 */
export default function MemberAvatar({
  member,
  size = "md",
  className,
}: MemberAvatarProps) {
  if (!member.user) {
    const { box, text } = sizeMap[size];
    return (
      <div
        className={clsx(
          box,
          text,
          "flex items-center justify-center rounded-full border border-dashed border-line bg-canvas font-medium leading-none text-ink-faint",
          className,
        )}
        aria-label="Removed member"
      >
        ?
      </div>
    );
  }

  return (
    <Avatar
      firstName={member.user.firstName}
      lastName={member.user.lastName}
      size={size}
      className={className}
    />
  );
}
