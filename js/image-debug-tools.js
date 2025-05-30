// js/image-debug-tools.js - Debug tools for image handling

class ImageDebugger {
    constructor() {
        this.missingImages = [];
        this.loadedImages = [];
        this.errorImages = [];
    }

    // Test all image paths for a given item
    async testItemImages(item) {
        console.group(`Testing images for: ${item.name}`);
        
        const results = {
            baseImage: null,
            rotationVariants: []
        };

        // Test base image
        try {
            results.baseImage = await this.testImage('../' + item.image_path);
            console.log(`✅ Base image loaded: ${item.image_path}`);
        } catch (error) {
            console.error(`❌ Base image failed: ${item.image_path}`);
            results.baseImage = false;
        }

        // Test rotation variants if they exist
        if (item.rotation_variants) {
            const variants = typeof item.rotation_variants === 'string' 
                ? JSON.parse(item.rotation_variants) 
                : item.rotation_variants;

            for (let i = 0; i < variants.length; i++) {
                const variant = variants[i];
                try {
                    const loaded = await this.testImage('../' + variant);
                    results.rotationVariants[i] = loaded;
                    console.log(`✅ Rotation ${i * 90}° loaded: ${variant}`);
                } catch (error) {
                    results.rotationVariants[i] = false;
                    console.error(`❌ Rotation ${i * 90}° failed: ${variant}`);
                }
            }
        }

        console.groupEnd();
        return results;
    }

