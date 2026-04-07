/**
 * Provider Settings UI — Accordion section inside the Chat Drawer.
 * Allows users to configure custom AI providers (BYOK) with:
 *   - Provider type selection (auto-fills base URL)
 *   - Multiple API keys input (round-robin)
 *   - Fetch available models from provider
 *   - Connection testing
 *   - Active provider switching
 */
'use client';
import { useState, useRef } from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  Badge,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Radio,
  RadioGroup,
  Select,
  Spinner,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  Tooltip,
  useToast,
  VStack,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import {
  MdAdd,
  MdCheck,
  MdClose,
  MdDelete,
  MdEdit,
  MdInfoOutline,
  MdRefresh,
  MdSettings,
  MdVisibility,
  MdVisibilityOff,
  MdWifi,
  MdWifiOff
} from 'react-icons/md';
import type {
  AIProviderConfig,
  AIProviderType
} from '@/hooks/provider-types';
import { PROVIDER_PRESETS } from '@/hooks/provider-types';
import type { useProviderSettings } from '@/hooks/use-provider-settings';

/** TranslationFunction expected from useTranslations('Chat') */
type TranslationFunction = (key: string, values?: Record<string, string>) => string;

interface ProviderSettingsProps {
  providerHook: ReturnType<typeof useProviderSettings>;
  t: TranslationFunction;
}

/** Color tokens used across the component */
const useProviderColors = () => ({
  inputBg: 'transparent',
  sectionBorder: 'inherit'
});

