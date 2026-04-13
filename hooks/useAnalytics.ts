/**
 * Google Analytics event tracking hook.
 * Uses the existing gtag setup from layout.tsx.
 * Provides typed event helpers for all numerology features.
 */
import { useCallback, useMemo } from 'react';

// Extend Window to include gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type NumerologyEvent =
  | 'birth_chart_view'
  | 'birth_chart_cell_click'
  | 'meaning_request'
  | 'meaning_cache_hit'
  | 'profile_save'
  | 'profile_load'
  | 'profile_delete'
  | 'formula_view'
  | 'numerology_calculate';

interface EventParams {
  [key: string]: string | number | boolean | undefined;
}

function sendGAEvent(eventName: NumerologyEvent, params?: EventParams): void {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', eventName, {
    event_category: 'numerology',
    ...params
  });
}

export function useAnalytics() {
  const trackEvent = useCallback(
    (eventName: NumerologyEvent, params?: EventParams) => {
      sendGAEvent(eventName, params);
    },
    []
  );

  const trackBirthChartView = useCallback((birthDate: string) => {
    sendGAEvent('birth_chart_view', { birth_date: birthDate });
  }, []);

  const trackBirthChartCellClick = useCallback((number: number) => {
    sendGAEvent('birth_chart_cell_click', { cell_number: number });
  }, []);

  const trackMeaningRequest = useCallback(
    (metric: string, value: string | number) => {
      sendGAEvent('meaning_request', { metric, value: String(value) });
    },
    []
  );

  const trackMeaningCacheHit = useCallback(
    (metric: string, value: string | number) => {
      sendGAEvent('meaning_cache_hit', { metric, value: String(value) });
    },
    []
  );

  const trackProfileSave = useCallback((profileCount: number) => {
    sendGAEvent('profile_save', { profile_count: profileCount });
  }, []);

  const trackProfileLoad = useCallback((profileName: string) => {
    sendGAEvent('profile_load', { profile_name: profileName });
  }, []);

  const trackFormulaView = useCallback((metric: string) => {
    sendGAEvent('formula_view', { metric });
  }, []);

  const trackNumerologyCalculate = useCallback(
    (name: string, birthDate: string) => {
      sendGAEvent('numerology_calculate', {
        has_name: name.length > 0,
        birth_date: birthDate
      });
    },
    []
  );

  return useMemo(() => ({
    trackEvent,
    trackBirthChartView,
    trackBirthChartCellClick,
    trackMeaningRequest,
    trackMeaningCacheHit,
    trackProfileSave,
    trackProfileLoad,
    trackFormulaView,
    trackNumerologyCalculate
  }), [
    trackEvent,
    trackBirthChartView,
    trackBirthChartCellClick,
    trackMeaningRequest,
    trackMeaningCacheHit,
    trackProfileSave,
    trackProfileLoad,
    trackFormulaView,
    trackNumerologyCalculate
  ]);
}
