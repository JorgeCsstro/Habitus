// dashboard-habitus.js - Fixed version with correct coordinate system

// Constants matching habitus-room.js EXACTLY
const GRID_SIZE = 6;
const CELL_SIZE = 60;
const WALL_HEIGHT = 4;

function initializeDashboardRoom(roomData, placedItems) {
    const container = document.getElementById('dashboard-room-container');
    if (!container) return;
    
    // Create room structure
    const roomHTML = `
        <div class="dashboard-room">
            <div class="room-base">
                <div class="room-floor" id="dashboard-room-floor"></div>
                <div class="room-wall-left" id="dashboard-wall-left"></div>
                <div class="room-wall-right" id="dashboard-wall-right"></div>
                <div class="room-door"></div>
            </div>
            <div class="placed-items-floor" id="dashboard-items-floor"></div>
            <div class="placed-items-wall-left" id="dashboard-items-wall-left"></div>
            <div class="placed-items-wall-right" id="dashboard-items-wall-right"></div>
        </div>
    `;
    
    container.innerHTML = roomHTML;
    
    // Apply room customizations
    if (roomData) {
        if (roomData.floor_color) {
            const floor = document.getElementById('dashboard-room-floor');
            if (floor) {
                floor.style.backgroundColor = roomData.floor_color;
            }
        }
        if (roomData.wall_color) {
            const leftWall = document.getElementById('dashboard-wall-left');
            const rightWall = document.getElementById('dashboard-wall-right');
            if (leftWall) {
                leftWall.style.background = `linear-gradient(to bottom, ${roomData.wall_color}, ${adjustColor(roomData.wall_color, -20)})`;
            }
            if (rightWall) {
                rightWall.style.background = `linear-gradient(to left, ${adjustColor(roomData.wall_color, -10)}, ${adjustColor(roomData.wall_color, -30)})`;
            }
        }
    }
    
    // Load placed items - filter out any invalid placements
    if (placedItems && placedItems.length > 0) {
        // Filter out items in door area
        const validItems = placedItems.filter(item => {
            // Skip items that are in the door area
            if (isDoorArea(item.grid_x, item.grid_y, item.surface || 'floor')) {
                console.warn(`Skipping item ${item.name} at invalid position (door area)`);
                return false;
            }
            
            // Validate coordinates are within bounds
            const itemConfig = getItemConfig(item.image_path || item.name);
            const bounds = getBoundsForSurface(item.surface || 'floor');
            
            if (item.grid_x < 0 || item.grid_y < 0 || 
                item.grid_x + itemConfig.width > bounds.maxX || 
                item.grid_y + itemConfig.height > bounds.maxY) {
                console.warn(`Skipping item ${item.name} at out-of-bounds position`);
                return false;
            }
            
            return true;
        });
        
        loadDashboardItems(validItems);
    }
}

function isDoorArea(x, y, surface) {
    // Door configuration matching habitus-room.js EXACTLY:
    // - Left wall: column 1 (x=1), bottom 2 rows (y=2,3)
    // - Floor entrance: column 1 (x=1), first row (y=0)
    
    x = parseInt(x);
    y = parseInt(y);
    
    if (surface === 'wall-left') {
        return x === 1 && y >= 2;
    }
    if (surface === 'floor') {
        return x === 1 && y === 0;
    }
    return false;
}

function getBoundsForSurface(surface) {
    if (surface === 'floor') {
        return { maxX: GRID_SIZE, maxY: GRID_SIZE };
    } else if (surface === 'wall-left') {
        return { maxX: GRID_SIZE, maxY: WALL_HEIGHT };
    } else if (surface === 'wall-right') {
        return { maxX: WALL_HEIGHT, maxY: GRID_SIZE };
    }
    return { maxX: GRID_SIZE, maxY: GRID_SIZE };
}

function loadDashboardItems(placedItems) {
    // Clear existing items
    ['floor', 'wall-left', 'wall-right'].forEach(surface => {
        const container = document.getElementById(`dashboard-items-${surface}`);
        if (container) {
            container.innerHTML = '';
        }
    });
    
    // Sort by z-index to maintain proper layering
    const sortedItems = [...placedItems].sort((a, b) => (a.z_index || 0) - (b.z_index || 0));
    
    // Place items
    sortedItems.forEach(item => {
        // Double-check door area constraint
        if (isDoorArea(item.grid_x, item.grid_y, item.surface || 'floor')) {
            console.warn(`Skipping item in door area: ${item.name} at ${item.grid_x},${item.grid_y}`);
            return;
        }
        
        const itemElement = createDashboardItem(item);
        if (itemElement) {
            const surface = item.surface || 'floor';
            const container = document.getElementById(`dashboard-items-${surface}`);
            if (container) {
                container.appendChild(itemElement);
            }
        }
    });
}

