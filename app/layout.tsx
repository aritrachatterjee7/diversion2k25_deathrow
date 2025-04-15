"use client"
import { useState, useEffect } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "react-hot-toast";
import { getAvailableRewards, getUserByEmail } from "@/utils/db/actions";

const inter = Inter({ subsets: ["latin"] });

interface Reward {
  id: number;
  name: string;
  cost: number;
  description: string | null;
  collectionInfo: string;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [userRole, setUserRole] = useState<"reporter" | "collector" | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const fetchTotalEarnings = async () => {
      try {
        const userEmail = localStorage.getItem("userEmail");
        if (userEmail) {
          const user = await getUserByEmail(userEmail);
          console.log("user from layout", user);

          if (user) {
            const rewards = await getAvailableRewards(user.id) as Reward[];
            console.log("availableRewards from layout", rewards);
            
            // Calculate total by summing all reward costs
            const total = rewards.reduce((sum, reward) => sum + reward.cost, 0);
            setTotalEarnings(total);
          }
        }
      } catch (error) {
        console.error("Error fetching total earnings:", error);
      }
    };

    fetchTotalEarnings();
  }, []);

  useEffect(() => {
    // Fetch the user's role and login status from localStorage
    const role = localStorage.getItem("userRole") as "reporter" | "collector" | null;
    const isLoggedIn = !!localStorage.getItem("userEmail");
    setUserRole(role);
    setLoggedIn(isLoggedIn);
  }, []);

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            totalEarnings={totalEarnings}
          />
          <div className="flex flex-1">
            <Sidebar open={sidebarOpen} userRole={userRole} loggedIn={loggedIn} />
            <main className="flex-1 p-4 lg:p-8 ml-0 lg:ml-64 transition-all duration-300">
              {children}
            </main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}