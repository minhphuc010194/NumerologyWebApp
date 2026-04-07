/**
 * Custom hook for managing user AI provider settings (BYOK).
 * Handles CRUD operations, localStorage persistence, model fetching,
 * and connection testing for external AI providers.
 */
'use client';
import { useState, useCallback, useEffect } from 'react';
import type {
  AIProviderConfig,
  AIProviderType,
  ProviderRequestConfig
} from './provider-types';
import { PROVIDER_PRESETS, PROVIDER_STORAGE_KEY, toProviderRequestConfig } from './provider-types';

interface UseProviderSettingsReturn {
  /** All configured providers */
  providers: AIProviderConfig[];
  /** Currently active provider (null = system default) */
  activeProvider: AIProviderConfig | null;
  /** Whether models are being fetched */
  isLoadingModels: boolean;

  /** Add a new provider */
  addProvider: (config: AIProviderConfig) => void;
  /** Update an existing provider */
  updateProvider: (id: string, partial: Partial<AIProviderConfig>) => void;
  /** Remove a provider — auto-fallback to system default if was active */
  removeProvider: (id: string) => void;
  /** Set active provider (null = system default) */
  setActiveProvider: (id: string | null) => void;
  /** Fetch available models from provider */
  fetchAvailableModels: (
    baseUrl: string,
    apiKey: string,
    providerType: AIProviderType
  ) => Promise<string[]>;
  /** Test connection to a provider */
  testConnection: (
    baseUrl: string,
    apiKey: string,
    providerType: AIProviderType
  ) => Promise<boolean>;
  /** Get request-safe config for API calls (null = use system default) */
  getActiveProviderForRequest: () => ProviderRequestConfig | null;
  /** Create a blank provider config from a preset type */
  createBlankProvider: (type: AIProviderType) => AIProviderConfig;
}

export function useProviderSettings(): UseProviderSettingsReturn {
  const [providers, setProviders] = useState<AIProviderConfig[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROVIDER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AIProviderConfig[];
        if (Array.isArray(parsed)) {
          setProviders(parsed);
        }
      }
    } catch {
      console.warn('[ProviderSettings] Failed to load from localStorage');
    }
  }, []);

  const persistProviders = useCallback(
    (newProviders: AIProviderConfig[]) => {
      try {
        localStorage.setItem(
          PROVIDER_STORAGE_KEY,
          JSON.stringify(newProviders)
        );
      } catch {
        console.warn('[ProviderSettings] Failed to persist to localStorage');
      }
    },
    []
  );

  const activeProvider =
    providers.find((provider) => provider.isActive) ?? null;

  const addProvider = useCallback(
    (config: AIProviderConfig) => {
      setProviders((previous) => {
        const updated = [...previous, config];
        persistProviders(updated);
        return updated;
      });
    },
    [persistProviders]
  );

  const updateProvider = useCallback(
    (id: string, partial: Partial<AIProviderConfig>) => {
      setProviders((previous) => {
        const updated = previous.map((provider) =>
          provider.id === id ? { ...provider, ...partial } : provider
        );
        persistProviders(updated);
        return updated;
      });
    },
    [persistProviders]
  );

  const removeProvider = useCallback(
    (id: string) => {
      setProviders((previous) => {
        const updated = previous.filter((provider) => provider.id !== id);
        persistProviders(updated);
        return updated;
      });
    },
    [persistProviders]
  );

  const setActiveProvider = useCallback(
    (id: string | null) => {
      setProviders((previous) => {
        const updated = previous.map((provider) => ({
          ...provider,
          isActive: provider.id === id
        }));
        persistProviders(updated);
        return updated;
      });
    },
    [persistProviders]
  );

  const fetchAvailableModels = useCallback(
    async (
      baseUrl: string,
      apiKey: string,
      providerType: AIProviderType
    ): Promise<string[]> => {
      setIsLoadingModels(true);
      try {
        const response = await fetch('/api/provider-models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ baseUrl, apiKey, providerType })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            (errorData as { error?: string }).error ??
              `Failed with status ${response.status}`
          );
        }

        const data = (await response.json()) as { models: string[] };
        return data.models ?? [];
      } finally {
        setIsLoadingModels(false);
      }
    },
    []
  );

  const testConnection = useCallback(
    async (
      baseUrl: string,
      apiKey: string,
      providerType: AIProviderType
    ): Promise<boolean> => {
      try {
        const models = await fetchAvailableModels(
          baseUrl,
          apiKey,
          providerType
        );
        return models.length > 0;
      } catch {
        return false;
      }
    },
    [fetchAvailableModels]
  );

  const getActiveProviderForRequest =
    useCallback((): ProviderRequestConfig | null => {
      if (!activeProvider) return null;
      return toProviderRequestConfig(activeProvider);
    }, [activeProvider]);

  const createBlankProvider = useCallback(
    (type: AIProviderType): AIProviderConfig => {
      const preset = PROVIDER_PRESETS[type];
      return {
        id: crypto.randomUUID(),
        type,
        label: preset.label,
        baseUrl: preset.baseUrl,
        apiKeys: [],
        model: '',
        availableModels: [],
        isActive: false
      };
    },
    []
  );

  return {
    providers,
    activeProvider,
    isLoadingModels,
    addProvider,
    updateProvider,
    removeProvider,
    setActiveProvider,
    fetchAvailableModels,
    testConnection,
    getActiveProviderForRequest,
    createBlankProvider
  };
}
