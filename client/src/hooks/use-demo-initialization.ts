import { useEffect } from 'react';
import { useStore } from '@/lib/store';

/**
 * Hook som initialiserar demosystemet med en standardanvändare
 * Kör bara en gång när appen startar
 */
export const useDemoInitialization = () => {
  const { user, setDemoUser } = useStore();

  useEffect(() => {
    // Om ingen användare är satt och vi har en demoUserId, initiera användaren
    if (!user.currentUser && user.demoUserId && user.isDemoMode) {
      console.log('Initializing demo system with user:', user.demoUserId);
      setDemoUser(user.demoUserId);
    }
  }, [user.currentUser, user.demoUserId, user.isDemoMode, setDemoUser]);
};