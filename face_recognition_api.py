"""
FastAPI Backend for Face Recognition Integration with Campus Ease
Provides endpoints for training faces, mass recognition, and attendance management
"""

import asyncio
import os
from contextlib import asynccontextmanager
from typing import List, Dict, Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import uvicorn
from pydantic import BaseModel
import logging
from datetime import datetime
import base64
from supabase import create_client, Client
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import face recognition modules
from face_recognition_module import (
    FaceRecognizerWithSupabase, 
    ImageProcessor, 
    GPUMonitor,
    DatabaseManager
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables
face_recognizer = None
image_processor = ImageProcessor()
gpu_monitor = GPUMonitor()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup the face recognition system"""
    global face_recognizer
    try:
        face_recognizer = FaceRecognizerWithSupabase(similarity_threshold=0.4)
        
        # Check GPU status
        gpu_status = gpu_monitor.get_gpu_status()
        logger.info(f"🚀 GPU Status: {gpu_status}")
        
        # Initialize database
        db_initialized = await face_recognizer.initialize_database()
        if not db_initialized:
            logger.error("❌ Failed to initialize face recognition database")
        else:
            logger.info("✅ Face recognition system initialized successfully")
            
    except Exception as e:
        logger.error(f"❌ Failed to initialize face recognition system: {str(e)}")
    
    yield
    
    # Cleanup (if needed)
    logger.info("🛑 Face recognition system shutting down")

app = FastAPI(
    title="Campus Ease Face Recognition API",
    description="Face recognition API for automated attendance management",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:5173", 
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080"
    ],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://jfricqlqhddznvliwwpt.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmcmljcWxxaGRkem52bGl3d3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTAzMDMsImV4cCI6MjA3ODc4NjMwM30.tLq8jgbKmm02qi-5eXXkgdlpYD-oy_mH7TiQKg5-5l0")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class StudentData(BaseModel):
    name: str
    student_id: str
    department: str
    role: str = "student"
    email: Optional[str] = None

class AttendanceRequest(BaseModel):
    class_id: str
    subject: str
    class_type: str
    date: str
    faculty_id: str
    faculty_name: str

class AttendanceResult(BaseModel):
    student_id: str
    student_name: str
    confidence: float
    status: str = "present"

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Campus Ease Face Recognition API",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Detailed health check with system status"""
    try:
        # Check GPU status
        gpu_status = gpu_monitor.get_gpu_status()
        
        # Check database connection
        db_status = await face_recognizer.db_manager.test_connection() if face_recognizer else False
        
        return {
            "status": "healthy" if db_status else "unhealthy",
            "gpu": gpu_status,
            "database": "connected" if db_status else "disconnected",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.post("/train-student")
async def train_student(
    student_data: str = Form(...),
    images: List[UploadFile] = File(...)
):
    """
    Train face recognition for a student
    
    Args:
        student_data: JSON string with student information
        images: List of uploaded image files for training
    """
    try:
        # Parse student data
        student_info = json.loads(student_data)
        
        if not face_recognizer:
            raise HTTPException(status_code=500, detail="Face recognition system not initialized")
        
        if not images:
            raise HTTPException(status_code=400, detail="No images provided for training")
        
        logger.info(f"📝 Training student: {student_info.get('name')} ({student_info.get('student_id')})")
        
        # Process uploaded images
        image_data_list = []
        for i, image in enumerate(images):
            # Validate image file
            if not image.content_type.startswith('image/'):
                raise HTTPException(status_code=400, detail=f"File {image.filename} is not an image")
            
            # Read image data
            image_bytes = await image.read()
            
            # Convert bytes to numpy array first
            np_image = image_processor.bytes_to_image(image_bytes)
            if np_image is None:
                logger.error(f"❌ Failed to convert image {i+1} to numpy array")
                continue
            
            # Enhance image
            enhanced_image = image_processor.enhance_image(np_image)
            if enhanced_image is not None:
                image_data_list.append(enhanced_image)
                logger.debug(f"✅ Processed image {i+1}/{len(images)}")
            else:
                logger.warning(f"⚠️ Failed to process image {i+1}: {image.filename}")
        
        if not image_data_list:
            raise HTTPException(status_code=400, detail="No valid images could be processed")
        
        # Train the face recognition system
        result = await face_recognizer.train_person(student_info, image_data_list)
        
        if result['success']:
            logger.info(f"✅ Student trained successfully: {student_info.get('name')}")
            return {
                "success": True,
                "message": f"Successfully trained face recognition for {student_info.get('name')}",
                "student_id": student_info.get('student_id'),
                "images_processed": len(image_data_list),
                "confidence_threshold": face_recognizer.similarity_threshold
            }
        else:
            logger.error(f"❌ Training failed: {result.get('message')}")
            raise HTTPException(status_code=400, detail=result.get('message', 'Training failed'))
            
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid student data JSON")
    except Exception as e:
        logger.error(f"❌ Training error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@app.post("/mass-recognition")
async def mass_face_recognition(
    attendance_data: str = Form(...),
    class_photo: UploadFile = File(...)
):
    """
    Perform mass face recognition on a class photo for attendance
    Returns annotated image with green boxes for identified students,
    red boxes for unknown faces, and statistics overlay
    
    Args:
        attendance_data: JSON string with attendance session information
        class_photo: Uploaded class photo for recognition
    """
    try:
        # Parse attendance data
        attendance_info = json.loads(attendance_data)
        
        if not face_recognizer:
            raise HTTPException(status_code=500, detail="Face recognition system not initialized")
        
        if not class_photo.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Uploaded file is not an image")
        
        logger.info(f"🔍 Processing mass recognition for class: {attendance_info.get('class_id')}")
        
        # Read and process class photo
        image_bytes = await class_photo.read()
        
        # Convert bytes to numpy array first
        np_image = image_processor.bytes_to_image(image_bytes)
        if np_image is None:
            raise HTTPException(status_code=400, detail="Could not convert uploaded image to proper format")
        
        # Enhance image
        enhanced_image = image_processor.enhance_image(np_image)
        
        if enhanced_image is None:
            raise HTTPException(status_code=400, detail="Could not process the uploaded image")
        
        # Perform mass recognition with annotated image
        recognition_results = await face_recognizer.recognize_faces(
            enhanced_image, 
            return_annotated_image=True
        )
        
        if not recognition_results['success']:
            raise HTTPException(status_code=400, detail=recognition_results.get('message', 'Recognition failed'))
        
        detected_faces = recognition_results.get('recognition_results', [])
        
        # Get class students from database
        try:
            class_response = supabase.table('student_records').select('*').eq('class_id', attendance_info.get('class_id')).execute()
            class_students = class_response.data or []
        except Exception as e:
            logger.error(f"❌ Error fetching class students: {str(e)}")
            class_students = []
        
        # Match recognized faces with class students
        attendance_results = []
        recognized_student_ids = set()
        
        for face_data in detected_faces:
            student_id = face_data.get('student_id')
            if student_id:
                # Find student in class roster
                student = next((s for s in class_students if s.get('user_id') == student_id), None)
                if student:
                    attendance_results.append({
                        "student_id": student_id,
                        "student_name": f"{student.get('fname', '')} {student.get('lname', '')}".strip(),
                        "confidence": face_data.get('confidence', 0.0),
                        "status": "present",
                        "detected": True
                    })
                    recognized_student_ids.add(student_id)
        
        # Add absent students
        for student in class_students:
            if student.get('user_id') not in recognized_student_ids:
                attendance_results.append({
                    "student_id": student.get('user_id'),
                    "student_name": f"{student.get('fname', '')} {student.get('lname', '')}".strip(),
                    "confidence": 0.0,
                    "status": "absent",
                    "detected": False
                })
        
        # Save annotated image to server (optional)
        annotated_image_bytes = recognition_results.get('annotated_image')
        annotated_image_path = None
        annotated_image_base64 = None
        
        if annotated_image_bytes:
            # Convert to base64 for frontend display
            annotated_image_base64 = base64.b64encode(annotated_image_bytes).decode('utf-8')
            
            # Save to server for record keeping
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            class_id = attendance_info.get('class_id', 'unknown')
            subject = attendance_info.get('subject', 'unknown').replace(' ', '_')
            
            # Create annotated images directory
            annotated_dir = os.path.join('logs', 'annotated_images', class_id)
            os.makedirs(annotated_dir, exist_ok=True)
            
            annotated_image_path = os.path.join(annotated_dir, f"{subject}_{timestamp}.jpg")
            
            # Convert bytes back to numpy array and save
            np_annotated = image_processor.bytes_to_image(annotated_image_bytes)
            if np_annotated is not None:
                image_processor.save_annotated_image(np_annotated, annotated_image_path)
        
        statistics = recognition_results.get('statistics', {})
        
        logger.info(f"✅ Mass recognition completed: {len(recognized_student_ids)}/{len(class_students)} students detected")
        
        return {
            "success": True,
            "message": f"Detected {len(recognized_student_ids)} out of {len(class_students)} students",
            "attendance_results": attendance_results,
            "total_faces_detected": len(detected_faces),
            "total_students_in_class": len(class_students),
            "recognition_confidence_threshold": face_recognizer.similarity_threshold,
            "annotated_image": annotated_image_base64,
            "annotated_image_path": annotated_image_path,
            "statistics": {
                "total_detected": statistics.get('total_detected', 0),
                "identified": statistics.get('identified', 0),
                "unidentified": statistics.get('not_identified', 0)
            },
            "processing_time_ms": recognition_results.get('recognition_time_ms', 0)
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid attendance data JSON")
    except Exception as e:
        logger.error(f"❌ Mass recognition error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Mass recognition failed: {str(e)}")

@app.post("/save-attendance")
async def save_mass_attendance(request_data: dict):
    """
    Save mass attendance results to database
    
    Args:
        request_data: Dictionary containing attendance_data and attendance_results
    """
    try:
        attendance_data = request_data.get('attendance_data', {})
        attendance_results = request_data.get('attendance_results', [])
        
        if not attendance_results:
            raise HTTPException(status_code=400, detail="No attendance results provided")
        
        logger.info(f"💾 Saving attendance for {len(attendance_results)} students")
        
        # Prepare attendance records for database
        attendance_records = []
        successful_saves = 0
        
        for result in attendance_results:
            try:
                # Get student details
                student_response = supabase.table('student_records').select('*').eq('user_id', result['student_id']).execute()
                student = student_response.data[0] if student_response.data else {}
                
                attendance_record = {
                    "user_id": result['student_id'],
                    "class_id": attendance_data['class_id'],
                    "student_name": result['student_name'],
                    "date": attendance_data['date'],
                    "subject": attendance_data['subject'],
                    "class_type": attendance_data['class_type'],
                    "status": result['status'],
                    "marked_by": attendance_data['faculty_id'],
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
                attendance_records.append(attendance_record)
                successful_saves += 1
                
            except Exception as record_error:
                logger.error(f"❌ Error processing record for {result.get('student_id', 'unknown')}: {str(record_error)}")
                continue
        
        # Save to database using upsert to handle duplicates
        if attendance_records:
            try:
                response = supabase.table('attendance').upsert(
                    attendance_records,
                    on_conflict="user_id,date,subject,class_id,marked_by"
                ).execute()
                
                if response.data:
                    saved_count = len(response.data)
                    logger.info(f"✅ Successfully saved attendance for {saved_count} students")
                    
                    return {
                        "success": True,
                        "message": f"Successfully saved attendance for {saved_count} students",
                        "saved_records": saved_count,
                        "face_recognition_count": len([r for r in attendance_results if r.get('confidence', 0) > 0]),
                        "manual_count": len([r for r in attendance_results if r.get('confidence', 0) == 0])
                    }
                else:
                    raise HTTPException(status_code=500, detail="Failed to save attendance records")
                    
            except Exception as db_error:
                logger.error(f"❌ Database error: {str(db_error)}")
                raise HTTPException(status_code=500, detail=f"Database error: {str(db_error)}")
        else:
            raise HTTPException(status_code=400, detail="No valid attendance records to save")
        
    except Exception as e:
        logger.error(f"❌ Save attendance error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save attendance: {str(e)}")

@app.get("/students/{student_id}/face-training-status")
async def get_student_face_training_status(student_id: str):
    """
    Check if a student has been trained for face recognition
    
    Args:
        student_id: Student ID to check
    """
    try:
        if not face_recognizer:
            raise HTTPException(status_code=500, detail="Face recognition system not initialized")
        
        # Check if student exists in face recognition database
        person = await face_recognizer.db_manager.get_person_by_student_id(student_id)
        
        if person:
            return {
                "trained": True,
                "student_id": student_id,
                "name": person.name,
                "training_date": person.created_at.isoformat() if person.created_at else None,
                "embedding_available": person.face_embedding is not None
            }
        else:
            return {
                "trained": False,
                "student_id": student_id
            }
            
    except Exception as e:
        logger.error(f"❌ Error checking training status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to check training status: {str(e)}")

@app.delete("/students/{student_id}/face-data")
async def delete_student_face_data(student_id: str):
    """
    Delete face recognition data for a student
    
    Args:
        student_id: Student ID to delete data for
    """
    try:
        if not face_recognizer:
            raise HTTPException(status_code=500, detail="Face recognition system not initialized")
        
        # Delete person data
        result = await face_recognizer.db_manager.delete_person_by_student_id(student_id)
        
        if result:
            logger.info(f"✅ Deleted face data for student: {student_id}")
            return {
                "success": True,
                "message": f"Successfully deleted face recognition data for student {student_id}"
            }
        else:
            raise HTTPException(status_code=404, detail="Student face data not found")
            
    except Exception as e:
        logger.error(f"❌ Error deleting face data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete face data: {str(e)}")

@app.get("/students/{student_id}/face-training-status")
async def get_face_training_status(student_id: str):
    """
    Get face training status for a specific student
    
    Args:
        student_id: Student ID to check training status for
    """
    try:
        if not face_recognizer:
            raise HTTPException(status_code=500, detail="Face recognition system not initialized")
        
        # Check if student exists and has training data
        db_manager = face_recognizer.db_manager
        person = await db_manager.get_person_by_student_id(student_id)
        
        if not person:
            return {
                "success": True,
                "trained": False,
                "student_id": student_id,
                "embedding_available": False,
                "training_date": None,
                "images_count": 0
            }
        
        return {
            "success": True,
            "trained": bool(person.face_embedding),
            "student_id": student_id,
            "embedding_available": bool(person.face_embedding),
            "training_date": person.last_trained.isoformat() if person.last_trained else None,
            "images_count": person.training_images_count or 0,
            "recognition_enabled": person.recognition_enabled,
            "person_name": person.name
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting training status for student {student_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get training status: {str(e)}")

@app.get("/system/stats")
async def get_system_stats():
    """Get face recognition system statistics"""
    try:
        if not face_recognizer:
            raise HTTPException(status_code=500, detail="Face recognition system not initialized")
        
        stats = await face_recognizer.get_system_stats()
        gpu_status = gpu_monitor.get_gpu_status()
        
        return {
            "success": True,
            "stats": stats,
            "gpu_status": gpu_status,
            "similarity_threshold": face_recognizer.similarity_threshold,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting system stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get system stats: {str(e)}")

@app.get("/download-annotated-image/{class_id}/{filename}")
async def download_annotated_image(class_id: str, filename: str):
    """
    Download saved annotated attendance image
    
    Args:
        class_id: Class identifier
        filename: Image filename
    """
    try:
        # Construct file path
        file_path = os.path.join('logs', 'annotated_images', class_id, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Annotated image not found")
        
        return FileResponse(
            path=file_path,
            media_type="image/jpeg",
            filename=f"attendance_{filename}"
        )
        
    except Exception as e:
        logger.error(f"❌ Error downloading annotated image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to download image: {str(e)}")

@app.get("/annotated-images/{class_id}")
async def list_annotated_images(class_id: str):
    """
    List all annotated images for a class
    
    Args:
        class_id: Class identifier
    """
    try:
        images_dir = os.path.join('logs', 'annotated_images', class_id)
        
        if not os.path.exists(images_dir):
            return {
                "success": True,
                "class_id": class_id,
                "images": [],
                "message": "No annotated images found for this class"
            }
        
        # Get all image files
        image_files = [
            {
                "filename": f,
                "path": os.path.join(images_dir, f),
                "created": datetime.fromtimestamp(os.path.getctime(os.path.join(images_dir, f))).isoformat(),
                "size": os.path.getsize(os.path.join(images_dir, f))
            }
            for f in os.listdir(images_dir)
            if f.lower().endswith(('.jpg', '.jpeg', '.png'))
        ]
        
        # Sort by creation time (newest first)
        image_files.sort(key=lambda x: x['created'], reverse=True)
        
        return {
            "success": True,
            "class_id": class_id,
            "images": image_files,
            "total_images": len(image_files)
        }
        
    except Exception as e:
        logger.error(f"❌ Error listing annotated images: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list images: {str(e)}")

@app.delete("/class/{class_id}/face-embeddings")
async def delete_class_face_embeddings(class_id: str):
    """
    Delete all face recognition embeddings for students in a specific class
    This removes face training data but keeps student records intact
    
    Args:
        class_id: Class identifier
    """
    try:
        if not face_recognizer:
            raise HTTPException(status_code=500, detail="Face recognition system not initialized")
        
        logger.info(f"🗑️ Deleting face embeddings for class: {class_id}")
        
        # Get all students in this class
        try:
            class_response = supabase.table('student_records').select('user_id').eq('class_id', class_id).execute()
            class_students = class_response.data or []
        except Exception as e:
            logger.error(f"❌ Error fetching class students: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Failed to fetch class students: {str(e)}")
        
        if not class_students:
            return {
                "success": True,
                "message": "No students found in this class",
                "deleted_count": 0,
                "class_id": class_id
            }
        
        # Delete face embeddings for each student
        deleted_count = 0
        failed_count = 0
        deleted_students = []
        
        for student in class_students:
            student_id = student.get('user_id')
            try:
                # Delete person data from face recognition database
                result = await face_recognizer.db_manager.delete_person_by_student_id(student_id)
                if result:
                    deleted_count += 1
                    deleted_students.append(student_id)
                    logger.info(f"✅ Deleted face data for student: {student_id}")
            except Exception as e:
                failed_count += 1
                logger.error(f"❌ Failed to delete face data for student {student_id}: {str(e)}")
        
        # Refresh the person cache to reflect deletions
        await face_recognizer._refresh_person_cache()
        
        logger.info(f"✅ Deleted face embeddings for {deleted_count} students in class {class_id}")
        
        return {
            "success": True,
            "message": f"Successfully deleted face embeddings for {deleted_count} students",
            "deleted_count": deleted_count,
            "failed_count": failed_count,
            "total_students": len(class_students),
            "class_id": class_id,
            "deleted_student_ids": deleted_students
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting class face embeddings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete embeddings: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "face_recognition_api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )