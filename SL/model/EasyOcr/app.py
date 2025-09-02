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
import traceback
import socket

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

# Initialize EasyOCR reader
print("Loading EasyOCR model...")
try:
    reader = easyocr.Reader(['th', 'en'], gpu=False)  # Use CPU
    print("EasyOCR model loaded successfully!")
except Exception as e:
    print(f"Error loading EasyOCR model: {e}")
    reader = None

def get_local_ip():
    """Get the local IP address of this machine"""
    try:
        # Connect to a remote address to determine local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "localhost"

@app.route('/', methods=['GET'])
def home():
    local_ip = get_local_ip()
    return jsonify({
        'message': 'OCR API Server is running!',
        'server_ip': local_ip,
        'endpoints': {
            'ocr': '/api/ocr (POST)',
            'health': '/health (GET)'
        },
        'status': 'ready',
        'easyocr_loaded': reader is not None
    })

@app.route('/health', methods=['GET'])
def health_check():
    local_ip = get_local_ip()
    return jsonify({
        'status': 'healthy',
        'message': 'OCR API is working',
        'server_ip': local_ip,
        'easyocr_loaded': reader is not None,
        'timestamp': str(pd.Timestamp.now()) if 'pd' in globals() else 'N/A'
    })

@app.route('/api/ocr', methods=['OPTIONS'])
def handle_options():
    """Handle preflight OPTIONS request"""
    response = jsonify({'message': 'CORS preflight successful'})
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response

@app.route('/api/ocr', methods=['POST'])
def process_ocr():
    try:
        logger.info("=== Received OCR request ===")
        
        # Check if EasyOCR is loaded
        if reader is None:
            return jsonify({
                'success': False,
                'message': 'EasyOCR model not loaded properly'
            }), 500
        
        # Get JSON data from request
        try:
            data = request.get_json()
            if not data:
                logger.error("No JSON data provided")
                return jsonify({
                    'success': False,
                    'message': 'No JSON data provided'
                }), 400
                
        except Exception as e:
            logger.error(f"JSON parsing error: {str(e)}")
            return jsonify({
                'success': False,
                'message': f'Invalid JSON data: {str(e)}'
            }), 400
        
        image_base64 = data.get('image')
        languages = data.get('languages', ['th', 'en'])
        
        if not image_base64:
            logger.error("No image data provided")
            return jsonify({
                'success': False,
                'message': 'No image data provided'
            }), 400
        
        logger.info(f"Processing image with languages: {languages}")
        logger.info(f"Image data length: {len(image_base64)} characters")
        
        # Decode base64 image
        try:
            # Remove prefix if present (data:image/jpeg;base64,)
            if 'base64,' in image_base64:
                image_base64 = image_base64.split('base64,')[1]
            
            # Add padding if necessary
            missing_padding = len(image_base64) % 4
            if missing_padding:
                image_base64 += '=' * (4 - missing_padding)
            
            # Decode base64
            image_data = base64.b64decode(image_base64)
            logger.info(f"Decoded image data size: {len(image_data)} bytes")
            
            # Open with PIL
            image = Image.open(io.BytesIO(image_data))
            logger.info(f"Image mode: {image.mode}, Size: {image.size}")
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert to numpy array
            image_array = np.array(image)
            logger.info(f"Image array shape: {image_array.shape}")
            
        except Exception as e:
            logger.error(f"Image decoding error: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return jsonify({
                'success': False,
                'message': f'Failed to decode image: {str(e)}'
            }), 400
        
        logger.info("Starting OCR processing...")
        
        # Process with EasyOCR
        try:
            results = reader.readtext(image_array)
            logger.info(f"OCR completed. Found {len(results)} text regions")
            
            # Extract text and confidence
            extracted_texts = []
            for i, result in enumerate(results):
                try:
                    bbox, text, confidence = result
                    logger.info(f"Region {i+1}: '{text}' (confidence: {confidence:.2f})")
                    
                    extracted_texts.append({
                        'text': text.strip(),
                        'confidence': float(confidence),
                        'bbox': [[float(point[0]), float(point[1])] for point in bbox]  # Ensure JSON serializable
                    })
                except Exception as e:
                    logger.error(f"Error processing result {i}: {str(e)}")
                    continue
            
            # Combine all text
            full_text = ' '.join([item['text'] for item in extracted_texts if item['text'].strip()])
            
            response_data = {
                'success': True,
                'text': full_text,
                'details': extracted_texts,
                'total_regions': len(results),
                'languages_used': languages
            }
            
            logger.info(f"OCR successful. Extracted text: '{full_text[:200]}{'...' if len(full_text) > 200 else ''}'")
            return jsonify(response_data)
            
        except Exception as e:
            logger.error(f"OCR processing error: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            return jsonify({
                'success': False,
                'message': f'OCR processing failed: {str(e)}'
            }), 500
        
    except Exception as e:
        logger.error(f"Unexpected server error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

# Additional endpoint for FormData if needed
@app.route('/api/ocr-formdata', methods=['POST', 'OPTIONS'])
def process_ocr_formdata():
    if request.method == 'OPTIONS':
        return handle_options()
        
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
                    'bbox': [[float(point[0]), float(point[1])] for point in bbox]
                })
            
            full_text = ' '.join([item['text'] for item in extracted_texts if item['text'].strip()])
            
            return jsonify({
                'success': True,
                'text': full_text,
                'details': extracted_texts,
                'total_regions': len(results),
                'languages_used': languages
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
        'message': 'Endpoint not found',
        'available_endpoints': ['/api/ocr', '/health', '/']
    }), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        'success': False,
        'message': 'Internal server error'
    }), 500

if __name__ == '__main__':
    local_ip = get_local_ip()
    print("=" * 50)
    print("Starting OCR Flask server...")
    print("=" * 50)
    print(f"🌐 Server will be available at:")
    print(f"   - Local: http://127.0.0.1:5000")
    print(f"   - Network: http://{local_ip}:5000")
    print(f"   - Android Emulator: http://10.0.2.2:5000")
    print(f"📱 For React Native app, use:")
    print(f"   - Android Emulator: 10.0.2.2")
    print(f"   - iOS Simulator: {local_ip}")
    print(f"   - Physical Device: {local_ip}")
    print("=" * 50)
    print("🔗 API Endpoints:")
    print("   - OCR: POST /api/ocr")
    print("   - Health: GET /health")
    print("   - Home: GET /")
    print("=" * 50)
    
    # Run server with host='0.0.0.0' to allow external connections
    app.run(
        host='0.0.0.0',  # ✅ Critical: allows connections from other devices
        port=5000,
        debug=True,
        threaded=True,
        use_reloader=False  # Prevent double loading of EasyOCR
    )