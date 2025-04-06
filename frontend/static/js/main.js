document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const previewArea = document.getElementById('previewArea');
    const imagePreview = document.getElementById('imagePreview');
    const cancelBtn = document.getElementById('cancelBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const container = document.querySelector('.container');

    // Create error message element
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.style.display = 'none';
    previewArea.insertBefore(errorMessage, document.querySelector('.preview-controls'));

    // Event Listeners
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    browseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    cancelBtn.addEventListener('click', resetUpload);
    analyzeBtn.addEventListener('click', analyzeImage);

    // Drag and drop functionality
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('active');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('active');
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('active');
        
        if (e.dataTransfer.files.length) {
            handleFiles(e.dataTransfer.files);
        }
    }

    function handleFileSelect(e) {
        if (e.target.files.length) {
            handleFiles(e.target.files);
        }
    }

    function handleFiles(files) {
        const file = files[0];
        
        // Check if the file is an image
        if (!file.type.match('image.*')) {
            showError('Please select an image file (JPG, PNG)');
            return;
        }
        
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showError('File size exceeds 5MB limit');
            return;
        }
        
        // Display preview
        displayPreview(file);
    }

    function displayPreview(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            dropZone.style.display = 'none';
            previewArea.style.display = 'block';
            errorMessage.style.display = 'none';
        };
        
        reader.readAsDataURL(file);
    }

    function resetUpload() {
        fileInput.value = '';
        imagePreview.src = '';
        dropZone.style.display = 'block';
        previewArea.style.display = 'none';
        errorMessage.style.display = 'none';
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    // Create modal for image cropping
    function createCropModal() {
        // Create modal elements
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'cropModal';

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';

        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        modalHeader.innerHTML = '<h3>Select Chessboard Area</h3><button class="btn" id="closeModal">&times;</button>';

        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        modalBody.innerHTML = '<p>Drag to create a rectangle around the chessboard</p><div class="crop-container"><img id="cropImage" src=""></div>';

        const modalFooter = document.createElement('div');
        modalFooter.className = 'modal-footer';
        modalFooter.innerHTML = '<button class="btn cancel-btn" id="cancelCrop">Cancel</button><button class="btn analyze-btn" id="applyCrop">Crop & Analyze</button>';

        // Assemble modal
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modalContent.appendChild(modalFooter);
        modal.appendChild(modalContent);

        // Add modal to container
        container.appendChild(modal);

        // Add event listeners
        document.getElementById('closeModal').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        document.getElementById('cancelCrop').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Return modal reference
        return modal;
    }

    function analyzeImage() {
        // Get the image file
        const file = fileInput.files[0];
        if (!file) {
            showError('No image selected!');
            return;
        }

        // Show loading state
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';

        // Option 1: Direct analysis (without cropping)
        directAnalysis(file);

        // Option 2: Show cropping modal (uncomment to use)
        // showCroppingModal(file);
    }

    function directAnalysis(file) {
        // Create FormData
        const formData = new FormData();
        formData.append('image', file);

        // Send image to backend for processing
        fetch('/api/analyze', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Process successful response
            console.log('Analysis result:', data);
            
            // Store the FEN in sessionStorage
            sessionStorage.setItem('fenNotation', data.fen);
            sessionStorage.setItem('activeColor', data.active_color || 'w');
            
            // Also store the confidence level and message
            sessionStorage.setItem('activeColorConfidence', data.active_color_confidence || 'medium');
            sessionStorage.setItem('analysisMessage', data.message || 'Image processed successfully');
            
            // Redirect to analysis page
            window.location.href = 'analyze.html';
        })
        .catch(error => {
            console.error('Error analyzing image:', error);
            showError('Error analyzing image. Please try again.');
            
            // Reset button state
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-chess"></i> Analyze Position';
        });
    }

    // Creates a modal for cropping the chessboard
    function showCroppingModal(file) {
        const modal = document.getElementById('cropModal') || createCropModal();
        const cropImage = document.getElementById('cropImage');
        
        // Load image for cropping
        const reader = new FileReader();
        reader.onload = function(e) {
            cropImage.src = e.target.result;
            modal.style.display = 'block';
            
            // TODO: Implement cropping functionality here
            // This would require a library like Cropper.js
            
            // For now, just use a simple click handler
            document.getElementById('applyCrop').addEventListener('click', function() {
                modal.style.display = 'none';
                directAnalysis(file);
            });
        };
        reader.readAsDataURL(file);
    }
}); 