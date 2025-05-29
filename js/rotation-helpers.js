// rotation-helpers.js - Helper functions for the rotation system

// Get item configuration with rotation support
function getItemConfig(itemName) {
    if (!itemName) return { width: 1, height: 1, surfaces: ['floor'] };
    
    // Extract base name from image path if needed
    const baseName = itemName.toLowerCase().replace(/\.(jpg|png|webp|gif)$/i, '').split('/').pop();
    
    // Remove rotation suffixes if present
    const cleanName = baseName.replace(/-(back|front)-(left|right)$/, '');
    
    // Updated item configurations
    const ITEM_SIZES = {
        // Floor Furniture
        'wooden_chair': { width: 1, height: 1, surfaces: ['floor'] },
        'simple_table': { width: 2, height: 2, surfaces: ['floor'] },
        'bookshelf': { width: 1, height: 2, surfaces: ['floor', 'wall-left', 'wall-right'] },
        'cozy_sofa': { width: 3, height: 2, surfaces: ['floor'] },
        // Decorations
        'potted_plant': { width: 1, height: 1, surfaces: ['floor'] },
        'floor_lamp': { width: 1, height: 1, surfaces: ['floor'] },
        'picture_frame': { width: 1, height: 1, surfaces: ['floor', 'wall-left', 'wall-right'] },
        'cactus': { width: 1, height: 1, surfaces: ['floor'] },
        'wall_clock': { width: 1, height: 1, surfaces: ['floor', 'wall-left', 'wall-right'] }
    };
    
    // Check predefined sizes
    if (ITEM_SIZES[cleanName]) {
        return ITEM_SIZES[cleanName];
    }
    
    // Default config
    return { width: 1, height: 1, surfaces: ['floor'] };
}

// Helper to preload rotation images
function preloadRotationImages(rotationVariants) {
    if (!rotationVariants || !Array.isArray(rotationVariants)) return;
    
    rotationVariants.forEach(imagePath => {
        if (imagePath) {
            const img = new Image();
            img.src = '../' + imagePath;
        }
    });
}

// Debug function to test rotation without clicking
function testRotation(itemId) {
    const item = document.querySelector(`[data-id="${itemId}"]`);
    if (!item) {
        console.error('Item not found:', itemId);
        return;
    }
    
    // Simulate rotation
    contextMenuItem = item;
    rotateItem();
    
    console.log('Rotated item', itemId);
}

// Helper to generate rotation variants paths from base path
function generateRotationPaths(basePath) {
    // Extract directory and base filename
    const pathParts = basePath.split('/');
    const filename = pathParts.pop();
    const directory = pathParts.join('/');
    
    // Remove extension
    const nameWithoutExt = filename.replace(/\.(jpg|png|webp|gif)$/i, '');
    const extension = filename.match(/\.(jpg|png|webp|gif)$/i)[0];
    
    // Generate 4 rotation variants
    return [
        `${directory}/${nameWithoutExt}-back-right${extension}`,
        `${directory}/${nameWithoutExt}-back-left${extension}`,
        `${directory}/${nameWithoutExt}-front-left${extension}`,
        `${directory}/${nameWithoutExt}-front-right${extension}`
    ];
}

// Batch update rotation for all items of a type
function batchRotateItems(itemType, rotation) {
    const items = document.querySelectorAll(`[data-name*="${itemType}"]`);
    items.forEach(item => {
        if (item.classList.contains('placed-item')) {
            item.dataset.rotation = rotation;
            contextMenuItem = item;
            rotateItem();
        }
    });
    
    console.log(`Rotated ${items.length} ${itemType} items to ${rotation}°`);
}

// Export rotation state for saving
function exportRotationState() {
    const rotationData = {};
    placedItems.forEach(item => {
        if (item.rotation && item.rotation !== 0) {
            rotationData[item.id] = item.rotation;
        }
    });
    return rotationData;
}

// Visual rotation helper overlay
function showRotationHelper() {
    const helper = document.createElement('div');
    helper.className = 'rotation-guide show';
    helper.innerHTML = `
        <h4>Rotation Guide</h4>
        <div class="rotation-guide-grid">
            <div class="rotation-guide-item">
                <span class="angle">0°</span>
                <span>Back-Right View</span>
            </div>
            <div class="rotation-guide-item">
                <span class="angle">90°</span>
                <span>Back-Left View</span>
            </div>
            <div class="rotation-guide-item">
                <span class="angle">180°</span>
                <span>Front-Left View</span>
            </div>
            <div class="rotation-guide-item">
                <span class="angle">270°</span>
                <span>Front-Right View</span>
            </div>
        </div>
    `;
    
    document.querySelector('.room-container').appendChild(helper);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        helper.classList.remove('show');
        setTimeout(() => helper.remove(), 300);
    }, 5000);
}

// Add rotation angle indicator to selected items
function showRotationAngle(item) {
    const rotation = parseInt(item.dataset.rotation) || 0;
    let angleIndicator = item.querySelector('.rotation-angle');
    
    if (!angleIndicator) {
        angleIndicator = document.createElement('div');
        angleIndicator.className = 'rotation-angle';
        item.appendChild(angleIndicator);
    }
    
    angleIndicator.textContent = `${rotation}°`;
}

// Make helper functions available globally
window.preloadRotationImages = preloadRotationImages;
window.testRotation = testRotation;
window.generateRotationPaths = generateRotationPaths;
window.batchRotateItems = batchRotateItems;
window.exportRotationState = exportRotationState;
window.showRotationHelper = showRotationHelper;