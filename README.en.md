# CanadaSpends: Interactive Government Spending Data Explorer

*[English](README.en.md) | [Français](README.fr.md)*

A powerful tool for exploring Canadian federal government spending data through natural language queries. Ask questions about government spending in plain English and get instant, AI-powered insights.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Using the Chat Interface](#using-the-chat-interface)
  - [Example Questions](#example-questions)
  - [Available Commands](#available-commands)
- [Architecture](#architecture)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

## Overview

CanadaSpends makes government spending data accessible through three main components:
- **Interactive Chat Interface:** Ask questions about spending data in natural language
- **Data Processing:** Automated parsing and cleaning of government data sources
- **Vector Search:** Advanced semantic search powered by Weaviate and AI embeddings

## Features

- 💬 Natural language query interface
- 🤖 AI-powered response generation
- 📊 Real-time access to government spending data
- 🔍 Semantic search capabilities
- 🎨 Rich text formatting for better readability
- 🔄 Persistent data storage
- 🐳 Easy deployment with Docker

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Cohere API key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/CanadaSpends.git
   cd CanadaSpends
   ```

2. **Configure environment:**
   Create a `.env` file in the root directory:
   ```env
   COHERE_API_KEY=your_cohere_api_key
   WEAVIATE_HOST=weaviate
   WEAVIATE_HTTP_PORT=8080
   WEAVIATE_GRPC_PORT=50051
   PYTHONPATH=/app
   ```

3. **Start the services:**
   ```bash
   cd query-engine
   docker-compose up -d
   docker-compose run --rm chat
   ```

This launches:
- Weaviate vector database
- API service
- Interactive chat interface

## Using the Chat Interface

The chat interface provides an intuitive way to explore government spending data. Simply type your questions in natural language and get detailed responses.

### Example Questions

- "What was the total spending in 2023?"
- "Compare spending between different departments"
- "What are the main categories of government spending?"
- "Which department had the highest spending?"

### Available Commands

- Type your questions in natural language to query the spending data
- `clear` - Clears the screen
- `q`, `quit`, or `exit` - Exits the chat interface
- Use Ctrl+C to exit at any time

## Architecture

The system consists of three main components:

1. **Vector Database (Weaviate)**
   - Stores and indexes spending data
   - Enables semantic search capabilities
   - Persists data between sessions

2. **API Service**
   - Handles data indexing
   - Processes natural language queries
   - Manages communication with AI models

3. **Chat Interface**
   - Provides interactive CLI
   - Formats responses for readability
   - Handles user commands

## Development

The source code is organized in the following structure:

```
CanadaSpends/
├── query-engine/
│   ├── src/
│   │   ├── chat_interface.py  # Interactive CLI
│   │   ├── query_engine.py    # Core query processing
│   │   ├── indexer.py         # Data indexing
│   │   └── main.py           # API service
│   ├── csv-data/             # Data directory
│   └── docker-compose.yaml   # Service configuration
```

## Troubleshooting

If you encounter issues:

1. **Service Issues**
   - Ensure all required API keys are correctly set in `.env`
   - Verify CSV data is present in `query-engine/csv-data`
   - Check service status: `docker-compose ps`
   - View logs: `docker-compose logs`

2. **Data Issues**
   - Ensure CSV files are properly formatted
   - Check file permissions
   - Verify data path in configuration

3. **API Issues**
   - Confirm API keys are valid
   - Check network connectivity
   - Verify service dependencies are running

4. **Support**
    - For support, please open an issue on the [GitHub repository](https://github.com/yourusername/CanadaSpends/issues)
    - Or if all else fails, contact [hi@canadaspends.com](mailto:hi@canadaspends.com)
