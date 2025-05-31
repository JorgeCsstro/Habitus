// habitus-room.js - Enhanced isometric room system with proper image handling

// Room state
let currentRoom = null;
let selectedItem = null;
let isDragging = false;
let placedItems = [];
let gridVisible = true;
let currentRotation = 0;
let contextMenuItem = null;
let dragPreview = null;
let currentDragData = null;
let currentSurface = 'floor';
let itemRotationData = {}; // Store rotation variants for each item
let isDashboardMode = false; // Flag to track if we're in dashboard mode
let debugMode = false; // Debug mode flag

let holdTimer = null;
let holdStartTime = 0;
let isHolding = false;
let heldItem = null;
let floatingMenu = null;
let holdIndicator = null;
let dragGhost = null;
let flyingItems = new Set();
let lastMousePosition = { x: 0, y: 0 };

// Grid configuration - 6x6
const GRID_SIZE = 6;
const CELL_SIZE = 60;
const ROOM_WIDTH = 360;
const ROOM_HEIGHT = 360;
const WALL_HEIGHT = 4;
const HOLD_DURATION = 800;

const ROTATION_ANGLES = {
    0: 0,    // back-right (default)
    90: 1,   // back-left
    180: 2,  // front-left
    270: 3   // front-right
};

// Item size definitions (can be loaded from database)
const ITEM_SIZES = {
    // Floor Furniture
    'wooden_chair': { width: 1, height: 1, surfaces: ['floor'] },
    'simple_table': { width: 2, height: 2, surfaces: ['floor'] },
    'bookshelf': { width: 1, height: 2, surfaces: ['floor', 'wall-left', 'wall-right'] },
    'cozy_sofa': { width: 3, height: 2, surfaces: ['floor'] },
    // Decorations
    'potted_plant': { width: 1, height: 1, surfaces: ['floor'] },
    'floor_lamp': { width: 1, height: 1, surfaces: ['floor'] },
    'picture_frame': { width: 1, height: 1, surfaces: ['wall-left', 'wall-right'] },
    'cactus': { width: 1, height: 1, surfaces: ['floor'] },
    'wall_clock': { width: 1, height: 1, surfaces: ['wall-left', 'wall-right'] }
};

// Initialize the Habitus room
function initializeHabitusRoom(roomData, items, rotationData = {}) {
    // FIXED: Add validation for required data
    if (!roomData) {
        console.error('initializeHabitusRoom: roomData is required');
        return;
    }
    
    // FIXED: Detect if we're in dashboard mode
    const roomElement = document.getElementById('isometric-room');
    isDashboardMode = roomElement && roomElement.closest('.dashboard-room') !== null;
    
    console.log('Initializing Habitus Room:', {
        roomData,
        itemCount: (items || []).length,
        isDashboardMode,
        rotationDataKeys: Object.keys(rotationData || {})
    });
    
    currentRoom = roomData;
    placedItems = items || [];
    itemRotationData = rotationData || {};
    
    // FIXED: Validate placed items data
    placedItems = placedItems.filter(item => {
        const isValid = item && 
                       typeof item.grid_x !== 'undefined' && 
                       typeof item.grid_y !== 'undefined' &&
                       item.image_path;
        return isValid;
    });
    
    // Ensure room structure exists
    ensureRoomStructure();
    
    // Only create grids if not in dashboard mode
    if (!isDashboardMode) {
        createAllGrids();
        createDragPreview();
        createHoldIndicator();
        createFloatingMenu();
        setupEnhancedEventListeners();
        /* console.log('🎮 Set up enhanced interactive controls'); */
    }
    
    // Load placed items
    loadPlacedItems();
    applyRoomCustomizations(roomData);
    
    // Load room customizations
    if (roomData.floor_color) {
        const floor = document.querySelector('.room-floor');
        if (floor) {
            floor.style.backgroundColor = roomData.floor_color;
        }
    }
    if (roomData.wall_color) {
        const leftWall = document.querySelector('.room-wall-left');
        const rightWall = document.querySelector('.room-wall-right');
        if (leftWall) {
            leftWall.style.background = `linear-gradient(to bottom, ${roomData.wall_color}, ${adjustColor(roomData.wall_color, -20)})`;
        }
        if (rightWall) {
            rightWall.style.background = `linear-gradient(to left, ${adjustColor(roomData.wall_color, -10)}, ${adjustColor(roomData.wall_color, -30)})`;
        }
    }
    return true;
}

function debugLog(...args) {
    if (debugMode || isDashboardMode) {
        console.log('[Habitus Room]', ...args);
    }
}

function debugError(...args) {
    console.error('[Habitus Room ERROR]', ...args);
}

function debugWarn(...args) {
    console.warn('[Habitus Room WARNING]', ...args);
}

/* // Initialize the Habitus room with enhanced error handling
function initializeHabitusRoom(roomData, items, rotationData = {}) {
    /* debugLog('🏠 Initializing Habitus Room');
    
    // Enhanced validation
    if (!roomData) {
        debugError('❌ roomData is required but not provided');
        return false;
    }
    
    if (!Array.isArray(items)) {
        debugError('❌ items must be an array, got:', typeof items);
        return false;
    }
    
    // Detect dashboard mode
    const roomElement = document.getElementById('isometric-room');
    if (!roomElement) {
        debugError('❌ Room element #isometric-room not found');
        return false;
    }
    
    isDashboardMode = roomElement.closest('.dashboard-room') !== null;
    debugMode = window.location.search.includes('debug=1') || isDashboardMode;
    
    /* debugLog('📊 Initialization Details:', {
        roomData: roomData,
        itemCount: items.length,
        isDashboardMode: isDashboardMode,
        debugMode: debugMode,
        rotationDataKeys: Object.keys(rotationData || {})
    }); 
    
    currentRoom = roomData;
    placedItems = items || [];
    itemRotationData = rotationData || {};
    
    // Validate and clean placed items data
    const originalCount = placedItems.length;
    placedItems = placedItems.filter(item => {
        const isValid = item && 
                       typeof item.grid_x !== 'undefined' && 
                       typeof item.grid_y !== 'undefined' &&
                       item.image_path;
        
        if (!isValid) {
            debugWarn('🗑️ Filtering out invalid item:', item);
        }
        return isValid;
    });
    
    if (placedItems.length !== originalCount) {
        debugWarn(`⚠️ Filtered out ${originalCount - placedItems.length} invalid items`);
    }
    
    /* debugLog(`✅ Processing ${placedItems.length} valid items`); 
    
    // Ensure room structure exists
    if (!ensureRoomStructure()) {
        debugError('❌ Failed to create room structure');
        return false;
    }
    
    // Only create grids if not in dashboard mode
    if (!isDashboardMode) {
        createAllGrids();
        /* debugLog('🔧 Created interactive grids'); 
    } else {
        /* debugLog('📱 Dashboard mode - skipping interactive grids'); 
    }
    
    // Load placed items
    const itemsLoaded = loadPlacedItems();
    /* debugLog(`📦 Loaded ${itemsLoaded} items`); 
    
    // Only set up interactive event listeners if not in dashboard mode
    if (!isDashboardMode) {
        setupEventListeners();
        createDragPreview();
        /* debugLog('🎮 Set up interactive controls'); 
    } else {
        /* debugLog('📱 Dashboard mode - skipping interactive controls'); 
    }
    
    // Apply room customizations
    applyRoomCustomizations(roomData);
    
    /* debugLog('✅ Room initialization completed successfully'); 
    return true;
} */

// Hold indicator for drag and drop
function createHoldIndicator() {
    if (holdIndicator) return;
    
    holdIndicator = document.createElement('div');
    holdIndicator.className = 'hold-to-drag-indicator';
    holdIndicator.innerHTML = '<div class="hold-progress"></div>';
    document.body.appendChild(holdIndicator);
}

// Create floating action menu
function createFloatingMenu() {
    if (floatingMenu) return;
    
    floatingMenu = document.createElement('div');
    floatingMenu.className = 'floating-action-menu';
    floatingMenu.innerHTML = `
        <button class="menu-button rotate" data-action="rotate">
            <span>Rotate Item</span>
        </button>
        <button class="menu-button front" data-action="front">
            <span>Bring to Front</span>
        </button>
        <button class="menu-button back" data-action="back">
            <span>Send to Back</span>
        </button>
        <button class="menu-button remove" data-action="remove">
            <span>Remove Item</span>
        </button>
    `;
    
    document.body.appendChild(floatingMenu);
    
    // Add menu button listeners
    floatingMenu.addEventListener('click', handleMenuAction);
}

