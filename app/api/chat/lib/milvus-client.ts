/**
 * Milvus client singleton for Zilliz Cloud.
 * Lazy initialization — connection is established on first use.
 */
import { MilvusClient, DataType, FunctionType } from "@zilliz/milvus2-sdk-node";

// Collection names as constants
export const COLLECTION_CHUNK = "Chunk";
export const COLLECTION_SUMMARY = "Summary";
export const COLLECTION_QA = "QA";

// Vector dimension matching the Nemotron-embed-vl-1b-v2 model
export const EMBEDDING_DIMENSION = 2048;

// Search field mappings per collection
export const SEARCH_FIELDS = {
  [COLLECTION_CHUNK]: {
    denseField: "embedding",
    sparseField: "sparse",
    bm25InputField: "text",
    outputFields: [
      "title",
      "text",
      "key_concepts",
      "ref_link",
      "language",
      "chunk_index",
    ],
  },
  [COLLECTION_SUMMARY]: {
    denseField: "embedding",
    sparseField: "sparse",
    bm25InputField: "summary",
    outputFields: ["title", "note", "ref_link", "language"],
  },
  [COLLECTION_QA]: {
    denseField: "embedding",
    sparseField: "sparse",
    bm25InputField: "question",
    outputFields: ["question", "answer", "title", "ref_link", "language"],
  },
} as const;

let clientInstance: MilvusClient | null = null;

function createMilvusClient(): MilvusClient {
  const address = process.env.MILVUS_ADDRESS;
  const token = process.env.MILVUS_TOKEN;

  if (!address) {
    throw new Error("MILVUS_ADDRESS environment variable is not configured");
  }

  if (!token) {
    throw new Error("MILVUS_TOKEN environment variable is not configured");
  }

  return new MilvusClient({
    address,
    token,
    channelOptions: {
      // Zilliz Cloud requires TLS
      "grpc.max_receive_message_length": 64 * 1024 * 1024,
      "grpc.max_send_message_length": 64 * 1024 * 1024,
    },
  });
}

/**
 * Returns a singleton MilvusClient instance.
 * Creates the connection on first invocation.
 */
export function getMilvusClient(): MilvusClient {
  if (!clientInstance) {
    clientInstance = createMilvusClient();
  }
  return clientInstance;
}

/**
 * Health check — verifies the Milvus connection is alive.
 */
export async function checkMilvusHealth(): Promise<boolean> {
  try {
    const client = getMilvusClient();
    const response = await client.checkHealth();
    return response.isHealthy;
  } catch (error) {
    console.error("[Milvus] Health check failed:", error);
    return false;
  }
}

const verifiedCollections = new Set<string>();

export function clearVerifiedCollection(collectionName: string) {
  verifiedCollections.delete(collectionName);
}

/**
 * Ensures the specified collection exists in Milvus. If not, auto-creates it
 * with the correct schema (dimension, dynamic fields, auto_id).
 */
function checkStatus(res: any, action: string) {
  if (res && res.status && res.status.error_code && res.status.error_code !== 'Success') {
    throw new Error(`[Milvus] ${action} Failed: ${res.status.reason || res.status.error_code}`);
  }
  if (res && res.error_code && res.error_code !== 'Success') { // some endpoints return error_code at root
    throw new Error(`[Milvus] ${action} Failed: ${res.reason || res.error_code}`);
  }
}

export async function ensureCollectionExists(collectionName: string): Promise<void> {
  if (verifiedCollections.has(collectionName)) return;

  const client = getMilvusClient();
  const hasCollectionRes = await client.hasCollection({ collection_name: collectionName });

  if (!hasCollectionRes.value) {
    console.log(`[Milvus] Collection ${collectionName} does not exist. Auto-creating Hybrid Schema...`);

    const fieldsMap = SEARCH_FIELDS[collectionName as keyof typeof SEARCH_FIELDS];
    if (!fieldsMap || !fieldsMap.bm25InputField) {
        throw new Error(`Schema mapping for ${collectionName} not found in SEARCH_FIELDS!`);
    }

    const bm25InputField = fieldsMap.bm25InputField;

    const createRes = await client.createCollection({
      collection_name: collectionName,
      fields: [
        { name: "id", data_type: DataType.Int64, is_primary_key: true, autoID: true },
        { name: "embedding", data_type: DataType.FloatVector, dim: EMBEDDING_DIMENSION },
        { name: "sparse", data_type: DataType.SparseFloatVector },
        { name: bm25InputField, data_type: DataType.VarChar, max_length: 65535, enable_analyzer: true },
      ],
      functions: [
        {
          name: "bm25_sparse_function",
          description: "BM25 sparse encoding",
          type: FunctionType.BM25,
          input_field_names: [bm25InputField],
          output_field_names: ["sparse"],
          params: {}
        }
      ],
      enable_dynamic_field: true
    });
    checkStatus(createRes, `createCollection (${collectionName})`);

    console.log(`[Milvus] Collection ${collectionName} created. Building Indexes...`);
    
    const index1 = await client.createIndex({
      collection_name: collectionName,
      field_name: "embedding",
      metric_type: "COSINE",
    });
    checkStatus(index1, `createIndex (embedding)`);

    const index2 = await client.createIndex({
      collection_name: collectionName,
      field_name: "sparse",
      index_type: "SPARSE_INVERTED_INDEX",
      metric_type: "BM25"
    });
    checkStatus(index2, `createIndex (sparse)`);

    console.log(`[Milvus] Loading Collection ${collectionName}...`);
    const loadRes = await client.loadCollectionSync({ collection_name: collectionName });
    checkStatus(loadRes, `loadCollectionSync (${collectionName})`);

    // Brief delay to allow Zilliz Cloud to propagate cluster changes
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  verifiedCollections.add(collectionName);
}
