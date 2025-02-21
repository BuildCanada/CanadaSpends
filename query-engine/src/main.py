import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
from typing import Optional
import uvicorn

from indexer import CSVIndexer
from query_engine import QueryEngine

# Load environment variables
load_dotenv()

# Global query_engine variable
query_engine = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize the query engine
    global query_engine
    indexer = CSVIndexer()
    csv_path = "/app/data/otpmopeom-apdtmacdpam-2024.csv"
    query_engine = await indexer.initialize_and_index(csv_path)
    
    yield  # Server is running and handling requests
    
    # Cleanup (if needed)
    query_engine = None

# Initialize FastAPI with lifespan
app = FastAPI(
    title="Canada Spends Query Engine",
    lifespan=lifespan
)

@app.get("/query")
async def query_data(question: str):
    if not query_engine:
        raise HTTPException(status_code=500, detail="Query engine not initialized")
    try:
        response = await query_engine.query(question)
        return {"question": question, "answer": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 