function setupEnhancedEventListeners() {
    // Remove old context menu listeners and add new hold-to-drag
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('contextmenu', preventContextMenu); // Disable right-click menu
    
    // Touch support for mobile
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    
    // Hide floating menu when clicking elsewhere
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.floating-action-menu') && !e.target.closest('.placed-item.being-held')) {
            hideFloatingMenu();
        }
    });
    
    // Clean up on page unload
    window.addEventListener('beforeunload', cleanup);
}

// Prevent right-click context menu
function preventContextMenu(e) {
    if (e.target.closest('.placed-item')) {
        e.preventDefault();
        return false;
    }
}

// Enhanced mouse down handler
function handleMouseDown(e) {
    if (e.button !== 0) return; // Only left mouse button
    
    const placedItem = e.target.closest('.placed-item');
    if (!placedItem || isDashboardMode) return;
    
    e.preventDefault();
    startHold(placedItem, e);
}

// Start hold timer
function startHold(item, e) {
    if (isHolding) return;
    
    isHolding = true;
    heldItem = item;
    holdStartTime = Date.now();
    lastMousePosition = { x: e.clientX, y: e.clientY };
    
    // Show hold indicator
    showHoldIndicator(e.clientX, e.clientY);
    
    // Start progress animation
    const progress = holdIndicator.querySelector('.hold-progress');
    let progressAngle = 0;
    
    holdTimer = setInterval(() => {
        const elapsed = Date.now() - holdStartTime;
        progressAngle = (elapsed / HOLD_DURATION) * 360;
        
        if (progress && progress.querySelector('::before')) {
            progress.style.setProperty('--progress', `${progressAngle}deg`);
        }
        
        if (elapsed >= HOLD_DURATION) {
            completeHold();
        }
    }, 16); // ~60fps
}

// Complete hold and start drag
function completeHold() {
    if (!heldItem) return;
    
    clearInterval(holdTimer);
    hideHoldIndicator();
    
    // Mark item as being held
    heldItem.classList.add('being-held');
    
    // Show floating menu
    showFloatingMenu();
    
    // Create drag ghost
    createDragGhost();
    
    // Add hold instruction
    addHoldInstruction();
    
    showActionFeedback(heldItem, 'Item picked up - drag to move');
}

// Show hold indicator
function showHoldIndicator(x, y) {
    if (!holdIndicator) return;
    
    holdIndicator.style.left = x - 30 + 'px';
    holdIndicator.style.top = y - 30 + 'px';
    holdIndicator.style.display = 'block';
}

// Hide hold indicator
function hideHoldIndicator() {
    if (holdIndicator) {
        holdIndicator.style.display = 'none';
    }
}

// Create drag ghost
function createDragGhost() {
    if (!heldItem) return;
    
    dragGhost = heldItem.cloneNode(true);
    dragGhost.className = 'drag-ghost';
    dragGhost.style.position = 'fixed';
    dragGhost.style.pointerEvents = 'none';
    dragGhost.style.zIndex = '10000';
    
    
    document.body.appendChild(dragGhost);
    updateDragGhost(lastMousePosition.x, lastMousePosition.y);
}

// Update drag ghost position
function updateDragGhost(x, y) {
    if (!dragGhost) return;
    
    const rect = heldItem.getBoundingClientRect();
    dragGhost.style.left = (x - rect.width / 2) + 'px';
    dragGhost.style.top = (y - rect.height / 2) + 'px';
}

// Mouse move handler
function handleMouseMove(e) {
    lastMousePosition = { x: e.clientX, y: e.clientY };
    
    if (isHolding && !heldItem.classList.contains('being-held')) {
        // Update hold indicator position
        if (holdIndicator && holdIndicator.style.display === 'block') {
            holdIndicator.style.left = e.clientX - 30 + 'px';
            holdIndicator.style.top = e.clientY - 30 + 'px';
        }
        
        // Check if mouse moved too far - cancel hold
        const startDistance = Math.sqrt(
            Math.pow(e.clientX - lastMousePosition.x, 2) + 
            Math.pow(e.clientY - lastMousePosition.y, 2)
        );
        
        if (startDistance > 10) {
            cancelHold();
        }
    } else if (heldItem && heldItem.classList.contains('being-held')) {
        // Update drag ghost and floating menu
        updateDragGhost(e.clientX, e.clientY);
        updateFloatingMenuPosition();
        
        // Check for drop zones
        checkDropZone(e);
    }
}

function checkDropZone(e) {
    // Visual feedback during drag
    const elementUnder = document.elementFromPoint(e.clientX, e.clientY);
    const gridCell = elementUnder ? elementUnder.closest('.grid-cell') : null;
    
    // Clear previous highlights
    document.querySelectorAll('.grid-cell').forEach(cell => {
        cell.classList.remove('drag-over', 'invalid-drop');
    });
    
    if (gridCell) {
        const dropResult = findDropZone(e);
        const itemConfig = getItemConfig(heldItem.querySelector('img').src);
        
        // Highlight affected cells
        for (let dy = 0; dy < itemConfig.height; dy++) {
            for (let dx = 0; dx < itemConfig.width; dx++) {
                const targetCell = document.querySelector(
                    `[data-surface="${dropResult.surface}"][data-x="${dropResult.gridX + dx}"][data-y="${dropResult.gridY + dy}"]`
                );
                if (targetCell) {
                    targetCell.classList.add(dropResult.valid ? 'drag-over' : 'invalid-drop');
                }
            }
        }
    }
}

// Mouse up handler
function handleMouseUp(e) {
    if (isHolding && heldItem) {
        if (heldItem.classList.contains('being-held')) {
            // Complete drag and drop
            completeDragDrop(e);
        } else {
            // Cancel hold
            cancelHold();
        }
    }
}

// Cancel hold
function cancelHold() {
    clearInterval(holdTimer);
    hideHoldIndicator();
    hideFloatingMenu();
    
    if (dragGhost) {
        dragGhost.remove();
        dragGhost = null;
    }
    
    if (heldItem) {
        heldItem.classList.remove('being-held');
        heldItem = null;
    }
    
    isHolding = false;
}

// Complete drag and drop
function completeDragDrop(e) {
    if (!heldItem) return;
    
    const dropResult = findDropZone(e);
    
    if (dropResult.valid) {
        // Valid drop - update item position
        updateItemPosition(heldItem, dropResult);
        removeFromFlying(heldItem);
        showActionFeedback(heldItem, 'Item moved successfully');
    } else {
        // Invalid drop - mark as flying
        addToFlying(heldItem);
        showActionFeedback(heldItem, 'Invalid position - item is floating');
    }
    
    // Clean up
    finalizeDragDrop();
}

// Find drop zone under cursor
function findDropZone(e) {
    const elementUnder = document.elementFromPoint(e.clientX, e.clientY);
    const gridCell = elementUnder ? elementUnder.closest('.grid-cell') : null;
    
    if (!gridCell) {
        return { valid: false, reason: 'Not over grid' };
    }
    
    const gridX = parseInt(gridCell.dataset.x);
    const gridY = parseInt(gridCell.dataset.y);
    const surface = gridCell.dataset.surface;
    
    const itemConfig = getItemConfig(heldItem.querySelector('img').src);
    const itemId = heldItem.dataset.id;
    
    // Check if placement is valid
    const isValid = isAreaAvailable(gridX, gridY, itemConfig.width, itemConfig.height, surface, itemId);
    
    return {
        valid: isValid,
        gridX: gridX,
        gridY: gridY,
        surface: surface,
        reason: isValid ? 'Valid placement' : 'Position occupied or invalid'
    };
}

// Update item position
function updateItemPosition(itemElement, dropResult) {
    const itemId = itemElement.dataset.id;
    const item = placedItems.find(i => i.id == itemId);
    
    if (item) {
        const oldSurface = item.surface || 'floor';
        
        // Update data
        item.grid_x = dropResult.gridX;
        item.grid_y = dropResult.gridY;
        item.surface = dropResult.surface;
        
        // Update visual position
        itemElement.style.left = (dropResult.gridX * CELL_SIZE) + 'px';
        itemElement.style.top = (dropResult.gridY * CELL_SIZE) + 'px';
        itemElement.dataset.gridX = dropResult.gridX;
        itemElement.dataset.gridY = dropResult.gridY;
        itemElement.dataset.surface = dropResult.surface;
        
        // Move to new container if surface changed
        if (oldSurface !== dropResult.surface) {
            const newContainer = document.getElementById(`placed-items-${dropResult.surface}`);
            if (newContainer) {
                newContainer.appendChild(itemElement);
            }
        }
    }
}

