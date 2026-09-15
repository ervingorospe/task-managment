export interface TagDetail {
  id: number;
  tagName: string;
  color: string;
  isDefault: boolean;
  orgId?: number;
  isDeleted?: boolean;
}
