from loguru import logger
import os
import pandas as pd
from typing import Optional

from llama_index.core import (
    Document, 
    VectorStoreIndex, 
    StorageContext, 
    Settings
)
from llama_index.vector_stores.weaviate import WeaviateVectorStore

import weaviate
from weaviate.classes.config import (
    Configure,
    DataType,
    Property
)
from weaviate.classes.init import AdditionalConfig, Timeout



class CSVIndexer:
    def __init__(self):
        # Initialize Weaviate client using v4 syntax
        http_port = int(os.getenv('WEAVIATE_HTTP_PORT'))
        grpc_port = int(os.getenv('WEAVIATE_GRPC_PORT'))

        self.weaviate_client = weaviate.connect_to_custom(
            http_host=os.getenv('WEAVIATE_HOST'),
            http_port=http_port,
            http_secure=False,
            grpc_host=os.getenv('WEAVIATE_HOST'),
            grpc_port=grpc_port,
            grpc_secure=False,          
            headers={
                "X-Cohere-Api-Key": os.getenv("COHERE_API_KEY")
            },
            additional_config=AdditionalConfig(
                timeout=Timeout(init=30, query=60, insert=120)  # Values in seconds
            )
        )

        logger.info(self.weaviate_client.is_ready())

    async def initialize_and_index(self, csv_path: str):
        try:
            # Read CSV file
            df = pd.read_csv(csv_path)

            self.weaviate_client.connect()
            
            # Create a class in Weaviate if it doesn't exist
            collection_name = "CanadaSpends"
            self._create_weaviate_schema(collection_name)
            
            # Convert DataFrame to documents
            documents = self._prepare_documents(df)
            
            # Create vector store
            vector_store = WeaviateVectorStore(
                weaviate_client=self.weaviate_client,
                index_name=collection_name,
                text_key="content"
            )
            
            # Create storage context
            storage_context = StorageContext.from_defaults(vector_store=vector_store)
            
            # Create index with explicit settings
            index = VectorStoreIndex.from_documents(
                documents,
                storage_context=storage_context,
                show_progress=True
            )
            
            from query_engine import QueryEngine
            return QueryEngine(index)
        except Exception as e:
            print(f"Error during initialization: {str(e)}")
            raise

    def _create_weaviate_schema(self, collection_name: str):

        # Delete if exists
        try:
            self.weaviate_client.collections.delete(collection_name)
        except:
            pass
        
        # Create collection with v4 syntax
        self.weaviate_client.collections.create(
            name=collection_name,
            vectorizer_config=Configure.Vectorizer.text2vec_cohere(
                model="embed-multilingual-v2.0"
            ),
            properties=[
                Property(name="content", data_type=DataType.TEXT)
            ]
        )

    def _prepare_documents(self, df: pd.DataFrame) -> list[Document]:
        documents = []
        
        for _, row in df.iterrows():
            # Create a structured text representation of the row
            content = f"""
            Department: {row['MINE']} ({row['MINF']})
            Fiscal Year: {row['FSCL_YR']}
            Description: {row['Description_EN']} ({row['Description_FR']})
            Total Net Expenditure: {row['Ttl-min-net-exp_Ttl-dép-min-nettes']}
            Consolidated Special Purpose Accounts: {row['Cons-spec-purpose-accnts_Cmpts-fins-dét-cons']}
            Accrual and Other Adjustments: {row['Accrual-and-other-adjs_Redressements-courus-et-autres']}
            Consolidated Crown Corps: {row["Cons-Crown-corps-and-other-ents_Socs-d'État-et-autres-ents-cons"]}
            Tax Credits and Repayments: {row['Tax-credits-and-repayments_Crédits-et-remboursements-fiscaux']}
            Internal Expenses: {row['Internal-expenses_Charges-internes']}
            """
            
            documents.append(Document(text=content))
        
        return documents

    def close(self):
        """Close the Weaviate client connection."""
        if self.weaviate_client:
            self.weaviate_client.close()