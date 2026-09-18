export interface TicketCommentAuthor {
  id: number;
  firstName: string;
  lastName: string;
  avatar?: string | null;
}

export interface TicketComment {
  id: number;
  ticketId: number;
  userId: number;
  comment: string;
  author: TicketCommentAuthor;
  createdAt: string;
  updatedAt: string;
}
