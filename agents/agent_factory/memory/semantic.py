"""
Module 14 & 15: Semantic Memory & Vector Retrieval Infrastructure
"""

import math
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class MemoryChunk(BaseModel):
    chunk_id: str
    text: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    embedding: Optional[List[float]] = None


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    if norm1 == 0.0 or norm2 == 0.0:
        return 0.0
    return dot / (norm1 * norm2)


class SimpleEmbeddingProvider:
    """Lightweight hash-based pseudo-embedding for testing and standalone operation."""
    def __init__(self, dim: int = 64):
        self.dim = dim

    def embed_text(self, text: str) -> List[float]:
        import hashlib
        words = text.lower().split()
        vec = [0.0] * self.dim
        for word in words:
            h = int(hashlib.md5(word.encode()).hexdigest(), 16)
            for i in range(self.dim):
                bit = (h >> (i % 32)) & 1
                vec[i] += 1.0 if bit else -1.0

        # Normalize
        norm = math.sqrt(sum(x * x for x in vec)) or 1.0
        return [x / norm for x in vec]


class SemanticMemory:
    """Module 15: In-memory vector store with chunking, metadata filtering, and similarity search."""

    def __init__(self, embedding_provider: Optional[SimpleEmbeddingProvider] = None):
        self.embedder = embedding_provider or SimpleEmbeddingProvider()
        self._chunks: List[MemoryChunk] = []

    def chunk_and_index(
        self,
        document_id: str,
        text: str,
        chunk_size: int = 500,
        overlap: int = 50,
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[MemoryChunk]:
        """Splits text into chunks, generates embeddings, and indexes them."""
        metadata = metadata or {}
        created_chunks = []

        start = 0
        idx = 0
        while start < len(text):
            end = start + chunk_size
            chunk_str = text[start:end]
            chunk_id = f"{document_id}_chunk_{idx}"
            embedding = self.embedder.embed_text(chunk_str)

            chunk = MemoryChunk(
                chunk_id=chunk_id,
                text=chunk_str,
                metadata={**metadata, "document_id": document_id, "chunk_index": idx},
                embedding=embedding
            )
            self._chunks.append(chunk)
            created_chunks.append(chunk)

            idx += 1
            start += chunk_size - overlap

        return created_chunks

    def search(
        self,
        query: str,
        top_k: int = 3,
        metadata_filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Returns top-k most similar chunks matching metadata filters."""
        if not self._chunks:
            return []

        query_vec = self.embedder.embed_text(query)
        scored: List[Dict[str, Any]] = []

        for chunk in self._chunks:
            # Metadata filter check
            if metadata_filters:
                match = all(chunk.metadata.get(k) == v for k, v in metadata_filters.items())
                if not match:
                    continue

            score = cosine_similarity(query_vec, chunk.embedding or [])
            scored.append({"chunk": chunk, "score": score})

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_k]
