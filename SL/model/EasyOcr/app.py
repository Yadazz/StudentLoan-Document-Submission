from flask import Flask, request, jsonify
from flask_cors import CORS
import easyocr
import base64
import numpy as np
import cv2
from PIL import Image
import io
import os
import logging

app = Flask(__name__)

# Configure CORS properly for React Native
CORS(app, 
     origins=["*"],  # Allow all origins for development
     methods=["GET", "POST", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Accept"]
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize EasyOCR reader (ใช้เวลาสักครู่ในการโหลดครั้งแรก)
print("Loading EasyOCR model...")
try:
    reader = easyocr.Reader(['th', 'en'], gpu=False)  # ใช้ CPU
    print("EasyOCR model loaded successfully!")
except Exception as e:
    print(f"Error loading EasyOCR model: {e}")
    reader = None

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'message': 'OCR API Server is running!',
        'endpoints': {
            'ocr': '/api/ocr (POST)',
            'health': '/health (GET)'
        },
        'status': 'ready'
    })

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'OCR API is working',
        'easyocr_loaded': reader is not None
    })

@app.route('/api/ocr', methods=['OPTIONS'])
def handle_options():
    """Handle preflight OPTIONS request"""
    return '', 200

@app.route('/api/ocr', methods=['POST'])
def process_ocr():
    try:
        logger.info("Received OCR request...")
        
        # Check if EasyOCR is loaded
        if reader is None:
            return jsonify({
                'success': False,
                'message': 'EasyOCR model not loaded properly'
            }), 500
        
        # รับข้อมูลจาก request
        try:
            data = request.get_json()
            if not data:
                return jsonify({
                    'success': False,
                    'message': 'No JSON data provided'
                }), 400
                
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Invalid JSON data: {str(e)}'
            }), 400
        
        image_base64 = data.get('image')
        languages = data.get('languages', ['th', 'en'])
        
        if not image_base64:
            return jsonify({
                'success': False,
                'message': 'No image data provided'
            }), 400
        
        logger.info("Decoding image...")
        
        # Decode base64 image
        try:
            # ลบ prefix ถ้ามี (data:image/jpeg;base64,)
            if 'base64,' in image_base64:
                image_base64 = image_base64.split('base64,')[1]
            
            # Add padding if necessary
            missing_padding = len(image_base64) % 4
            if missing_padding:
                image_base64 += '=' * (4 - missing_padding)
            
            image_data = base64.b64decode(image_base64)
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert to numpy array
            image_array = np.array(image)
            
            logger.info(f"Image decoded successfully: {image_array.shape}")
            
        except Exception as e:
            logger.error(f"Image decoding error: {str(e)}")
            return jsonify({
                'success': False,
                'message': f'Failed to decode image: {str(e)}'
            }), 400
        
        logger.info("Processing with EasyOCR...")
        
        # Process with EasyOCR
        try:
            results = reader.readtext(image_array)
            logger.info(f"OCR found {len(results)} text regions")
            
            # Extract text and confidence
            extracted_texts = []
            for result in results:
                bbox, text, confidence = result
                extracted_texts.append({
                    'text': text.strip(),
                    'confidence': float(confidence),
                    'bbox': [list(point) for point in bbox]  # Convert to JSON serializable
                })
            
            # Combine all text
            full_text = ' '.join([item['text'] for item in extracted_texts if item['text'].strip()])
            
            response_data = {
                'success': True,
                'text': full_text,
                'details': extracted_texts,
                'total_regions': len(results)
            }
            
            logger.info(f"OCR completed successfully. Extracted: {full_text[:100]}...")
            return jsonify(response_data)
            
        except Exception as e:
            logger.error(f"OCR processing error: {str(e)}")
            return jsonify({
                'success': False,
                'message': f'OCR processing failed: {str(e)}'
            }), 500
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

# Additional endpoint for FormData if needed
@app.route('/api/ocr-formdata', methods=['POST', 'OPTIONS'])
def process_ocr_formdata():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        logger.info("Received OCR FormData request...")
        
        if reader is None:
            return jsonify({
                'success': False,
                'message': 'EasyOCR model not loaded properly'
            }), 500
        
        # Get image from FormData
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No image file provided'
            }), 400
        
        image_file = request.files['image']
        languages = request.form.get('languages', '["th", "en"]')
        
        try:
            import json
            languages = json.loads(languages)
        except:
            languages = ['th', 'en']
        
        # Process image
        try:
            image = Image.open(image_file.stream)
            if image.mode != 'RGB':
                image = image.convert('RGB')
            image_array = np.array(image)
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Failed to process image file: {str(e)}'
            }), 400
        
        # OCR Processing
        try:
            results = reader.readtext(image_array)
            extracted_texts = []
            
            for result in results:
                bbox, text, confidence = result
                extracted_texts.append({
                    'text': text.strip(),
                    'confidence': float(confidence),
                    'bbox': [list(point) for point in bbox]
                })
            
            full_text = ' '.join([item['text'] for item in extracted_texts if item['text'].strip()])
            
            return jsonify({
                'success': True,
                'text': full_text,
                'details': extracted_texts,
                'total_regions': len(results)
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'OCR processing failed: {str(e)}'
            }), 500
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'message': 'Internal server error'
    }), 500

if __name__ == '__main__':
    print("Starting OCR Flask server...")
    print("Server will be available at:")
    print("  - Local: http://127.0.0.1:5000")
    print("  - Network: http://0.0.0.0:5000")
    print("  - Android Emulator: http://10.0.2.2:5000")
    print("API endpoint: /api/ocr")
    print("Health check: /health")
    
    # รันเซิร์ฟเวอร์ - สำคัญมาก: ใช้ host='0.0.0.0'
    app.run(
        host='0.0.0.0',  # ✅ เปลี่ยนจาก '127.0.0.1' เป็น '0.0.0.0'
        port=5000,
        debug=True,
        threaded=True
    )
