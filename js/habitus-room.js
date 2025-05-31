// habitus-room.js - Fixed isometric room system with proper drag and drop

// Room state
let currentRoom = null;
let selectedItem = null;
let isDragging = false;
let placedItems = [];
let gridVisible = false; // FIXED: Start with grids hidden
let currentDragData = null;
let itemRotationData = {};
let isDashboardMode = false;
let debugMode = false;

// FIXED: Hold-to-drag variables (cleaned up)
let holdTimer = null;
let holdStartTime = 0;
let isHolding = false;
let heldItem = null;
let floatingMenu = null;
let holdIndicator = null;
let flyingItems = new Set();
let lastMousePosition = { x: 0, y: 0 };
let dragStartPosition = { x: 0, y: 0 };
let isActualDrag = false;
let clickStartTime = 0;
let hasMovedDuringHold = false;

// Grid configuration - 6x6
const GRID_SIZE = 6;
const CELL_SIZE = 60;
const ROOM_WIDTH = 360;
const ROOM_HEIGHT = 360;
const WALL_HEIGHT = 4;
const HOLD_DURATION = 600;
const ROTATION_ANGLES = {
    0: 0,    // back-right (default)
    90: 1,   // back-left
    180: 2,  // front-left
    270: 3   // front-right
};

// Item size definitions
const ITEM_SIZES = {
    'wooden_chair': { width: 1, height: 1, surfaces: ['floor'] },
    'simple_table': { width: 2, height: 2, surfaces: ['floor'] },
    'bookshelf': { width: 1, height: 2, surfaces: ['floor', 'wall-left', 'wall-right'] },
    'cozy_sofa': { width: 3, height: 2, surfaces: ['floor'] },
    'potted_plant': { width: 1, height: 1, surfaces: ['floor'] },
    'floor_lamp': { width: 1, height: 1, surfaces: ['floor'] },
    'picture_frame': { width: 1, height: 1, surfaces: ['wall-left', 'wall-right'] },
    'cactus': { width: 1, height: 1, surfaces: ['floor'] },
    'wall_clock': { width: 1, height: 1, surfaces: ['wall-left', 'wall-right'] }
};

// Initialize the Habitus room
function initializeHabitusRoom(roomData, items, rotationData = {}) {
    if (!roomData) {
        console.error('initializeHabitusRoom: roomData is required');
        return;
    }
    
    const roomElement = document.getElementById('isometric-room');
    isDashboardMode = roomElement && roomElement.closest('.dashboard-room') !== null;
    
    console.log('🏠 Initializing Habitus Room:', {
        roomData: roomData.name,
        itemCount: (items || []).length,
        isDashboardMode,
        rotationDataKeys: Object.keys(rotationData || {})
    });
    
    currentRoom = roomData;
    placedItems = items || [];
    itemRotationData = rotationData || {};
    
    // Validate placed items data
    placedItems = placedItems.filter(item => {
        const isValid = item && 
                       typeof item.grid_x !== 'undefined' && 
                       typeof item.grid_y !== 'undefined' &&
                       item.image_path;
        return isValid;
    });
    
    // Ensure room structure exists
    ensureRoomStructure();
    
    // Only create interactive elements if not in dashboard mode
    if (!isDashboardMode) {
        createAllGrids();
        createDragPreview();
        createHoldIndicator();
        createFloatingMenu();
        setupEventListeners();
        console.log('🎮 Interactive controls enabled');
    }
    
    // Load placed items
    loadPlacedItems();
    applyRoomCustomizations(roomData);
    
    console.log('✅ Room initialization complete');
    return true;
}

// FIXED: Ensure room structure exists
function ensureRoomStructure() {
    const room = document.getElementById('isometric-room');
    if (!room) {
        console.error('❌ Room container not found');
        return false;
    }
    
    if (!room.querySelector('.room-base')) {
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
    }
    
    return true;
}

