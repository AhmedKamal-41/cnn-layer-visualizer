"""Image hash caching service with LRU eviction."""

import hashlib
import logging
from collections import OrderedDict
from typing import Optional, List

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
    
    def compute_cache_key(
        self, 
        image_bytes: bytes, 
        model_id: str, 
        top_k_preds: int = 5, 
        top_k_cam: int = 1, 
        cam_layers: Optional[List[str]] = None,
        cam_layer_mode: str = "fast",
        feature_map_limit: int = 16
    ) -> str:
        """
        Compute SHA256 hash of image bytes + model_id + settings.
        
        Args:
            image_bytes: Raw image bytes
            model_id: Model identifier
            top_k_preds: Number of prediction labels to return (default: 5)
            top_k_cam: Number of classes to generate Grad-CAM for (default: 1)
            cam_layers: List of layer names for Grad-CAM (default: None, uses default layers)
            cam_layer_mode: Grad-CAM layer mode - "fast" or "full" (default: "fast")
            feature_map_limit: Number of feature maps to save per layer (default: 16)
            
        Returns:
            Hex digest of cache key (SHA256 of image_bytes + model_id + all settings)
        """
        # Default cam_layers if None
        if cam_layers is None:
            cam_layers = ["conv1", "layer1", "layer2", "layer3", "layer4"]
        
        # Sort layers for consistent cache key
        sorted_layers = sorted(cam_layers)
        layers_str = ",".join(sorted_layers)
        
        # Combine image_bytes + model_id + all settings (encoded to bytes)
        combined = (
            image_bytes + 
            model_id.encode('utf-8') + 
            str(top_k_preds).encode('utf-8') + 
            str(top_k_cam).encode('utf-8') + 
            layers_str.encode('utf-8') +
            cam_layer_mode.encode('utf-8') +
            str(feature_map_limit).encode('utf-8')
        )
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

