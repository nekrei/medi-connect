import { getCurrentUser } from "@/lib/auth/current-user";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    if (!query) {
        return NextResponse.json(
            {
                message: 'Query expected found none'
            },
            {
                status: 500
            });
    }   
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
        )
        const data = await response.json();
        return NextResponse.json({data: data}, {status: 200});
    }catch (error) {
        console.error('Error fetching coordinates:', error);
        return NextResponse.json(
            {
                message: 'Failed to fetch coordinates'
            },
            {
                status: 500
            });
    }
}