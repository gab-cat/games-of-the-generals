import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import React from 'react';

interface IPStore {
  ipAddress: string | null;
  isLoading: boolean;
  error: string | null;
  fetchIP: () => Promise<void>;
}

// IP geolocation service - using a free service that provides IP address
const fetchIPAddress = async (): Promise<string> => {
  try {
    // Use a reliable IP detection service
    const response = await fetch('https://api.ipify.org?format=json', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch IP address');
    }

    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error fetching IP address:', error);

    // Fallback: try another service
    try {
      const response = await fetch('https://httpbin.org/ip', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Fallback IP service also failed');
      }

      const data = await response.json();
      return data.origin;
    } catch (fallbackError) {
      console.error('Fallback IP service failed:', fallbackError);

      // Last resort: use a simple echo service
      try {
        const response = await fetch('https://api64.ipify.org?format=json', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          return data.ip;
        }
      } catch (lastError) {
        console.error('All IP detection services failed:', lastError);
      }

      throw new Error('Unable to detect IP address');
    }
  }
};

export const useIPStore = create<IPStore>()(
  persist(
    (set, get) => ({
      ipAddress: null,
      isLoading: false,
      error: null,

      fetchIP: async () => {
        const { ipAddress, isLoading } = get();

        // If we already have an IP address and it's not loading, don't fetch again
        if (ipAddress && !isLoading) {
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const ip = await fetchIPAddress();
          set({ ipAddress: ip, isLoading: false, error: null });
          console.log('📍 IP address detected and stored:', ip);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          set({ error: errorMessage, isLoading: false });
          console.error('❌ Failed to fetch IP address:', errorMessage);
        }
      },
    }),
    {
      name: 'ip-store',
      // Only persist the IP address, not loading state or error
      partialize: (state) => ({ ipAddress: state.ipAddress }),
    }
  )
);

// Hook to get the current IP address and auto-fetch if needed
export const useIP = () => {
  const { ipAddress, isLoading, error, fetchIP } = useIPStore();

  // Auto-fetch IP if we don't have one and we're not loading
  React.useEffect(() => {
    if (!ipAddress && !isLoading && !error) {
      void fetchIP();
    }
  }, [ipAddress, isLoading, error, fetchIP]);

  return {
    ipAddress,
    isLoading,
    error,
    refetchIP: fetchIP,
  };
};
