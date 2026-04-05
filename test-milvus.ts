import { MilvusClient } from "@zilliz/milvus2-sdk-node";
import 'dotenv/config';

async function main() {
  const client = new MilvusClient({
    address: process.env.MILVUS_ADDRESS!,
    token: process.env.MILVUS_TOKEN!,
  });

  const queryText = "Dương Văn Nghĩa 11 - 06 - 1976";
  const queryEmbedding = new Array(2048).fill(0.1); 

  try {
    const res = await client.hybridSearch({
      collection_name: "Summary",
      reqs: [
        {
          data: [queryEmbedding], 
          anns_field: "embedding",
          limit: 2,
        },
        {
          data: [queryText], 
          anns_field: "sparse",
          limit: 2,
        }
      ],
      rerank: { strategy: "rrf", params: { k: 50 } },
      limit: 2,
      output_fields: ["title"]
    });
    console.log("Hybrid Search Success:", res);
  } catch (e: any) {
    console.log("Hybrid Search Failed with Error:", e.message);
  }
}

main();
