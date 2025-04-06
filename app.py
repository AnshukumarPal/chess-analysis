from flask import Flask, request, jsonify, send_from_directory, render_template
import os
import sys
import json
import base64
import tempfile
from werkzeug.utils import secure_filename

# Silence all warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'  # Disable GPU
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Disable oneDNN

import warnings
warnings.filterwarnings('ignore')

import logging
logging.getLogger('tensorflow').setLevel(logging.ERROR)
logging.getLogger('keras').setLevel(logging.ERROR) 

# Import TensorFlow after suppressing warnings
import tensorflow as tf
tf.compat.v1.logging.set_verbosity(tf.compat.v1.logging.ERROR)
tf.get_logger().setLevel('ERROR')

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the image-to-fen model components
try:
    from image_to_fen.src.board_cropper import BoardCropper
    from image_to_fen.src.square_extractor import SquareExtractor
    from image_to_fen.src.piece_classifier import PieceClassifier
    from image_to_fen.src.fen_generator import FENGenerator
except ImportError:
    # Alternative: Try different import paths
    sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'image-to-fen'))
    from src.board_cropper import BoardCropper
    from src.square_extractor import SquareExtractor
    from src.piece_classifier import PieceClassifier
    from src.fen_generator import FENGenerator

app = Flask(__name__, 
            static_folder="frontend/static", 
            template_folder="frontend/templates")

# Configuration
UPLOAD_FOLDER = 'temp/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 
                         'image_to_fen', 'models', 'piece_classifier.h5')

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5 MB max upload

# Initialize model components
board_cropper = BoardCropper()
square_extractor = SquareExtractor()
piece_classifier = PieceClassifier()
fen_generator = FENGenerator()

# Load pre-trained model
if os.path.exists(MODEL_PATH):
    piece_classifier.load_model(MODEL_PATH)
    print(f"Model loaded from {MODEL_PATH}")
else:
    print(f"Model not found at {MODEL_PATH}. Please make sure the model exists.")

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return send_from_directory('frontend/templates', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if path == 'analyze.html':
        return send_from_directory('frontend/templates', 'analyze.html')
    return send_from_directory('frontend/static', path)

@app.route('/api/analyze', methods=['POST'])
def analyze_image():
    # Check if the post request has the file part
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    
    # If user does not select file, browser also
    # submit an empty part without filename
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Process the chess image using the image-to-fen model
            fen, active_color = analyze_chess_image(filepath)
            
            # Return both the FEN and active color information
            # along with a confidence level for the active color
            return jsonify({
                'fen': fen,
                'active_color': active_color,
                'active_color_confidence': 'low',  # This helps the user know they might need to check it
                'message': 'Image processed successfully. Please verify the active color is correct.'
            })
        
        except Exception as e:
            error_message = str(e)
            print(f"Error processing image: {error_message}")
            
            # Return a more helpful error message
            if "board not found" in error_message.lower():
                return jsonify({'error': 'Could not detect a chessboard in the image. Please try again with a clearer image.'}), 500
            elif "piece classification" in error_message.lower():
                return jsonify({'error': 'Could not identify pieces correctly. Please try a different image.'}), 500
            else:
                return jsonify({'error': f'Error analyzing image: {error_message}'}), 500
        
        finally:
            # Clean up the uploaded file
            if os.path.exists(filepath):
                os.remove(filepath)
    
    return jsonify({'error': 'Invalid file format. Please use JPG or PNG images.'}), 400

@app.route('/api/evaluate', methods=['POST'])
def evaluate_position():
    data = request.get_json()
    
    if not data or 'fen' not in data:
        return jsonify({'error': 'No FEN provided'}), 400
    
    fen = data['fen']
    
    try:
        # This is where you would call a chess engine API
        # For now, we'll return mock data
        
        # Mock implementation
        evaluation = 0.2  # Slightly better for white
        best_move = "e2e4"
        
        return jsonify({
            'evaluation': evaluation,
            'best_move': best_move
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def analyze_chess_image(image_path):
    """
    Process a chess image to generate FEN notation
    
    Args:
        image_path: Path to the chess image
        
    Returns:
        tuple: (fen, active_color)
    """
    # Step 1: User-guided cropping
    cropped_board = board_cropper.crop(image_path)
    
    # Step 2: Extract squares with orientation handling
    squares = square_extractor.extract(cropped_board)
    
    # Step 3: Classify pieces
    piece_positions = piece_classifier.classify_squares(squares)
    
    # Step 4: Detect active color
    active_color, green_arrow_move, highlighted_move = detect_active_color(
        piece_positions, 
        cropped_board=cropped_board, 
        board_orientation=square_extractor.board_orientation
    )
    
    # Step 5: Generate FEN
    fen = fen_generator.generate(
        piece_positions, 
        active_color=active_color,
        green_arrow_move=green_arrow_move,
        highlighted_move=highlighted_move
    )
    
    return fen, active_color

def detect_active_color(piece_positions, cropped_board=None, board_orientation=None):
    """
    Simplified version of active color detection from image-to-fen
    """
    # Default to white's turn if detection fails
    active_color = 'w'
    
    try:
        # Create piece matrix from piece positions
        pieces_matrix = []
        for row in range(8):
            row_pieces = []
            for col in range(8):
                idx = row * 8 + col
                piece = piece_positions[idx]
                if piece == 'empty':
                    row_pieces.append('.')
                else:
                    color, piece_type = piece.split('_')
                    piece_symbol = piece_type[0]
                    if color == 'white':
                        piece_symbol = piece_symbol.upper()
                    else:
                        piece_symbol = piece_symbol.lower()
                    row_pieces.append(piece_symbol)
            pieces_matrix.append(row_pieces)
        
        # Use visual detection if possible
        if cropped_board is not None and board_orientation is not None:
            # Import the detection function depending on which import structure worked
            try:
                from image_to_fen.main import detect_active_color_from_image
            except ImportError:
                from main import detect_active_color_from_image
                
            active_color, green_arrow_move, highlighted_move = detect_active_color_from_image(
                cropped_board, board_orientation, pieces_matrix
            )
            return active_color, green_arrow_move, highlighted_move
    
    except Exception as e:
        print(f"Error in active color detection: {e}")
    
    # Fallback to default
    return active_color, None, None

if __name__ == '__main__':
    app.run(debug=True)