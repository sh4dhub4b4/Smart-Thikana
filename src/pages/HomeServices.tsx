import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function HomeServices({ userArea }: { userArea: string }) {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    // Fetch pending jobs in the worker's thana
    const fetchJobs = async () => {
      const { data } = await supabase
        .from('service_bookings')
        .select('*, listings(location, thana)')
        .eq('status', 'pending')
        .eq('listings.thana', userArea); // Filter by worker's location
      setRequests(data || []);
    };
    fetchJobs();
  }, [userArea]);

  const handleResponse = async (bookingId: string, newStatus: 'accepted' | 'rejected') => {
    await supabase
      .from('service_bookings')
      .update({ status: newStatus })
      .eq('id', bookingId);
    // Refresh local state
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