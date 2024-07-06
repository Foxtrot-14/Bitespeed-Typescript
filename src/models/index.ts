export type PrecedenceType = "primary" | "secondary";

export interface User {
  id: string;
  phoneNumber: string;
  email: string;
  linkedId: string;
  linkPrecedence: PrecedenceType;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}
