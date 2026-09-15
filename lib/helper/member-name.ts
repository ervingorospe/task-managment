import { MemberDetail } from "../types/organization/member-detail.type";

export function getMemberName(member: MemberDetail) {
  const firstName = member.user?.firstName ?? member.firstName;
  const lastName = member.user?.lastName ?? member.lastName;

  return `${firstName} ${lastName}`;
}

export function getMemberEmail(member: MemberDetail) {
  return member.user?.email ?? member.email;
}
