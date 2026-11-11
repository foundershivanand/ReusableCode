"""
Module 32 & 33: RAG Engine, Hybrid Search (BM25 + Dense Vectors), and Knowledge Base
"""

import math
import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from agent_factory.memory.semantic import MemoryChunk, SimpleEmbeddingProvider, cosine_similarity


class RAGSearchResult(BaseModel):
    chunk_id: str
    text: str
    source_doc: str
    score: float
    retrieval_mode: str  # "dense", "sparse_bm25", "hybrid_rrf"
    metadata: Dict[str, Any] = Field(default_factory=dict)


class BM25Index:
    """Lightweight sparse BM25 index for exact keyword matching."""

    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.doc_len: List[int] = []
        self.avg_doc_len: float = 0.0
        self.corpus_size: int = 0
        self.doc_freqs: List[Dict[str, int]] = []
        self.idf: Dict[str, float] = {}
        self.chunk_ids: List[str] = []

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r"\b\w+\b", text.lower())

    def index(self, chunks: List[MemoryChunk]) -> None:
        self.chunk_ids = [c.chunk_id for c in chunks]
        self.corpus_size = len(chunks)
        self.doc_len = []
        self.doc_freqs = []
        df: Dict[str, int] = {}

        for c in chunks:
            tokens = self._tokenize(c.text)
            self.doc_len.append(len(tokens))
            freq: Dict[str, int] = {}
            for t in tokens:
                freq[t] = freq.get(t, 0) + 1
            self.doc_freqs.append(freq)
            for t in freq:
                df[t] = df.get(t, 0) + 1

        self.avg_doc_len = sum(self.doc_len) / max(1, self.corpus_size)

        # Calculate IDF
        self.idf = {}
        for word, count in df.items():
            self.idf[word] = math.log(1.0 + (self.corpus_size - count + 0.5) / (count + 0.5))

    def search(self, query: str, top_k: int = 5) -> List[tuple[str, float]]:
        q_tokens = self._tokenize(query)
        scores: List[float] = [0.0] * self.corpus_size

        for token in q_tokens:
            if token not in self.idf:
                continue
            token_idf = self.idf[token]
            for i, freq_dict in enumerate(self.doc_freqs):
                tf = freq_dict.get(token, 0)
                if tf > 0:
                    numerator = token_idf * tf * (self.k1 + 1.0)
                    denominator = tf + self.k1 * (1.0 - self.b + self.b * (self.doc_len[i] / self.avg_doc_len))
                    scores[i] += numerator / denominator

        ranked = sorted(
            [(self.chunk_ids[i], scores[i]) for i in range(self.corpus_size) if scores[i] > 0.0],
            key=lambda x: x[1],
            reverse=True
        )
        return ranked[:top_k]


class RAGEngine:
    """Module 32: Hybrid RAG Engine combining Dense Vector Search and BM25 with Reciprocal Rank Fusion."""

    def __init__(self, embedder: Optional[SimpleEmbeddingProvider] = None):
        self.embedder = embedder or SimpleEmbeddingProvider()
        self.bm25 = BM25Index()
        self._chunks: Dict[str, MemoryChunk] = {}

    def index_document(
        self,
        document_id: str,
        text: str,
        chunk_size: int = 400,
        overlap: int = 50,
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[MemoryChunk]:
        metadata = metadata or {}
        created: List[MemoryChunk] = []
        start = 0
        idx = 0

        while start < len(text):
            end = start + chunk_size
            sub = text[start:end]
            chunk_id = f"{document_id}_ch_{idx}"
            emb = self.embedder.embed_text(sub)
            chunk = MemoryChunk(
                chunk_id=chunk_id,
                text=sub,
                metadata={**metadata, "doc_id": document_id, "chunk_index": idx},
                embedding=emb
            )
            self._chunks[chunk_id] = chunk
            created.append(chunk)
            idx += 1
            start += chunk_size - overlap

        # Re-index BM25
        self.bm25.index(list(self._chunks.values()))
        return created

    def hybrid_search(self, query: str, top_k: int = 3, rrf_k: int = 60) -> List[RAGSearchResult]:
        """Performs Reciprocal Rank Fusion (RRF) between BM25 and Dense Embeddings."""
        if not self._chunks:
            return []

        # 1. Sparse BM25
        bm25_hits = self.bm25.search(query, top_k=top_k * 2)
        sparse_ranks = {cid: rank for rank, (cid, _) in enumerate(bm25_hits)}

        # 2. Dense Vector
        q_emb = self.embedder.embed_text(query)
        dense_hits = []
        for cid, chunk in self._chunks.items():
            if chunk.embedding:
                sim = cosine_similarity(q_emb, chunk.embedding)
                dense_hits.append((cid, sim))
        dense_hits.sort(key=lambda x: x[1], reverse=True)
        dense_ranks = {cid: rank for rank, (cid, _) in enumerate(dense_hits[:top_k * 2])}

        # 3. Reciprocal Rank Fusion
        all_candidate_ids = set(sparse_ranks.keys()) | set(dense_ranks.keys())
        rrf_scores: Dict[str, float] = {}

        for cid in all_candidate_ids:
            score = 0.0
            if cid in sparse_ranks:
                score += 1.0 / (rrf_k + sparse_ranks[cid])
            if cid in dense_ranks:
                score += 1.0 / (rrf_k + dense_ranks[cid])
            rrf_scores[cid] = score

        sorted_cids = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]

        results = []
        for cid, score in sorted_cids:
            chunk = self._chunks[cid]
            results.append(
                RAGSearchResult(
                    chunk_id=chunk.chunk_id,
                    text=chunk.text,
                    source_doc=chunk.metadata.get("doc_id", "unknown"),
                    score=round(score, 6),
                    retrieval_mode="hybrid_rrf",
                    metadata=chunk.metadata
                )
            )
        return results


class KnowledgeBase:
    """Module 33: Dedicated persistent Knowledge Base for an individual agent."""

    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self.rag = RAGEngine()

    def add_knowledge(self, doc_id: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        self.rag.index_document(doc_id, content, metadata=metadata)

    def retrieve(self, query: str, top_k: int = 3) -> List[RAGSearchResult]:
        return self.rag.hybrid_search(query, top_k=top_k)
