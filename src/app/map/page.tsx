'use client';
import dynamic  from "next/dynamic";    

const Map = dynamic(() => import('@/components/LeafletMap'), {
    ssr: false,
});

function MapPage() {
    const lng = 90.4125;
    const lat = 23.8103;
    const origin = { lat, lng };
    return (
        <div className="flex items-center justify-center h-screen w-full">
            <div className="h-1/2 w-1/2">
                <Map base={origin} />
            </div>
        </div>
    );
}

export default MapPage;