'use client';

import { getCurrentUser } from "@/lib/auth/current-user";
import dynamic  from "next/dynamic";    
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
const Map = dynamic(() => import('@/components/LeafletMap'), {
    ssr: false,
});

async function MapPage() {
     const user = await getCurrentUser();
    
        if (!user) {
            redirect('/login');
        }
    console.log('MapPage component rendering');
    const lng = 90.37;
    const lat = 23.75;
    const origin = { lat, lng };
    const [markers, setMarkers] = useState([]);

    useEffect(() => {
        console.log('useEffect running, fetching markers...');
        fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
    }).then(res => res.json())
      .then(data => {
        console.log('Markers fetched:', data);
        setMarkers(data.markers);
      })
      .catch(error => {
        console.error('Error fetching markers:', error);
      });
    }, [lat, lng]);
    return (
        <div className="flex items-center justify-center h-screen w-full">
            <div className="h-full w-1/2">
                <Map base={origin} details={markers} />
            </div>
        </div>
    );
}

export default MapPage;