import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MapPin, Trash, Coins, Medal, Settings, Home, ShoppingCart } from "lucide-react";

interface SidebarProps {
  open: boolean;
  userRole: "reporter" | "collector" | null; // Add userRole prop
  loggedIn: boolean; // Add loggedIn prop
}

export default function Sidebar({ open, userRole, loggedIn }: SidebarProps) {
  const pathname = usePathname();

  // Define all sidebar items
  const allItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/report", icon: MapPin, label: "Report Waste" },
    { href: "/collect", icon: Trash, label: "Collect Waste" },
    { href: "/rewards", icon: Coins, label: "Rewards" },
    { href: "/leaderboard", icon: Medal, label: "Leaderboard" },
    { href: "https://com-v8x8.vercel.app/", icon: ShoppingCart, label: "My Shop" },
  ];

  // Define sidebar items for Waste Reporter
  const reporterItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/report", icon: MapPin, label: "Report Waste" },
    { href: "/rewards", icon: Coins, label: "Rewards" },
    { href: "/leaderboard", icon: Medal, label: "Leaderboard" },
    { href: "https://com-v8x8.vercel.app/", icon: ShoppingCart, label: "My Shop" },
  ];

  // Define sidebar items for Waste Collector
  const collectorItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/collect", icon: Trash, label: "Collect Waste" },
    { href: "/rewards", icon: Coins, label: "Rewards" },
  ];

  // Determine which items to display based on the user's role and login status
  const sidebarItems = loggedIn
    ? userRole === "reporter"
      ? reporterItems
      : collectorItems
    : allItems;

  return (
    <aside
      className={`bg-white border-r pt-20 border-gray-200 text-gray-800 w-64 fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out ${
        open ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
    >
      <nav className="h-full flex flex-col justify-between">
        <div className="px-4 py-6 space-y-8">
          {sidebarItems.map((item) => (
            <Link key={item.href} href={item.href} passHref>
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={`w-full justify-start py-3 flex items-center transition-all duration-300 ${
                  pathname === item.href
                    ? "bg-green-100 text-green-800"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
                onClick={() => {
                  if (item.href.startsWith("http")) {
                    window.location.href = item.href;
                  }
                }}
              >
                <item.icon className="mr-3 h-6 w-6 transition-transform duration-300" />
                <span className="text-base transition-transform duration-300 ease-in-out transform hover:scale-110">
                  {item.label}
                </span>
              </Button>
            </Link>
          ))}
        </div>
        <div className="p-4 border-t border-gray-200">
          <Link href="/settings" passHref>
            <Button
              variant={pathname === "/settings" ? "secondary" : "outline"}
              className={`w-full py-3 flex items-center transition-all duration-300 ${
                pathname === "/settings"
                  ? "bg-green-100 text-green-800"
                  : "text-gray-600 border-gray-300 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Settings className="mr-3 h-6 w-6 transition-transform duration-300" />
              <span className="text-base transition-transform duration-300 ease-in-out transform hover:scale-110">
                Settings
              </span>
            </Button>
          </Link>
        </div>
      </nav>
    </aside>
  );
}