// Add item to flying state
function addToFlying(itemElement) {
    const itemId = itemElement.dataset.id;
    flyingItems.add(itemId);
    itemElement.classList.add('flying');
    updateFlyingWarning();
}

// Remove item from flying state
function removeFromFlying(itemElement) {
    const itemId = itemElement.dataset.id;
    flyingItems.delete(itemId);
    itemElement.classList.remove('flying');
    updateFlyingWarning();
}

// Update flying items warning
function updateFlyingWarning() {
    let warning = document.querySelector('.flying-items-warning');
    
    if (flyingItems.size > 0) {
        if (!warning) {
            warning = document.createElement('div');
            warning.className = 'flying-items-warning';
            document.body.appendChild(warning);
        }
        
        warning.innerHTML = `${flyingItems.size} item(s) in invalid positions - they will be removed when you save`;
        warning.classList.add('show');
        
        // Update save button
        const saveBtn = document.querySelector('.save-room-btn');
        if (saveBtn) {
            saveBtn.classList.add('has-flying');
        }
    } else {
        if (warning) {
            warning.classList.remove('show');
        }
        
        // Reset save button
        const saveBtn = document.querySelector('.save-room-btn');
        if (saveBtn) {
            saveBtn.classList.remove('has-flying');
        }
    }
}

// Finalize drag and drop
function finalizeDragDrop() {
    if (dragGhost) {
        dragGhost.remove();
        dragGhost = null;
    }
    
    if (heldItem) {
        heldItem.classList.remove('being-held');
    }
    
    // Keep floating menu open for further actions
    updateFloatingMenuPosition();
    
    isHolding = false;
}

// Show floating menu
function showFloatingMenu() {
    if (!floatingMenu || !heldItem) return;
    
    floatingMenu.classList.add('show');
    updateFloatingMenuPosition();
}

// Update floating menu position
function updateFloatingMenuPosition() {
    if (!floatingMenu || !heldItem) return;
    
    const itemRect = heldItem.getBoundingClientRect();
    const menuWidth = 140;
    const menuHeight = 160;
    
    let left = itemRect.right + 10;
    let top = itemRect.top;
    
    // Adjust if menu would go off screen
    if (left + menuWidth > window.innerWidth) {
        left = itemRect.left - menuWidth - 10;
    }
    
    if (top + menuHeight > window.innerHeight) {
        top = window.innerHeight - menuHeight - 10;
    }
    
    floatingMenu.style.left = left + 'px';
    floatingMenu.style.top = top + 'px';
}

// Hide floating menu
function hideFloatingMenu() {
    if (floatingMenu) {
        floatingMenu.classList.remove('show');
    }
    
    if (heldItem) {
        heldItem.classList.remove('selected');
        heldItem = null;
    }
}

// Handle menu actions
function handleMenuAction(e) {
    if (!e.target.closest('.menu-button') || !heldItem) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const action = e.target.closest('.menu-button').dataset.action;
    
    switch (action) {
        case 'rotate':
            rotateHeldItem();
            break;
        case 'front':
            moveHeldItemToFront();
            break;
        case 'back':
            moveHeldItemToBack();
            break;
        case 'remove':
            removeHeldItem();
            break;
    }
}

// Rotate held item
function rotateHeldItem() {
    if (!heldItem) return;
    
    const currentRotation = parseInt(heldItem.dataset.rotation) || 0;
    const newRotation = (currentRotation + 90) % 360;
    
    heldItem.dataset.rotation = newRotation;
    
    // Update rotation data
    const itemId = heldItem.dataset.id;
    const item = placedItems.find(i => i.id == itemId);
    if (item) {
        item.rotation = newRotation;
        
        // Update image if rotation variants exist
        updateItemRotationImage(heldItem, item, newRotation);
    }
    
    showActionFeedback(heldItem, `Rotated to ${newRotation}°`);
}

// Move held item to front
function moveHeldItemToFront() {
    if (!heldItem) return;
    
    const surface = heldItem.dataset.surface;
    const maxZ = Math.max(...placedItems.filter(i => i.surface === surface).map(i => i.z_index || 0));
    
    heldItem.style.zIndex = maxZ + 1;
    
    const itemId = heldItem.dataset.id;
    const item = placedItems.find(i => i.id == itemId);
    if (item) {
        item.z_index = maxZ + 1;
    }
    
    showActionFeedback(heldItem, 'Moved to front');
}

// Move held item to back
function moveHeldItemToBack() {
    if (!heldItem) return;
    
    const surface = heldItem.dataset.surface;
    heldItem.style.zIndex = 1;
    
    // Update z-indices for all items on same surface
    placedItems.forEach(item => {
        if (item.surface === surface && item.id != heldItem.dataset.id && item.z_index > 0) {
            item.z_index++;
        }
    });
    
    const itemId = heldItem.dataset.id;
    const item = placedItems.find(i => i.id == itemId);
    if (item) {
        item.z_index = 1;
    }
    
    // Apply z-index changes
    document.querySelectorAll(`.placed-item[data-surface="${surface}"]`).forEach(el => {
        const elItem = placedItems.find(i => i.id == el.dataset.id);
        if (elItem) {
            el.style.zIndex = elItem.z_index;
        }
    });
    
    showActionFeedback(heldItem, 'Moved to back');
}

// Remove held item
function removeHeldItem() {
    if (!heldItem) return;
    
    if (confirm('Remove this item from the room?')) {
        const itemId = heldItem.dataset.id;
        
        // Remove from flying items if present
        removeFromFlying(heldItem);
        
        // Remove from array
        placedItems = placedItems.filter(i => i.id != itemId);
        
        // Remove element
        heldItem.remove();
        
        hideFloatingMenu();
        showActionFeedback(document.body, 'Item removed');
    }
}

// Ensure room structure exists
function ensureRoomStructure() {
    const room = document.getElementById('isometric-room');
    if (!room) {
        debugError('❌ Room container not found');
        return false;
    }
    
    // Check if structure already exists
    if (!room.querySelector('.room-base')) {
        /* debugLog('🏗️ Creating room structure'); */
        
        // Clear and rebuild room structure
        room.innerHTML = `
            <div class="room-base">
                <div class="room-floor" id="room-floor"></div>
                <div class="room-wall-left" id="wall-left"></div>
                <div class="room-wall-right" id="wall-right"></div>
                <div class="room-door"></div>
            </div>
            <div class="room-grid-floor" id="room-grid-floor"></div>
            <div class="room-grid-wall-left" id="room-grid-wall-left"></div>
            <div class="room-grid-wall-right" id="room-grid-wall-right"></div>
            <div class="placed-items-floor" id="placed-items-floor"></div>
            <div class="placed-items-wall-left" id="placed-items-wall-left"></div>
            <div class="placed-items-wall-right" id="placed-items-wall-right"></div>
        `;
    } else {
        /* debugLog('🏗️ Room structure already exists'); */
    }
    
    // Verify all required containers exist
    const requiredContainers = [
        'room-floor', 'wall-left', 'wall-right',
        'placed-items-floor', 'placed-items-wall-left', 'placed-items-wall-right'
    ];
    
    for (const containerId of requiredContainers) {
        if (!document.getElementById(containerId)) {
            debugError(`❌ Required container missing: ${containerId}`);
            return false;
        }
    }
    
    return true;
}

function applyRoomCustomizations(roomData) {
    /* debugLog('🎨 Applying room customizations'); */
    
    try {
        if (roomData.floor_color) {
            const floor = document.querySelector('.room-floor');
            if (floor) {
                floor.style.backgroundColor = roomData.floor_color;
                /* debugLog('🎨 Applied floor color:', roomData.floor_color); */
            }
        }
        
        if (roomData.wall_color) {
            const leftWall = document.querySelector('.room-wall-left');
            const rightWall = document.querySelector('.room-wall-right');
            if (leftWall) {
                leftWall.style.background = `linear-gradient(to bottom, ${roomData.wall_color}, ${adjustColor(roomData.wall_color, -20)})`;
                /* debugLog('🎨 Applied left wall color:', roomData.wall_color); */
            }
            if (rightWall) {
                rightWall.style.background = `linear-gradient(to left, ${adjustColor(roomData.wall_color, -10)}, ${adjustColor(roomData.wall_color, -30)})`;
                /* debugLog('🎨 Applied right wall color:', roomData.wall_color); */
            }
        }
    } catch (error) {
        debugError('❌ Error applying room customizations:', error);
    }
}

