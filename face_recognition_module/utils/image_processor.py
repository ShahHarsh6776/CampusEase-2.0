"""
Image Processing Utilities for Campus Face Recognition
"""

import cv2
import numpy as np
import base64
import io
from PIL import Image
from typing import Optional, Tuple, Union
import logging

logger = logging.getLogger(__name__)

class ImageProcessor:
    """
    Image processing utilities for face recognition system
    """
    
    @staticmethod
    def resize_image(image: np.ndarray, max_size: int = 1024) -> np.ndarray:
        """
        Resize image while maintaining aspect ratio
        
        Args:
            image: Input image as numpy array
            max_size: Maximum dimension size
            
        Returns:
            Resized image
        """
        height, width = image.shape[:2]
        
        if max(height, width) <= max_size:
            return image
        
        if height > width:
            new_height = max_size
            new_width = int(width * (max_size / height))
        else:
            new_width = max_size
            new_height = int(height * (max_size / width))
        
        return cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
    
    @staticmethod
    def enhance_image(image: np.ndarray) -> np.ndarray:
        """
        Apply image enhancement for better face detection
        
        Args:
            image: Input image
            
        Returns:
            Enhanced image
        """
        # Convert to LAB color space
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        
        # Apply CLAHE to L channel
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        lab[:, :, 0] = clahe.apply(lab[:, :, 0])
        
        # Convert back to BGR
        enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        
        return enhanced
    
    @staticmethod
    def normalize_image(image: np.ndarray) -> np.ndarray:
        """
        Normalize image for consistent processing
        
        Args:
            image: Input image
            
        Returns:
            Normalized image
        """
        # Ensure image is in correct format
        if len(image.shape) == 3 and image.shape[2] == 4:
            # Convert RGBA to RGB
            image = cv2.cvtColor(image, cv2.COLOR_RGBA2BGR)
        elif len(image.shape) == 2:
            # Convert grayscale to BGR
            image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
        
        # Normalize pixel values
        image = image.astype(np.float32) / 255.0
        image = (image * 255).astype(np.uint8)
        
        return image
    
    @staticmethod
    def bytes_to_image(image_bytes: bytes) -> Optional[np.ndarray]:
        """
        Convert image bytes to numpy array
        
        Args:
            image_bytes: Raw image bytes
            
        Returns:
            Image as numpy array or None if conversion fails
        """
        try:
            npimg = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
            return image
        except Exception as e:
            logger.error(f"Error converting bytes to image: {e}")
            return None
    
    @staticmethod
    def image_to_bytes(image: np.ndarray, format: str = '.jpg', quality: int = 95) -> Optional[bytes]:
        """
        Convert numpy image to bytes
        
        Args:
            image: Image as numpy array
            format: Image format ('.jpg', '.png', etc.)
            quality: JPEG quality (1-100)
            
        Returns:
            Image bytes or None if conversion fails
        """
        try:
            if format.lower() == '.jpg' or format.lower() == '.jpeg':
                encode_params = [cv2.IMWRITE_JPEG_QUALITY, quality]
            elif format.lower() == '.png':
                encode_params = [cv2.IMWRITE_PNG_COMPRESSION, 9]
            else:
                encode_params = []
            
            success, buffer = cv2.imencode(format, image, encode_params)
            if success:
                return buffer.tobytes()
            return None
        except Exception as e:
            logger.error(f"Error converting image to bytes: {e}")
            return None
    
    @staticmethod
    def base64_to_image(base64_string: str) -> Optional[np.ndarray]:
        """
        Convert base64 string to image
        
        Args:
            base64_string: Base64 encoded image
            
        Returns:
            Image as numpy array
        """
        try:
            # Remove data URL prefix if present
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            
            # Decode base64
            image_bytes = base64.b64decode(base64_string)
            return ImageProcessor.bytes_to_image(image_bytes)
        except Exception as e:
            logger.error(f"Error converting base64 to image: {e}")
            return None
    
    @staticmethod
    def image_to_base64(image: np.ndarray, format: str = '.jpg') -> Optional[str]:
        """
        Convert image to base64 string
        
        Args:
            image: Image as numpy array
            format: Image format
            
        Returns:
            Base64 string or None if conversion fails
        """
        try:
            image_bytes = ImageProcessor.image_to_bytes(image, format)
            if image_bytes:
                return base64.b64encode(image_bytes).decode('utf-8')
            return None
        except Exception as e:
            logger.error(f"Error converting image to base64: {e}")
            return None
    
    @staticmethod
    def validate_image(image_data: Union[bytes, np.ndarray, str]) -> bool:
        """
        Validate if image data is valid
        
        Args:
            image_data: Image data in various formats
            
        Returns:
            True if valid, False otherwise
        """
        try:
            if isinstance(image_data, bytes):
                image = ImageProcessor.bytes_to_image(image_data)
            elif isinstance(image_data, str):
                image = ImageProcessor.base64_to_image(image_data)
            elif isinstance(image_data, np.ndarray):
                image = image_data
            else:
                return False
            
            return image is not None and len(image.shape) >= 2
        except:
            return False
    
    @staticmethod
    def crop_face(image: np.ndarray, bbox: list, padding: float = 0.2) -> Optional[np.ndarray]:
        """
        Crop face from image using bounding box
        
        Args:
            image: Source image
            bbox: Bounding box [x1, y1, x2, y2]
            padding: Padding factor (0.2 = 20% padding)
            
        Returns:
            Cropped face image
        """
        try:
            x1, y1, x2, y2 = map(int, bbox)
            
            # Calculate padding
            width = x2 - x1
            height = y2 - y1
            pad_w = int(width * padding)
            pad_h = int(height * padding)
            
            # Apply padding
            x1 = max(0, x1 - pad_w)
            y1 = max(0, y1 - pad_h)
            x2 = min(image.shape[1], x2 + pad_w)
            y2 = min(image.shape[0], y2 + pad_h)
            
            # Crop face
            face = image[y1:y2, x1:x2]
            return face
        except Exception as e:
            logger.error(f"Error cropping face: {e}")
            return None
    
    @staticmethod
    def create_thumbnail(image: np.ndarray, size: Tuple[int, int] = (150, 150)) -> np.ndarray:
        """
        Create thumbnail of image
        
        Args:
            image: Source image
            size: Thumbnail size (width, height)
            
        Returns:
            Thumbnail image
        """
        return cv2.resize(image, size, interpolation=cv2.INTER_AREA)
    
    @staticmethod
    def draw_statistics_overlay(image: np.ndarray, total_detected: int, 
                               identified: int, unknown: int) -> np.ndarray:
        """
        Draw statistics overlay on the image
        
        Args:
            image: Input image
            total_detected: Total number of faces detected
            identified: Number of identified faces
            unknown: Number of unknown faces
            
        Returns:
            Image with statistics overlay
        """
        # Create a copy to avoid modifying original
        annotated = image.copy()
        height, width = annotated.shape[:2]
        
        # Define overlay parameters
        overlay_height = 120
        overlay_width = 400
        padding = 20
        
        # Position overlay at top-right corner
        x = width - overlay_width - padding
        y = padding
        
        # Create semi-transparent overlay background
        overlay = annotated.copy()
        cv2.rectangle(overlay, (x, y), (x + overlay_width, y + overlay_height), 
                     (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.7, annotated, 0.3, 0, annotated)
        
        # Draw border
        cv2.rectangle(annotated, (x, y), (x + overlay_width, y + overlay_height), 
                     (255, 255, 255), 2)
        
        # Add title
        title = "ATTENDANCE STATISTICS"
        cv2.putText(annotated, title, (x + 10, y + 25), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        # Add statistics
        stats_y = y + 50
        line_spacing = 25
        
        # Total detected
        cv2.putText(annotated, f"Total Heads Detected: {total_detected}", 
                   (x + 10, stats_y), cv2.FONT_HERSHEY_SIMPLEX, 0.5, 
                   (255, 255, 255), 1)
        
        # Identified (green)
        cv2.rectangle(annotated, (x + 10, stats_y + 5), (x + 25, stats_y + 20), 
                     (0, 255, 0), -1)
        cv2.putText(annotated, f"Identified: {identified}", 
                   (x + 35, stats_y + line_spacing), cv2.FONT_HERSHEY_SIMPLEX, 
                   0.5, (0, 255, 0), 1)
        
        # Unknown (red)
        cv2.rectangle(annotated, (x + 10, stats_y + line_spacing + 10), 
                     (x + 25, stats_y + line_spacing + 25), (0, 0, 255), -1)
        cv2.putText(annotated, f"Not Identified: {unknown}", 
                   (x + 35, stats_y + 2 * line_spacing), cv2.FONT_HERSHEY_SIMPLEX, 
                   0.5, (0, 0, 255), 1)
        
        return annotated
    
    @staticmethod
    def save_annotated_image(image: np.ndarray, output_path: str, 
                            quality: int = 95) -> bool:
        """
        Save annotated image to file
        
        Args:
            image: Annotated image
            output_path: Path to save the image
            quality: JPEG quality (1-100)
            
        Returns:
            True if saved successfully, False otherwise
        """
        try:
            # Ensure directory exists
            import os
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Save image with high quality
            if output_path.lower().endswith('.jpg') or output_path.lower().endswith('.jpeg'):
                cv2.imwrite(output_path, image, 
                           [cv2.IMWRITE_JPEG_QUALITY, quality])
            else:
                cv2.imwrite(output_path, image)
            
            logger.info(f"✅ Annotated image saved: {output_path}")
            return True
        except Exception as e:
            logger.error(f"❌ Error saving annotated image: {e}")
            return False