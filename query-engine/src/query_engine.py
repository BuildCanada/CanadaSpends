from llama_index.core.indices import VectorStoreIndex
from typing import Optional

class QueryEngine:
    def __init__(self, index: VectorStoreIndex):
        self.index = index
        self.query_engine = index.as_query_engine(
            similarity_top_k=5,
            response_mode="compact"
        )

    async def query(self, question: str) -> str:
        try:
            response = self.query_engine.query(question)
            return str(response)
        except Exception as e:
            raise Exception(f"Error querying index: {str(e)}")