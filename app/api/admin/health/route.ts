import { NextResponse } from 'next/server';
import { checkMilvusHealth } from '@/app/api/chat/lib/milvus-client';

export async function GET() {
  try {
    const isHealthy = await checkMilvusHealth();

    if (isHealthy) {
      return NextResponse.json({ status: 'connected' });
    } else {
      return NextResponse.json(
        {
          status: 'disconnected',
          error:
            'Failed to connect to MilvusDB. Please check MILVUS_ADDRESS and MILVUS_TOKEN.'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
