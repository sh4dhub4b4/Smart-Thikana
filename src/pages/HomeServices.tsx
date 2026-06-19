import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function HomeServices({ userArea }: { userArea: string }) {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchJobs = async () => {
      try {
        const { data, error } = await supabase
          .from('service_bookings')
          .select('*, listings!inner(location, thana)')
          .eq('status', 'pending')
          .eq('listings.thana', userArea);
        if (!cancelled && !error) setRequests(data || []);
      } catch (err) {
        if (!cancelled) console.error("Failed to fetch service jobs:", err);
      }
    };
    fetchJobs();
    return () => { cancelled = true; };
  }, [userArea]);

  const handleResponse = async (bookingId: string, newStatus: 'accepted' | 'rejected') => {
    const { error } = await supabase
      .from('service_bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);
    if (error) { console.error("Failed to update booking:", error); return; }
    setRequests(prev => prev.filter(r => r.id !== bookingId));
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Service Requests in {userArea}</h1>
      <div className="grid gap-4">
        {requests.map(req => (
          <div key={req.id} className="border p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold">{req.service_type}</h3>
            <p>Location: {req.listings.location}</p>
            <div className="mt-4 flex gap-2">
              <button 
                onClick={() => handleResponse(req.id, 'accepted')}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >Accept</button>
              <button 
                onClick={() => handleResponse(req.id, 'rejected')}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}