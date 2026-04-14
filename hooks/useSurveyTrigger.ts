'use client';

import { useState, useCallback, useEffect } from 'react';

// --- Custom Event ---
const SURVEY_OPEN_EVENT = 'open-survey';

/** Dispatch this from anywhere to force-open the survey banner */
export function openSurveyManually(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SURVEY_OPEN_EVENT));
  }
}

// --- Constants ---
const STORAGE_KEY_USAGE_COUNT = 'survey-usage-count';
const STORAGE_KEY_COMPLETED = 'survey-completed';
const STORAGE_KEY_DISMISSED_AT = 'survey-dismissed-at';

/** Minimum usage actions before showing survey */
const USAGE_THRESHOLD = 2;
/** Cooldown period after dismiss (days) */
const DISMISS_COOLDOWN_DAYS = 1;
/** Delay before showing banner after threshold met (ms) */
export const SURVEY_SHOW_DELAY_MS = 3000;

// --- Helpers ---

function getStorageNumber(key: string): number {
  if (typeof window === 'undefined') return 0;
  const val = localStorage.getItem(key);
  return val ? parseInt(val, 10) || 0 : 0;
}

function isWithinCooldown(): boolean {
  if (typeof window === 'undefined') return true;
  const dismissedAt = localStorage.getItem(STORAGE_KEY_DISMISSED_AT);
  if (!dismissedAt) return false;

  const dismissedTime = parseInt(dismissedAt, 10);
  if (isNaN(dismissedTime)) return false;

  const cooldownMs = DISMISS_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - dismissedTime < cooldownMs;
}

function isAlreadyCompleted(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(STORAGE_KEY_COMPLETED) === 'true';
}

// --- Hook ---

interface UseSurveyTriggerReturn {
  /** Whether the survey banner should be displayed */
  shouldShowSurvey: boolean;
  /** Whether this is a manual re-open (user clicked feedback button) */
  isManualOpen: boolean;
  /** Increment usage counter (call after user completes a key action) */
  incrementUsage: () => void;
  /** Mark survey as completed (user submitted responses) */
  markCompleted: () => void;
  /** Mark survey as dismissed (user closed without completing) */
  markDismissed: () => void;
  /** Current usage count */
  usageCount: number;
}

export function useSurveyTrigger(): UseSurveyTriggerReturn {
  const [usageCount, setUsageCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);

  // Initialize from localStorage + listen for manual open event
  useEffect(() => {
    const count = getStorageNumber(STORAGE_KEY_USAGE_COUNT);
    setUsageCount(count);
    setIsReady(true);

    const handleManualOpen = () => {
      setIsManualOpen(true);
      setIsVisible(true);
    };

    window.addEventListener(SURVEY_OPEN_EVENT, handleManualOpen);
    return () => {
      window.removeEventListener(SURVEY_OPEN_EVENT, handleManualOpen);
    };
  }, []);

  // Evaluate auto-trigger visibility (skip if manually opened)
  useEffect(() => {
    if (!isReady || isManualOpen) return;
    if (isAlreadyCompleted() || isWithinCooldown()) {
      setIsVisible(false);
      return;
    }

    if (usageCount >= USAGE_THRESHOLD) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, SURVEY_SHOW_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [usageCount, isReady, isManualOpen]);

  const incrementUsage = useCallback(() => {
    setUsageCount((prev) => {
      const next = prev + 1;
      localStorage.setItem(STORAGE_KEY_USAGE_COUNT, String(next));
      return next;
    });
  }, []);

  const markCompleted = useCallback(() => {
    if (!isManualOpen) {
      // Only permanently mark as completed for auto-triggered surveys
      localStorage.setItem(STORAGE_KEY_COMPLETED, 'true');
    }
    setIsVisible(false);
    setIsManualOpen(false);
  }, [isManualOpen]);

  const markDismissed = useCallback(() => {
    if (!isManualOpen) {
      // Only set cooldown for auto-triggered surveys, not manual opens
      localStorage.setItem(STORAGE_KEY_DISMISSED_AT, String(Date.now()));
    }
    setIsVisible(false);
    setIsManualOpen(false);
  }, [isManualOpen]);

  return {
    shouldShowSurvey: isVisible,
    isManualOpen,
    incrementUsage,
    markCompleted,
    markDismissed,
    usageCount
  };
}