export function ProviderSettings({ providerHook, t }: ProviderSettingsProps) {
  const {
    providers,
    activeProvider,
    isLoadingModels,
    addProvider,
    updateProvider,
    removeProvider,
    setActiveProvider,
    fetchAvailableModels,
    testConnection,
    createBlankProvider
  } = providerHook;

  const toast = useToast();
  const [isAddingProvider, setIsAddingProvider] = useState(false);
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [formState, setFormState] = useState<AIProviderConfig | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'testing' | 'success' | 'failed'
  >('idle');

  const keyInputRef = useRef<HTMLInputElement>(null);

  const providerTypeOptions = Object.entries(PROVIDER_PRESETS).map(
    ([key, preset]) => ({
      value: key as AIProviderType,
      label: preset.label
    })
  );

  // --- Form Handlers ---

  const handleStartAdd = () => {
    setFormState(createBlankProvider('openai'));
    setIsAddingProvider(true);
    setEditingProviderId(null);
    setKeyInput('');
    setConnectionStatus('idle');
  };

  const handleStartEdit = (provider: AIProviderConfig) => {
    setFormState({ ...provider });
    setEditingProviderId(provider.id);
    setIsAddingProvider(false);
    setKeyInput('');
    setConnectionStatus('idle');
  };

  const handleCancel = () => {
    setFormState(null);
    setIsAddingProvider(false);
    setEditingProviderId(null);
    setKeyInput('');
    setConnectionStatus('idle');
  };

  const handleTypeChange = (type: AIProviderType) => {
    if (!formState) return;
    const preset = PROVIDER_PRESETS[type];
    setFormState({
      ...formState,
      type,
      label: preset.label,
      baseUrl: preset.baseUrl,
      apiKeys: [],
      model: '',
      availableModels: []
    });
    setConnectionStatus('idle');
  };

  const handleAddKey = () => {
    if (!formState || !keyInput.trim()) return;
    const trimmedKey = keyInput.trim();
    if (formState.apiKeys.includes(trimmedKey)) {
      toast({
        title: 'Key already added',
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }
    setFormState({
      ...formState,
      apiKeys: [...formState.apiKeys, trimmedKey]
    });
    setKeyInput('');
    keyInputRef.current?.focus();
  };

  /**
   * Auto-adds the key currently typed in the input to apiKeys.
   * Returns the updated formState with the pending key included.
   * This ensures buttons work even if user hasn't clicked '+'.
   */
  const ensurePendingKeyAdded = (): AIProviderConfig | null => {
    if (!formState) return null;
    if (!keyInput.trim()) return formState;

    const trimmedKey = keyInput.trim();
    if (formState.apiKeys.includes(trimmedKey)) return formState;

    const updatedForm = {
      ...formState,
      apiKeys: [...formState.apiKeys, trimmedKey]
    };
    setFormState(updatedForm);
    setKeyInput('');
    return updatedForm;
  };

  const handleRemoveKey = (index: number) => {
    if (!formState) return;
    setFormState({
      ...formState,
      apiKeys: formState.apiKeys.filter((_, i) => i !== index)
    });
  };

  const handleFetchModels = async () => {
    const currentForm = ensurePendingKeyAdded();
    if (!currentForm) return;
    const firstKey = currentForm.apiKeys[0] ?? '';
    const preset = PROVIDER_PRESETS[currentForm.type];

    if (preset.requiresApiKey && !firstKey) {
      toast({
        title: t('providerApiKeys'),
        description: 'API key is required',
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }

    try {
      const models = await fetchAvailableModels(
        currentForm.baseUrl,
        firstKey,
        currentForm.type
      );

      if (models.length === 0) {
        toast({
          title: t('providerNoModels'),
          status: 'warning',
          duration: 3000,
          position: 'top'
        });
        return;
      }

      setFormState({
        ...currentForm,
        availableModels: models,
        model: currentForm.model || models[0]
      });

      toast({
        title: `${models.length} models`,
        status: 'success',
        duration: 2000,
        position: 'top'
      });
    } catch (error) {
      toast({
        title: t('providerTestFailed'),
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 3000,
        position: 'top'
      });
    }
  };

  const handleTestConnection = async () => {
    const currentForm = ensurePendingKeyAdded();
    if (!currentForm) return;
    setConnectionStatus('testing');

    const firstKey = currentForm.apiKeys[0] ?? '';
    const isConnected = await testConnection(
      currentForm.baseUrl,
      firstKey,
      currentForm.type
    );

    setConnectionStatus(isConnected ? 'success' : 'failed');

    toast({
      title: isConnected ? t('providerTestSuccess') : t('providerTestFailed'),
      status: isConnected ? 'success' : 'error',
      duration: 3000,
      position: 'top'
    });
  };

  const handleSave = () => {
    const currentForm = ensurePendingKeyAdded();
    if (!currentForm) return;

    if (!currentForm.model) {
      toast({
        title: t('providerSelectModel'),
        status: 'warning',
        duration: 2000,
        position: 'top'
      });
      return;
    }

    if (editingProviderId) {
      updateProvider(editingProviderId, currentForm);
    } else {
      addProvider(currentForm);
    }

    handleCancel();
  };

  const handleDelete = (id: string) => {
    removeProvider(id);
    if (editingProviderId === id) handleCancel();
  };

  const maskApiKey = (key: string): string => {
    if (key.length <= 8) return '••••••••';
    return `••••••${key.slice(-4)}`;
  };

  /** Check if keys are available (either already added or pending in input) */
  const hasKeysOrPendingKey =
    formState &&
    (formState.apiKeys.length > 0 || keyInput.trim().length > 0);

  const isFormValid =
    formState &&
    formState.baseUrl.trim() &&
    formState.model &&
    (hasKeysOrPendingKey ||
      !PROVIDER_PRESETS[formState.type].requiresApiKey);

  const isActionDisabled =
    !formState?.baseUrl ||
    (formState && PROVIDER_PRESETS[formState.type].requiresApiKey &&
      !hasKeysOrPendingKey);

  const isEditing = isAddingProvider || editingProviderId !== null;

  // --- Render ---

  return (
    <Accordion allowToggle>
      <AccordionItem border="none">
        <AccordionButton
          px={3}
          py={2}
          borderRadius="md"
          _hover={{ bg: 'blackAlpha.50', _dark: { bg: 'whiteAlpha.100' } }}
        >
          <HStack flex={1} spacing={2} overflow="hidden">
            <Icon as={MdSettings} color="brand.500" flexShrink={0} />
            <Text fontSize="sm" fontWeight="medium" whiteSpace="nowrap" isTruncated>
              {t('providerSettings')}
            </Text>
            {activeProvider ? (
              <Badge
                colorScheme="green"
                fontSize="2xs"
                borderRadius="full"
                px={2}
              >
                {activeProvider.label}
              </Badge>
            ) : (
              <Badge
                colorScheme="gray"
                fontSize="2xs"
                borderRadius="full"
                px={2}
              >
                {t('providerDefault')}
              </Badge>
            )}
          </HStack>
          <AccordionIcon />
        </AccordionButton>

        <AccordionPanel px={3} pb={3}>
          <VStack spacing={3} align="stretch">
            {/* Active Provider Selection */}
            <RadioGroup
              value={activeProvider?.id ?? 'system'}
              onChange={(value) =>
                setActiveProvider(value === 'system' ? null : value)
              }
            >
              <VStack spacing={1} align="stretch">
                {/* System Default Option */}
                <Flex
                  p={2}
                  borderRadius="md"
                  align="center"
                  _hover={{
                    bg: 'blackAlpha.50',
                    _dark: { bg: 'whiteAlpha.50' }
                  }}
                >
                  <Radio value="system" size="sm" colorScheme="brand">
                    <Text fontSize="sm">{t('providerDefault')}</Text>
                  </Radio>
                </Flex>

                {/* User Providers */}
                {providers.map((provider) => (
                  <Flex
                    key={provider.id}
                    p={2}
                    borderRadius="md"
                    align="center"
                    bg={
                      provider.isActive
                        ? 'brand.50'
                        : 'transparent'
                    }
                    _dark={{
                      bg: provider.isActive
                        ? 'whiteAlpha.100'
                        : 'transparent'
                    }}
                    _hover={{
                      bg: 'blackAlpha.50',
                      _dark: { bg: 'whiteAlpha.50' }
                    }}
                  >
                    <Radio
                      value={provider.id}
                      size="sm"
                      colorScheme="brand"
                      flex={1}
                    >
                      <HStack spacing={2}>
                        <Text fontSize="sm" fontWeight="medium">
                          {provider.label}
                        </Text>
                        <Badge fontSize="2xs" colorScheme="purple">
                          {provider.model.length > 20
                            ? `${provider.model.slice(0, 20)}…`
                            : provider.model}
                        </Badge>
                      </HStack>
                    </Radio>
                    <HStack spacing={0}>
                      <Tooltip label={t('providerEdit')} hasArrow>
                        <IconButton
                          icon={<Icon as={MdEdit} />}
                          size="xs"
                          variant="ghost"
                          aria-label="Edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(provider);
                          }}
                        />
                      </Tooltip>
                      <Tooltip label={t('providerDelete')} hasArrow>
                        <IconButton
                          icon={<Icon as={MdDelete} />}
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          aria-label="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(provider.id);
                          }}
                        />
                      </Tooltip>
                    </HStack>
                  </Flex>
                ))}
              </VStack>
            </RadioGroup>

            {/* Add Provider Button */}
            {!isEditing && (
              <Button
                size="sm"
                variant="outline"
                colorScheme="brand"
                leftIcon={<Icon as={MdAdd} />}
                onClick={handleStartAdd}
              >
                {t('providerAdd')}
              </Button>
            )}

            {/* Add/Edit Provider Form */}
            {isEditing && formState && (
              <>
                <Divider />
                <VStack
                  spacing={3}
                  align="stretch"
                  p={3}
                  borderRadius="md"
                  borderWidth={1}
                  borderColor="brand.200"
                  _dark={{ borderColor: 'whiteAlpha.200' }}
                  borderStyle="dashed"
                >
                  <Text fontSize="sm" fontWeight="bold" color="brand.500">
                    {editingProviderId
                      ? t('providerEdit')
                      : t('providerAdd')}
                  </Text>

                  {/* Provider Type */}
                  <FormControl size="sm">
                    <FormLabel fontSize="xs">{t('providerType')}</FormLabel>
                    <Select
                      size="sm"
                      value={formState.type}
                      onChange={(e) =>
                        handleTypeChange(e.target.value as AIProviderType)
                      }
                    >
                      {providerTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Display Name */}
                  <FormControl size="sm">
                    <FormLabel fontSize="xs">{t('providerLabel')}</FormLabel>
                    <Input
                      size="sm"
                      value={formState.label}
                      onChange={(e) =>
                        setFormState({ ...formState, label: e.target.value })
                      }
                      placeholder="My OpenAI Key"
                    />
                  </FormControl>

                  {/* Base URL */}
                  <FormControl size="sm">
                    <FormLabel fontSize="xs">{t('providerBaseUrl')}</FormLabel>
                    <Input
                      size="sm"
                      value={formState.baseUrl}
                      onChange={(e) =>
                        setFormState({ ...formState, baseUrl: e.target.value })
                      }
                      placeholder={
                        PROVIDER_PRESETS[formState.type].urlPlaceholder
                      }
                    />
                  </FormControl>

                  {/* API Keys */}
                  <FormControl size="sm">
                    <FormLabel fontSize="xs" display="flex" alignItems="center">
                      {t('providerApiKeys')}
                      <Tooltip label={t('providerMultiKeyHint')} placement="top" hasArrow>
                        <Box as="span" ml={1} display="inline-flex" alignItems="center">
                          <Icon as={MdInfoOutline} boxSize={3.5} color="gray.400" _dark={{ color: 'gray.500' }} cursor="help" />
                        </Box>
                      </Tooltip>
                      {formState.apiKeys.length > 1 && (
                        <Badge
                          ml={2}
                          fontSize="2xs"
                          colorScheme="blue"
                        >
                          Round-robin ×{formState.apiKeys.length}
                        </Badge>
                      )}
                    </FormLabel>

                    {/* Existing keys (masked) */}
                    {formState.apiKeys.length > 0 && (
                      <Wrap spacing={1} mb={2}>
                        {formState.apiKeys.map((key, index) => (
                          <WrapItem key={index}>
                            <Tag
                              size="sm"
                              variant="subtle"
                              colorScheme="gray"
                            >
                              <TagLabel fontFamily="mono" fontSize="xs">
                                {maskApiKey(key)}
                              </TagLabel>
                              <TagCloseButton
                                onClick={() => handleRemoveKey(index)}
                              />
                            </Tag>
                          </WrapItem>
                        ))}
                      </Wrap>
                    )}

                    {/* Key Input */}
                    <InputGroup size="sm">
                      <Input
                        ref={keyInputRef}
                        type={showKeyInput ? 'text' : 'password'}
                        value={keyInput}
                        onChange={(e) => setKeyInput(e.target.value)}
                        placeholder={
                          PROVIDER_PRESETS[formState.type].keyPlaceholder +
                          t('providerMultiKeyPlaceholder')
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddKey();
                          }
                        }}
                      />
                      <InputRightElement width="4rem">
                        <HStack spacing={0}>
                          <IconButton
                            icon={
                              <Icon
                                as={
                                  showKeyInput
                                    ? MdVisibilityOff
                                    : MdVisibility
                                }
                                boxSize={3.5}
                              />
                            }
                            size="xs"
                            variant="ghost"
                            aria-label="Toggle key visibility"
                            onClick={() => setShowKeyInput(!showKeyInput)}
                          />
                          <IconButton
                            icon={<Icon as={MdAdd} boxSize={3.5} />}
                            size="xs"
                            variant="ghost"
                            colorScheme="brand"
                            aria-label="Add key"
                            onClick={handleAddKey}
                            isDisabled={!keyInput.trim()}
                          />
                        </HStack>
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  {/* Fetch Models + Model Select */}
                  <FormControl size="sm">
                    <FormLabel fontSize="xs">{t('providerModel')}</FormLabel>
                    <HStack spacing={2}>
                      <Button
                        size="xs"
                        colorScheme="blue"
                        variant="outline"
                        leftIcon={
                          isLoadingModels ? (
                            <Spinner size="xs" />
                          ) : (
                            <Icon as={MdRefresh} />
                          )
                        }
                        onClick={handleFetchModels}
                        isLoading={isLoadingModels}
                        loadingText={t('providerFetchingModels')}
                        isDisabled={isActionDisabled}
                      >
                        {t('providerFetchModels')}
                      </Button>
                    </HStack>

                    {formState.availableModels.length > 0 && (
                      <Select
                        size="sm"
                        mt={2}
                        value={formState.model}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            model: e.target.value
                          })
                        }
                        placeholder={t('providerSelectModel')}
                      >
                        {formState.availableModels.map((modelId) => (
                          <option key={modelId} value={modelId}>
                            {modelId}
                          </option>
                        ))}
                      </Select>
                    )}
                  </FormControl>

                  {/* Actions: Test + Save + Cancel */}
                  <HStack spacing={2} pt={1}>
                    <Tooltip label={t('providerTestConnection')} hasArrow>
                      <IconButton
                        icon={
                          <Icon
                            as={
                              connectionStatus === 'success'
                                ? MdWifi
                                : connectionStatus === 'failed'
                                  ? MdWifiOff
                                  : MdWifi
                            }
                          />
                        }
                        size="sm"
                        variant="outline"
                        colorScheme={
                          connectionStatus === 'success'
                            ? 'green'
                            : connectionStatus === 'failed'
                              ? 'red'
                              : 'gray'
                        }
                        aria-label="Test connection"
                        onClick={handleTestConnection}
                        isLoading={connectionStatus === 'testing'}
                        isDisabled={isActionDisabled}
                      />
                    </Tooltip>

                    <Button
                      size="sm"
                      colorScheme="brand"
                      leftIcon={<Icon as={MdCheck} />}
                      onClick={handleSave}
                      isDisabled={!isFormValid}
                      flex={1}
                    >
                      {t('providerSave')}
                    </Button>

                    <IconButton
                      icon={<Icon as={MdClose} />}
                      size="sm"
                      variant="ghost"
                      aria-label="Cancel"
                      onClick={handleCancel}
                    />
                  </HStack>
                </VStack>
              </>
            )}
          </VStack>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}