// Adjust color brightness
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

// Create drag preview element
function createDragPreview() {
    // Only create drag previews if not in dashboard mode
    if (isDashboardMode) return;
    
    // Create preview for each surface
    ['floor', 'wall-left', 'wall-right'].forEach(surface => {
        const container = document.getElementById(`placed-items-${surface}`);
        if (container) {
            let preview = container.querySelector('.drag-preview');
            if (!preview) {
                preview = document.createElement('div');
                preview.className = 'drag-preview';
                preview.style.display = 'none';
                preview.style.position = 'absolute';
                preview.style.pointerEvents = 'none';
                container.appendChild(preview);
            }
        }
    });
    
    // Set main drag preview reference
    dragPreview = document.querySelector('.drag-preview');
}

// Get item configuration
function getItemConfig(itemName) {
    if (!itemName) return { width: 1, height: 1, surfaces: ['floor'] };
    
    // Extract base name from image path
    const baseName = itemName.toLowerCase().replace(/\.(jpg|png|webp|gif)$/i, '').split('/').pop();
    
    // Remove rotation suffixes if present
    const cleanName = baseName.replace(/-(back|front)-(left|right)$/, '');
    
    // Item configurations using clean names
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
        'wall_clock': { width: 1, height: 1, surfaces: ['floor', 'wall-left', 'wall-right'] },
        'wall_mirror': { width: 1, height: 1, surfaces: ['wall-left', 'wall-right'] },
        'wall_shelf': { width: 2, height: 1, surfaces: ['wall-left', 'wall-right'] },
        'painting': { width: 2, height: 1, surfaces: ['wall-left', 'wall-right'] }
    };
    
    // Check predefined sizes using clean name
    if (ITEM_SIZES[cleanName]) {
        return ITEM_SIZES[cleanName];
    }
    
    // Default config
    return { width: 1, height: 1, surfaces: ['floor'] };
}

// Create all grids (floor and walls)
function createAllGrids() {
    // Create floor grid
    createGrid('floor', GRID_SIZE, GRID_SIZE);
    
    // Create wall grids (4 cells high)
    createGrid('wall-left', GRID_SIZE, WALL_HEIGHT);
    createGrid('wall-right', WALL_HEIGHT, GRID_SIZE);
}

// Create a grid for a specific surface
function createGrid(surface, width, height) {
    const gridContainer = document.getElementById(`room-grid-${surface}`);
    if (!gridContainer) return;
    
    gridContainer.innerHTML = '';
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.x = x;
            cell.dataset.y = y;
            cell.dataset.surface = surface;
            
            // Position cells in grid
            cell.style.left = (x * CELL_SIZE) + 'px';
            cell.style.top = (y * CELL_SIZE) + 'px';
            cell.style.width = CELL_SIZE + 'px';
            cell.style.height = CELL_SIZE + 'px';
            
            // Mark door area as non-placeable (on left wall and floor entrance)
            if (isDoorArea(x, y, surface)) {
                cell.classList.add('non-placeable');
            }
            
            // Add drop listeners
            cell.addEventListener('dragover', handleDragOver);
            cell.addEventListener('dragleave', handleDragLeave);
            cell.addEventListener('drop', handleDrop);
            cell.addEventListener('click', handleCellClick);
            
            gridContainer.appendChild(cell);
        }
    }
}

// Check if coordinates are in door area (on left wall and floor in front)
function isDoorArea(x, y, surface) {
    // Door configuration:
    // - Left wall: column 1 (x=1), bottom 2 rows (y=2,3)
    // - Floor entrance: column 1 (x=1), first row (y=0) - to keep entrance clear
    
    if (surface === 'wall-left') {
        return x === 1 && y >= 2;
    }
    // Block the floor cell in front of the door entrance
    if (surface === 'floor') {
        return x === 1 && y === 0;
    }
    return false;
}

// Check if area is available for item placement
function isAreaAvailable(x, y, width, height, surface, excludeItemId = null) {
    // Get grid dimensions based on surface
    let maxX, maxY;
    if (surface === 'floor') {
        maxX = GRID_SIZE;
        maxY = GRID_SIZE;
    } else if (surface === 'wall-left') {
        maxX = GRID_SIZE;
        maxY = WALL_HEIGHT;
    } else if (surface === 'wall-right') {
        maxX = WALL_HEIGHT;
        maxY = GRID_SIZE;
    }
    
    // Check bounds
    if (x < 0 || y < 0 || x + width > maxX || y + height > maxY) {
        return false;
    }
    
    // Check door area (on left wall and floor entrance)
    for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
            if (isDoorArea(x + dx, y + dy, surface)) {
                return false;
            }
        }
    }
    
    // Check collision with other items on the same surface
    for (const item of placedItems) {
        if (item.surface !== surface) continue; // Skip items on other surfaces
        if (excludeItemId && item.id === excludeItemId) continue;
        
        const itemConfig = getItemConfig(item.image_path || item.name);
        
        // Check if rectangles overlap
        if (!(x + width <= item.grid_x || 
              x >= item.grid_x + itemConfig.width ||
              y + height <= item.grid_y || 
              y >= item.grid_y + itemConfig.height)) {
            return false;
        }
    }
    
    return true;
}

// Load placed items into the room
// Load placed items with enhanced debugging
function loadPlacedItems() {
    /* debugLog('📦 Loading placed items'); */
    
    // Clear items from all surfaces
    let clearedCount = 0;
    ['floor', 'wall-left', 'wall-right'].forEach(surface => {
        const container = document.getElementById(`placed-items-${surface}`);
        if (container) {
            const existingItems = container.querySelectorAll('.placed-item');
            clearedCount += existingItems.length;
            existingItems.forEach(item => item.remove());
        }
    });
    
    if (clearedCount > 0) {
        /* debugLog(`🗑️ Cleared ${clearedCount} existing items`); */
    }
    
    let loadedCount = 0;
    let errorCount = 0;
    
    // Place items on appropriate surfaces
    placedItems.forEach((item, index) => {
        try {
            // Enhanced validation
            if (!item || typeof item.grid_x === 'undefined' || typeof item.grid_y === 'undefined') {
                debugWarn(`⚠️ Skipping invalid item at index ${index}:`, item);
                errorCount++;
                return;
            }
            
            const itemElement = createPlacedItem(item);
            if (itemElement) {
                const surface = item.surface || 'floor';
                const container = document.getElementById(`placed-items-${surface}`);
                if (container) {
                    container.appendChild(itemElement);
                    loadedCount++;
                    /* debugLog(`📦 Placed item ${item.id} "${item.name}" on ${surface} at [${item.grid_x}, ${item.grid_y}]`); */
                } else {
                    debugError(`❌ Container not found for surface: ${surface}`);
                    errorCount++;
                }
            } else {
                debugError(`❌ Failed to create element for item:`, item);
                errorCount++;
            }
        } catch (error) {
            debugError(`❌ Error loading item at index ${index}:`, error, item);
            errorCount++;
        }
    });
    
    /* debugLog(`📊 Loading summary: ${loadedCount} loaded, ${errorCount} errors`); */
    return loadedCount;
}

