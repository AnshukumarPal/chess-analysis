#!/usr/bin/env python3

import os
import sys
import importlib.util

def check_module(module_name):
    """Check if a module is available for import"""
    try:
        importlib.import_module(module_name)
        return True
    except ImportError:
        return False

def check_file_exists(path):
    """Check if a file exists"""
    return os.path.exists(path) and os.path.isfile(path)

def check_directory_exists(path):
    """Check if a directory exists"""
    return os.path.exists(path) and os.path.isdir(path)

def main():
    print("\n=== Chess Analysis Setup Check ===\n")
    
    # Check required Python modules
    print("Checking required Python modules...")
    required_modules = [
        "flask", "tensorflow", "numpy", "cv2", "matplotlib", 
        "werkzeug", "PIL", "tqdm", "chess", "sklearn"
    ]
    
    all_modules_available = True
    for module in required_modules:
        if check_module(module):
            print(f"✓ {module}")
        else:
            print(f"✗ {module} - Not found")
            all_modules_available = False

    # Check frontend files
    print("\nChecking frontend files...")
    frontend_files = [
        "frontend/templates/index.html",
        "frontend/templates/analyze.html",
        "frontend/static/css/style.css",
        "frontend/static/js/main.js",
        "frontend/static/js/analyze.js"
    ]
    
    all_frontend_files_exist = True
    for file_path in frontend_files:
        if check_file_exists(file_path):
            print(f"✓ {file_path}")
        else:
            print(f"✗ {file_path} - Not found")
            all_frontend_files_exist = False
    
    # Check image-to-fen model
    print("\nChecking image-to-fen model...")
    
    # Add the current directory to the Python path
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    
    # First, check if the image-to-fen directory exists
    if check_directory_exists("image-to-fen"):
        print("✓ image-to-fen directory")
        
        # Check essential model files
        model_files = [
            "image-to-fen/models/piece_classifier.h5",
            "image-to-fen/src/board_cropper.py",
            "image-to-fen/src/square_extractor.py",
            "image-to-fen/src/piece_classifier.py",
            "image-to-fen/src/fen_generator.py"
        ]
        
        all_model_files_exist = True
        for file_path in model_files:
            if check_file_exists(file_path):
                print(f"✓ {file_path}")
            else:
                print(f"✗ {file_path} - Not found")
                all_model_files_exist = False
        
        # Verify Python module imports
        print("\nVerifying Python module imports...")
        
        try:
            # Try the first import style
            sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'image-to-fen'))
            from src.board_cropper import BoardCropper
            from src.square_extractor import SquareExtractor
            from src.piece_classifier import PieceClassifier
            from src.fen_generator import FENGenerator
            print("✓ Module imports successful")
            
            # Try to load the model
            model_path = "image-to-fen/models/piece_classifier.h5"
            if check_file_exists(model_path):
                try:
                    classifier = PieceClassifier()
                    classifier.load_model(model_path)
                    print("✓ Model loaded successfully")
                except Exception as e:
                    print(f"✗ Error loading model: {e}")
            
        except ImportError as e:
            print(f"✗ Module import error: {e}")
    else:
        print("✗ image-to-fen directory not found")
        print("  Please run: git clone https://github.com/AnshukumarPal/image-to-fen.git")
    
    # Summary
    print("\n=== Setup Check Summary ===")
    if all_modules_available:
        print("✓ All required Python modules are available")
    else:
        print("✗ Some required Python modules are missing")
        print("  Run: pip install -r requirements.txt")
    
    if all_frontend_files_exist:
        print("✓ All frontend files are in place")
    else:
        print("✗ Some frontend files are missing")
    
    if all_modules_available and all_frontend_files_exist and check_directory_exists("image-to-fen"):
        print("\n✓ Setup looks good! You can run the application with:")
        print("  python app.py")
    else:
        print("\n✗ Setup is incomplete. Please fix the issues above before running the application.")

if __name__ == "__main__":
    main() 