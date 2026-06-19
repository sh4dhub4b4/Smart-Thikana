/**
 * AppLayout — shared shell with Navbar + Footer
 */
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function AppLayout() {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 animate-fade-in">
        <Outlet key={location.pathname} />
      </main>
      <Footer />
    </div>
  );
}
