import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Define the interface locally so TypeScript knows what 'row' looks like
interface AdminStats {
  thana: string;
  district: string;
  total_landlords: number;
  total_tax_collection: number;
  registered_workers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      // Use 'as any' to bypass the relation check until types are updated
      const { data, error } = await supabase
        .from('admin_platform_monitor' as any)
        .select('*');
      
      if (error) {
        console.error("Error fetching admin stats:", error);
        setError(error.message);
        return;
      }
      
      setStats(data || []);
    };
    fetchStats();
  }, []);

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6 text-green-800">Platform Admin Overview</h1>
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-red-800">
          Failed to load admin stats: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-green-800">Platform Admin Overview</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 border">Location (Thana)</th>
              <th className="p-3 border">Landlords</th>
              <th className="p-3 border">Total Tax Collected</th>
              <th className="p-3 border">Workers</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="p-3 border">{row.thana}, {row.district}</td>
                <td className="p-3 border">{row.total_landlords}</td>
                <td className="p-3 border">৳{row.total_tax_collection?.toLocaleString()}</td>
                <td className="p-3 border">{row.registered_workers}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}