// Apply room customizations
function applyRoomCustomizations(roomData) {
    try {
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
    } catch (error) {
        console.error('❌ Error applying room customizations:', error);
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

// FIXED: Create all grids (floor and walls)
function createAllGrids() {
    createGrid('floor', GRID_SIZE, GRID_SIZE);
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
            
            cell.style.left = (x * CELL_SIZE) + 'px';
            cell.style.top = (y * CELL_SIZE) + 'px';
            cell.style.width = CELL_SIZE + 'px';
            cell.style.height = CELL_SIZE + 'px';
            
            if (isDoorArea(x, y, surface)) {
                cell.classList.add('non-placeable');
            }
            
            cell.addEventListener('dragover', handleDragOver);
            cell.addEventListener('drop', handleDrop);
            
            gridContainer.appendChild(cell);
        }
    }
}

// Check if coordinates are in door area
function isDoorArea(x, y, surface) {
    if (surface === 'wall-left') {
        return x === 1 && y >= 2;
    }
    if (surface === 'floor') {
        return x === 1 && y === 0;
    }
    return false;
}

// FIXED: Create drag preview element
function createDragPreview() {
    if (isDashboardMode) return;
    
    ['floor', 'wall-left', 'wall-right'].forEach(surface => {
        const container = document.getElementById(`placed-items-${surface}`);
        if (container) {
            let preview = container.querySelector('.drag-preview');
            if (!preview) {
                preview = document.createElement('div');
                preview.className = 'drag-preview';
                preview.style.cssText = `
                    position: absolute;
                    pointer-events: none;
                    opacity: 0.7;
                    z-index: 9999;
                    border: 2px dashed #6a8d7f;
                    background-color: rgba(106, 141, 127, 0.1);
                    border-radius: 4px;
                    display: none;
                `;
                container.appendChild(preview);
            }
        }
    });
}

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
    floatingMenu.addEventListener('click', handleMenuAction);
}

// FIXED: Set up event listeners
function setupEventListeners() {
    if (isDashboardMode) return;
    
    // FIXED: Clean event listener setup
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('contextmenu', preventContextMenu);
    
    // Hide floating menu when clicking elsewhere
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.floating-action-menu') && 
            !e.target.closest('.placed-item.being-held') &&
            !e.target.closest('.placed-item.selected')) {
            hideFloatingMenu();
        }
    });
    
    // Global drag end handler - FIXED: Ensure cleanup
    document.addEventListener('dragend', function(e) {
        clearDragState(); // FIXED: Always clear drag state
    });
    
    // Escape key to hide menu
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideFloatingMenu();
            cancelHold();
        }
    });
}

// Prevent right-click context menu
function preventContextMenu(e) {
    if (e.target.closest('.placed-item')) {
        e.preventDefault();
        return false;
    }
}

