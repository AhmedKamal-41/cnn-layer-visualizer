"""Image hash caching service with LRU eviction."""

import hashlib
import logging
from collections import OrderedDict
from typing import Optional

from app.core.config import settings
from app.jobs.models import JobResult

logger = logging.getLogger("app.services.cache")


class CacheService:
    """Service for caching job results with LRU eviction."""
    
    def __init__(self, max_items: int = 100):
        """
        Initialize cache service with LRU eviction.
        
        Args:
            max_items: Maximum number of items to cache (default: 100)
        """
        self._cache: OrderedDict[str, JobResult] = OrderedDict()
        self._max_items = max_items
    
    def compute_cache_key(self, image_bytes: bytes, model_id: str) -> str:
        """
        Compute SHA256 hash of image bytes + model_id.
        
        Args:
            image_bytes: Raw image bytes
            model_id: Model identifier
            
        Returns:
            Hex digest of cache key (SHA256 of image_bytes + model_id)
        """
        # Combine image_bytes + model_id (encoded to bytes)
        combined = image_bytes + model_id.encode('utf-8')
        return hashlib.sha256(combined).hexdigest()
    
    def get(self, cache_key: str) -> Optional[JobResult]:
        """
        Get cached result by cache key (LRU: moves item to end).
        
        Args:
            cache_key: SHA256 hash of image_bytes + model_id
            
        Returns:
            Cached JobResult if found, None otherwise
        """
        if cache_key in self._cache:
            # Move to end (most recently used)
            self._cache.move_to_end(cache_key)
            logger.debug(f"Cache hit for key: {cache_key[:16]}...")
            return self._cache[cache_key]
        
        logger.debug(f"Cache miss for key: {cache_key[:16]}...")
        return None
    
    def set(self, cache_key: str, value: JobResult) -> None:
        """
        Store result in cache (LRU: adds/moves to end, evicts oldest if over limit).
        
        Args:
            cache_key: SHA256 hash of image_bytes + model_id
            value: JobResult to cache
        """
        if cache_key in self._cache:
            # Update existing entry and move to end
            self._cache.move_to_end(cache_key)
        else:
            # Add new entry
            self._cache[cache_key] = value
            
            # Evict oldest if over limit
            if len(self._cache) > self._max_items:
                oldest_key = next(iter(self._cache))
                del self._cache[oldest_key]
                logger.debug(f"Evicted cache entry: {oldest_key[:16]}...")
        
        # Ensure it's at the end (most recently used)
        self._cache.move_to_end(cache_key)
        logger.debug(f"Cached result for key: {cache_key[:16]}... (cache size: {len(self._cache)}/{self._max_items})")
    
    def has(self, cache_key: str) -> bool:
        """
        Check if cache contains entry for cache key.
        
        Args:
            cache_key: SHA256 hash of image_bytes + model_id
            
        Returns:
            True if cached, False otherwise
        """
        return cache_key in self._cache
    
    def clear(self) -> None:
        """Clear all cached entries."""
        self._cache.clear()
        logger.debug("Cache cleared")
    
    def size(self) -> int:
        """Get current cache size."""
        return len(self._cache)


# Global cache service instance
cache_service = CacheService(max_items=settings.CACHE_MAX_ITEMS if settings.CACHE_ENABLED else 0)

