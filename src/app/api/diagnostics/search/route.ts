import { NextResponse } from 'next/server';

import { searchDiagnosticCenterTests } from '@/lib/repositories/test-report-repository';
import { getCurrentUser } from '@/lib/auth/current-user';

export async function GET(req: Request) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
        
    const searchParams = new URL(req.url).searchParams;

    const query = (searchParams.get('query') ?? '').trim();
    const district = (searchParams.get('district') ?? '').trim();
    const thana = (searchParams.get('thana') ?? '').trim();
    const minPriceRaw = (searchParams.get('minPrice') ?? '').trim();
    const maxPriceRaw = (searchParams.get('maxPrice') ?? '').trim();
    const testIdRaw = (searchParams.get('testId') ?? '').trim();

    const minPrice = minPriceRaw ? Number(minPriceRaw) : null;
    const maxPrice = maxPriceRaw ? Number(maxPriceRaw) : null;
    const testId = testIdRaw ? Number(testIdRaw) : null;

    if (minPriceRaw && (!Number.isFinite(minPrice) || Number(minPrice) < 0)) {
        return NextResponse.json({ message: 'Invalid minPrice' }, { status: 400 });
    }

    if (maxPriceRaw && (!Number.isFinite(maxPrice) || Number(maxPrice) < 0)) {
        return NextResponse.json({ message: 'Invalid maxPrice' }, { status: 400 });
    }

    if (testIdRaw && (!Number.isInteger(testId) || Number(testId) <= 0)) {
        return NextResponse.json({ message: 'Invalid testId' }, { status: 400 });
    }

    try {
        const data = await searchDiagnosticCenterTests({
            query,
            district: district || null,
            thana: thana || null,
            minPrice,
            maxPrice,
            testId,
        });

        return NextResponse.json({ data }, { status: 200 });
    } catch (error) {
        console.error('Failed to search diagnostic centers:', error);
        return NextResponse.json({ message: 'Failed to search diagnostic centers' }, { status: 500 });
    }
}