// FIXED: Enhanced mouse down handler
function handleMouseDown(e) {
    if (e.button !== 0) return; // Only left mouse button
    
    const placedItem = e.target.closest('.placed-item');
    if (!placedItem || isDashboardMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    dragStartPosition = { x: e.clientX, y: e.clientY };
    clickStartTime = Date.now();
    hasMovedDuringHold = false;
    isActualDrag = false;
    
    startHold(placedItem, e);
}

// Start hold timer
function startHold(item, e) {
    if (isHolding) return;
    
    isHolding = true;
    heldItem = item;
    holdStartTime = Date.now();
    lastMousePosition = { x: e.clientX, y: e.clientY };
    
    showHoldIndicator(e.clientX, e.clientY);
    
    let progressAngle = 0;
    
    holdTimer = setInterval(() => {
        const elapsed = Date.now() - holdStartTime;
        progressAngle = (elapsed / HOLD_DURATION) * 360;
        
        updateHoldProgress(progressAngle);
        
        if (elapsed >= HOLD_DURATION) {
            completeHold();
        }
    }, 16);
}

function updateHoldProgress(angle) {
    if (!holdIndicator) return;
    
    const progress = holdIndicator.querySelector('.hold-progress');
    if (progress) {
        progress.style.background = `conic-gradient(#6a8d7f 0deg, #6a8d7f ${angle}deg, transparent ${angle}deg)`;
    }
}

// Complete hold and start drag
function completeHold() {
    if (!heldItem) return;
    
    clearInterval(holdTimer);
    hideHoldIndicator();
    
    heldItem.classList.add('being-held');
    showGridsForDragging(); // FIXED: Show grids when drag starts
    
    isDragging = true;
    isActualDrag = true;
    
    showActionFeedback(heldItem, 'Item picked up - drag to move');
}

// FIXED: Show grids for dragging
function showGridsForDragging() {
    const room = document.getElementById('isometric-room');
    if (room) {
        room.classList.add('dragging');
    }
}

// FIXED: Hide grids for dragging
function hideGridsForDragging() {
    const room = document.getElementById('isometric-room');
    if (room) {
        room.classList.remove('dragging');
    }
    
    // Clear all grid highlights
    document.querySelectorAll('.grid-cell').forEach(cell => {
        cell.classList.remove('drag-over', 'drag-invalid');
    });
    
    // Hide all drag previews
    document.querySelectorAll('.drag-preview').forEach(preview => {
        preview.style.display = 'none';
    });
}

// Show hold indicator
function showHoldIndicator(x, y) {
    if (!holdIndicator) return;
    
    holdIndicator.style.left = (x - 30) + 'px';
    holdIndicator.style.top = (y - 30) + 'px';
    holdIndicator.style.display = 'block';
}

// Hide hold indicator
function hideHoldIndicator() {
    if (holdIndicator) {
        holdIndicator.style.display = 'none';
    }
}

// FIXED: Mouse move handler
function handleMouseMove(e) {
    const currentPos = { x: e.clientX, y: e.clientY };
    
    if (isHolding && !heldItem.classList.contains('being-held')) {
        // Update hold indicator position
        if (holdIndicator && holdIndicator.style.display === 'block') {
            holdIndicator.style.left = (currentPos.x - 30) + 'px';
            holdIndicator.style.top = (currentPos.y - 30) + 'px';
        }
        
        // Check if mouse moved too far
        const distance = Math.sqrt(
            Math.pow(currentPos.x - dragStartPosition.x, 2) + 
            Math.pow(currentPos.y - dragStartPosition.y, 2)
        );
        
        if (distance > 15) {
            hasMovedDuringHold = true;
        }
        
        if (distance > 25) {
            cancelHold();
        }
    } else if (heldItem && heldItem.classList.contains('being-held')) {
        isActualDrag = true;
        checkDropZone(e);
    }
    
    lastMousePosition = currentPos;
}

// FIXED: Check drop zone with proper highlighting
function checkDropZone(e) {
    // Clear previous highlights
    document.querySelectorAll('.grid-cell').forEach(cell => {
        cell.classList.remove('drag-over', 'drag-invalid');
    });
    
    const elementUnder = document.elementFromPoint(e.clientX, e.clientY);
    const gridCell = elementUnder ? elementUnder.closest('.grid-cell') : null;
    
    if (gridCell && heldItem) {
        const dropResult = findDropZone(e);
        const itemConfig = getItemConfig(heldItem.querySelector('img').src);
        
        // Highlight all affected cells
        for (let dy = 0; dy < itemConfig.height; dy++) {
            for (let dx = 0; dx < itemConfig.width; dx++) {
                const targetCell = document.querySelector(
                    `[data-surface="${dropResult.surface}"][data-x="${dropResult.gridX + dx}"][data-y="${dropResult.gridY + dy}"]`
                );
                if (targetCell) {
                    targetCell.classList.add(dropResult.valid ? 'drag-over' : 'drag-invalid');
                }
            }
        }
        
        updateDragPreview(dropResult);
    }
}

// FIXED: Update drag preview
function updateDragPreview(dropResult) {
    if (!dropResult || !heldItem) return;
    
    // Hide all previews first
    document.querySelectorAll('.drag-preview').forEach(preview => {
        preview.style.display = 'none';
    });
    
    // Show preview on the correct surface
    const preview = document.querySelector(`#placed-items-${dropResult.surface} .drag-preview`);
    if (preview) {
        const itemConfig = getItemConfig(heldItem.querySelector('img').src);
        
        preview.style.display = 'block';
        preview.style.left = (dropResult.gridX * CELL_SIZE) + 'px';
        preview.style.top = (dropResult.gridY * CELL_SIZE) + 'px';
        preview.style.width = (itemConfig.width * CELL_SIZE) + 'px';
        preview.style.height = (itemConfig.height * CELL_SIZE) + 'px';
        preview.style.opacity = dropResult.valid ? '0.7' : '0.3';
        preview.style.borderColor = dropResult.valid ? '#6a8d7f' : '#a15c5c';
        
        const img = heldItem.querySelector('img');
        if (img) {
            preview.innerHTML = `<img src="${img.src}" alt="${img.alt}">`;
        }
    }
}

// FIXED: Mouse up handler
function handleMouseUp(e) {
    if (isHolding && heldItem) {
        const holdDuration = Date.now() - clickStartTime;
        
        if (heldItem.classList.contains('being-held')) {
            completeDragDrop(e); // FIXED: Complete drag and drop
        } else {
            if (!hasMovedDuringHold && holdDuration < HOLD_DURATION) {
                handleItemClick(heldItem, e);
            }
            cancelHold();
        }
    }
}

// Handle item click (non-drag)
function handleItemClick(itemElement, e) {
    if (!itemElement) return;
    
    deselectItem();
    itemElement.classList.add('selected');
    selectedItem = itemElement;
    heldItem = itemElement;
    
    showFloatingMenuAtPosition(e.clientX, e.clientY);
    showActionFeedback(itemElement, 'Item selected');
}

// Show floating menu at specific position
function showFloatingMenuAtPosition(x, y) {
    if (!floatingMenu || !heldItem) return;
    
    floatingMenu.classList.add('show');
    
    const menuWidth = 140;
    const menuHeight = 160;
    
    let left = x + 10;
    let top = y;
    
    if (left + menuWidth > window.innerWidth) {
        left = x - menuWidth - 10;
    }
    
    if (top + menuHeight > window.innerHeight) {
        top = window.innerHeight - menuHeight - 10;
    }
    
    floatingMenu.style.left = left + 'px';
    floatingMenu.style.top = top + 'px';
}

// FIXED: Cancel hold with proper cleanup
function cancelHold() {
    clearInterval(holdTimer);
    hideHoldIndicator();
    hideFloatingMenu();
    
    if (heldItem) {
        heldItem.classList.remove('being-held');
        if (isActualDrag) {
            heldItem = null;
        }
    }
    
    hideGridsForDragging(); // FIXED: Always hide grids when canceling
    
    isHolding = false;
    isDragging = false;
    isActualDrag = false;
    hasMovedDuringHold = false;
}

// FIXED: Complete drag and drop with proper cleanup
function completeDragDrop(e) {
    if (!heldItem) return;
    
    const dropResult = findDropZone(e);
    
    if (dropResult.valid) {
        updateItemPosition(heldItem, dropResult);
        removeFromFlying(heldItem);
        showActionFeedback(heldItem, 'Item moved successfully');
        
        setTimeout(() => {
            if (heldItem) {
                showFloatingMenuAfterDrop();
            }
        }, 100);
        
    } else {
        const elementUnder = document.elementFromPoint(e.clientX, e.clientY);
        if (elementUnder && elementUnder.closest('.grid-cell')) {
            addToFlying(heldItem);
            showActionFeedback(heldItem, 'Invalid position - item is floating');
        } else {
            showActionFeedback(heldItem, 'Item returned to original position');
        }
    }
    
    finalizeDragDrop(); // FIXED: Always finalize and cleanup
}

// Show floating menu after drop
function showFloatingMenuAfterDrop() {
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
    
    if (left + menuWidth > window.innerWidth) {
        left = itemRect.left - menuWidth - 10;
    }
    
    if (top + menuHeight > window.innerHeight) {
        top = window.innerHeight - menuHeight - 10;
    }
    
    floatingMenu.style.left = left + 'px';
    floatingMenu.style.top = top + 'px';
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
    
    if (!itemConfig.surfaces.includes(surface)) {
        return { valid: false, gridX, gridY, surface, reason: 'Surface not compatible' };
    }
    
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
        
        item.grid_x = dropResult.gridX;
        item.grid_y = dropResult.gridY;
        item.surface = dropResult.surface;
        
        itemElement.style.left = (dropResult.gridX * CELL_SIZE) + 'px';
        itemElement.style.top = (dropResult.gridY * CELL_SIZE) + 'px';
        itemElement.dataset.gridX = dropResult.gridX;
        itemElement.dataset.gridY = dropResult.gridY;
        itemElement.dataset.surface = dropResult.surface;
        
        if (oldSurface !== dropResult.surface) {
            const newContainer = document.getElementById(`placed-items-${dropResult.surface}`);
            if (newContainer) {
                newContainer.appendChild(itemElement);
            }
        }
    }
}

