import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center max-w-md px-4">
        <h1 className="font-display text-7xl font-black text-primary mb-2">404</h1>
        <p className="text-xl text-muted-foreground mb-6">This page doesn't exist.</p>
        <Button asChild>
          <Link to="/"><Home className="h-4 w-4 mr-2" /> Back to Home</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
