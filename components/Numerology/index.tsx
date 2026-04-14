'use client';
import ReactMarkdown from 'react-markdown';
import {
  type FC,
  useId,
  useRef,
  useState,
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo
} from 'react';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useTranslations, useLocale } from 'next-intl';
import { useToast } from '@chakra-ui/react';
import {
  Box,
  Input,
  VStack,
  HStack,
  InputDate,
  Button,
  Text,
  FormControl,
  FormErrorMessage,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Badge,
  Tooltip,
  Icon,
  IconButton,
  Collapse,
  FaSave,
  MdExpandMore,
  MdExpandLess,
  MdArrowForward,
  MdErrorOutline,
  Spinner
} from '@/components';
import { RenderItem } from './RenderItem';
import { BirthChart } from './BirthChart';
import { ProfileManager } from './ProfileManager';
import { useProcessNumerology } from 'hooks';
import { useBirthChart } from '@/hooks/useBirthChart';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useProfiles } from '@/hooks/useProfiles';
import dayjs from 'dayjs';

dayjs.extend(customParseFormat);

// --- Meaning Cache Utilities ---

const MEANING_CACHE_PREFIX = 'meaning-';
const MEANING_CACHE_TTL_DAYS = 7;
const BIRTH_CHART_VISIBILITY_KEY = 'birth-chart-visible';

interface MeaningCacheEntry {
  content: string;
  cachedAt: number;
}

function getMeaningCacheKey(metric: string, value: string | number): string {
  return `${MEANING_CACHE_PREFIX}${metric}-${value}`;
}

function getCachedMeaning(
  metric: string,
  value: string | number
): MeaningCacheEntry | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = getMeaningCacheKey(metric, value);
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const entry: MeaningCacheEntry = JSON.parse(stored);
    const now = Date.now();
    const ttlMs = MEANING_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;

    if (now - entry.cachedAt > ttlMs) {
      localStorage.removeItem(key);
      return null;
    }

    return entry;
  } catch {
    return null;
  }
}

function setCachedMeaning(
  metric: string,
  value: string | number,
  content: string
): void {
  if (typeof window === 'undefined') return;
  const key = getMeaningCacheKey(metric, value);
  const entry: MeaningCacheEntry = {
    content,
    cachedAt: Date.now()
  };
  localStorage.setItem(key, JSON.stringify(entry));
}

// --- Main Component ---

interface NumerologyComponentProps {
  /** Callback invoked after each successful numerology calculation */
  onCalculate?: () => void;
}

