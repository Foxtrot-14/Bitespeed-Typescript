export type PrecedenceType = "primary" | "secondary";

export interface User {
  id: number;
  phoneNumber: number;
  email: string;
  linkedId: number;
  linkPrecedence: PrecedenceType;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}
