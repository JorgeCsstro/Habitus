// habitus-room.js - Enhanced isometric room system with 6x6 grid and wall placement

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
let currentSurface = 'floor'; // Current placement surface: 'floor', 'wall-left', 'wall-right'

// Grid configuration - Updated to 6x6
const GRID_SIZE = 6; // 6x6 grid
const CELL_SIZE = 60; // Size of each grid cell in pixels (larger for 6x6)
const ROOM_WIDTH = 360; // 6 * 60
const ROOM_HEIGHT = 360; // 6 * 60
const WALL_HEIGHT = 4; // Wall is 4 cells high

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
function initializeHabitusRoom(roomData, items) {
    currentRoom = roomData;
    placedItems = items || [];
    
    // Ensure room structure exists
    ensureRoomStructure();
    
    // Create grids for all surfaces
    createAllGrids();
    
    // Load placed items
    loadPlacedItems();
    
    // Set up event listeners
    setupEventListeners();
    
    // Create drag preview element
    createDragPreview();
    
    // Load room customizations (walls, floor)
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
}

// Ensure room structure exists
function ensureRoomStructure() {
    const room = document.getElementById('isometric-room');
    if (!room) return;
    
    // Check if structure already exists
    if (!room.querySelector('.room-base')) {
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
    
    // Extract base name from image path if needed
    const baseName = itemName.toLowerCase().replace(/\.(jpg|png|webp|gif)$/i, '').split('/').pop();
    
    // Check predefined sizes
    if (ITEM_SIZES[baseName]) {
        return ITEM_SIZES[baseName];
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
function loadPlacedItems() {
    // Clear items from all surfaces
    ['floor', 'wall-left', 'wall-right'].forEach(surface => {
        const container = document.getElementById(`placed-items-${surface}`);
        if (container) {
            const existingItems = container.querySelectorAll('.placed-item');
            existingItems.forEach(item => item.remove());
        }
    });
    
    // Place items on appropriate surfaces
    placedItems.forEach(item => {
        const itemElement = createPlacedItem(item);
        if (itemElement) {
            const surface = item.surface || 'floor'; // Default to floor if not specified
            const container = document.getElementById(`placed-items-${surface}`);
            if (container) {
                container.appendChild(itemElement);
            }
        }
    });
}

// Create a placed item element
function createPlacedItem(item) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'placed-item';
    itemDiv.dataset.id = item.id;
    itemDiv.dataset.gridX = item.grid_x;
    itemDiv.dataset.gridY = item.grid_y;
    itemDiv.dataset.surface = item.surface || 'floor';
    
    const itemConfig = getItemConfig(item.image_path || item.name);
    
    // Position and size on grid
    itemDiv.style.left = (item.grid_x * CELL_SIZE) + 'px';
    itemDiv.style.top = (item.grid_y * CELL_SIZE) + 'px';
    itemDiv.style.width = (itemConfig.width * CELL_SIZE) + 'px';
    itemDiv.style.height = (itemConfig.height * CELL_SIZE) + 'px';
    itemDiv.style.transform = `rotate(${item.rotation || 0}deg)`;
    itemDiv.style.zIndex = item.z_index || 1;
    
    // Create image
    const img = document.createElement('img');
    img.src = '../' + item.image_path;
    img.alt = item.name;
    img.draggable = false;
    itemDiv.appendChild(img);
    
    // Add event listeners
    itemDiv.addEventListener('click', selectItem);
    itemDiv.addEventListener('contextmenu', showContextMenu);
    
    // Make placed items draggable for repositioning
    itemDiv.draggable = true;
    itemDiv.addEventListener('dragstart', handleItemDragStart);
    itemDiv.addEventListener('dragend', handleItemDragEnd);
    
    return itemDiv;
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
    
    // Store drag data
    currentDragData = {
        itemId: item.dataset.id,
        itemDataId: item.dataset.itemId,
        image: item.dataset.image,
        name: item.dataset.name,
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
        // Create new placed item
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
            name: currentDragData.name
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
    isDragging = false;
    currentDragData = null;
    document.querySelectorAll('.drag-preview').forEach(preview => {
        preview.style.display = 'none';
    });
    document.querySelectorAll('.grid-cell').forEach(c => {
        c.classList.remove('drag-over', 'drag-invalid');
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

// Rotate selected item
function rotateItem() {
    if (!contextMenuItem) return;
    
    const currentRotation = parseInt(contextMenuItem.style.transform.replace(/[^0-9-]/g, '')) || 0;
    const newRotation = (currentRotation + 90) % 360;
    contextMenuItem.style.transform = `rotate(${newRotation}deg)`;
    
    // Update in data
    const itemId = contextMenuItem.dataset.id;
    const item = placedItems.find(i => i.id == itemId);
    if (item) {
        item.rotation = newRotation;
    }
    
    hideContextMenu();
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
function saveRoom() {
    const saveBtn = event.target;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    // Prepare data
    const roomData = {
        room_id: currentRoom.id,
        items: placedItems.map(item => ({
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
            showNotification('Room layout saved successfully!', 'success');
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

// Make functions globally available
window.initializeHabitusRoom = initializeHabitusRoom;
window.toggleGrid = toggleGrid;
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