/**
 * Multi-profile management hook.
 * Persists numerology profiles to localStorage with CRUD operations.
 * Max 10 profiles per user.
 */
import { useState, useCallback, useEffect, useMemo } from 'react';

const STORAGE_KEY = 'numerology-profiles';
const MAX_PROFILES = 10;

export interface NumerologyProfile {
  id: string;
  name: string;
  birthDate: string;
  createdAt: string;
}

function generateProfileId(): string {
  return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadProfilesFromStorage(): NumerologyProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveProfilesToStorage(profiles: NumerologyProfile[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<NumerologyProfile[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setProfiles(loadProfilesFromStorage());
    setIsLoaded(true);
  }, []);

  const saveProfile = useCallback(
    (
      name: string,
      birthDate: string
    ): { success: boolean; isMaxReached: boolean } => {
      const trimmedName = name.trim();
      if (!trimmedName || !birthDate) {
        return { success: false, isMaxReached: false };
      }

      setProfiles((prev) => {
        // Check if profile with same name+birthDate already exists
        const existingIndex = prev.findIndex(
          (p) =>
            p.name.toLowerCase() === trimmedName.toLowerCase() &&
            p.birthDate === birthDate
        );

        if (existingIndex >= 0) {
          // Update existing profile timestamp
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            createdAt: new Date().toISOString()
          };
          saveProfilesToStorage(updated);
          return updated;
        }

        // Check max limit
        if (prev.length >= MAX_PROFILES) {
          return prev; // Will be caught by return value
        }

        const newProfile: NumerologyProfile = {
          id: generateProfileId(),
          name: trimmedName,
          birthDate,
          createdAt: new Date().toISOString()
        };

        const updated = [newProfile, ...prev];
        saveProfilesToStorage(updated);
        return updated;
      });

      // Check if max was reached before save
      const currentProfiles = loadProfilesFromStorage();
      const alreadyExists = currentProfiles.some(
        (p) =>
          p.name.toLowerCase() === trimmedName.toLowerCase() &&
          p.birthDate === birthDate
      );

      if (!alreadyExists && currentProfiles.length >= MAX_PROFILES) {
        return { success: false, isMaxReached: true };
      }

      return { success: true, isMaxReached: false };
    },
    []
  );

  const deleteProfile = useCallback((profileId: string) => {
    setProfiles((prev) => {
      const updated = prev.filter((p) => p.id !== profileId);
      saveProfilesToStorage(updated);
      return updated;
    });
  }, []);

  const getProfile = useCallback(
    (profileId: string): NumerologyProfile | undefined => {
      return profiles.find((p) => p.id === profileId);
    },
    [profiles]
  );

  return useMemo(() => ({
    profiles,
    isLoaded,
    saveProfile,
    deleteProfile,
    getProfile,
    maxProfiles: MAX_PROFILES
  }), [profiles, isLoaded, saveProfile, deleteProfile, getProfile]);
}