    // Test if an image can be loaded
    testImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.loadedImages.push(src);
                resolve(true);
            };
            img.onerror = () => {
                this.errorImages.push(src);
                reject(new Error(`Failed to load: ${src}`));
            };
            img.src = src;
        });
    }

    // Test all items in inventory
    async testAllInventoryImages() {
        console.log('=== Testing All Inventory Images ===');
        
        const inventoryItems = document.querySelectorAll('.inventory-item');
        const results = {};

        for (const element of inventoryItems) {
            const itemData = {
                name: element.dataset.name,
                image_path: element.dataset.image,
                rotation_variants: element.dataset.rotationVariants ? 
                    JSON.parse(element.dataset.rotationVariants) : null
            };

            results[itemData.name] = await this.testItemImages(itemData);
        }

        console.log('=== Test Results Summary ===');
        console.log(`Total loaded: ${this.loadedImages.length}`);
        console.log(`Total errors: ${this.errorImages.length}`);
        
        if (this.errorImages.length > 0) {
            console.warn('Missing images:', this.errorImages);
        }

        return results;
    }

    // Generate missing rotation images (creates placeholder copies)
    async generateMissingRotationImages() {
        console.log('=== Generating Missing Rotation Images ===');
        
        const inventoryItems = document.querySelectorAll('.inventory-item');
        
        for (const element of inventoryItems) {
            const itemData = {
                name: element.dataset.name,
                image_path: element.dataset.image,
                rotation_variants: element.dataset.rotationVariants ? 
                    JSON.parse(element.dataset.rotationVariants) : null
            };

            if (itemData.rotation_variants) {
                console.log(`Checking rotation variants for: ${itemData.name}`);
                
                // Test base image first
                try {
                    await this.testImage('../' + itemData.image_path);
                } catch (error) {
                    console.warn(`Base image missing for ${itemData.name}: ${itemData.image_path}`);
                    continue;
                }

                // Check each rotation variant
                for (let i = 0; i < itemData.rotation_variants.length; i++) {
                    const variant = itemData.rotation_variants[i];
                    try {
                        await this.testImage('../' + variant);
                    } catch (error) {
                        console.log(`Creating placeholder for ${itemData.name} rotation ${i * 90}°`);
                        // In a real scenario, you'd need server-side support to actually create files
                        // This is just for demonstration
                        console.warn(`Server-side script needed to copy: ${itemData.image_path} -> ${variant}`);
                    }
                }
            }
        }
    }

    // Visual debug overlay for images
    showImageDebugOverlay() {
        // Remove existing overlay
        const existingOverlay = document.getElementById('image-debug-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
            return;
        }

        const overlay = document.createElement('div');
        overlay.id = 'image-debug-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            max-height: 500px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 15px;
            border-radius: 10px;
            z-index: 10000;
            overflow-y: auto;
            font-family: monospace;
            font-size: 12px;
        `;

        let html = '<h3 style="margin: 0 0 10px 0;">Image Debug Info</h3>';
        
        // Show placed items info
        html += '<div><strong>Placed Items:</strong></div>';
        placedItems.forEach(item => {
            const status = this.loadedImages.includes('../' + item.image_path) ? '✅' : '❌';
            html += `<div>${status} ${item.name} (${item.rotation || 0}°)</div>`;
        });

        html += '<div style="margin-top: 10px;"><strong>Error Images:</strong></div>';
        this.errorImages.forEach(img => {
            html += `<div style="color: #ff6b6b;">❌ ${img}</div>`;
        });

        html += `
            <div style="margin-top: 15px;">
                <button onclick="imageDebugger.testAllInventoryImages()" 
                        style="background: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 3px; margin: 2px;">
                    Test All Images
                </button>
                <button onclick="imageDebugger.generateMissingRotationImages()" 
                        style="background: #FF9800; color: white; border: none; padding: 5px 10px; border-radius: 3px; margin: 2px;">
                    Check Missing
                </button>
                <button onclick="imageDebugger.showImageDebugOverlay()" 
                        style="background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 3px; margin: 2px;">
                    Close
                </button>
            </div>
        `;

        overlay.innerHTML = html;
        document.body.appendChild(overlay);
    }

    // Fix item image paths in real-time
    fixItemImagePaths() {
        console.log('=== Fixing Item Image Paths ===');
        
        // Fix inventory items
        document.querySelectorAll('.inventory-item').forEach(item => {
            const currentImage = item.dataset.image;
            const normalizedImage = this.normalizeImagePath(currentImage);
            
            if (currentImage !== normalizedImage) {
                console.log(`Fixing inventory item: ${currentImage} -> ${normalizedImage}`);
                item.dataset.image = normalizedImage;
                
                const img = item.querySelector('img');
                if (img) {
                    img.src = '../' + normalizedImage;
                }
            }
        });

        // Fix placed items
        document.querySelectorAll('.placed-item').forEach(item => {
            const itemId = item.dataset.id;
            const placedItem = placedItems.find(i => i.id == itemId);
            
            if (placedItem) {
                const currentImage = placedItem.image_path;
                const normalizedImage = this.normalizeImagePath(currentImage);
                
                if (currentImage !== normalizedImage) {
                    console.log(`Fixing placed item: ${currentImage} -> ${normalizedImage}`);
                    placedItem.image_path = normalizedImage;
                    
                    const img = item.querySelector('img');
                    if (img) {
                        img.src = '../' + normalizedImage;
                    }
                }
            }
        });
    }

    // Normalize image path (remove rotation suffixes)
    normalizeImagePath(imagePath) {
        return imagePath.replace(/-(back|front)-(left|right)(?=\.(jpg|png|webp|gif))/i, '');
    }

    // Generate a report of all image issues
    generateImageReport() {
        const report = {
            totalItems: placedItems.length,
            itemsWithRotation: placedItems.filter(i => i.rotation > 0).length,
            itemsWithVariants: placedItems.filter(i => i.rotation_variants).length,
            missingImages: this.errorImages.length,
            loadedImages: this.loadedImages.length
        };

        console.table(report);
        return report;
    }
}

// Image path utilities
const ImageUtils = {
    // Convert old suffixed name to base name
    getBaseName(imagePath) {
        return imagePath.replace(/-(back|front)-(left|right)(?=\.(jpg|png|webp|gif))/i, '');
    },

    // Generate rotation variants from base path
    generateVariants(basePath) {
        const pathParts = basePath.split('/');
        const filename = pathParts.pop();
        const directory = pathParts.join('/');
        
        const nameWithoutExt = filename.replace(/\.(jpg|png|webp|gif)$/i, '');
        const extension = filename.match(/\.(jpg|png|webp|gif)$/i);
        
        if (!extension) return [basePath];
        
        const ext = extension[0];
        
        return [
            `${directory}/${nameWithoutExt}-back-right${ext}`,
            `${directory}/${nameWithoutExt}-back-left${ext}`,
            `${directory}/${nameWithoutExt}-front-left${ext}`,
            `${directory}/${nameWithoutExt}-front-right${ext}`
        ];
    },

    // Check if item should have rotation variants
    shouldHaveRotation(itemName) {
        const rotatableItems = [
            'wooden_chair', 'simple_table', 'bookshelf', 'cozy_sofa',
            'picture_frame', 'wall_clock'
        ];
        
        const cleanName = this.getBaseName(itemName.toLowerCase());
        const baseName = cleanName.split('/').pop().replace(/\.(jpg|png|webp|gif)$/i, '');
        
        return rotatableItems.includes(baseName);
    }
};

// Initialize debugger
const imageDebugger = new ImageDebugger();

// Add keyboard shortcut for debug overlay
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Shift + I for image debug
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        imageDebugger.showImageDebugOverlay();
    }
});

// Export for global access
window.imageDebugger = imageDebugger;
window.ImageUtils = ImageUtils;

console.log('Image Debug Tools loaded. Use Ctrl+Shift+I to open debug overlay.');
console.log('Available commands:');
console.log('- imageDebugger.testAllInventoryImages()');
console.log('- imageDebugger.generateImageReport()');
console.log('- imageDebugger.fixItemImagePaths()');
console.log('- ImageUtils.generateVariants(path)');