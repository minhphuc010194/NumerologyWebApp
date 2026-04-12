'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Textarea,
  VStack,
  HStack,
  useToast,
  Text,
  Badge,
  useColorModeValue,
  Divider,
  Progress
} from '@/components';

type CollectionType = 'Chunk' | 'Summary' | 'QA';
type HealthStatus = 'idle' | 'checking' | 'success' | 'error';

export default function AdminMilvusPage() {
  const [collection, setCollection] = useState<CollectionType>('Chunk');
  const [isLoading, setIsLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('idle');
  const toast = useToast();
  const t = useTranslations('Admin');

  const cardBg = useColorModeValue('white', 'gray.800');

  // Form state
  const [formData, setFormData] = useState<Record<string, string>>({
    title: '',
    ref_link: '',
    language: 'vi'
  });

  // Bulk import state
  const [importMode, setImportMode] = useState<'single' | 'bulk'>('single');
  const queueRef = useRef<{ originalIndex: number; data: any }[]>([]);
  const totalItemsRef = useRef(0);

  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [concurrency, setConcurrency] = useState(5);

  const concurrencyRef = useRef(concurrency);
  const isPausedRef = useRef(isPaused);
  const isRunningRef = useRef(isRunning);
  const activeWorkersRef = useRef(0);
  const successCountRef = useRef(0);

  useEffect(() => {
    concurrencyRef.current = concurrency;
  }, [concurrency]);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      processNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concurrency]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFilesChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsLoading(true);
    let combined: any[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const text = await files[i].text();
        const arr = JSON.parse(text);
        if (Array.isArray(arr)) combined = combined.concat(arr);
      } catch (e) {
        toast({
          title: t('toastErrorTitle'),
          description: t('toastErrorInvalidJson') + ' - ' + files[i].name,
          status: 'error'
        });
      }
    }

    queueRef.current = combined.map((d, index) => ({
      originalIndex: index,
      data: d
    }));
    totalItemsRef.current = combined.length;
    setProgress(0);
    successCountRef.current = 0;
    setIsRunning(false);
    setIsPaused(false);
    setIsLoading(false);
  };

  const processNext = async () => {
    if (isPausedRef.current || !isRunningRef.current) return;

    while (
      activeWorkersRef.current < concurrencyRef.current &&
      queueRef.current.length > 0 &&
      !isPausedRef.current
    ) {
      const task = queueRef.current.shift();
      if (!task) break;

      activeWorkersRef.current++;

      (async () => {
        let reqFailed = false;
        try {
          const response = await fetch('/api/admin/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ collection, data: task.data })
          });

          if (!response.ok) {
            const res = await response.json().catch(() => ({}));
            throw new Error(
              t('itemLabel', { index: task.originalIndex }) +
                (res.error || t('toastErrorInsertDesc'))
            );
          }

          successCountRef.current++;
          setProgress(successCountRef.current);
        } catch (err) {
          reqFailed = true;
          console.error(err);
          toast({
            title: t('toastErrorTitle'),
            description:
              err instanceof Error
                ? err.message
                : 'Error at ' + task.originalIndex,
            status: 'error'
          });
        } finally {
          activeWorkersRef.current--;

          if (reqFailed) {
            isPausedRef.current = true;
            isRunningRef.current = false;
            setIsPaused(true);
            setIsRunning(false);
            // Push back to the front of queue to allow exactly resuming
            queueRef.current.unshift(task);
          } else {
            if (
              queueRef.current.length === 0 &&
              successCountRef.current >= totalItemsRef.current
            ) {
              activeWorkersRef.current = 0; // safely reset
              isRunningRef.current = false;
              isPausedRef.current = false;
              setIsRunning(false);
              setIsPaused(false);
              toast({
                title: t('toastSuccessTitle'),
                description: t('toastSuccessBulkInsert', {
                  count: totalItemsRef.current
                }),
                status: 'success'
              });
            } else {
              if (!isPausedRef.current && isRunningRef.current) processNext();
            }
          }
        }
      })();
    }
  };

  const startOrResumeProcess = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (totalItemsRef.current === 0)
      return toast({
        title: t('toastErrorTitle'),
        description: t('toastErrorNoFile'),
        status: 'error'
      });
    if (progress >= totalItemsRef.current) return;

    // Immediate ref synchronization to prevent race conditions in processNext
    isRunningRef.current = true;
    isPausedRef.current = false;

    setIsRunning(true);
    setIsPaused(false);
    processNext();
  };

  const handlePause = (e: React.MouseEvent) => {
    e.preventDefault();
    isPausedRef.current = true;
    isRunningRef.current = false;
    
    setIsPaused(true);
    setIsRunning(false);
  };

  const checkHealth = async () => {
    setHealthStatus('checking');
    try {
      const res = await fetch('/api/admin/health');
      if (!res.ok) throw new Error('Kết nối thất bại');

      const data = await res.json();
      if (data.status === 'connected') {
        setHealthStatus('success');
        toast({
          title: t('toastSuccessTitle'),
          description: t('toastSuccessCheckDesc'),
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      } else {
        throw new Error('Trạng thái không xác định');
      }
    } catch (e) {
      setHealthStatus('error');
      toast({
        title: t('toastErrorTitle'),
        description: t('toastErrorCheckDesc'),
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection,
          data: formData
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to ingest data');
      }

      toast({
        title: t('toastSuccessTitle'),
        description: t('toastSuccessInsertDesc', { collection }),
        status: 'success',
        duration: 5000,
        isClosable: true
      });

      // Reset form but keep title/language for convenience
      setFormData({
        title: '',
        ref_link: formData.ref_link || '',
        language: formData.language || 'vi'
      });
    } catch (error) {
      toast({
        title: t('toastErrorTitle'),
        description:
          error instanceof Error ? error.message : t('toastErrorInsertDesc'),
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.md" py={10}>
      <Box p={8} bg={cardBg} borderRadius="xl" shadow="xl" borderWidth="1px">
        <VStack
          spacing={6}
          align="stretch"
          as="form"
          onSubmit={(e) => {
            e.preventDefault();
            if (importMode === 'single') handleSubmit(e);
            else startOrResumeProcess(e);
          }}
        >
          <VStack spacing={2}>
            <Heading size="lg" textAlign="center" color="brand.500">
              {t('pageTitle')}
            </Heading>
            <Text textAlign="center" color="gray.500" fontSize="sm">
              {t('pageSubtitle')}
            </Text>

            <HStack
              bg="gray.50"
              _dark={{ bg: 'gray.700' }}
              p={3}
              borderRadius="lg"
              mt={2}
              w="full"
              justify="space-between"
            >
              <HStack>
                <Text fontSize="sm" fontWeight={500}>
                  {t('statusLabel')}
                </Text>
                {healthStatus === 'idle' && (
                  <Badge colorScheme="gray">{t('statusIdle')}</Badge>
                )}
                {healthStatus === 'checking' && (
                  <Badge colorScheme="blue">{t('statusChecking')}</Badge>
                )}
                {healthStatus === 'success' && (
                  <Badge colorScheme="green">{t('statusConnected')}</Badge>
                )}
                {healthStatus === 'error' && (
                  <Badge colorScheme="red">{t('statusDisconnected')}</Badge>
                )}
              </HStack>
              <Button
                size="sm"
                onClick={checkHealth}
                isLoading={healthStatus === 'checking'}
              >
                {t('checkConnectionBtn')}
              </Button>
            </HStack>
          </VStack>

          <Divider />

          <FormControl isRequired>
            <FormLabel>{t('collectionLabel')}</FormLabel>
            <Select
              value={collection}
              onChange={(e) => setCollection(e.target.value as CollectionType)}
            >
              <option value="Chunk">{t('collectionChunk')}</option>
              <option value="Summary">{t('collectionSummary')}</option>
              <option value="QA">{t('collectionQA')}</option>
            </Select>
          </FormControl>

          <Divider />

          <HStack w="full" spacing={4}>
            <Button
              flex={1}
              variant={importMode === 'single' ? 'solid' : 'outline'}
              colorScheme="brand"
              onClick={() => setImportMode('single')}
            >
              {t('tabSingle')}
            </Button>
            <Button
              flex={1}
              variant={importMode === 'bulk' ? 'solid' : 'outline'}
              colorScheme="brand"
              onClick={() => setImportMode('bulk')}
            >
              {t('tabBulk')}
            </Button>
          </HStack>

          {importMode === 'bulk' ? (
            <FormControl isRequired>
              <FormLabel>{t('bulkLabel')} (Multiple files allowed)</FormLabel>
              <Input
                type="file"
                accept=".json"
                multiple
                onChange={(e) => handleFilesChange(e.target.files)}
                p={1}
                disabled={isRunning}
              />

              <FormLabel mt={4}>{t('concurrencyLabel')}</FormLabel>
              <Input
                type="number"
                min={1}
                max={50}
                value={concurrency}
                onChange={(e) => setConcurrency(Number(e.target.value) || 1)}
              />

              {totalItemsRef.current > 0 && (
                <Box mt={4}>
                  <Text
                    fontSize="sm"
                    mb={1}
                    color={progress >= totalItemsRef.current ? "green.500" : "brand.500"}
                    fontWeight="bold"
                  >
                    {t('progressLabel')}: {progress} / {totalItemsRef.current} (
                    {((progress / totalItemsRef.current) * 100).toFixed(1)}
                    %)
                  </Text>
                  <Progress
                    value={(progress / totalItemsRef.current) * 100}
                    size="sm"
                    colorScheme={progress >= totalItemsRef.current ? "green" : "brand"}
                    borderRadius="md"
                    hasStripe={progress < totalItemsRef.current}
                    isAnimated={isRunning}
                  />

                  {isPaused && (
                    <Badge mt={2} colorScheme="orange">
                      {t('pauseStatus')}
                    </Badge>
                  )}
                </Box>
              )}
            </FormControl>
          ) : (
            <VStack spacing={4} align="stretch">
              {/* Common Fields */}
              <FormControl isRequired>
                <FormLabel>{t('titleLabel')}</FormLabel>
                <Input
                  placeholder={t('titlePlaceholder')}
                  value={formData.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>{t('refLinkLabel')}</FormLabel>
                <Input
                  placeholder={t('refLinkPlaceholder')}
                  value={formData.ref_link || ''}
                  onChange={(e) =>
                    handleInputChange('ref_link', e.target.value)
                  }
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>{t('languageLabel')}</FormLabel>
                <Select
                  value={formData.language || 'vi'}
                  onChange={(e) =>
                    handleInputChange('language', e.target.value)
                  }
                >
                  <option value="vi">{t('langVi')}</option>
                  <option value="en">{t('langEn')}</option>
                </Select>
              </FormControl>

              <Divider />

              {/* Chunk Specific */}
              {collection === 'Chunk' && (
                <>
                  <FormControl isRequired>
                    <FormLabel>{t('textLabel')}</FormLabel>
                    <Textarea
                      rows={5}
                      value={formData.text || ''}
                      onChange={(e) =>
                        handleInputChange('text', e.target.value)
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>{t('noteLabel')}</FormLabel>
                    <Textarea
                      rows={3}
                      value={formData.note || ''}
                      onChange={(e) =>
                        handleInputChange('note', e.target.value)
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>{t('keyConceptsLabel')}</FormLabel>
                    <Input
                      placeholder={t('keyConceptsPlaceholder')}
                      value={formData.key_concepts || ''}
                      onChange={(e) =>
                        handleInputChange('key_concepts', e.target.value)
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>{t('chunkIndexLabel')}</FormLabel>
                    <Input
                      type="number"
                      value={formData.chunk_index || '0'}
                      onChange={(e) =>
                        handleInputChange('chunk_index', e.target.value)
                      }
                    />
                  </FormControl>
                </>
              )}

              {/* Summary Specific */}
              {collection === 'Summary' && (
                <>
                  <FormControl isRequired>
                    <FormLabel>{t('summaryLabel')}</FormLabel>
                    <Textarea
                      rows={4}
                      value={formData.summary || ''}
                      onChange={(e) =>
                        handleInputChange('summary', e.target.value)
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>{t('noteLabel')}</FormLabel>
                    <Textarea
                      rows={3}
                      value={formData.note || ''}
                      onChange={(e) =>
                        handleInputChange('note', e.target.value)
                      }
                    />
                  </FormControl>
                </>
              )}

              {/* QA Specific */}
              {collection === 'QA' && (
                <>
                  <FormControl isRequired>
                    <FormLabel>{t('questionLabel')}</FormLabel>
                    <Input
                      value={formData.question || ''}
                      onChange={(e) =>
                        handleInputChange('question', e.target.value)
                      }
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>{t('answerLabel')}</FormLabel>
                    <Textarea
                      rows={5}
                      value={formData.answer || ''}
                      onChange={(e) =>
                        handleInputChange('answer', e.target.value)
                      }
                    />
                  </FormControl>
                </>
              )}
            </VStack>
          )}

          {importMode === 'single' ? (
            <Button
              type="submit"
              colorScheme="brand"
              size="lg"
              isLoading={isLoading}
              loadingText={t('submittingBtn')}
              w="full"
              mt={4}
            >
              {t('submitBtn')}
            </Button>
          ) : (
            <HStack w="full" mt={4} spacing={4}>
              {!isRunning ? (
                <Button
                  colorScheme="brand"
                  size="lg"
                  flex={1}
                  onClick={startOrResumeProcess}
                  isDisabled={isLoading || totalItemsRef.current === 0}
                >
                  {progress > 0 && progress < totalItemsRef.current
                    ? 'Resume'
                    : t('submitBtn')}
                </Button>
              ) : (
                <Button
                  colorScheme="orange"
                  size="lg"
                  flex={1}
                  onClick={handlePause}
                >
                  Pause
                </Button>
              )}
            </HStack>
          )}
        </VStack>
      </Box>
    </Container>
  );
}