// Create a placed item element
function createPlacedItem(item) {
    try {
        // Enhanced validation
        if (!item || !item.id || typeof item.grid_x === 'undefined' || typeof item.grid_y === 'undefined') {
            debugError('❌ Invalid item data for createPlacedItem:', item);
            return null;
        }
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'placed-item';
        itemDiv.dataset.id = item.id;
        itemDiv.dataset.gridX = item.grid_x;
        itemDiv.dataset.gridY = item.grid_y;
        itemDiv.dataset.surface = item.surface || 'floor';
        itemDiv.dataset.rotation = item.rotation || 0;
        itemDiv.dataset.itemId = item.item_id || item.inventory_id;
        
        const itemConfig = getItemConfig(item.image_path || item.name);
        
        // Position and size on grid
        itemDiv.style.left = (item.grid_x * CELL_SIZE) + 'px';
        itemDiv.style.top = (item.grid_y * CELL_SIZE) + 'px';
        itemDiv.style.width = (itemConfig.width * CELL_SIZE) + 'px';
        itemDiv.style.height = (itemConfig.height * CELL_SIZE) + 'px';
        itemDiv.style.zIndex = item.z_index || 1;
        
        // Create image element
        const img = document.createElement('img');
        
        // Get rotation variants
        let rotationVariants = item.rotation_variants || itemRotationData[item.item_id];
        
        // If no rotation variants provided, try to generate them
        if (!rotationVariants && item.image_path) {
            rotationVariants = generateRotationVariants(item.image_path);
        }
        
        // Get the correct image path for current rotation
        const imagePath = getRotatedImagePath(
            normalizeImagePath(item.image_path), 
            item.rotation || 0, 
            rotationVariants
        );
        
        img.src = '../' + imagePath;
        img.alt = item.name || 'Item';
        img.draggable = false;
        
        // Enhanced error handling for image loading
        img.onerror = function() {
            debugWarn(`⚠️ Failed to load image: ${imagePath}, falling back to base image`);
            const fallbackPath = '../' + normalizeImagePath(item.image_path);
            if (this.src !== fallbackPath) {
                this.src = fallbackPath;
            } else {
                debugError(`❌ Both primary and fallback images failed for item: ${item.name}`);
                // Create a placeholder
                this.style.display = 'none';
                const placeholder = document.createElement('div');
                placeholder.style.cssText = `
                    width: 100%; height: 100%; background: #ddd; 
                    display: flex; align-items: center; justify-content: center;
                    font-size: 10px; color: #666; text-align: center;
                `;
                placeholder.textContent = item.name || 'Item';
                itemDiv.appendChild(placeholder);
            }
        };
        
        img.onload = function() {
            /* debugLog(`✅ Image loaded successfully: ${imagePath}`); */
        };
        
        itemDiv.appendChild(img);
        
        // Store rotation data
        if (rotationVariants) {
            itemDiv.dataset.rotationVariants = JSON.stringify(rotationVariants);
        }
        
        // Only add interactive event listeners if not in dashboard mode
        if (!isDashboardMode) {
            itemDiv.addEventListener('click', selectItem);
            itemDiv.addEventListener('contextmenu', showContextMenu);
            
            // Make placed items draggable for repositioning
            itemDiv.draggable = true;
            itemDiv.addEventListener('dragstart', handleItemDragStart);
            itemDiv.addEventListener('dragend', handleItemDragEnd);
        }
        
        return itemDiv;
        
    } catch (error) {
        debugError('❌ Error in createPlacedItem:', error, item);
        return null;
    }
}

// Handle cell click (for debugging and surface switching)
function handleCellClick(e) {
    if (e.shiftKey) {
        const cell = e.target;
        const surface = cell.dataset.surface;
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);
        const isBlocked = isDoorArea(x, y, surface);
        console.log(`Cell clicked: ${surface} [${x}, ${y}] - ${isBlocked ? 'BLOCKED (door area)' : 'Available'}`);
    }
}

// Set up event listeners
function setupEventListeners() {
    // Only set up interactive listeners if not in dashboard mode
    if (isDashboardMode) return;
    
    // Close context menu on click outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.item-context-menu') && !e.target.closest('.placed-item')) {
            hideContextMenu();
        }
    });
    
    // Deselect item on room click
    const room = document.getElementById('isometric-room');
    if (room) {
        room.addEventListener('click', function(e) {
            if (e.target.classList.contains('grid-cell') || 
                e.target.classList.contains('room-floor') ||
                e.target.classList.contains('room-wall-left') ||
                e.target.classList.contains('room-wall-right')) {
                deselectItem();
            }
        });
    }
    
    // Global drag end handler
    document.addEventListener('dragend', function(e) {
        // Hide all drag previews
        document.querySelectorAll('.drag-preview').forEach(preview => {
            preview.style.display = 'none';
        });
        
        // Clear all drag states
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.classList.remove('drag-over', 'drag-invalid');
        });
        
        isDragging = false;
        currentDragData = null;
    });
}

// Drag and drop handlers
function startDrag(e) {
    const item = e.target.closest('.inventory-item');
    if (!item) return;
    
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('itemId', item.dataset.id);
    e.dataTransfer.setData('itemDataId', item.dataset.itemId);
    e.dataTransfer.setData('image', item.dataset.image);
    e.dataTransfer.setData('name', item.dataset.name);
    
    // Get rotation variants if available
    const rotationVariants = item.dataset.rotationVariants ? 
        JSON.parse(item.dataset.rotationVariants) : null;
    
    // Store drag data
    currentDragData = {
        itemId: item.dataset.id,
        itemDataId: item.dataset.itemId,
        image: item.dataset.image,
        name: item.dataset.name,
        rotationVariants: rotationVariants,
        isReposition: false
    };
    
    isDragging = true;
    
    // Show grid when dragging starts
    const room = document.getElementById('isometric-room');
    if (room) {
        room.classList.add('dragging');
    }
}

// Handle dragging of already placed items
function handleItemDragStart(e) {
    const item = e.target.closest('.placed-item');
    if (!item) return;
    
    const itemId = item.dataset.id;
    const placedItem = placedItems.find(i => i.id == itemId);
    
    if (!placedItem) return;
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('placedItemId', itemId);
    e.dataTransfer.setData('isReposition', 'true');
    
    // Store drag data
    currentDragData = {
        itemId: placedItem.inventory_id,
        itemDataId: placedItem.item_id,
        image: placedItem.image_path,
        name: placedItem.name,
        surface: placedItem.surface || 'floor',
        isReposition: true,
        originalId: itemId
    };
    
    // Make item semi-transparent
    item.classList.add('dragging');
    
    isDragging = true;
    
    // Show grid when dragging starts
    const room = document.getElementById('isometric-room');
    if (room) {
        room.classList.add('dragging');
    }
}

function handleItemDragEnd(e) {
    const item = e.target.closest('.placed-item');
    if (item) {
        item.classList.remove('dragging');
    }
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    
    if (!isDragging || !currentDragData) return false;
    
    const cell = e.target.closest('.grid-cell');
    if (!cell) return false;
    
    const gridX = parseInt(cell.dataset.x);
    const gridY = parseInt(cell.dataset.y);
    const surface = cell.dataset.surface;
    const itemConfig = getItemConfig(currentDragData.image || currentDragData.name);
    
    // Check if item can be placed on this surface
    if (!currentDragData.isReposition && !itemConfig.surfaces.includes(surface)) {
        e.dataTransfer.dropEffect = 'none';
        return false;
    }
    
    // Clear previous hover states
    document.querySelectorAll('.grid-cell').forEach(c => {
        c.classList.remove('drag-over', 'drag-invalid');
    });
    
    // Check if placement is valid
    const excludeId = currentDragData.isReposition ? currentDragData.originalId : null;
    const isValid = isAreaAvailable(gridX, gridY, itemConfig.width, itemConfig.height, surface, excludeId);
    
    // Highlight affected cells
    for (let dy = 0; dy < itemConfig.height; dy++) {
        for (let dx = 0; dx < itemConfig.width; dx++) {
            const targetCell = document.querySelector(`[data-surface="${surface}"][data-x="${gridX + dx}"][data-y="${gridY + dy}"]`);
            if (targetCell) {
                targetCell.classList.add(isValid ? 'drag-over' : 'drag-invalid');
            }
        }
    }
    
    // Update drag preview position
    const preview = document.querySelector(`#placed-items-${surface} .drag-preview`);
    if (preview) {
        preview.style.display = 'block';
        preview.style.left = (gridX * CELL_SIZE) + 'px';
        preview.style.top = (gridY * CELL_SIZE) + 'px';
        preview.style.width = (itemConfig.width * CELL_SIZE) + 'px';
        preview.style.height = (itemConfig.height * CELL_SIZE) + 'px';
        preview.innerHTML = `<img src="../${currentDragData.image}" alt="${currentDragData.name}">`;
        preview.style.opacity = isValid ? '0.7' : '0.3';
    }
    
    e.dataTransfer.dropEffect = isValid ? 'copy' : 'none';
    return false;
}

