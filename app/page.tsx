"use client"; // Mark this component as a Client Component

import { useState, useEffect } from 'react';
import { ArrowRight, Earth, Recycle, Coins, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Poppins } from 'next/font/google';
import Link from 'next/link';
import { getRecentReports, getAllRewards, getWasteCollectionTasks } from '@/utils/db/actions';
import { motion } from 'framer-motion'; 

const poppins = Poppins({
  weight: ['300', '400', '600'],
  subsets: ['latin'],
  display: 'swap',
});

interface StatisticBadgeProps {
  value: string | number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

function StatisticBadge({ value, label, icon: Icon }: StatisticBadgeProps) {
  return (
    <div className="flex items-center gap-3 bg-green-50 px-4 py-2 rounded-full">
      <Icon className="h-5 w-5 text-green-600" />
      <div>
        <span className="font-bold text-green-800">{value}</span>
        <span className="ml-2 text-green-600 text-sm">{label}</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [impactData, setImpactData] = useState({
    wasteCollected: 0,
    reportsSubmitted: 0,
    tokensEarned: 0,
    co2Offset: 0
  });

  useEffect(() => {
    async function fetchImpactData() {
      try {
        const reports = await getRecentReports(100);
        const rewards = await getAllRewards();
        const tasks = await getWasteCollectionTasks(100);

        const wasteCollected = tasks.reduce((total, task) => {
          const match = task.amount.match(/(\d+(\.\d+)?)/);
          const amount = match ? parseFloat(match[0]) : 0;
          return total + amount;
        }, 0);

        const reportsSubmitted = reports.length;
        const tokensEarned = rewards.reduce((total, reward) => total + (reward.points || 0), 0);
        const co2Offset = wasteCollected * 0.5;

        setImpactData({
          wasteCollected: Math.round(wasteCollected * 10) / 10,
          reportsSubmitted,
          tokensEarned,
          co2Offset: Math.round(co2Offset * 10) / 10
        });
      } catch (error) {
        console.error("Error fetching impact data:", error);
        setImpactData({
          wasteCollected: 0,
          reportsSubmitted: 0,
          tokensEarned: 0,
          co2Offset: 0
        });
      }
    }

    fetchImpactData();
  }, []);

  return (
    <div className={`min-h-screen bg-gradient-to-b from-white to-green-50 ${poppins.className}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center text-center py-8"
        >
          {/* Earth Logo with Animation */}
          <div className="relative mb-4">
            <div className="aspect-square w-40 mx-auto relative">
              <div className="absolute inset-0 bg-green-200 rounded-full animate-pulse opacity-20"></div>
              <div className="absolute inset-8 bg-green-300 rounded-full animate-ping opacity-30"></div>
              <div className="absolute inset-16 bg-green-400 rounded-full animate-spin opacity-40"></div>
              <Earth className="absolute inset-0 m-auto h-28 w-28 text-green-600" />
            </div>
          </div>

          <h1 className="text-5xl font-bold text-gray-800 leading-tight mb-4">
            Transform Waste into
            <span className="block text-green-600 mt-2">Environmental Impact</span>
          </h1>
          <p className="text-gray-600 max-w-2xl mb-6">
            Join the movement to reduce waste, earn rewards, and make a positive impact on the planet.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <StatisticBadge value={`${impactData.wasteCollected}kg`} label="Waste Collected" icon={Recycle} />
            <StatisticBadge value={impactData.tokensEarned} label="Tokens Earned" icon={Coins} />
            <StatisticBadge value={`${impactData.co2Offset}kg`} label="CO2 Offset" icon={Earth} />
          </div>
          {!loggedIn ? (
            <Button
              onClick={() => setLoggedIn(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-12 py-6 rounded-full text-xl transition-all duration-300 ease-in-out transform hover:scale-105 hover:text-2xl"
              style={{ minWidth: '280px' }}
            >
              Join the Movement
              <ArrowRight className="ml-2" />
            </Button>
          ) : (
            <Link href="/report">
              <Button
                className="bg-green-600 hover:bg-green-700 text-white px-12 py-6 rounded-full text-xl transition-all duration-300 ease-in-out transform hover:scale-105 hover:text-2xl"
                style={{ minWidth: '280px' }}
              >
                Start Reporting
                <ArrowRight className="ml-2" />
              </Button>
            </Link>
          )}
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="py-16"
        >
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="flex flex-col md:flex-row gap-8">
            {[
              {
                icon: MapPin,
                title: "Report Waste",
                description: "Easily report waste locations and types through our intuitive interface"
              },
              {
                icon: Recycle,
                title: "Track Collection",
                description: "Monitor waste collection progress and environmental impact in real-time"
              },
              {
                icon: Coins,
                title: "Earn Rewards",
                description: "Get rewarded with tokens for your environmental contributions"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 + index * 0.2 }}
                className="flex-1 bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                </div>
                <p className="text-gray-600 mt-4">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Community Impact Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
          className="bg-white rounded-3xl p-8 shadow-lg mb-20"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Community Impact</h2>
            <p className="text-gray-600">Together, we are making a difference</p>
          </div>
          <div className="flex flex-wrap justify-around gap-4">
            <div className="text-center p-4">
              <div className="text-4xl font-bold text-green-600 mb-2">{impactData.wasteCollected}</div>
              <div className="text-sm text-gray-600">KG Waste Collected</div>
            </div>
            <div className="text-center p-4">
              <div className="text-4xl font-bold text-green-600 mb-2">{impactData.reportsSubmitted}</div>
              <div className="text-sm text-gray-600">Reports Submitted</div>
            </div>
            <div className="text-center p-4">
              <div className="text-4xl font-bold text-green-600 mb-2">{impactData.tokensEarned}</div>
              <div className="text-sm text-gray-600">Tokens Earned</div>
            </div>
            <div className="text-center p-4">
              <div className="text-4xl font-bold text-green-600 mb-2">{impactData.co2Offset}</div>
              <div className="text-sm text-gray-600">KG CO2 Offset</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}