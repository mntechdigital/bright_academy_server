export interface IReview {
    id?: string;
    name: string;
    author: string;
    rating: number;
    description: string;
    image: string;
    status?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