const NumerologyComponent: FC<NumerologyComponentProps> = ({ onCalculate }) => {
  const tNum = useTranslations('Numerology');
  const tVal = useTranslations('Validation');
  const tMetrics = useTranslations('NumerologyMetrics');
  const tMeaning = useTranslations('Meaning');
  const tChart = useTranslations('BirthChart');
  const tProfile = useTranslations('Profile');
  const locale = useLocale();
  const toast = useToast();
  const {
    trackFormulaView,
    trackMeaningRequest,
    trackMeaningCacheHit,
    trackNumerologyCalculate,
    trackBirthChartCellClick,
    trackProfileSave
  } = useAnalytics();
  const { saveProfile, deleteProfile, maxProfiles, profiles, isLoaded: profilesLoaded } = useProfiles();
  const id = useId();
  const color = useColorModeValue('black', 'white');
  const contentBg = useColorModeValue('white', 'gray.800');
  const cachedBadgeBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const cachedBadgeBorder = useColorModeValue('gray.100', 'whiteAlpha.100');
  const refInputName = useRef<HTMLInputElement>(null);
  const [localName, setLocalName] = useState<string>('Dương Văn Nghĩa');
  const [localBirth, setLocalBirth] = useState<string>('1976-06-11');
  const [submittedName, setSubmittedName] = useState<string>('Dương Văn Nghĩa');
  const [submittedBirth, setSubmittedBirth] = useState<string>('1976-06-11');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [birthError, setBirthError] = useState<string>('');
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const data = useProcessNumerology(submittedName, submittedBirth);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Birth Chart toggle state (localStorage persisted)
  const [isBirthChartVisible, setIsBirthChartVisible] = useState(true);

  // AI Meaning state
  const [meaningContent, setMeaningContent] = useState<string>('');
  const [isMeaningLoading, setIsMeaningLoading] = useState<boolean>(false);
  const [isMeaningFromCache, setIsMeaningFromCache] = useState<boolean>(false);
  const [meaningError, setMeaningError] = useState<boolean>(false);
  const meaningAbortRef = useRef<AbortController | null>(null);

  // AI Birth Chart Analysis state
  const {
    isOpen: isAnalysisOpen,
    onOpen: onAnalysisOpen,
    onClose: onAnalysisClose
  } = useDisclosure();
  const [analysisContent, setAnalysisContent] = useState<string>('');
  const [isAnalysisLoading, setIsAnalysisLoading] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<boolean>(false);
  const [isAnalysisFromCache, setIsAnalysisFromCache] = useState<boolean>(false);
  const [analysisCachedAt, setAnalysisCachedAt] = useState<number | null>(null);
  const analysisAbortRef = useRef<AbortController | null>(null);

  // Hook to get birth chart raw structure for AI Analysis payload
  const birthChartData = useBirthChart(submittedBirth);

  useEffect(() => {
    // Restore birth chart visibility from localStorage
    const stored = localStorage.getItem(BIRTH_CHART_VISIBILITY_KEY);
    if (stored !== null) {
      setIsBirthChartVisible(stored === 'true');
    }
    setIsMounted(true);
    // Focus name input after hydration (avoid autoFocus SSR mismatch)
    refInputName.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      meaningAbortRef.current?.abort();
    };
  }, []);

  const toggleBirthChart = useCallback(() => {
    setIsBirthChartVisible((prev) => {
      const next = !prev;
      localStorage.setItem(BIRTH_CHART_VISIBILITY_KEY, String(next));
      return next;
    });
  }, []);

  const formatBirthDate = useCallback((birthDate: string): string => {
    if (!birthDate || !birthDate.trim()) {
      return '';
    }

    const parts = birthDate.split('-');
    if (parts.length !== 3) {
      return birthDate;
    }

    const [year, month, date] = parts;
    const paddedYear = year.padStart(4, '0');
    const paddedMonth = month.padStart(2, '0');
    const paddedDate = date.padStart(2, '0');

    return `${paddedYear}-${paddedMonth}-${paddedDate}`;
  }, []);

  const validateBirthDate = useCallback(
    (birthDate: string): string => {
      if (!birthDate || !birthDate.trim()) {
        return tVal('requireBirth');
      }

      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(birthDate)) {
        return tVal('invalidFormat');
      }

      if (!isMounted) {
        return '';
      }

      const date = dayjs(birthDate, 'YYYY-MM-DD', true);
      if (!date.isValid()) {
        return tVal('invalidDate');
      }

      const today = dayjs();
      if (date.isAfter(today)) {
        return tVal('futureDate');
      }

      const minYear = 1900;
      const maxYear = dayjs().year();
      const year = date.year();
      if (year < minYear || year > maxYear) {
        return tVal('yearRange', { min: minYear, max: maxYear });
      }

      return '';
    },
    [isMounted, tVal]
  );

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      const formattedBirth = formatBirthDate(localBirth);
      const error = validateBirthDate(formattedBirth);
      if (error) {
        setBirthError(error);
        return;
      }

      setBirthError('');
      setIsLoading(true);

      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setSubmittedName(localName.trim());
        setSubmittedBirth(formattedBirth);
        trackNumerologyCalculate(localName.trim(), formattedBirth);
        onCalculate?.();
      } finally {
        setIsLoading(false);
      }
    },
    [
      localName,
      localBirth,
      formatBirthDate,
      validateBirthDate,
      trackNumerologyCalculate,
      onCalculate
    ]
  );

  // --- Save Profile (inline with submit button) ---
  const handleSaveProfile = useCallback(() => {
    if (!localName.trim() || !localBirth) return;

    const { success, isMaxReached } = saveProfile(localName, localBirth);

    if (isMaxReached) {
      toast({
        title: tProfile('maxProfilesReached', { max: maxProfiles }),
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
      return;
    }

    if (success) {
      trackProfileSave(profiles.length + 1);
      toast({
        title: tProfile('profileSaved'),
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
    }
  }, [
    localName,
    localBirth,
    saveProfile,
    toast,
    tProfile,
    maxProfiles,
    profiles.length,
    trackProfileSave
  ]);

  // --- AI Meaning Handler (FIXED: correct SSE parsing) ---
  const handleMeaningClick = useCallback(async () => {
    if (!selectedItem?.key || selectedItem.value === undefined) return;

    const metric = tMetrics(selectedItem.key as any);
    const value = selectedItem.value;

    // Check cache first
    const cached = getCachedMeaning(selectedItem.key, value);
    if (cached) {
      trackMeaningCacheHit(selectedItem.key, value);
      setMeaningContent(cached.content);
      setIsMeaningFromCache(true);
      setMeaningError(false);
      return;
    }

    // Fetch from API
    trackMeaningRequest(selectedItem.key, value);
    setIsMeaningLoading(true);
    setMeaningContent('');
    setIsMeaningFromCache(false);
    setMeaningError(false);

    meaningAbortRef.current?.abort();
    const abortController = new AbortController();
    meaningAbortRef.current = abortController;

    try {
      const isVietnamese = locale === 'vi';
      const prompt = isVietnamese
        ? `Giải thích chi tiết ý nghĩa chỉ số "${metric}" mang giá trị ${value} theo Nhân số học Pythagoras. Trả lời ngắn gọn, có cấu trúc, sử dụng bullet points và emoji. Trả lời bằng tiếng Việt.`
        : `Explain in detail the meaning of the "${metric}" index with value ${value} in Pythagorean Numerology. Keep it concise, structured, use bullet points and emoji. Answer in English.`;

      const numerologySystemPrompt = isVietnamese
        ? 'Bạn là chuyên gia Nhân số học Pythagoras. Trả lời chính xác, ngắn gọn, có cấu trúc rõ ràng.'
        : 'You are a Pythagorean Numerology expert. Answer accurately, concisely, with clear structure.';

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          skipExpansion: true,
          language: isVietnamese ? 'Vietnamese' : 'English',
          systemPrompt: numerologySystemPrompt
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let buffer = '';

      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;

        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);

            // Skip sources event
            if (parsed.type === 'sources') continue;
            // Skip done event
            if (parsed.done) continue;

            // Server sends { content: "..." } format (from response-generator.ts line 117)
            const delta = parsed.content ?? '';

            if (delta) {
              accumulatedContent += delta;
              setMeaningContent(accumulatedContent);
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      // Cache the result
      if (accumulatedContent) {
        setCachedMeaning(selectedItem.key, value, accumulatedContent);
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      console.error('[Meaning] Fetch failed:', error);
      setMeaningError(true);
    } finally {
      setIsMeaningLoading(false);
    }
  }, [selectedItem, tMetrics, trackMeaningRequest, trackMeaningCacheHit, locale]);

  // --- Birth Chart Analysis Handler ---
  const handleAnalyzeBirthChart = useCallback(async (forceRegenerate?: boolean | any) => {
    const isForce = forceRegenerate === true;
    onAnalysisOpen();
    setIsAnalysisLoading(true);
    setAnalysisContent('');
    setAnalysisError(false);
    setIsAnalysisFromCache(false);
    setAnalysisCachedAt(null);

    const cacheKeyMetric = 'birthchart-analysis';
    const cacheKeyValue = `${submittedBirth}-${locale}`;

    if (!isForce) {
      const cached = getCachedMeaning(cacheKeyMetric, cacheKeyValue);
      if (cached) {
        setAnalysisContent(cached.content);
        setIsAnalysisFromCache(true);
        setAnalysisCachedAt(cached.cachedAt);
        setIsAnalysisLoading(false);
        return;
      }
    }

    analysisAbortRef.current?.abort();
    const abortController = new AbortController();
    analysisAbortRef.current = abortController;

    try {
      const isVietnamese = locale === 'vi';
      
      // Building the comprehensive payload for the AI
      const numbersInfo = `Các số xuất hiện trong ngày sinh:
${birthChartData.grid
  .filter((c) => c.frequency > 0)
  .map((c) => `- Số ${c.number}: Xuất hiện ${c.frequency} lần${c.isIsolated ? ' (Bị cô lập)' : ''}`)
  .join('\n')}
      `;

      const strengthArrowsText = birthChartData.arrows.filter(a => a.type === 'strength').map(a => a.numbers.join('-')).join(', ');
      const emptyArrowsText = birthChartData.arrows.filter(a => a.type === 'empty').map(a => a.numbers.join('-')).join(', ');
      
      const arrowsInfo = `Mũi tên trên biểu đồ:
- Mũi tên sức mạnh (đầy đủ): ${strengthArrowsText || 'Không có'}
- Mũi tên điểm yếu (trống): ${emptyArrowsText || 'Không có'}
      `;

      const instruction = isVietnamese 
        ? `Phân tích toàn diện Biểu đồ Ngày Sinh này theo Nhân số học Pythagoras. Chỉ rõ Mũi tên sức mạnh, độ lặp lại của các con số, cảnh báo số cô lập, phân tích mũi tên trống. Cuối cùng, gợi ý hành động cụ thể để điền "con số ảo" khắc phục điểm yếu. Dùng bullet points và emoji.`
        : `Analyze this Birth Chart mapped on the Pythagorean Numerology grid. Detail the strengths arrows, number frequencies, isolated numbers, and empty arrows. Recommend concrete lifestyle actions to create "virtual numbers". Use bullet points and emojis.`;

      const prompt = `${instruction}\n\nDữ liệu Biểu đồ:\n${numbersInfo}\n${arrowsInfo}`;
      
      const systemPrompt = isVietnamese
        ? 'Bạn là Master Nhân số học. Phân tích thật chi tiết Biểu đồ Ngày Sinh, định hướng tích cực và giải pháp cải thiện cụ thể.'
        : 'You are a Numerology Master. Provide a detailed, empowering Birth Chart analysis focusing on traits, strengths, empty spots, and actionable virtual number solutions.';

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          skipExpansion: true,
          language: isVietnamese ? 'Vietnamese' : 'English',
          systemPrompt
        }),
        signal: abortController.signal
      });

      if (!response.ok) throw new Error('API error');
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader from response');

      let accumulatedContent = '';
      let buffer = '';
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === 'sources' || parsed.done) continue;
            const delta = parsed.content ?? '';
            if (delta) {
              accumulatedContent += delta;
              setAnalysisContent(accumulatedContent);
            }
          } catch {
            // Ignore partial JSON
          }
        }
      }

      if (accumulatedContent) {
        setCachedMeaning(cacheKeyMetric, cacheKeyValue, accumulatedContent);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setAnalysisError(true);
      console.error(err);
    } finally {
      setIsAnalysisLoading(false);
    }
  }, [locale, birthChartData, onAnalysisOpen, submittedBirth]);

  // Handle Close Modals
  const closeModal = useCallback(() => {
    meaningAbortRef.current?.abort();
    onClose();
  }, [onClose]);

  const closeAnalysisModal = useCallback(() => {
    analysisAbortRef.current?.abort();
    onAnalysisClose();
  }, [onAnalysisClose]);

  // --- Profile Select Handler ---
  const handleSelectProfile = useCallback(
    (name: string, birthDate: string) => {
      setLocalName(name);
      setLocalBirth(birthDate);
      setSubmittedName('');
      setSubmittedBirth('');
    },
    []
  );

  // --- Birth Chart Cell Click (GA tracking only) ---
  const handleBirthChartCellClick = useCallback(
    (number: number) => {
      trackBirthChartCellClick(number);
    },
    [trackBirthChartCellClick]
  );

  const contentFormula = useMemo(() => {
    if (!selectedItem?.key) return tNum('formulaComingSoon');
    return tNum(`ExplainFormula.${selectedItem?.key as any}`);
  }, [selectedItem?.key]);

  const isProfileAlreadySaved = useMemo(() => {
    if (!localName.trim() || !localBirth) return false;
    return profiles.some(
      (p) =>
        p.name.toLowerCase() === localName.trim().toLowerCase() &&
        p.birthDate === localBirth
    );
  }, [profiles, localName, localBirth]);

  // Colors
  const cacheBadgeBg = useColorModeValue('blue.50', 'blue.900');
  const cacheBadgeColor = useColorModeValue('blue.600', 'blue.300');
  const chartToggleColor = useColorModeValue('gray.600', 'gray.400');
  const dividerColor = useColorModeValue('brand.100', 'brand.800');
  const chartToggleHoverBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const meaningDividerColor = useColorModeValue('gray.200', 'whiteAlpha.200');

  return (
    <Box>
      <Box mt={8}>
        <ProfileManager
          currentName={localName}
          currentBirthDate={localBirth}
          profiles={profiles}
          isLoaded={profilesLoaded}
          onSelectProfile={handleSelectProfile}
          onDeleteProfile={deleteProfile}
        />
      </Box>

      <Box as="form" onSubmit={handleSubmit}>
        <VStack spacing={3} align="stretch">
          <Box h="40px">
            <Input
              rounded={50}
              onClick={() => refInputName.current?.select()}
              ref={refInputName}
              value={localName}
              placeholder={tNum('namePlaceholder')}
              w={{ md: '50%', xs: '100%' }}
              textAlign="center"
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setLocalName(e.target.value)
              }
              color={color}
            />
          </Box>

          <FormControl isInvalid={!!birthError}>
            <Box>
              <InputDate
                rounded={50}
                getValue={(date) => {
                  setLocalBirth(date);
                }}
                defaultValue={localBirth}
                color={color}
              />
            </Box>
            {birthError && (
              <FormErrorMessage
                mt={1}
                fontSize="sm"
                textAlign="center"
                justifyContent="center"
              >
                {birthError}
              </FormErrorMessage>
            )}
          </FormControl>

          {/* Submit + Save Profile — compact inline */}
          <Box textAlign="center" py={2}>
            <Box display="inline-flex" alignItems="center" gap={2}>
              <Button
                type="submit"
                colorScheme="orange"
                size="sm"
                borderRadius="full"
                fontSize="sm"
                fontWeight={700}
                px={6}
                isLoading={isLoading}
                loadingText={tNum('processing')}
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: 'lg'
                }}
                _active={{
                  transform: 'translateY(0)'
                }}
                transition="all 0.2s"
              >
                {tNum('viewResult')}
              </Button>

              {!isProfileAlreadySaved && (
                <Tooltip label={tProfile('saveProfile')} hasArrow fontSize="xs">
                  <IconButton
                    aria-label={tProfile('saveProfile')}
                    icon={<Icon as={FaSave} />}
                    colorScheme="orange"
                    variant="outline"
                    size="sm"
                    borderRadius="full"
                    onClick={handleSaveProfile}
                    isDisabled={!localName.trim() || !localBirth}
                    _hover={{
                      transform: 'translateY(-2px)',
                      boxShadow: 'md'
                    }}
                    transition="all 0.2s"
                  />
                </Tooltip>
              )}
            </Box>
          </Box>
        </VStack>
      </Box>

      {/* Birth Chart — collapsible with localStorage toggle */}
      {submittedBirth && (
        <Box mt={6} mb={6} maxW="400px" mx="auto">
          {/* Toggle Header */}
          <HStack
            spacing={2}
            cursor="pointer"
            onClick={toggleBirthChart}
            justify="center"
            mb={isBirthChartVisible ? 3 : 0}
            px={3}
            py={1.5}
            borderRadius="full"
            transition="all 0.2s"
            _hover={{
              bg: chartToggleHoverBg
            }}
            userSelect="none"
          >
            <Box
              fontSize={{ base: 'sm', md: 'md' }}
              fontWeight={700}
              color={chartToggleColor}
            >
              {tChart('title')}
            </Box>
            <Icon
              as={isBirthChartVisible ? MdExpandLess : MdExpandMore}
              color={chartToggleColor}
              boxSize={5}
              transition="transform 0.2s"
            />
          </HStack>

          {isMounted && (
            <Collapse in={isBirthChartVisible} animateOpacity>
              <Box pb={4}>
                <BirthChart
                  birthDate={submittedBirth}
                  onCellClick={handleBirthChartCellClick}
                />
                {/* Action Analyze Birth Chart Button */}
                <Box mt={-4} textAlign="center" position="relative" zIndex={2}>
                  <Button
                    variant="outline"
                    bg={contentBg}
                    _hover={{ bg: chartToggleHoverBg, transform: 'translateY(-2px)' }}
                    _active={{ transform: 'translateY(0)' }}
                    colorScheme="red"
                    size="sm"
                    borderRadius="full"
                    boxShadow="md"
                    px={6}
                    transition="all 0.2s"
                    onClick={handleAnalyzeBirthChart}
                    leftIcon={<Icon as={MdArrowForward} />}
                    isLoading={isAnalysisLoading}
                    loadingText={tNum('processing')}
                  >
                    {tChart('analyzeChart') || 'Giải mã Biểu đồ'}
                  </Button>
                </Box>
              </Box>
            </Collapse>
          )}
        </Box>
      )}

      {/* Divider */}
      {submittedBirth && (
        <Box
          h="1px"
          bgGradient={`linear(to-r, transparent, ${dividerColor}, transparent)`}
          mx="auto"
          w="60%"
          mb={6}
        />
      )}

      {!!submittedBirth && (
        <Box mt={4}>
          {data && data.length > 0 && (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={4}
              mb={6}
            >
              <Box w={{ base: '40px', md: '80px' }} h="1px" bgGradient="linear(to-r, transparent, red.500)" opacity={0.8} />
              <Box fontSize={20} fontWeight={800} color="red.400" whiteSpace="nowrap">
                {tNum('indexTitle')}
              </Box>
              <Box w={{ base: '40px', md: '80px' }} h="1px" bgGradient="linear(to-l, transparent, red.500)" opacity={0.8} />
            </Box>
          )}

          <Box display="flex" flexWrap="wrap" justifyContent="center" gap="12px">
            {data.map((item: any, index: number) => (
              <Box
                key={id + index}
                w={{
                  base: 'calc(50% - 6px)',
                  sm: 'calc(33.333% - 8px)',
                  md: 'calc(25% - 9px)',
                  xl: 'calc(20% - 9.6px)'
                }}
              >
                <RenderItem
                  item={item}
                  onClick={() => {
                    setSelectedItem(item);
                    setMeaningContent('');
                    setIsMeaningFromCache(false);
                    setMeaningError(false);
                    trackFormulaView(item.key);
                    onOpen();
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      )}

        <Modal
          isOpen={isOpen}
          onClose={() => {
            meaningAbortRef.current?.abort();
            onClose();
          }}
          isCentered={{ base: false, md: true }}
          motionPreset="slideInBottom"
          size="2xl"
        >
          <ModalOverlay backdropFilter="blur(3px)" />
          <ModalContent mx={4} rounded={20}>
            <ModalHeader>
              {selectedItem
                ? tNum('formulaTitle', {
                    name: tMetrics(selectedItem.key as any)
                  })
                : ''}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <Box
                fontSize="sm"
                lineHeight="tall"
                className="formula-markdown"
                css={{
                  '& strong, & b': {
                    color: 'var(--chakra-colors-red-400)',
                    fontWeight: 700
                  },
                  '& ul, & ol': {
                    paddingLeft: '20px',
                    marginBottom: '8px'
                  },
                  '& li': {
                    marginBottom: '6px'
                  },
                  '& p': {
                    marginBottom: '10px'
                  }
                }}
              >
                <ReactMarkdown>{contentFormula}</ReactMarkdown>
              </Box>

              {selectedItem && selectedItem.value !== undefined && (
                <Box mt={6}>
                  {/* AI Meaning Button — only show if no content yet */}
                  {!meaningContent && !isMeaningLoading && !meaningError && (
                    <Box display="flex" justifyContent="center">
                      <Button
                        colorScheme="orange"
                        borderRadius="full"
                        w="full"
                        px={8}
                        py={{ base: 2, md: 3 }}
                        height="auto"
                        whiteSpace="normal"
                        fontSize={{ base: 'sm', md: 'md' }}
                        lineHeight="shorter"
                        onClick={handleMeaningClick}
                        _hover={{
                          transform: 'translateY(-2px)',
                          boxShadow: 'md'
                        }}
                        transition="all 0.2s"
                      >
                        {tNum('viewMeaning', {
                          metric: tMetrics(selectedItem.key as any),
                          value: selectedItem.value
                        })}
                      </Button>
                    </Box>
                  )}

                  {/* Loading State */}
                  {isMeaningLoading && (
                    <Box textAlign="center" py={3}>
                      <Button
                        isLoading
                        loadingText={tMeaning('loading')}
                        colorScheme="orange"
                        variant="ghost"
                        borderRadius="full"
                        w="full"
                        isDisabled
                      />
                    </Box>
                  )}

                  {/* Error State */}
                  {meaningError && (
                    <Box textAlign="center" py={3}>
                      <Box fontSize="sm" color="red.400" mb={2}>
                        {tMeaning('error')}
                      </Box>
                      <Button
                        size="sm"
                        colorScheme="orange"
                        variant="outline"
                        borderRadius="full"
                        onClick={handleMeaningClick}
                      >
                        {tMeaning('retry')}
                      </Button>
                    </Box>
                  )}

                  {/* Meaning Content (streamed/cached) */}
                  {meaningContent && (
                    <Box mt={4}>
                      {/* Cache badge */}
                      {isMeaningFromCache && (
                        <Box display="flex" justifyContent="center" mb={3}>
                          <Tooltip
                            label={tMeaning('cachedTooltip')}
                            hasArrow
                            fontSize="xs"
                          >
                            <Badge
                              bg={cacheBadgeBg}
                              color={cacheBadgeColor}
                              borderRadius="full"
                              px={3}
                              py={1}
                              fontSize="2xs"
                              fontWeight={600}
                            >
                              💾 {tMeaning('cachedBadge')}
                            </Badge>
                          </Tooltip>
                        </Box>
                      )}

                      {/* Divider before meaning */}
                      <Box
                        h="1px"
                        bg={meaningDividerColor}
                        mb={4}
                      />

                      <Box
                        fontSize="sm"
                        lineHeight="tall"
                        className="formula-markdown"
                        css={{
                          '& strong, & b': {
                            color: 'var(--chakra-colors-brand-500)',
                            fontWeight: 700
                          },
                          '& ul, & ol': {
                            paddingLeft: '20px',
                            marginBottom: '8px'
                          },
                          '& li': {
                            marginBottom: '6px'
                          },
                          '& p': {
                            marginBottom: '10px'
                          }
                        }}
                      >
                        <ReactMarkdown>{meaningContent}</ReactMarkdown>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Birth Chart Analysis Modal */}
        <Modal isOpen={isAnalysisOpen} onClose={closeAnalysisModal} size="xl" scrollBehavior="inside">
          <ModalOverlay backdropFilter="blur(4px)" />
          <ModalContent
            bg={contentBg}
            mx={4}
            mt={{ base: 16, md: 24 }}
            maxH={{ base: '80vh', md: '75vh' }}
            pb={4}
          >
            <ModalHeader
              color="red.500"
              pb={2}
              borderBottomWidth="1px"
              borderColor={useColorModeValue('gray.100', 'whiteAlpha.100')}
            >
              {tChart('analyzeChart') || 'Giải mã Biểu đồ Ngày Sinh'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pt={4} className="markdown-body">
              {isAnalysisLoading && !analysisContent ? (
                <Box py={8} textAlign="center">
                  <Spinner color="red.500" />
                  <Text mt={4} color="gray.500" fontSize="sm">
                    {tNum('processing')}
                  </Text>
                </Box>
              ) : analysisError ? (
                <Box py={6} textAlign="center">
                  <Icon as={MdErrorOutline} color="red.400" boxSize={8} mb={3} />
                  <Text color="red.500">{tVal('genericError')}</Text>
                  <Button mt={4} size="sm" onClick={handleAnalyzeBirthChart}>
                    Thử lại
                  </Button>
                </Box>
              ) : analysisContent ? (
                <Box>
                  {isAnalysisFromCache && analysisCachedAt && (
                    <HStack mb={4} justify="space-between" align="center" bg={cachedBadgeBg} p={2} borderRadius="md" borderWidth="1px" borderColor={cachedBadgeBorder}>
                      <Text fontSize="xs" color="gray.500" fontStyle="italic">
                        {tMeaning('cachedBadge')} - {dayjs(analysisCachedAt).format('DD/MM/YYYY HH:mm')}
                      </Text>
                      <Button size="xs" variant="outline" colorScheme="gray" onClick={() => handleAnalyzeBirthChart(true)}>
                        Phân tích lại
                      </Button>
                    </HStack>
                  )}
                  <Box
                    sx={{
                      'h3': { fontSize: '1.25rem', mt: 4, mb: 2, color: 'brand.500' },
                      'h4': { fontSize: '1.1rem', mt: 3, mb: 2, color: 'gray.700' },
                      'p': { mb: 3 },
                      'ul': { pl: 5, mb: 3 },
                      'li': { mb: 1, listStyleType: 'disc' }
                    }}
                  >
                    <ReactMarkdown>{analysisContent}</ReactMarkdown>
                  </Box>
                </Box>
              ) : null}
            </ModalBody>
          </ModalContent>
        </Modal>
      </Box>
  );
};

// React 19 compatible component type - workaround for FC type incompatibility
// Using any type to bypass React 19 JSX type strictness
export const Numerology: any = NumerologyComponent;