function handleDragLeave(e) {
    // Don't clear if we're still over a grid cell
    const relatedTarget = e.relatedTarget;
    if (relatedTarget && relatedTarget.classList && relatedTarget.classList.contains('grid-cell')) {
        return;
    }
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    e.preventDefault();
    
    const cell = e.target.closest('.grid-cell');
    if (!cell) return;
    
    // Get grid coordinates and surface
    const gridX = parseInt(cell.dataset.x);
    const gridY = parseInt(cell.dataset.y);
    const surface = cell.dataset.surface;
    
    // Get item data
    const isReposition = e.dataTransfer.getData('isReposition') === 'true';
    const itemConfig = getItemConfig(currentDragData.image || currentDragData.name);
    
    // Check if item can be placed on this surface
    if (!isReposition && !itemConfig.surfaces.includes(surface)) {
        showNotification('This item cannot be placed on this surface!', 'warning');
        return;
    }
    
    // Check if area is available
    const excludeId = isReposition ? currentDragData.originalId : null;
    if (!isAreaAvailable(gridX, gridY, itemConfig.width, itemConfig.height, surface, excludeId)) {
        showNotification('Cannot place item here!', 'warning');
        return;
    }
    
    if (isReposition) {
        // Update existing item position
        const itemToMove = placedItems.find(i => i.id == currentDragData.originalId);
        if (itemToMove) {
            const oldSurface = itemToMove.surface || 'floor';
            itemToMove.grid_x = gridX;
            itemToMove.grid_y = gridY;
            itemToMove.surface = surface;
            
            // Move visual element to new surface if needed
            const itemElement = document.querySelector(`[data-id="${currentDragData.originalId}"]`);
            if (itemElement) {
                itemElement.style.left = (gridX * CELL_SIZE) + 'px';
                itemElement.style.top = (gridY * CELL_SIZE) + 'px';
                itemElement.dataset.gridX = gridX;
                itemElement.dataset.gridY = gridY;
                itemElement.dataset.surface = surface;
                
                // Move to new container if surface changed
                if (oldSurface !== surface) {
                    const newContainer = document.getElementById(`placed-items-${surface}`);
                    if (newContainer) {
                        newContainer.appendChild(itemElement);
                    }
                }
            }
            
            showNotification('Item moved!', 'success');
        }
    } else {
        // Create new placed item with rotation variants
        const newItem = {
            id: 'temp_' + Date.now(),
            inventory_id: currentDragData.itemId,
            item_id: currentDragData.itemDataId,
            grid_x: gridX,
            grid_y: gridY,
            surface: surface,
            rotation: 0,
            z_index: placedItems.filter(i => i.surface === surface).length + 1,
            image_path: currentDragData.image,
            name: currentDragData.name,
            rotation_variants: currentDragData.rotationVariants
        };
        
        // Add to placed items
        placedItems.push(newItem);
        
        // Create and add element
        const itemElement = createPlacedItem(newItem);
        const container = document.getElementById(`placed-items-${surface}`);
        if (container) {
            container.appendChild(itemElement);
        }
        
        showNotification('Item placed! Remember to save your layout.', 'info');
    }
    
    // Clear drag state
    clearDragState();
}

function clearDragState() {
    isDragging = false;
    currentDragData = null;
    document.querySelectorAll('.drag-preview').forEach(preview => {
        preview.style.display = 'none';
    });
    document.querySelectorAll('.grid-cell').forEach(c => {
        c.classList.remove('drag-over', 'drag-invalid');
    });
    
    const room = document.getElementById('isometric-room');
    if (room) {
        room.classList.remove('dragging');
    }
}

// Global drag end handler
document.addEventListener('dragend', function(e) {
    // Hide all drag previews
    document.querySelectorAll('.drag-preview').forEach(preview => {
        preview.style.display = 'none';
    });
    
    // Clear all drag states
    document.querySelectorAll('.grid-cell').forEach(cell => {
        cell.classList.remove('drag-over', 'drag-invalid');
    });
    
    // Reset placed item dragging state
    document.querySelectorAll('.placed-item.dragging').forEach(item => {
        item.classList.remove('dragging');
    });
    
    // Hide grid when dragging ends (regardless of where drop occurred)
    const room = document.getElementById('isometric-room');
    if (room) {
        room.classList.remove('dragging');
    }
    
    isDragging = false;
    currentDragData = null;
});

// Select an item
function selectItem(e) {
    e.stopPropagation();
    
    // Deselect previous item
    deselectItem();
    
    // Select new item
    const item = e.target.closest('.placed-item');
    if (item) {
        item.classList.add('selected');
        selectedItem = item;
    }
}

// Deselect item
function deselectItem() {
    if (selectedItem) {
        selectedItem.classList.remove('selected');
        selectedItem = null;
    }
    hideContextMenu();
}

// Show context menu
function showContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const item = e.target.closest('.placed-item');
    if (!item) return;
    
    selectItem(e);
    contextMenuItem = item;
    
    let menu = document.getElementById('item-context-menu');
    if (!menu) {
        // Create context menu if it doesn't exist
        menu = document.createElement('div');
        menu.id = 'item-context-menu';
        menu.className = 'item-context-menu';
        menu.innerHTML = `
            <button onclick="rotateItem()">Rotate</button>
            <button onclick="moveToFront()">Bring to Front</button>
            <button onclick="moveToBack()">Send to Back</button>
            <button onclick="removeItem()">Remove</button>
        `;
        document.body.appendChild(menu);
    }
    
    menu.style.display = 'block';
    menu.style.left = e.pageX + 'px';
    menu.style.top = e.pageY + 'px';
}

// Hide context menu
function hideContextMenu() {
    const menu = document.getElementById('item-context-menu');
    if (menu) {
        menu.style.display = 'none';
    }
    contextMenuItem = null;
}

// NEW: Function to normalize image paths and handle rotation suffixes
function normalizeImagePath(imagePath) {
    if (!imagePath) return '';
    
    // If the path already has a rotation suffix, extract the base path
    const rotationPattern = /-(back|front)-(left|right)(?=\.(jpg|png|webp|gif))/i;
    
    if (rotationPattern.test(imagePath)) {
        return imagePath.replace(rotationPattern, '');
    }
    
    return imagePath;
}

function getRotatedImagePath(basePath, rotation, rotationVariants) {
    if (!rotationVariants || rotationVariants.length === 0) {
        return basePath;
    }
    
    const rotationIndex = ROTATION_ANGLES[rotation] || 0;
    return rotationVariants[rotationIndex] || basePath;
}

// NEW: Function to generate rotation variants from base or suffixed path
function generateRotationVariants(imagePath) {
    if (!imagePath) return [];
    
    const basePath = normalizeImagePath(imagePath);
    const pathParts = basePath.split('/');
    const filename = pathParts.pop();
    const directory = pathParts.join('/');
    
    const nameWithoutExt = filename.replace(/\.(jpg|png|webp|gif)$/i, '');
    const extension = filename.match(/\.(jpg|png|webp|gif)$/i);
    
    if (!extension) return [imagePath];
    
    const ext = extension[0];
    
    return [
        `${directory}/${nameWithoutExt}-back-right${ext}`,    // 0°
        `${directory}/${nameWithoutExt}-back-left${ext}`,     // 90°
        `${directory}/${nameWithoutExt}-front-left${ext}`,    // 180°
        `${directory}/${nameWithoutExt}-front-right${ext}`    // 270°
    ];
}

// Rotate selected item
function rotateItem() {
    if (!contextMenuItem) return;
    
    const currentRotation = parseInt(contextMenuItem.dataset.rotation) || 0;
    const newRotation = (currentRotation + 90) % 360;
    
    // Update rotation data
    contextMenuItem.dataset.rotation = newRotation;
    
    // Get rotation variants
    let rotationVariants = null;
    try {
        rotationVariants = JSON.parse(contextMenuItem.dataset.rotationVariants || '[]');
    } catch (e) {
        // If no rotation variants, try to generate them
        const itemId = contextMenuItem.dataset.id;
        const item = placedItems.find(i => i.id == itemId);
        if (item && item.image_path) {
            rotationVariants = generateRotationVariants(item.image_path);
            contextMenuItem.dataset.rotationVariants = JSON.stringify(rotationVariants);
        }
    }
    
    // Update the image if variants exist
    const img = contextMenuItem.querySelector('img');
    if (img && rotationVariants && rotationVariants.length > 0) {
        const itemId = contextMenuItem.dataset.id;
        const item = placedItems.find(i => i.id == itemId);
        
        if (item) {
            const newImagePath = getRotatedImagePath(
                normalizeImagePath(item.image_path), 
                newRotation, 
                rotationVariants
            );
            
            // Update image with error handling
            const oldSrc = img.src;
            img.src = '../' + newImagePath;
            
            img.onerror = function() {
                console.warn(`Failed to load rotated image: ${newImagePath}, keeping current image`);
                this.src = oldSrc;
                this.onerror = null; // Prevent infinite loop
            };
        }
    }
    
    // Update in data
    const itemId = contextMenuItem.dataset.id;
    const item = placedItems.find(i => i.id == itemId);
    if (item) {
        item.rotation = newRotation;
    }
    
    hideContextMenu();
    showNotification(`Item rotated to ${newRotation}°`, 'info');
}

