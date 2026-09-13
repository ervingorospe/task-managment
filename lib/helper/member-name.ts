import { MemberDetail } from "../types/organization/member-detail.type";

export function getMemberName(member: MemberDetail) {
  const firstName = member.user?.first_name ?? member.first_name;
  const lastName = member.user?.last_name ?? member.last_name;

  return `${firstName} ${lastName}`;
}

export function getMemberEmail(member: MemberDetail) {
  return member.user?.email ?? member.email;
}