// FIXED: Finalize drag and drop with complete cleanup
function finalizeDragDrop() {
    if (heldItem) {
        heldItem.classList.remove('being-held');
        heldItem.classList.add('selected');
        selectedItem = heldItem;
    }
    
    hideGridsForDragging(); // FIXED: Always hide grids
    
    isDragging = false;
    isHolding = false;
    isActualDrag = false;
}

// Hide floating menu
function hideFloatingMenu() {
    if (floatingMenu) {
        floatingMenu.classList.remove('show');
    }
    
    if (heldItem && !isDragging) {
        heldItem.classList.remove('selected');
        heldItem = null;
        selectedItem = null;
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
            return;
    }
    
    setTimeout(() => {
        hideFloatingMenu();
    }, 1000);
}

// Rotate held item
function rotateHeldItem() {
    if (!heldItem) return;
    
    const currentRotation = parseInt(heldItem.dataset.rotation) || 0;
    const newRotation = (currentRotation + 90) % 360;
    
    heldItem.dataset.rotation = newRotation;
    
    const itemId = heldItem.dataset.id;
    const item = placedItems.find(i => i.id == itemId);
    if (item) {
        item.rotation = newRotation;
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
        
        removeFromFlying(heldItem);
        placedItems = placedItems.filter(i => i.id != itemId);
        heldItem.remove();
        
        hideFloatingMenu();
        heldItem = null;
        selectedItem = null;
        
        showActionFeedback(document.body, 'Item removed');
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
        
        const saveBtn = document.querySelector('.save-room-btn');
        if (saveBtn) {
            saveBtn.classList.add('has-flying');
        }
    } else {
        if (warning) {
            warning.classList.remove('show');
        }
        
        const saveBtn = document.querySelector('.save-room-btn');
        if (saveBtn) {
            saveBtn.classList.remove('has-flying');
        }
    }
}

