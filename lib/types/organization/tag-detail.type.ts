export interface TagDetail {
  id: number;
  tag_name: string;
  color: string;
  isDefault: boolean;
  org_id?: number;
  isDeleted?: boolean;
}
