'use client';

import { FC, useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Textarea,
  Input,
  Icon,
  Tooltip,
  useColorModeValue,
  useToast,
  CloseIcon
} from '@/components';
import { useSurveyTrigger } from '@/hooks/useSurveyTrigger';

// --- Types ---

type ExperienceRating = 'love' | 'good' | 'neutral' | 'needsImprovement';
type Willingness = 'yes' | 'maybe' | 'no';
type PricingModel = 'monthly' | 'yearly' | 'lifetime';
type SurveyStep = 1 | 2 | 3 | 4 | 'thank-you';

interface SurveyData {
  experienceRating: ExperienceRating | null;
  willingness: Willingness | null;
  pricingModel: PricingModel | null;
  priceRange: string | null;
  desiredFeatures: string[];
  customFeature: string;
  feedback: string;
}

// --- Price options per model ---

const PRICE_OPTIONS: Record<PricingModel, { key: string; value: string }[]> = {
  monthly: [
    { key: 'priceMonthly29k', value: '29k/month' },
    { key: 'priceMonthly49k', value: '49k/month' },
    { key: 'priceMonthly79k', value: '79k/month' }
  ],
  yearly: [
    { key: 'priceYearly199k', value: '199k/year' },
    { key: 'priceYearly349k', value: '349k/year' },
    { key: 'priceYearly499k', value: '499k/year' }
  ],
  lifetime: [
    { key: 'priceLifetime299k', value: '299k' },
    { key: 'priceLifetime499k', value: '499k' },
    { key: 'priceLifetime799k', value: '799k' }
  ]
};

// --- Rating Emojis ---

const RATING_OPTIONS: { value: ExperienceRating; emoji: string; key: string }[] = [
  { value: 'love', emoji: '😍', key: 'ratingLove' },
  { value: 'good', emoji: '😊', key: 'ratingGood' },
  { value: 'neutral', emoji: '😐', key: 'ratingNeutral' },
  { value: 'needsImprovement', emoji: '😕', key: 'ratingNeedsImprovement' }
];

// --- Feature Options ---

const FEATURE_OPTIONS: { key: string; descKey: string; emoji: string; value: string }[] = [
  { key: 'featureSync', descKey: 'featureSyncDesc', emoji: '🔄', value: 'Tài khoản & Đồng bộ hồ sơ' },
  { key: 'featureUnlimitedChat', descKey: 'featureUnlimitedChatDesc', emoji: '💬', value: 'Chat AI không giới hạn' },
  { key: 'featureDeepAnalysis', descKey: 'featureDeepAnalysisDesc', emoji: '🔮', value: 'Phân tích AI chuyên sâu' },
  { key: 'featurePdfReport', descKey: 'featurePdfReportDesc', emoji: '📊', value: 'Báo cáo PDF chuyên nghiệp' },
  { key: 'featureCompatibility', descKey: 'featureCompatibilityDesc', emoji: '🤝', value: 'Tương hợp cặp đôi' }
];

// --- Total steps ---
const TOTAL_STEPS = 4;

// --- Component ---

interface SurveyBannerProps {
  /** Current page context for analytics */
  page: 'home' | 'chat';
}

