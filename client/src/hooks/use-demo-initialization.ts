import { useEffect } from 'react';
import { useStore } from '@/lib/store';

/**
 * Hook som initialiserar demosystemet med en standardanvändare
 * Kör bara en gång när appen startar
 */
export const useDemoInitialization = () => {
  const { user, setDemoPersona } = useStore();

  useEffect(() => {
    // Om ingen användare är satt och vi har en demoPersonaId, initiera persona
    if (!user.currentUser && user.demoPersonaId && user.isDemoMode) {
      console.log('Initializing demo system with persona:', user.demoPersonaId);
      setDemoPersona(user.demoPersonaId);
    }
  }, [user.currentUser, user.demoPersonaId, user.isDemoMode, setDemoPersona]);
};