# Chess Position Analyzer

A web application that allows users to upload screenshots of chess games, which are then converted into standard FEN notation for further analysis and play.

## Features

- Upload chess game screenshots (from Chess.com, Lichess, etc.)
- Automatic recognition of chess positions using trained models
- Generation of FEN notation from images
- Interactive chess board to play from the detected position
- Option to choose active color (white or black to move)
- Analysis tools for the detected position
- Export to popular chess platforms (Lichess, Chess.com)

## Project Structure

- `frontend/` - Web UI files
  - `templates/` - HTML templates
  - `static/` - Static assets (CSS, JS, images)
- `app.py` - Flask backend
- `models/` - Trained chess position recognition models
- `src/` - Source code for image recognition and FEN generation

## Getting Started

### Prerequisites

- Python 3.7 or higher
- pip (Python package manager)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/AnshukumarPal/chess-analysis.git
   cd chess-analysis
   ```

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the application:
   ```
   python app.py
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

## Usage

1. Upload a screenshot of a chess game from Chess.com, Lichess, or any other platform
2. The system will automatically recognize the position and generate the FEN notation
3. Verify and adjust the active color if needed
4. Analyze the position using the built-in tools or export to external platforms
5. Play from the detected position directly in the application

## Technologies Used

- Frontend: HTML, CSS, JavaScript, Chessboard.js, Chess.js
- Backend: Python, Flask
- Image Recognition: TensorFlow/Keras, OpenCV
- Chess Analysis: Stockfish (optional)

## License

MIT License

## Acknowledgments

- [Chess.com](https://www.chess.com) for inspiration
- [Chessboard.js](https://chessboardjs.com) for the interactive chess board
- [Chess.js](https://github.com/jhlywa/chess.js) for chess move validation
# chess-analysis