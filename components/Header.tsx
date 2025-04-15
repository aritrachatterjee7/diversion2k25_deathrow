import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Menu, Search, Bell, User, ChevronDown, LogIn, Earth } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { createUser, getUnreadNotifications, markNotificationAsRead, getUserByEmail, getUserBalance } from "@/utils/db/actions";
import RoleSelectionModal from "@/components/ui/RoleSelectionModal";
import SecretKeyModal from "@/components/ui/SecretKeyModal";

type Notification = {
  id: number;
  type: string;
  message: string;
};

interface HeaderProps {
  onMenuClick: () => void;
  totalEarnings: number;
}

interface UserInfo {
  email?: string;
  name?: string;
  role?: 'reporter' | 'collector';
}

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x1",
  rpcTarget: "https://eth.llamarpc.com",
  displayName: "Ethereum Mainnet",
  blockExplorerUrl: "https://etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
};

export default function Header({ onMenuClick, totalEarnings }: HeaderProps) {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [balance, setBalance] = useState(totalEarnings || 0); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [retryCount, setRetryCount] = useState(0);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showSecretKeyModal, setShowSecretKeyModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const maxRetries = 3;

  // Use pathname without assigning to variable since it's not used
  usePathname();
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    const initWeb3Auth = async () => {
      try {
        const clientId = process.env.NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID;
        if (!clientId) {
          throw new Error("WEB3_AUTH_CLIENT_ID is not defined");
        }

        const privateKeyProvider = new EthereumPrivateKeyProvider({
          config: { chainConfig },
        });

        const networkToUse = retryCount >= 2
          ? WEB3AUTH_NETWORK.CYAN
          : WEB3AUTH_NETWORK.SAPPHIRE_DEVNET;

        const web3authInstance = new Web3Auth({
          clientId,
          web3AuthNetwork: networkToUse,
          privateKeyProvider,
        });

        await web3authInstance.initModal();
        setWeb3auth(web3authInstance);

        if (web3authInstance.connected) {
          setLoggedIn(true);
          setProvider(web3authInstance.provider);
          const user = await web3authInstance.getUserInfo();
          const role = localStorage.getItem('userRole');
          setUserInfo({ ...user, role: role as 'reporter' | 'collector' });

          if (user.email) {
            localStorage.setItem('userEmail', user.email);
            await createUser(user.email, user.name || 'Anonymous User');
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error initializing Web3Auth:", error);

        if (retryCount < maxRetries) {
          const nextRetry = retryCount + 1;
          setRetryCount(nextRetry);
          setTimeout(initWeb3Auth, 2000);
        } else {
          setLoading(false);
        }
      }
    };

    initWeb3Auth();
  }, [retryCount]);

  useEffect(() => {
    setBalance(prevBalance => {
      const newBalance = Math.max(prevBalance || 0, totalEarnings || 0);
      return isNaN(newBalance) ? 0 : newBalance;
    });
  }, [totalEarnings]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (userInfo?.email) {
          const user = await getUserByEmail(userInfo.email);
          if (user) {
            const unreadNotifications = await getUnreadNotifications(user.id);
            setNotifications(unreadNotifications);
          }
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    if (userInfo?.email) {
      fetchNotifications();
      const notificationInterval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(notificationInterval);
    }
  }, [userInfo]);

  useEffect(() => {
    const fetchUserBalance = async () => {
      try {
        if (userInfo?.email) {
          const user = await getUserByEmail(userInfo.email);
          if (user) {
            const userBalance = await getUserBalance(user.id);
            setBalance(prevBalance => {
              const newBalance = Math.max(prevBalance || 0, userBalance || 0, totalEarnings || 0);
              return isNaN(newBalance) ? 0 : newBalance;
            });
          }
        }
      } catch (error) {
        console.error("Error fetching user balance:", error);
      }
    };

    // Fetch balance immediately when the component mounts or userInfo changes
    fetchUserBalance();

    // Set up polling to fetch balance every 10 seconds
    const balanceInterval = setInterval(fetchUserBalance, 10000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(balanceInterval);
  }, [userInfo, totalEarnings]);

  const handleRoleSelection = async (role: 'reporter' | 'collector') => {
    localStorage.setItem('userRole', role);
    setShowRoleModal(false);

    if (role === 'collector') {
      setShowSecretKeyModal(true);
    } else {
      await login();
    }
  };

  const handleSecretKeySubmit = async (secretKey: string) => {
    try {
      // Check if the secret key is "123456"
      if (secretKey !== "123456") {
        alert("Invalid secret key. Please try again.");
        return;
      }

      // If the secret key is valid, proceed with Web3Auth login
      if (!web3auth) {
        throw new Error("web3auth not initialized");
      }

      const web3authProvider = await web3auth.connect();
      setProvider(web3authProvider);
      setLoggedIn(true);

      const user = await web3auth.getUserInfo();
      const role = localStorage.getItem('userRole') as 'reporter' | 'collector';
      setUserInfo({ ...user, role });

      if (user.email) {
        localStorage.setItem('userEmail', user.email);
        await createUser(user.email, user.name || 'Anonymous User');
      }

      setShowSecretKeyModal(false);
    } catch (error) {
      console.error("Error during secret key submission or Web3Auth login:", error);
      alert("Error during login. Please try again.");
    }
  };

  const login = async () => {
    try {
      if (!web3auth) {
        throw new Error("web3auth not initialized");
      }

      const web3authProvider = await web3auth.connect();
      setProvider(web3authProvider);
      setLoggedIn(true);

      const user = await web3auth.getUserInfo();
      const role = localStorage.getItem('userRole') as 'reporter' | 'collector';
      setUserInfo({ ...user, role });

      if (user.email) {
        localStorage.setItem('userEmail', user.email);
        await createUser(user.email, user.name || 'Anonymous User');
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("Error during login. Please try again later.");
    }
  };

  const logout = async () => {
    try {
      if (!web3auth) {
        throw new Error("web3auth not initialized");
      }

      await web3auth.logout();
      setProvider(null);
      setLoggedIn(false);
      setUserInfo(null);
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
    } catch (error) {
      console.error("Error during logout:", error);
      alert("Error during logout. Please try again.");
    }
  };

  const handleNotificationClick = async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification.id !== notificationId)
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  if (loading) {
    return <div className="p-4">Initializing Web3Auth... Please wait</div>;
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="mr-2 md:mr-4" onClick={() => { onMenuClick(); setIsSidebarOpen(!isSidebarOpen); }}>
              <Menu className="h-6 w-6" />
            </Button>
            <Link href="/" className="flex items-center">
              <Earth className="h-6 w-6 md:h-8 md:w-8 text-green-500 mr-1 md:mr-2" />
              <div className="flex flex-col">
                <span className="font-bold text-base md:text-lg text-gray-800">Bin.AI</span>
              </div>
            </Link>
          </div>

          {!isMobile && (
            <div className="flex-1 max-w-xl mx-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          )}

          <div className="flex items-center space-x-4 md:space-x-6">
            {isMobile && (
              <Button variant="ghost" size="icon" className="mr-2">
                <Search className="h-5 w-5" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-6 w-6 md:h-7 md:w-7" />
                  {notifications.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 px-1 min-w-[1.2rem] h-5">
                      {notifications.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{notification.type}</span>
                        <span className="text-sm text-gray-500">{notification.message}</span>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem>No new notifications</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {!loggedIn ? (
              <Button
                onClick={() => setShowRoleModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white text-sm md:text-base px-6 py-3 md:px-8 md:py-4 ml-4 md:ml-6"
              >
                Login
                <LogIn className="ml-2 h-5 w-5 md:h-6 md:w-6" />
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="flex items-center">
                    <User className="h-6 w-6 md:h-7 md:w-7 mr-1" />
                    <ChevronDown className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    {userInfo?.name || "Anonymous User"}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-500">
                    Role: {userInfo?.role === 'reporter' ? 'Waste Reporter' : 'Waste Collector'}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/settings">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>Sign Out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <RoleSelectionModal
        showRoleModal={showRoleModal}
        setShowRoleModal={setShowRoleModal}
        handleRoleSelection={handleRoleSelection}
      />

      <SecretKeyModal
        showModal={showSecretKeyModal}
        onClose={() => setShowSecretKeyModal(false)}
        onSubmit={handleSecretKeySubmit}
      />
    </>
  );
}