// Update the counter-rotation styles in createDashboardItem:
function createDashboardItem(item) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'placed-item';
    
    const itemConfig = getItemConfig(item.image_path || item.name);
    
    // Position and size using EXACT same cell size as habitus.php
    itemDiv.style.left = (item.grid_x * CELL_SIZE) + 'px';
    itemDiv.style.top = (item.grid_y * CELL_SIZE) + 'px';
    itemDiv.style.width = (itemConfig.width * CELL_SIZE) + 'px';
    itemDiv.style.height = (itemConfig.height * CELL_SIZE) + 'px';
    itemDiv.style.zIndex = item.z_index || 1;
    
    // Create image
    const img = document.createElement('img');
    
    // Get the correct image path based on rotation
    let imagePath = normalizeImagePath(item.image_path);
    
    // Only use rotation variants if rotation is not 0
    if (item.rotation && item.rotation !== 0 && item.rotation_variants) {
        try {
            const variants = typeof item.rotation_variants === 'string' 
                ? JSON.parse(item.rotation_variants) 
                : item.rotation_variants;
            
            const rotationIndex = Math.floor((item.rotation || 0) / 90) % 4;
            if (variants && variants[rotationIndex]) {
                imagePath = variants[rotationIndex];
            }
        } catch (e) {
            console.warn('Error parsing rotation variants:', e);
        }
    }
    
    img.src = '../' + imagePath;
    img.alt = item.name || 'Item';
    img.draggable = false;
    
    // Handle image load errors
    img.onerror = function() {
        console.warn(`Failed to load image: ${imagePath}, falling back to base image`);
        this.src = '../' + normalizeImagePath(item.image_path);
    };
    
    itemDiv.appendChild(img);
    
    return itemDiv;
}

function normalizeImagePath(imagePath) {
    if (!imagePath) return '';
    // Remove rotation suffixes to get base path
    return imagePath.replace(/-(back|front)-(left|right)(?=\.(jpg|png|webp|gif))/i, '');
}

function getItemConfig(itemName) {
    if (!itemName) return { width: 1, height: 1 };
    
    const baseName = itemName.toLowerCase().replace(/\.(jpg|png|webp|gif)$/i, '').split('/').pop();
    const cleanName = baseName.replace(/-(back|front)-(left|right)$/, '');
    
    // EXACT same configuration as habitus-room.js
    const ITEM_SIZES = {
        // Floor Furniture
        'wooden_chair': { width: 1, height: 1 },
        'simple_table': { width: 2, height: 2 },
        'bookshelf': { width: 1, height: 2 },
        'cozy_sofa': { width: 3, height: 2 },
        // Decorations
        'potted_plant': { width: 1, height: 1 },
        'floor_lamp': { width: 1, height: 1 },
        'picture_frame': { width: 1, height: 1 },
        'cactus': { width: 1, height: 1 },
        'wall_clock': { width: 1, height: 1 },
        'wall_mirror': { width: 1, height: 1 },
        'wall_shelf': { width: 2, height: 1 },
        'painting': { width: 2, height: 1 }
    };
    
    return ITEM_SIZES[cleanName] || { width: 1, height: 1 };
}

function adjustColor(color, amount) {
    const usePound = color[0] === '#';
    const col = usePound ? color.slice(1) : color;
    const num = parseInt(col, 16);
    let r = (num >> 16) + amount;
    if (r > 255) r = 255;
    else if (r < 0) r = 0;
    let g = ((num >> 8) & 0x00FF) + amount;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    let b = (num & 0x0000FF) + amount;
    if (b > 255) b = 255;
    else if (b < 0) b = 0;
    return (usePound ? '#' : '') + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// Debug function to check what's being loaded
function debugDashboardItems(placedItems) {
    console.log('=== Dashboard Items Debug ===');
    console.log('Total items:', placedItems.length);
    
    placedItems.forEach((item, index) => {
        console.log(`Item ${index + 1}:`, {
            name: item.name,
            position: `${item.grid_x},${item.grid_y}`,
            surface: item.surface || 'floor',
            rotation: item.rotation || 0,
            image: item.image_path,
            inDoorArea: isDoorArea(item.grid_x, item.grid_y, item.surface || 'floor')
        });
    });
}

// Make functions globally available
window.initializeDashboardRoom = initializeDashboardRoom;
window.debugDashboardItems = debugDashboardItems;