// Get item configuration
function getItemConfig(itemName) {
    if (!itemName) return { width: 1, height: 1, surfaces: ['floor'] };
    
    const baseName = itemName.toLowerCase().replace(/\.(jpg|png|webp|gif)$/i, '').split('/').pop();
    const cleanName = baseName.replace(/-(back|front)-(left|right)$/, '');
    
    if (ITEM_SIZES[cleanName]) {
        return ITEM_SIZES[cleanName];
    }
    
    return { width: 1, height: 1, surfaces: ['floor'] };
}

// Check if area is available for item placement
function isAreaAvailable(x, y, width, height, surface, excludeItemId = null) {
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
    
    if (x < 0 || y < 0 || x + width > maxX || y + height > maxY) {
        return false;
    }
    
    for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
            if (isDoorArea(x + dx, y + dy, surface)) {
                return false;
            }
        }
    }
    
    for (const item of placedItems) {
        if (item.surface !== surface) continue;
        if (excludeItemId && item.id === excludeItemId) continue;
        
        const itemConfig = getItemConfig(item.image_path || item.name);
        
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
function loadPlacedItems() {
    console.log('📦 Loading placed items');
    
    ['floor', 'wall-left', 'wall-right'].forEach(surface => {
        const container = document.getElementById(`placed-items-${surface}`);
        if (container) {
            const existingItems = container.querySelectorAll('.placed-item');
            existingItems.forEach(item => item.remove());
        }
    });
    
    let loadedCount = 0;    
    let errorCount = 0;
    
    placedItems.forEach((item, index) => {
        try {
            if (!item || typeof item.grid_x === 'undefined' || typeof item.grid_y === 'undefined') {
                console.warn(`⚠️ Skipping invalid item at index ${index}:`, item);
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
                } else {
                    console.error(`❌ Container not found for surface: ${surface}`);
                    errorCount++;
                }
            } else {
                console.error(`❌ Failed to create element for item:`, item);
                errorCount++;
            }
        } catch (error) {
            console.error(`❌ Error loading item at index ${index}:`, error, item);
            errorCount++;
        }
    });
    
    console.log(`📊 Loading summary: ${loadedCount} loaded, ${errorCount} errors`);
    return loadedCount;
}

