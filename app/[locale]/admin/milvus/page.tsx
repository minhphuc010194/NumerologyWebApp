'use client';

import { useState } from 'react';
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
} from 'components';
import { useTranslations } from 'next-intl';

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
    language: 'vi',
  });
  
  // Bulk import state
  const [importMode, setImportMode] = useState<'single' | 'bulk'>('single');
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFile) return toast({ title: t('toastErrorTitle'), description: t('toastErrorNoFile'), status: 'error' });
    
    setIsLoading(true);
    try {
      const text = await bulkFile.text();
      const dataArr = JSON.parse(text);
      if (!Array.isArray(dataArr)) throw new Error(t('toastErrorInvalidJson'));
      
      setBulkProgress({ current: 0, total: dataArr.length });

      for (let i = 0; i < dataArr.length; i++) {
        const item = dataArr[i];
        const response = await fetch('/api/admin/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collection,
            data: item
          })
        });
        
        if (!response.ok) {
          const res = await response.json();
          throw new Error(t('itemLabel', { index: i }) + (res.error || t('toastErrorInsertDesc')));
        }

        setBulkProgress({ current: i + 1, total: dataArr.length });
        await new Promise(r => setTimeout(r, 100)); // Delay to avoid strict rate limits
      }

      toast({ title: t('toastSuccessTitle'), description: t('toastSuccessBulkInsert', { count: dataArr.length }), status: 'success' });
      setBulkFile(null);
      setBulkProgress({ current: 0, total: 0 });
    } catch(err) {
      toast({ title: t('toastErrorTitle'), description: err instanceof Error ? err.message : t('toastErrorInsertDesc'), status: 'error' });
    } finally {
      setIsLoading(false);
    }
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
          isClosable: true,
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
        isClosable: true,
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
        }),
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
        isClosable: true,
      });

      // Reset form but keep title/language for convenience
      setFormData({
        title: '',
        ref_link: formData.ref_link || '',
        language: formData.language || 'vi',
      });
    } catch (error) {
      toast({
        title: t('toastErrorTitle'),
        description: error instanceof Error ? error.message : t('toastErrorInsertDesc'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.md" py={10}>
      <Box p={8} bg={cardBg} borderRadius="xl" shadow="xl" borderWidth="1px">
        <VStack spacing={6} align="stretch" as="form" onSubmit={importMode === 'single' ? handleSubmit : handleBulkSubmit}>
          
          <VStack spacing={2}>
            <Heading size="lg" textAlign="center" color="brand.500">
               {t('pageTitle')}
            </Heading>
            <Text textAlign="center" color="gray.500" fontSize="sm">
              {t('pageSubtitle')}
            </Text>
            
            <HStack bg="gray.50" _dark={{ bg: "gray.700" }} p={3} borderRadius="lg" mt={2} w="full" justify="space-between">
              <HStack>
                <Text fontSize="sm" fontWeight={500}>{t('statusLabel')}</Text>
                {healthStatus === 'idle' && <Badge colorScheme="gray">{t('statusIdle')}</Badge>}
                {healthStatus === 'checking' && <Badge colorScheme="blue">{t('statusChecking')}</Badge>}
                {healthStatus === 'success' && <Badge colorScheme="green">{t('statusConnected')}</Badge>}
                {healthStatus === 'error' && <Badge colorScheme="red">{t('statusDisconnected')}</Badge>}
              </HStack>
              <Button size="sm" onClick={checkHealth} isLoading={healthStatus === 'checking'}>
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
            <Button flex={1} variant={importMode === 'single' ? 'solid' : 'outline'} colorScheme="brand" onClick={() => setImportMode('single')}>{t('tabSingle')}</Button>
            <Button flex={1} variant={importMode === 'bulk' ? 'solid' : 'outline'} colorScheme="brand" onClick={() => setImportMode('bulk')}>{t('tabBulk')}</Button>
          </HStack>

          {importMode === 'bulk' ? (
             <FormControl isRequired>
                <FormLabel>{t('bulkLabel')}</FormLabel>
                <Input type="file" accept=".json" onChange={(e) => setBulkFile(e.target.files?.[0] || null)} p={1} />
                {bulkProgress.total > 0 && (
                   <Box mt={4}>
                     <Text fontSize="sm" mb={1} color="brand.500" fontWeight="bold">
                       {t('progressLabel')}: {bulkProgress.current} / {bulkProgress.total} ({((bulkProgress.current / bulkProgress.total) * 100).toFixed(1)}%)
                     </Text>
                     <Progress value={(bulkProgress.current / bulkProgress.total) * 100} size="sm" colorScheme="brand" borderRadius="md" hasStripe isAnimated />
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
              onChange={(e) => handleInputChange('ref_link', e.target.value)}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>{t('languageLabel')}</FormLabel>
            <Select
              value={formData.language || 'vi'}
              onChange={(e) => handleInputChange('language', e.target.value)}
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
                  onChange={(e) => handleInputChange('text', e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>{t('noteLabel')}</FormLabel>
                <Textarea
                  rows={3}
                  value={formData.note || ''}
                  onChange={(e) => handleInputChange('note', e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>{t('keyConceptsLabel')}</FormLabel>
                <Input
                  placeholder={t('keyConceptsPlaceholder')}
                  value={formData.key_concepts || ''}
                  onChange={(e) => handleInputChange('key_concepts', e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>{t('chunkIndexLabel')}</FormLabel>
                <Input
                  type="number"
                  value={formData.chunk_index || '0'}
                  onChange={(e) => handleInputChange('chunk_index', e.target.value)}
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
                  onChange={(e) => handleInputChange('summary', e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>{t('noteLabel')}</FormLabel>
                <Textarea
                  rows={3}
                  value={formData.note || ''}
                  onChange={(e) => handleInputChange('note', e.target.value)}
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
                  onChange={(e) => handleInputChange('question', e.target.value)}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>{t('answerLabel')}</FormLabel>
                <Textarea
                  rows={5}
                  value={formData.answer || ''}
                  onChange={(e) => handleInputChange('answer', e.target.value)}
                />
              </FormControl>
            </>
          )}
          </VStack>
        )}

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
        </VStack>
      </Box>
    </Container>
  );
}