export const SurveyBanner: FC<SurveyBannerProps> = ({ page }) => {
  const t = useTranslations('Survey');
  const locale = useLocale();
  const toast = useToast();
  const { shouldShowSurvey, isManualOpen, markCompleted, markDismissed, usageCount } =
    useSurveyTrigger();

  const [currentStep, setCurrentStep] = useState<SurveyStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surveyData, setSurveyData] = useState<SurveyData>({
    experienceRating: null,
    willingness: null,
    pricingModel: null,
    priceRange: null,
    desiredFeatures: [],
    customFeature: '',
    feedback: ''
  });

  // Reset survey state when manually re-opened
  useEffect(() => {
    if (isManualOpen && shouldShowSurvey) {
      setCurrentStep(1);
      setSurveyData({
        experienceRating: null,
        willingness: null,
        pricingModel: null,
        priceRange: null,
        desiredFeatures: [],
        customFeature: '',
        feedback: ''
      });
      setShowCustomPrice(false);
      setCustomPriceValue('');
      setShowCustomFeature(false);
    }
  }, [isManualOpen, shouldShowSurvey]);

  // --- Colors ---
  const bannerBg = useColorModeValue(
    'rgba(255, 255, 255, 0.92)',
    'rgba(26, 32, 44, 0.92)'
  );
  const bannerBorder = useColorModeValue('brand.200', 'brand.700');
  const bannerShadow = useColorModeValue(
    '0 -4px 24px rgba(221, 107, 32, 0.12)',
    '0 -4px 24px rgba(221, 107, 32, 0.08)'
  );
  const titleColor = useColorModeValue('gray.800', 'white');
  const subtitleColor = useColorModeValue('gray.500', 'gray.400');
  const dotActive = useColorModeValue('brand.500', 'brand.400');
  const dotInactive = useColorModeValue('gray.200', 'gray.600');
  const emojiHoverBg = useColorModeValue('brand.50', 'whiteAlpha.100');
  const emojiSelectedBg = useColorModeValue('brand.100', 'brand.900');
  const optionBorder = useColorModeValue('gray.200', 'gray.600');
  const optionSelectedBorder = useColorModeValue('brand.400', 'brand.400');
  const textareaBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const costSubtitleColor = useColorModeValue('orange.600', 'orange.300');

  // --- Handlers ---

  const handleRatingSelect = useCallback((rating: ExperienceRating) => {
    setSurveyData((prev) => ({ ...prev, experienceRating: rating }));
    // Auto advance after brief delay for visual feedback
    setTimeout(() => setCurrentStep(2), 300);
  }, []);

  const handleWillingnessSelect = useCallback((willingness: Willingness) => {
    setSurveyData((prev) => ({ ...prev, willingness }));
    if (willingness === 'yes') {
      // Stay on step 2 to show pricing sub-section
    } else {
      // Skip to features step
      setCurrentStep(3);
    }
  }, []);

  const handlePricingModelSelect = useCallback((model: PricingModel) => {
    setSurveyData((prev) => ({
      ...prev,
      pricingModel: model,
      priceRange: null
    }));
    setShowCustomPrice(false);
  }, []);

  const [showCustomPrice, setShowCustomPrice] = useState(false);
  const [customPriceValue, setCustomPriceValue] = useState('');
  const [showCustomFeature, setShowCustomFeature] = useState(false);

  const handlePriceSelect = useCallback((price: string) => {
    setSurveyData((prev) => ({ ...prev, priceRange: price }));
    setShowCustomPrice(false);
    setTimeout(() => setCurrentStep(3), 300);
  }, []);

  const handleCustomPriceSubmit = useCallback(() => {
    const trimmed = customPriceValue.trim();
    if (!trimmed) return;
    handlePriceSelect(`custom:${trimmed}`);
  }, [customPriceValue, handlePriceSelect]);

  const handleFeatureToggle = useCallback((featureValue: string) => {
    setSurveyData((prev) => {
      const isSelected = prev.desiredFeatures.includes(featureValue);
      return {
        ...prev,
        desiredFeatures: isSelected
          ? prev.desiredFeatures.filter((f) => f !== featureValue)
          : [...prev.desiredFeatures, featureValue]
      };
    });
  }, []);

  const handleCustomFeatureChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSurveyData((prev) => ({ ...prev, customFeature: e.target.value }));
    },
    []
  );

  const handleFeedbackChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setSurveyData((prev) => ({ ...prev, feedback: e.target.value }));
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        locale,
        page,
        experienceRating: surveyData.experienceRating,
        willingness: surveyData.willingness,
        pricingModel: surveyData.pricingModel,
        priceRange: surveyData.priceRange,
        desiredFeatures: surveyData.desiredFeatures.length > 0 ? surveyData.desiredFeatures : null,
        customFeature: surveyData.customFeature.trim() || null,
        feedback: surveyData.feedback.trim() || null,
        usageCount
      };

      const response = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Survey API error: ${response.status}`);
      }

      markCompleted();
      setCurrentStep('thank-you');

      // Auto-hide after showing thank you
      setTimeout(() => {
        setCurrentStep(1); // Reset for clean state
      }, 4000);
    } catch (error) {
      console.error('[Survey] Submit failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit survey. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [surveyData, locale, page, usageCount, markCompleted, toast]);

  const handleSkip = useCallback(() => {
    // Submit whatever data we have so far
    handleSubmit();
  }, [handleSubmit]);

  const handleDismiss = useCallback(() => {
    markDismissed();
  }, [markDismissed]);

  // --- Progress dots ---
  const currentStepNum = typeof currentStep === 'number' ? currentStep : TOTAL_STEPS;

  const progressDots = useMemo(
    () => (
      <HStack spacing={1.5} justify="center" mb={3}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => (
          <Box
            key={step}
            w={currentStepNum === step ? '18px' : '6px'}
            h="6px"
            borderRadius="full"
            bg={currentStepNum >= step ? dotActive : dotInactive}
            transition="all 0.3s ease"
          />
        ))}
      </HStack>
    ),
    [currentStepNum, dotActive, dotInactive]
  );

  // --- Render guard ---
  if (!shouldShowSurvey && currentStep !== 'thank-you') return null;

  return (
    <Box
      id="survey-banner"
      position="fixed"
      bottom={{ base: '56px', md: '60px' }}
      left="50%"
      transform="translateX(-50%)"
      w={{ base: '94%', md: '480px' }}
      maxW="520px"
      zIndex={99}
      bg={bannerBg}
      backdropFilter="blur(20px)"
      borderWidth="1px"
      borderColor={bannerBorder}
      borderRadius="2xl"
      boxShadow={bannerShadow}
      px={{ base: 4, md: 5 }}
      py={4}
      sx={{
        animation: 'surveySlideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        '@keyframes surveySlideUp': {
          from: {
            opacity: 0,
            transform: 'translateX(-50%) translateY(30px)'
          },
          to: {
            opacity: 1,
            transform: 'translateX(-50%) translateY(0)'
          }
        }
      }}
    >
      {/* Close button */}
      {currentStep !== 'thank-you' && (
        <Tooltip label={t('dismissTooltip')} hasArrow fontSize="xs">
          <IconButton
            aria-label={t('dismissTooltip')}
            icon={<CloseIcon />}
            size="xs"
            variant="ghost"
            position="absolute"
            top={2}
            right={2}
            borderRadius="full"
            opacity={0.6}
            _hover={{ opacity: 1 }}
            onClick={handleDismiss}
          />
        </Tooltip>
      )}

      {/* Thank You Screen */}
      {currentStep === 'thank-you' && (
        <VStack
          spacing={2}
          py={2}
          sx={{ animation: 'fadeIn 0.4s ease' }}
        >
          <Text fontSize="3xl">🎉</Text>
          <Text
            fontSize="lg"
            fontWeight={700}
            color={titleColor}
            textAlign="center"
          >
            {t('thankYouTitle')}
          </Text>
          <Text
            fontSize="sm"
            color={subtitleColor}
            textAlign="center"
          >
            {t('thankYouMessage')}
          </Text>
        </VStack>
      )}

      {/* Step 1: Experience Rating */}
      {currentStep === 1 && (
        <VStack spacing={3} sx={{ animation: 'fadeIn 0.3s ease' }}>
          {progressDots}
          <Text
            fontSize={{ base: 'sm', md: 'md' }}
            fontWeight={700}
            color={titleColor}
            textAlign="center"
            lineHeight="short"
          >
            {t('step1Title')}
          </Text>
          <HStack spacing={{ base: 2, md: 3 }} justify="center" flexWrap="wrap">
            {RATING_OPTIONS.map((option) => (
              <VStack
                key={option.value}
                spacing={1}
                cursor="pointer"
                px={{ base: 2.5, md: 3 }}
                py={2}
                borderRadius="xl"
                borderWidth="1px"
                borderColor={
                  surveyData.experienceRating === option.value
                    ? optionSelectedBorder
                    : optionBorder
                }
                bg={
                  surveyData.experienceRating === option.value
                    ? emojiSelectedBg
                    : 'transparent'
                }
                transition="all 0.2s"
                _hover={{
                  bg: emojiHoverBg,
                  transform: 'translateY(-2px)',
                  shadow: 'sm'
                }}
                _active={{ transform: 'translateY(0)' }}
                onClick={() => handleRatingSelect(option.value)}
                role="button"
                aria-label={t(option.key as any)}
              >
                <Text fontSize={{ base: '2xl', md: '3xl' }}>{option.emoji}</Text>
                <Text
                  fontSize={{ base: '2xs', md: 'xs' }}
                  fontWeight={600}
                  color={subtitleColor}
                  textAlign="center"
                  whiteSpace="nowrap"
                >
                  {t(option.key as any)}
                </Text>
              </VStack>
            ))}
          </HStack>
        </VStack>
      )}

      {/* Step 2: Willingness to Pay */}
      {currentStep === 2 && (
        <VStack spacing={3} sx={{ animation: 'fadeIn 0.3s ease' }}>
          {progressDots}

          {/* Main question (if not answered yet) */}
          {!surveyData.willingness && (
            <>
              <Text
                fontSize={{ base: 'sm', md: 'md' }}
                fontWeight={700}
                color={titleColor}
                textAlign="center"
                lineHeight="short"
              >
                {t('step2Title')}
              </Text>
              {/* Cost transparency subtitle */}
              <Text
                fontSize={{ base: '2xs', md: 'xs' }}
                color={costSubtitleColor}
                textAlign="center"
                lineHeight="tall"
                px={1}
              >
                {t('step2Subtitle')}
              </Text>
              <VStack spacing={2} w="100%">
                <Button
                  w="100%"
                  size="sm"
                  colorScheme="orange"
                  borderRadius="full"
                  fontWeight={700}
                  onClick={() => handleWillingnessSelect('yes')}
                  _hover={{ transform: 'translateY(-1px)', shadow: 'md' }}
                  transition="all 0.2s"
                >
                  💎 {t('willingnessYes')}
                </Button>
                <HStack spacing={2} w="100%">
                  <Button
                    flex={1}
                    size="sm"
                    variant="outline"
                    borderRadius="full"
                    fontWeight={600}
                    onClick={() => handleWillingnessSelect('maybe')}
                    _hover={{ transform: 'translateY(-1px)' }}
                    transition="all 0.2s"
                  >
                    🤔 {t('willingnessMaybe')}
                  </Button>
                  <Button
                    flex={1}
                    size="sm"
                    variant="ghost"
                    borderRadius="full"
                    fontWeight={600}
                    onClick={() => handleWillingnessSelect('no')}
                    _hover={{ transform: 'translateY(-1px)' }}
                    transition="all 0.2s"
                  >
                    {t('willingnessNo')}
                  </Button>
                </HStack>
              </VStack>
            </>
          )}

          {/* Pricing sub-section (only if "yes") */}
          {surveyData.willingness === 'yes' && (
            <VStack spacing={3} w="100%" sx={{ animation: 'fadeIn 0.3s ease' }}>
              {/* Pricing Model Selection */}
              {!surveyData.pricingModel && (
                <>
                  <Text
                    fontSize={{ base: 'sm', md: 'md' }}
                    fontWeight={700}
                    color={titleColor}
                    textAlign="center"
                  >
                    {t('pricingModelTitle')}
                  </Text>
                  <HStack spacing={2} w="100%" justify="center">
                    {(['monthly', 'yearly', 'lifetime'] as PricingModel[]).map(
                      (model) => (
                        <Button
                          key={model}
                          flex={1}
                          size="sm"
                          variant="outline"
                          borderRadius="full"
                          fontWeight={600}
                          borderColor={optionBorder}
                          onClick={() => handlePricingModelSelect(model)}
                          _hover={{
                            borderColor: 'brand.400',
                            bg: emojiHoverBg,
                            transform: 'translateY(-1px)'
                          }}
                          transition="all 0.2s"
                        >
                          {model === 'monthly' && '💳 '}
                          {model === 'yearly' && '📅 '}
                          {model === 'lifetime' && '♾️ '}
                          {t(`pricing${model.charAt(0).toUpperCase() + model.slice(1)}` as any)}
                        </Button>
                      )
                    )}
                  </HStack>
                </>
              )}

              {/* Price Range (after model is selected) */}
              {surveyData.pricingModel && (
                <>
                  <Text
                    fontSize={{ base: 'sm', md: 'md' }}
                    fontWeight={700}
                    color={titleColor}
                    textAlign="center"
                  >
                    {t('priceTitle')}
                  </Text>
                  <HStack spacing={2} w="100%" justify="center" flexWrap="wrap">
                    {PRICE_OPTIONS[surveyData.pricingModel].map((option) => (
                      <Button
                        key={option.key}
                        flex={1}
                        size="sm"
                        variant="outline"
                        borderRadius="full"
                        fontWeight={600}
                        borderColor={
                          surveyData.priceRange === option.value
                            ? optionSelectedBorder
                            : optionBorder
                        }
                        bg={
                          surveyData.priceRange === option.value
                            ? emojiSelectedBg
                            : 'transparent'
                        }
                        onClick={() => handlePriceSelect(option.value)}
                        _hover={{
                          borderColor: 'brand.400',
                          bg: emojiHoverBg,
                          transform: 'translateY(-1px)'
                        }}
                        transition="all 0.2s"
                      >
                        {t(option.key as any)}
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      variant={showCustomPrice ? 'solid' : 'outline'}
                      colorScheme={showCustomPrice ? 'orange' : undefined}
                      borderRadius="full"
                      fontWeight={600}
                      borderColor={optionBorder}
                      onClick={() => setShowCustomPrice((p) => !p)}
                      _hover={{
                        borderColor: 'brand.400',
                        bg: emojiHoverBg,
                        transform: 'translateY(-1px)'
                      }}
                      transition="all 0.2s"
                      minW="fit-content"
                    >
                      ✏️ {t('priceOther')}
                    </Button>
                  </HStack>
                  {showCustomPrice && (
                    <HStack
                      spacing={2}
                      w="100%"
                      sx={{ animation: 'fadeIn 0.2s ease' }}
                    >
                      <Input
                        size="sm"
                        borderRadius="full"
                        placeholder={t('priceCustomPlaceholder')}
                        value={customPriceValue}
                        onChange={(e) => setCustomPriceValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCustomPriceSubmit();
                        }}
                        bg={textareaBg}
                        fontSize="sm"
                        autoFocus
                        _focus={{
                          borderColor: 'brand.400',
                          boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)'
                        }}
                      />
                      <Button
                        size="sm"
                        colorScheme="orange"
                        borderRadius="full"
                        fontWeight={700}
                        onClick={handleCustomPriceSubmit}
                        isDisabled={!customPriceValue.trim()}
                        px={4}
                      >
                        OK
                      </Button>
                    </HStack>
                  )}
                </>
              )}
            </VStack>
          )}
        </VStack>
      )}

      {/* Step 3: Desired Features (NEW) */}
      {currentStep === 3 && (
        <VStack spacing={3} sx={{ animation: 'fadeIn 0.3s ease' }}>
          {progressDots}
          <Text
            fontSize={{ base: 'sm', md: 'md' }}
            fontWeight={700}
            color={titleColor}
            textAlign="center"
            lineHeight="short"
          >
            {t('step3Title')}
          </Text>
          <Text
            fontSize="2xs"
            color={subtitleColor}
            textAlign="center"
          >
            {t('step3Subtitle')}
          </Text>

          {/* Feature checkboxes */}
          <VStack spacing={1.5} w="100%">
            {FEATURE_OPTIONS.map((feature) => {
              const isSelected = surveyData.desiredFeatures.includes(feature.value);
              return (
                <HStack
                  key={feature.value}
                  w="100%"
                  px={3}
                  py={2}
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor={isSelected ? optionSelectedBorder : optionBorder}
                  bg={isSelected ? emojiSelectedBg : 'transparent'}
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{
                    bg: emojiHoverBg,
                    transform: 'translateY(-1px)',
                    shadow: 'sm'
                  }}
                  _active={{ transform: 'translateY(0)' }}
                  onClick={() => handleFeatureToggle(feature.value)}
                  role="checkbox"
                  aria-checked={isSelected}
                  spacing={2.5}
                >
                  <Text fontSize="lg" flexShrink={0}>{feature.emoji}</Text>
                  <VStack spacing={0} align="start" flex={1}>
                    <Text
                      fontSize={{ base: 'xs', md: 'sm' }}
                      fontWeight={600}
                      color={titleColor}
                      lineHeight="short"
                    >
                      {t(feature.key as any)}
                    </Text>
                    <Text
                      fontSize="2xs"
                      color={subtitleColor}
                      lineHeight="short"
                    >
                      {t(feature.descKey as any)}
                    </Text>
                  </VStack>
                  {/* Checkmark indicator */}
                  <Box
                    w="18px"
                    h="18px"
                    borderRadius="md"
                    borderWidth="2px"
                    borderColor={isSelected ? 'brand.400' : optionBorder}
                    bg={isSelected ? 'brand.400' : 'transparent'}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                    transition="all 0.2s"
                  >
                    {isSelected && (
                      <Text fontSize="xs" color="white" lineHeight={1}>✓</Text>
                    )}
                  </Box>
                </HStack>
              );
            })}

            {/* "Other" feature option */}
            <HStack
              w="100%"
              px={3}
              py={2}
              borderRadius="xl"
              borderWidth="1px"
              borderColor={showCustomFeature ? optionSelectedBorder : optionBorder}
              bg={showCustomFeature ? emojiSelectedBg : 'transparent'}
              cursor="pointer"
              transition="all 0.2s"
              _hover={{
                bg: emojiHoverBg,
                transform: 'translateY(-1px)',
                shadow: 'sm'
              }}
              onClick={() => setShowCustomFeature((p) => !p)}
              role="checkbox"
              aria-checked={showCustomFeature}
              spacing={2.5}
            >
              <Text fontSize="lg" flexShrink={0}>✏️</Text>
              <Text
                fontSize={{ base: 'xs', md: 'sm' }}
                fontWeight={600}
                color={titleColor}
                flex={1}
              >
                {t('featureOther')}
              </Text>
              <Box
                w="18px"
                h="18px"
                borderRadius="md"
                borderWidth="2px"
                borderColor={showCustomFeature ? 'brand.400' : optionBorder}
                bg={showCustomFeature ? 'brand.400' : 'transparent'}
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
                transition="all 0.2s"
              >
                {showCustomFeature && (
                  <Text fontSize="xs" color="white" lineHeight={1}>✓</Text>
                )}
              </Box>
            </HStack>

            {/* Custom feature input */}
            {showCustomFeature && (
              <Input
                size="sm"
                borderRadius="xl"
                placeholder={t('featureOtherPlaceholder')}
                value={surveyData.customFeature}
                onChange={handleCustomFeatureChange}
                bg={textareaBg}
                fontSize="sm"
                autoFocus
                _focus={{
                  borderColor: 'brand.400',
                  boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)'
                }}
                sx={{ animation: 'fadeIn 0.2s ease' }}
              />
            )}
          </VStack>

          {/* Next button */}
          <Button
            w="100%"
            size="sm"
            colorScheme="orange"
            borderRadius="full"
            fontWeight={700}
            onClick={() => setCurrentStep(4)}
            _hover={{ transform: 'translateY(-1px)', shadow: 'md' }}
            transition="all 0.2s"
          >
            {t('submitButton')} →
          </Button>
        </VStack>
      )}

      {/* Step 4: Feedback (previously Step 3) */}
      {currentStep === 4 && (
        <VStack spacing={3} sx={{ animation: 'fadeIn 0.3s ease' }}>
          {progressDots}
          <Text
            fontSize={{ base: 'sm', md: 'md' }}
            fontWeight={700}
            color={titleColor}
            textAlign="center"
            lineHeight="short"
          >
            {t('step4Title')}
          </Text>
          <Textarea
            value={surveyData.feedback}
            onChange={handleFeedbackChange}
            placeholder={t('feedbackPlaceholder')}
            size="sm"
            borderRadius="xl"
            bg={textareaBg}
            rows={2}
            resize="none"
            fontSize="sm"
            _focus={{
              borderColor: 'brand.400',
              boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)'
            }}
          />
          <HStack spacing={2} w="100%">
            <Button
              flex={1}
              size="sm"
              colorScheme="orange"
              borderRadius="full"
              fontWeight={700}
              isLoading={isSubmitting}
              loadingText="..."
              onClick={handleSubmit}
              _hover={{ transform: 'translateY(-1px)', shadow: 'md' }}
              transition="all 0.2s"
            >
              ✨ {t('submitButton')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              borderRadius="full"
              fontWeight={600}
              onClick={handleSkip}
              isDisabled={isSubmitting}
            >
              {t('skipButton')}
            </Button>
          </HStack>
        </VStack>
      )}
    </Box>
  );
};