function preloadRotationImages(items) {
    items.forEach(item => {
        if (item.rotation_variants) {
            item.rotation_variants.forEach(imagePath => {
                const img = new Image();
                img.src = '../' + imagePath;
            });
        } else if (item.image_path) {
            // Generate and preload rotation variants
            const variants = generateRotationVariants(item.image_path);
            variants.forEach(imagePath => {
                const img = new Image();
                img.src = '../' + imagePath;
            });
        }
    });
}

function debugImagePaths() {
    console.log('=== Image Path Debug ===');
    
    placedItems.forEach(item => {
        console.log(`Item ${item.id}:`);
        console.log(`  Original path: ${item.image_path}`);
        console.log(`  Normalized path: ${normalizeImagePath(item.image_path)}`);
        console.log(`  Rotation variants:`, item.rotation_variants || generateRotationVariants(item.image_path));
        console.log(`  Current rotation: ${item.rotation || 0}°`);
        
        const rotationVariants = item.rotation_variants || generateRotationVariants(item.image_path);
        const currentPath = getRotatedImagePath(normalizeImagePath(item.image_path), item.rotation || 0, rotationVariants);
        console.log(`  Current image path: ${currentPath}`);
        console.log('---');
    });
}

// Move item to front
function moveToFront() {
    if (!contextMenuItem) return;
    
    const surface = contextMenuItem.dataset.surface;
    
    // Get highest z-index for this surface
    const maxZ = Math.max(...placedItems.filter(i => i.surface === surface).map(i => i.z_index || 0));
    contextMenuItem.style.zIndex = maxZ + 1;
    
    // Update in data
    const itemId = contextMenuItem.dataset.id;
    const item = placedItems.find(i => i.id == itemId);
    if (item) {
        item.z_index = maxZ + 1;
    }
    
    hideContextMenu();
}

// Move item to back
function moveToBack() {
    if (!contextMenuItem) return;
    
    const surface = contextMenuItem.dataset.surface;
    contextMenuItem.style.zIndex = 1;
    
    // Update z-indices for all items on same surface
    placedItems.forEach(item => {
        if (item.surface === surface && item.id != contextMenuItem.dataset.id && item.z_index > 0) {
            item.z_index++;
        }
    });
    
    // Update selected item
    const itemId = contextMenuItem.dataset.id;
    const item = placedItems.find(i => i.id == itemId);
    if (item) {
        item.z_index = 1;
    }
    
    // Apply z-index changes
    document.querySelectorAll(`.placed-item[data-surface="${surface}"]`).forEach(el => {
        const elItem = placedItems.find(i => i.id == el.dataset.id);
        if (elItem) {
            el.style.zIndex = elItem.z_index;
        }
    });
    
    hideContextMenu();
}

// Remove item
function removeItem() {
    if (!contextMenuItem) return;
    
    if (confirm('Remove this item from the room?')) {
        const itemId = contextMenuItem.dataset.id;
        
        // Remove from array
        placedItems = placedItems.filter(i => i.id != itemId);
        
        // Remove element
        contextMenuItem.remove();
        
        hideContextMenu();
        showNotification('Item removed', 'info');
    }
}

// Switch surface view
function switchSurface(surface) {
    currentSurface = surface;
    
    // Update button states
    document.querySelectorAll('.surface-toggle').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.surface === surface) {
            btn.classList.add('active');
        }
    });
    
    // Show/hide grids based on selection
    ['floor', 'wall-left', 'wall-right'].forEach(s => {
        const grid = document.getElementById(`room-grid-${s}`);
        const items = document.getElementById(`placed-items-${s}`);
        if (grid && items) {
            if (s === surface || surface === 'all') {
                grid.style.opacity = '1';
                items.style.opacity = '1';
            } else {
                grid.style.opacity = '0.3';
                items.style.opacity = '0.3';
            }
        }
    });
    
    showNotification(`Viewing: ${surface === 'all' ? 'All surfaces' : surface}`, 'info');
}

// Filter inventory items
function filterInventory(category) {
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Filter items
    const items = document.querySelectorAll('.inventory-item');
    items.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Save room layout
// Enhanced save room function
function saveRoom() {
    const saveBtn = event.target;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    // Remove flying items before saving
    const flyingItemsCount = flyingItems.size;
    if (flyingItemsCount > 0) {
        if (!confirm(`${flyingItemsCount} item(s) are in invalid positions and will be removed. Continue?`)) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Layout';
            return;
        }
        
        // Remove flying items
        clearFlyingItems();
    }
    
    // Prepare data (excluding flying items)
    const validItems = placedItems.filter(item => !flyingItems.has(item.id));
    
    const roomData = {
        room_id: currentRoom.id,
        items: validItems.map(item => ({
            id: item.id.toString().startsWith('temp_') ? null : item.id,
            inventory_id: item.inventory_id,
            grid_x: item.grid_x,
            grid_y: item.grid_y,
            surface: item.surface || 'floor',
            rotation: item.rotation || 0,
            z_index: item.z_index || 1
        }))
    };
    
    // Send to server
    fetch('../php/api/habitus/save_room.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(roomData)
    })
    .then(response => response.json())
    .then(data => {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Layout';
        
        if (data.success) {
            // Update temporary IDs with real IDs
            if (data.item_ids) {
                placedItems.forEach(item => {
                    if (item.id.toString().startsWith('temp_')) {
                        const newId = data.item_ids[item.id];
                        if (newId) {
                            // Update in placed items array
                            const oldId = item.id;
                            item.id = newId;
                            
                            // Update element
                            const element = document.querySelector(`[data-id="${oldId}"]`);
                            if (element) {
                                element.dataset.id = newId;
                            }
                        }
                    }
                });
            }
            
            let message = 'Room layout saved successfully!';
            if (flyingItemsCount > 0) {
                message += ` ${flyingItemsCount} invalid item(s) were removed.`;
            }
            
            showNotification(message, 'success');
        } else {
            showNotification(data.message || 'Error saving room layout', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Layout';
        showNotification('Error saving room layout', 'error');
    });
}

// Clear all flying items
function clearFlyingItems() {
    flyingItems.forEach(itemId => {
        const element = document.querySelector(`[data-id="${itemId}"]`);
        if (element) {
            element.remove();
        }
        // Remove from placed items array
        placedItems = placedItems.filter(i => i.id != itemId);
    });
    
    flyingItems.clear();
    updateFlyingWarning();
}

// Show action feedback
function showActionFeedback(targetElement, message) {
    const feedback = document.createElement('div');
    feedback.className = 'action-feedback';
    feedback.textContent = message;
    
    if (targetElement === document.body) {
        feedback.style.position = 'fixed';
        feedback.style.top = '50%';
        feedback.style.left = '50%';
        feedback.style.transform = 'translate(-50%, -50%)';
    } else {
        const rect = targetElement.getBoundingClientRect();
        feedback.style.position = 'fixed';
        feedback.style.left = (rect.left + rect.width / 2) + 'px';
        feedback.style.top = (rect.top - 10) + 'px';
        feedback.style.transform = 'translateX(-50%)';
    }
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.remove();
    }, 1500);
}

// Touch support
function handleTouchStart(e) {
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        const placedItem = touch.target.closest('.placed-item');
        if (placedItem && !isDashboardMode) {
            e.preventDefault();
            startHold(placedItem, { clientX: touch.clientX, clientY: touch.clientY });
        }
    }
}

function handleTouchMove(e) {
    if (e.touches.length === 1 && (isHolding || (heldItem && heldItem.classList.contains('being-held')))) {
        e.preventDefault();
        const touch = e.touches[0];
        handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }
}

function handleTouchEnd(e) {
    if (isHolding || (heldItem && heldItem.classList.contains('being-held'))) {
        e.preventDefault();
        const touch = e.changedTouches[0];
        handleMouseUp({ clientX: touch.clientX, clientY: touch.clientY });
    }
}

