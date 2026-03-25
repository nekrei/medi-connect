import {pool} from '@/lib/db';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/current-user';

export type Review = {
    reviewid?: number;
    userid: number;
    doctorid: number;
    rating: number;
    comment: string;
    reviewdate: string;
}
export async function POST(req: Request) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await pool.connect();
    try {
        const body = await req.json();
        const review = body.review as Review;
        await client.query(
            `insert into reviews (userid, doctorid, rating, comment, reviewdate)
            values ($1, $2, $3, $4, $5)`,
            [parseInt(user.id), review.doctorid, review.rating, review.comment, review.reviewdate]
        );
        return NextResponse.json({ message: 'Review added successfully' });
    } catch (error) {
        console.error('Error adding review:', error);
        return NextResponse.json({ error: 'Failed to add review' }, { status: 500 });
    } finally {
        client.release();
    }
}