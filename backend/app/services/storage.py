"""Storage service for saving generated visual assets."""

import aiofiles
from pathlib import Path
from typing import Optional
import json

from app.core.config import settings


class StorageService:
    """Service for managing storage of generated assets."""
    
    def __init__(self):
        """Initialize storage service."""
        self._storage_root = settings.STORAGE_DIR
        self._storage_root.mkdir(parents=True, exist_ok=True)
    
    def get_job_storage_path(self, job_id: str) -> Path:
        """
        Get storage path for a specific job.
        
        Args:
            job_id: Unique job identifier
            
        Returns:
            Path to job storage directory
        """
        job_path = self._storage_root / job_id
        job_path.mkdir(parents=True, exist_ok=True)
        return job_path
    
    async def save_file(
        self,
        job_id: str,
        filename: str,
        content: bytes,
    ) -> Path:
        """
        Save file to job storage directory.
        
        Args:
            job_id: Unique job identifier
            filename: Name of the file to save
            content: File content as bytes
            
        Returns:
            Path to saved file
        """
        job_path = self.get_job_storage_path(job_id)
        file_path = job_path / filename
        
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(content)
        
        return file_path
    
    async def save_json(
        self,
        job_id: str,
        filename: str,
        data: dict,
    ) -> Path:
        """
        Save JSON data to job storage directory.
        
        Args:
            job_id: Unique job identifier
            filename: Name of the JSON file
            data: Dictionary to save as JSON
            
        Returns:
            Path to saved file
        """
        job_path = self.get_job_storage_path(job_id)
        file_path = job_path / filename
        
        async with aiofiles.open(file_path, "w") as f:
            await f.write(json.dumps(data, indent=2))
        
        return file_path
    
    def get_file_url(self, job_id: str, filename: str) -> str:
        """
        Get URL or relative path for a stored file.
        
        Args:
            job_id: Unique job identifier
            filename: Name of the file
            
        Returns:
            Relative path to file
        """
        return f"/storage/{job_id}/{filename}"
    
    async def list_job_files(self, job_id: str) -> list[Path]:
        """
        List all files in job storage directory.
        
        Args:
            job_id: Unique job identifier
            
        Returns:
            List of file paths
        """
        job_path = self.get_job_storage_path(job_id)
        if job_path.exists():
            return list(job_path.iterdir())
        return []


# Global storage service instance
storage_service = StorageService()