// Create a placed item element
function createPlacedItem(item) {
    try {
        if (!item || !item.id || typeof item.grid_x === 'undefined' || typeof item.grid_y === 'undefined') {
            console.error('❌ Invalid item data for createPlacedItem:', item);
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
        
        itemDiv.style.left = (item.grid_x * CELL_SIZE) + 'px';
        itemDiv.style.top = (item.grid_y * CELL_SIZE) + 'px';
        itemDiv.style.width = (itemConfig.width * CELL_SIZE) + 'px';
        itemDiv.style.height = (itemConfig.height * CELL_SIZE) + 'px';
        itemDiv.style.zIndex = item.z_index || 1;
        
        const img = document.createElement('img');
        
        let rotationVariants = item.rotation_variants || itemRotationData[item.item_id];
        
        if (!rotationVariants && item.image_path) {
            rotationVariants = generateRotationVariants(item.image_path);
        }
        
        const imagePath = getRotatedImagePath(
            normalizeImagePath(item.image_path), 
            item.rotation || 0, 
            rotationVariants
        );
        
        img.src = '../' + imagePath;
        img.alt = item.name || 'Item';
        img.draggable = false;
        
        img.onerror = function() {
            console.warn(`⚠️ Failed to load image: ${imagePath}, falling back to base image`);
            const fallbackPath = '../' + normalizeImagePath(item.image_path);
            if (this.src !== fallbackPath) {
                this.src = fallbackPath;
            }
        };
        
        itemDiv.appendChild(img);
        
        if (rotationVariants) {
            itemDiv.dataset.rotationVariants = JSON.stringify(rotationVariants);
        }
        
        // Only add interactive event listeners if not in dashboard mode
        if (!isDashboardMode) {
            itemDiv.addEventListener('click', selectItem);
            itemDiv.draggable = true;
            itemDiv.addEventListener('dragstart', handleItemDragStart);
        }
        
        return itemDiv;
        
    } catch (error) {
        console.error('❌ Error in createPlacedItem:', error, item);
        return null;
    }
}

// REMOVED UNUSED FUNCTIONS AND CONSOLIDATED DRAG HANDLERS

// Traditional drag and drop for inventory items
function startDrag(e) {
    const item = e.target.closest('.inventory-item');
    if (!item) return;
    
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('itemId', item.dataset.id);
    e.dataTransfer.setData('itemDataId', item.dataset.itemId);
    e.dataTransfer.setData('image', item.dataset.image);
    e.dataTransfer.setData('name', item.dataset.name);
    
    const rotationVariants = item.dataset.rotationVariants ? 
        JSON.parse(item.dataset.rotationVariants) : null;
    
    currentDragData = {
        itemId: item.dataset.id,
        itemDataId: item.dataset.itemId,
        image: item.dataset.image,
        name: item.dataset.name,
        rotationVariants: rotationVariants,
        isReposition: false
    };
    
    isDragging = true;
    showGridsForDragging();
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
    
    currentDragData = {
        itemId: placedItem.inventory_id,
        itemDataId: placedItem.item_id,
        image: placedItem.image_path,
        name: placedItem.name,
        surface: placedItem.surface || 'floor',
        isReposition: true,
        originalId: itemId
    };
    
    item.classList.add('dragging');
    isDragging = true;
    showGridsForDragging();
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
    
    if (!currentDragData.isReposition && !itemConfig.surfaces.includes(surface)) {
        e.dataTransfer.dropEffect = 'none';
        return false;
    }
    
    document.querySelectorAll('.grid-cell').forEach(c => {
        c.classList.remove('drag-over', 'drag-invalid');
    });
    
    const excludeId = currentDragData.isReposition ? currentDragData.originalId : null;
    const isValid = isAreaAvailable(gridX, gridY, itemConfig.width, itemConfig.height, surface, excludeId);
    
    for (let dy = 0; dy < itemConfig.height; dy++) {
        for (let dx = 0; dx < itemConfig.width; dx++) {
            const targetCell = document.querySelector(`[data-surface="${surface}"][data-x="${gridX + dx}"][data-y="${gridY + dy}"]`);
            if (targetCell) {
                targetCell.classList.add(isValid ? 'drag-over' : 'drag-invalid');
            }
        }
    }
    
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

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    e.preventDefault();
    
    const cell = e.target.closest('.grid-cell');
    if (!cell) {
        clearDragState(); // FIXED: Clear state even on invalid drop
        return;
    }
    
    const gridX = parseInt(cell.dataset.x);
    const gridY = parseInt(cell.dataset.y);
    const surface = cell.dataset.surface;
    
    const isReposition = e.dataTransfer.getData('isReposition') === 'true';
    const itemConfig = getItemConfig(currentDragData.image || currentDragData.name);
    
    if (!isReposition && !itemConfig.surfaces.includes(surface)) {
        showNotification('This item cannot be placed on this surface!', 'warning');
        clearDragState(); // FIXED: Clear state
        return;
    }
    
    const excludeId = isReposition ? currentDragData.originalId : null;
    if (!isAreaAvailable(gridX, gridY, itemConfig.width, itemConfig.height, surface, excludeId)) {
        showNotification('Cannot place item here!', 'warning');
        clearDragState(); // FIXED: Clear state
        return;
    }
    
    if (isReposition) {
        const itemToMove = placedItems.find(i => i.id == currentDragData.originalId);
        if (itemToMove) {
            const oldSurface = itemToMove.surface || 'floor';
            itemToMove.grid_x = gridX;
            itemToMove.grid_y = gridY;
            itemToMove.surface = surface;
            
            const itemElement = document.querySelector(`[data-id="${currentDragData.originalId}"]`);
            if (itemElement) {
                itemElement.style.left = (gridX * CELL_SIZE) + 'px';
                itemElement.style.top = (gridY * CELL_SIZE) + 'px';
                itemElement.dataset.gridX = gridX;
                itemElement.dataset.gridY = gridY;
                itemElement.dataset.surface = surface;
                
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
        
        placedItems.push(newItem);
        
        const itemElement = createPlacedItem(newItem);
        const container = document.getElementById(`placed-items-${surface}`);
        if (container) {
            container.appendChild(itemElement);
        }
        
        showNotification('Item placed! Remember to save your layout.', 'info');
    }
    
    clearDragState(); // FIXED: Always clear drag state
}

// FIXED: Clear drag state with complete cleanup
function clearDragState() {
    isDragging = false;
    currentDragData = null;
    
    hideGridsForDragging(); // FIXED: Always hide grids
    
    // Reset placed item dragging state
    document.querySelectorAll('.placed-item.dragging').forEach(item => {
        item.classList.remove('dragging');
    });
}

// Select an item
function selectItem(e) {
    e.stopPropagation();
    
    deselectItem();
    
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
}

// Image handling functions
function normalizeImagePath(imagePath) {
    if (!imagePath) return '';
    
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
        `${directory}/${nameWithoutExt}-back-right${ext}`,
        `${directory}/${nameWithoutExt}-back-left${ext}`,
        `${directory}/${nameWithoutExt}-front-left${ext}`,
        `${directory}/${nameWithoutExt}-front-right${ext}`
    ];
}

function updateItemRotationImage(itemElement, item, newRotation) {
    let rotationVariants = null;
    try {
        rotationVariants = JSON.parse(itemElement.dataset.rotationVariants || '[]');
    } catch (e) {
        if (item && item.image_path) {
            rotationVariants = generateRotationVariants(item.image_path);
            itemElement.dataset.rotationVariants = JSON.stringify(rotationVariants);
        }
    }
    
    const img = itemElement.querySelector('img');
    if (img && rotationVariants && rotationVariants.length > 0) {
        if (item) {
            const newImagePath = getRotatedImagePath(
                normalizeImagePath(item.image_path), 
                newRotation, 
                rotationVariants
            );
            
            const oldSrc = img.src;
            img.src = '../' + newImagePath;
            
            img.onerror = function() {
                console.warn(`Failed to load rotated image: ${newImagePath}, keeping current image`);
                this.src = oldSrc;
                this.onerror = null;
            };
        }
    }
}

// FIXED: Toggle grid visibility
function toggleGrid() {
    gridVisible = !gridVisible;
    const room = document.getElementById('isometric-room');
    
    if (gridVisible) {
        room.classList.add('grid-visible');
    } else {
        room.classList.remove('grid-visible');
    }
    
    showNotification(gridVisible ? 'Grid visible' : 'Grid hidden', 'info');
}

// Filter inventory items
function filterInventory(category) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    const items = document.querySelectorAll('.inventory-item');
    items.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// FIXED: Save room layout with proper flying item handling
function saveRoom() {
    const saveBtn = event.target;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    const flyingItemsCount = flyingItems.size;
    if (flyingItemsCount > 0) {
        if (!confirm(`${flyingItemsCount} item(s) are in invalid positions and will be removed. Continue?`)) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Layout';
            return;
        }
        
        clearFlyingItems();
    }
    
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
            if (data.item_ids) {
                placedItems.forEach(item => {
                    if (item.id.toString().startsWith('temp_')) {
                        const newId = data.item_ids[item.id];
                        if (newId) {
                            const oldId = item.id;
                            item.id = newId;
                            
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
    feedback.style.cssText = `
        position: fixed;
        background: #6a8d7f;
        color: white;
        padding: 4px 12px;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 600;
        opacity: 0;
        transform: translateY(10px);
        animation: actionSuccess 1.5s ease-out forwards;
        pointer-events: none;
        z-index: 10000;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes actionSuccess {
            0% { opacity: 0; transform: translateY(10px); }
            20% { opacity: 1; transform: translateY(0); }
            80% { opacity: 1; transform: translateY(-10px); }
            100% { opacity: 0; transform: translateY(-20px); }
        }
    `;
    document.head.appendChild(style);
    
    if (targetElement === document.body) {
        feedback.style.top = '50%';
        feedback.style.left = '50%';
        feedback.style.transform = 'translate(-50%, -50%)';
    } else {
        const rect = targetElement.getBoundingClientRect();
        feedback.style.left = (rect.left + rect.width / 2) + 'px';
        feedback.style.top = (rect.top - 10) + 'px';
        feedback.style.transform = 'translateX(-50%)';
    }
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.remove();
        style.remove();
    }, 1500);
}

// Clear room
function clearRoom() {
    if (!confirm('Are you sure you want to remove all items from this room?')) {
        return;
    }
    
    placedItems = [];
    flyingItems.clear();
    updateFlyingWarning();
    
    ['floor', 'wall-left', 'wall-right'].forEach(surface => {
        const container = document.getElementById(`placed-items-${surface}`);
        if (container) {
            const items = container.querySelectorAll('.placed-item');
            items.forEach(item => item.remove());
        }
    });
    
    createDragPreview();
    showNotification('Room cleared', 'info');
}

// Navigation functions
function changeRoom(roomId) {
    window.location.href = `habitus.php?room_id=${roomId}`;
}

function createNewRoom() {
    const modalTitle = document.getElementById('modal-title');
    const roomNameInput = document.getElementById('room-name-input');
    const roomModal = document.getElementById('room-modal');
    
    if (modalTitle) modalTitle.textContent = 'Create New Room';
    if (roomNameInput) roomNameInput.value = '';
    if (roomModal) roomModal.style.display = 'flex';
}

function renameRoom() {
    const modalTitle = document.getElementById('modal-title');
    const roomNameInput = document.getElementById('room-name-input');
    const roomModal = document.getElementById('room-modal');
    
    if (modalTitle) modalTitle.textContent = 'Rename Room';
    if (roomNameInput) roomNameInput.value = currentRoom.name;
    if (roomModal) roomModal.style.display = 'flex';
}

function closeRoomModal() {
    const roomModal = document.getElementById('room-modal');
    if (roomModal) roomModal.style.display = 'none';
}

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
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Make functions globally available
window.initializeHabitusRoom = initializeHabitusRoom;
window.toggleGrid = toggleGrid;
window.filterInventory = filterInventory;
window.saveRoom = saveRoom;
window.clearRoom = clearRoom;
window.changeRoom = changeRoom;
window.createNewRoom = createNewRoom;
window.renameRoom = renameRoom;
window.closeRoomModal = closeRoomModal;
window.saveRoomName = saveRoomName;
window.startDrag = startDrag;

// Legacy function compatibility (for any old references)
window.rotateItem = () => console.log('Use new hold-to-drag system');
window.moveToFront = () => console.log('Use new hold-to-drag system');
window.moveToBack = () => console.log('Use new hold-to-drag system');
window.removeItem = () => console.log('Use new hold-to-drag system');

console.log('🚀 Fixed Habitus Room system loaded and ready');