// Add hold instruction to items
function addHoldInstruction() {
    document.querySelectorAll('.placed-item').forEach(item => {
        if (!item.querySelector('.hold-instruction')) {
            const instruction = document.createElement('div');
            instruction.className = 'hold-instruction';
            instruction.textContent = 'Hold to drag';
            item.appendChild(instruction);
        }
    });
}

// Cleanup function
function cleanup() {
    clearInterval(holdTimer);
    if (dragGhost) dragGhost.remove();
    if (holdIndicator) holdIndicator.remove();
    if (floatingMenu) floatingMenu.remove();
}

// Clear room
function clearRoom() {
    if (!confirm('Are you sure you want to remove all items from this room?')) {
        return;
    }
    
    placedItems = [];
    ['floor', 'wall-left', 'wall-right'].forEach(surface => {
        const container = document.getElementById(`placed-items-${surface}`);
        if (container) {
            const items = container.querySelectorAll('.placed-item');
            items.forEach(item => item.remove());
        }
    });
    
    // Re-add drag previews
    createDragPreview();
    
    showNotification('Room cleared', 'info');
}

// Change room
function changeRoom(roomId) {
    window.location.href = `habitus.php?room_id=${roomId}`;
}

// Create new room
function createNewRoom() {
    const modalTitle = document.getElementById('modal-title');
    const roomNameInput = document.getElementById('room-name-input');
    const roomModal = document.getElementById('room-modal');
    
    if (modalTitle) modalTitle.textContent = 'Create New Room';
    if (roomNameInput) roomNameInput.value = '';
    if (roomModal) roomModal.style.display = 'flex';
}

// Rename room
function renameRoom() {
    const modalTitle = document.getElementById('modal-title');
    const roomNameInput = document.getElementById('room-name-input');
    const roomModal = document.getElementById('room-modal');
    
    if (modalTitle) modalTitle.textContent = 'Rename Room';
    if (roomNameInput) roomNameInput.value = currentRoom.name;
    if (roomModal) roomModal.style.display = 'flex';
}

// Close room modal
function closeRoomModal() {
    const roomModal = document.getElementById('room-modal');
    if (roomModal) roomModal.style.display = 'none';
}

// Save room name
function saveRoomName() {
    const roomNameInput = document.getElementById('room-name-input');
    const name = roomNameInput ? roomNameInput.value.trim() : '';
    
    if (!name) {
        showNotification('Please enter a room name', 'error');
        return;
    }
    
    const modalTitle = document.getElementById('modal-title');
    const isNew = modalTitle && modalTitle.textContent.includes('Create');
    const url = isNew ? '../php/api/habitus/create_room.php' : '../php/api/habitus/rename_room.php';
    
    const data = isNew ? { name } : { room_id: currentRoom.id, name };
    
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (isNew) {
                window.location.href = `habitus.php?room_id=${data.room_id}`;
            } else {
                currentRoom.name = name;
                const roomSelect = document.querySelector('#room-select option:checked');
                if (roomSelect) roomSelect.textContent = name;
                closeRoomModal();
                showNotification('Room renamed successfully', 'success');
            }
        } else {
            showNotification(data.message || 'Error saving room name', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error saving room name', 'error');
    });
}

// Show notification
function showNotification(message, type = 'info') {
    // Check if notification container exists
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function debugWallPlacement() {
    console.log('=== Wall Placement Debug ===');
    
    // Check grid positions
    const leftWallGrid = document.getElementById('room-grid-wall-left');
    const rightWallGrid = document.getElementById('room-grid-wall-right');
    const leftWallItems = document.getElementById('placed-items-wall-left');
    const rightWallItems = document.getElementById('placed-items-wall-right');
    
    console.log('Left Wall Grid:', leftWallGrid?.getBoundingClientRect());
    console.log('Right Wall Grid:', rightWallGrid?.getBoundingClientRect());
    console.log('Left Wall Items:', leftWallItems?.getBoundingClientRect());
    console.log('Right Wall Items:', rightWallItems?.getBoundingClientRect());
    
    // Check placed items on walls
    const wallItems = placedItems.filter(item => item.surface !== 'floor');
    console.log('Wall Items:', wallItems);
    
    // Toggle debug mode
    document.getElementById('isometric-room').classList.toggle('debug-mode');
}

function testWallAlignment() {
    console.log('=== Testing Wall Grid Alignment ===');
    
    // Get all grids and item containers
    const elements = {
        'Left Wall Grid': document.getElementById('room-grid-wall-left'),
        'Left Wall Items': document.getElementById('placed-items-wall-left'),
        'Right Wall Grid': document.getElementById('room-grid-wall-right'),
        'Right Wall Items': document.getElementById('placed-items-wall-right')
    };
    
    // Check if positions match
    for (const [name, element] of Object.entries(elements)) {
        if (element) {
            const computed = window.getComputedStyle(element);
            console.log(`${name}:`, {
                top: computed.top,
                left: computed.left,
                transform: computed.transform,
                transformOrigin: computed.transformOrigin
            });
        }
    }
    
    // Visual test: Add colored borders to see alignment
    const leftGrid = document.getElementById('room-grid-wall-left');
    const leftItems = document.getElementById('placed-items-wall-left');
    const rightGrid = document.getElementById('room-grid-wall-right');
    const rightItems = document.getElementById('placed-items-wall-right');
    
    if (leftGrid) leftGrid.style.border = '2px solid red';
    if (leftItems) leftItems.style.border = '2px dashed blue';
    if (rightGrid) rightGrid.style.border = '2px solid green';
    if (rightItems) rightItems.style.border = '2px dashed orange';
    
    // Make grids visible
    document.getElementById('isometric-room').classList.add('dragging');
    
    console.log('Red solid = Left Wall Grid, Blue dashed = Left Wall Items');
    console.log('Green solid = Right Wall Grid, Orange dashed = Right Wall Items');
    console.log('Borders should overlap exactly if alignment is correct.');
}

// Add test item to specific wall position
function testPlaceWallItem(surface = 'wall-left', x = 0, y = 0) {
    // Create a test item
    const testItem = {
        id: 'test_' + Date.now(),
        inventory_id: 'test',
        item_id: 'test',
        grid_x: x,
        grid_y: y,
        surface: surface,
        rotation: 0,
        z_index: 100,
        image_path: 'images/items/decorations/wall_clock.webp',
        name: 'Test Wall Item'
    };
    
    // Add to placed items
    placedItems.push(testItem);
    
    // Create and add element
    const itemElement = createPlacedItem(testItem);
    const container = document.getElementById(`placed-items-${surface}`);
    if (container) {
        container.appendChild(itemElement);
        console.log(`Test item placed at ${surface} [${x}, ${y}]`);
    }
}

// Make functions globally available
window.initializeHabitusRoom = initializeHabitusRoom;
window.switchSurface = switchSurface;
window.filterInventory = filterInventory;
window.saveRoom = saveRoom;
window.clearRoom = clearRoom;
window.changeRoom = changeRoom;
window.createNewRoom = createNewRoom;
window.renameRoom = renameRoom;
window.closeRoomModal = closeRoomModal;
window.saveRoomName = saveRoomName;
window.rotateItem = rotateItem;
window.moveToFront = moveToFront;
window.moveToBack = moveToBack;
window.removeItem = removeItem;
window.startDrag = startDrag;
window.debugWallPlacement = debugWallPlacement;
window.testWallAlignment = testWallAlignment;
window.testPlaceWallItem = testPlaceWallItem;
window.normalizeImagePath = normalizeImagePath;
window.generateRotationVariants = generateRotationVariants;
window.preloadRotationImages = preloadRotationImages;
window.debugImagePaths = debugImagePaths;
window.habitusDebug = {
    getCurrentRoom: () => currentRoom,
    getPlacedItems: () => placedItems,
    getItemRotationData: () => itemRotationData,
    isDashboardMode: () => isDashboardMode,
    debugMode: () => debugMode,
    reinitialize: (roomData, items, rotationData) => {
        /* debugLog('🔄 Manual re-initialization requested'); */
        return initializeHabitusRoom(roomData, items, rotationData);
    },
    testItem: (itemData) => {
        /* debugLog('🧪 Testing item creation:', itemData); */
        return createPlacedItem(itemData);
    }
};

/* debugLog('🚀 Habitus Room system loaded and ready'); */