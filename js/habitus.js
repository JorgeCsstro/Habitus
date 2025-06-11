// habitus-room.js - Enhanced isometric room system with multi-grid items

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

// Grid configuration
const GRID_SIZE = 20; // 20x20 grid
const CELL_SIZE = 20; // Size of each grid cell in pixels
const ROOM_WIDTH = 400;
const ROOM_HEIGHT = 400;

// Item size definitions (you can expand this or load from database)
const ITEM_SIZES = {
    // Furniture
    'wooden_chair': { width: 1, height: 1 },
    'simple_table': { width: 2, height: 2 },
    'bookshelf': { width: 1, height: 2 },
    'cozy_sofa': { width: 3, height: 2 },
    // Decorations
    'potted_plant': { width: 1, height: 1 },
    'floor_lamp': { width: 1, height: 1 },
    'picture_frame': { width: 1, height: 1 },
    'cactus': { width: 1, height: 1 },
    'wall_clock': { width: 1, height: 1 }
};

// Initialize the Habitus room
function initializeHabitusRoom(roomData, items) {
    currentRoom = roomData;
    placedItems = items || [];
    
    // Create grid
    createGrid();
    
    // Load placed items
    loadPlacedItems();
    
    // Set up event listeners
    setupEventListeners();
    
    // Create drag preview element
    createDragPreview();
    
    // Load room customizations (walls, floor)
    if (roomData.floor_color) {
        document.getElementById('room-floor').style.backgroundColor = roomData.floor_color;
    }
    if (roomData.wall_color) {
        const leftWall = document.getElementById('wall-left');
        const rightWall = document.getElementById('wall-right');
        if (leftWall) {
            leftWall.style.background = `linear-gradient(to bottom, ${roomData.wall_color}, ${adjustColor(roomData.wall_color, -20)})`;
        }
        if (rightWall) {
            rightWall.style.background = `linear-gradient(to left, ${adjustColor(roomData.wall_color, -10)}, ${adjustColor(roomData.wall_color, -30)})`;
        }
    }
}

// Create drag preview element
function createDragPreview() {
    dragPreview = document.createElement('div');
    dragPreview.className = 'drag-preview';
    dragPreview.style.display = 'none';
    dragPreview.style.position = 'absolute';
    dragPreview.style.pointerEvents = 'none';
    dragPreview.style.opacity = '0.7';
    dragPreview.style.zIndex = '1000';
    document.getElementById('placed-items').appendChild(dragPreview);
}

// Get item size from name
function getItemSize(itemName) {
    // Extract base name from image path if needed
    const baseName = itemName.toLowerCase().replace(/\.(jpg|png|webp|gif)$/i, '').split('/').pop();
    
    // Check predefined sizes
    if (ITEM_SIZES[baseName]) {
        return ITEM_SIZES[baseName];
    }
    
    // Default size
    return { width: 1, height: 1 };
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

// Create the grid overlay
function createGrid() {
    const gridContainer = document.getElementById('room-grid');
    gridContainer.innerHTML = '';
    
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.x = x;
            cell.dataset.y = y;
            
            // Position cells in grid
            cell.style.left = (x * CELL_SIZE) + 'px';
            cell.style.top = (y * CELL_SIZE) + 'px';
            
            // Mark door area as non-placeable (left wall, low position)
            if (isDoorArea(x, y)) {
                cell.classList.add('non-placeable');
            }
            
            // Add drop listeners
            cell.addEventListener('dragover', handleDragOver);
            cell.addEventListener('dragleave', handleDragLeave);
            cell.addEventListener('drop', handleDrop);
            
            gridContainer.appendChild(cell);
        }
    }
}

// Check if coordinates are in door area
function isDoorArea(x, y) {
    // Door is on the left wall, around grid position 2-5, 10-15
    return x >= 2 && x <= 5 && y >= 10 && y <= 15;
}

// Check if area is available for item placement
function isAreaAvailable(x, y, width, height, excludeItemId = null) {
    // Check bounds
    if (x < 0 || y < 0 || x + width > GRID_SIZE || y + height > GRID_SIZE) {
        return false;
    }
    
    // Check door area
    for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
            if (isDoorArea(x + dx, y + dy)) {
                return false;
            }
        }
    }
    
    // Check collision with other items
    for (const item of placedItems) {
        if (excludeItemId && item.id === excludeItemId) continue;
        
        const itemSize = getItemSize(item.image_path || item.name);
        
        // Check if rectangles overlap
        if (!(x + width <= item.grid_x || 
              x >= item.grid_x + itemSize.width ||
              y + height <= item.grid_y || 
              y >= item.grid_y + itemSize.height)) {
            return false;
        }
    }
    
    return true;
}

// Load placed items into the room
function loadPlacedItems() {
    const itemsContainer = document.getElementById('placed-items');
    // Clear only placed items, not the drag preview
    const existingItems = itemsContainer.querySelectorAll('.placed-item');
    existingItems.forEach(item => item.remove());
    
    placedItems.forEach(item => {
        const itemElement = createPlacedItem(item);
        itemsContainer.appendChild(itemElement);
    });
}

// Create a placed item element
function createPlacedItem(item) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'placed-item';
    itemDiv.dataset.id = item.id;
    itemDiv.dataset.gridX = item.grid_x;
    itemDiv.dataset.gridY = item.grid_y;
    
    const itemSize = getItemSize(item.image_path || item.name);
    
    // Position and size on grid
    itemDiv.style.left = (item.grid_x * CELL_SIZE) + 'px';
    itemDiv.style.top = (item.grid_y * CELL_SIZE) + 'px';
    itemDiv.style.width = (itemSize.width * CELL_SIZE) + 'px';
    itemDiv.style.height = (itemSize.height * CELL_SIZE) + 'px';
    itemDiv.style.transform = `rotate(${item.rotation || 0}deg)`;
    itemDiv.style.zIndex = item.z_index || 1;
    
    // Create image
    const img = document.createElement('img');
    img.src = '../' + item.image_path;
    img.alt = item.name;
    itemDiv.appendChild(img);
    
    // Add click listener for selection
    itemDiv.addEventListener('click', selectItem);
    itemDiv.addEventListener('contextmenu', showContextMenu);
    
    // Make placed items draggable for repositioning
    itemDiv.draggable = true;
    itemDiv.addEventListener('dragstart', handleItemDragStart);
    
    return itemDiv;
}

// Handle dragging of already placed items
function handleItemDragStart(e) {
    const item = e.target.closest('.placed-item');
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
        isReposition: true,
        originalId: itemId
    };
    
    // Make item semi-transparent
    item.style.opacity = '0.5';
    
    isDragging = true;
}

// Set up event listeners
function setupEventListeners() {
    // Close context menu on click outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.item-context-menu')) {
            hideContextMenu();
        }
    });
    
    // Deselect item on room click
    document.getElementById('isometric-room').addEventListener('click', function(e) {
        if (e.target.classList.contains('grid-cell') || 
            e.target.id === 'room-floor' ||
            e.target.id === 'wall-left' ||
            e.target.id === 'wall-right') {
            deselectItem();
        }
    });
    
    // Global drag end handler
    document.addEventListener('dragend', function(e) {
        if (dragPreview) {
            dragPreview.style.display = 'none';
        }
        
        // Reset opacity for repositioned items
        const items = document.querySelectorAll('.placed-item');
        items.forEach(item => {
            item.style.opacity = '1';
        });
        
        // Clear all drag-over states
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
    const itemSize = getItemSize(currentDragData.image || currentDragData.name);
    
    // Clear previous hover states
    document.querySelectorAll('.grid-cell').forEach(c => {
        c.classList.remove('drag-over', 'drag-invalid');
    });
    
    // Check if placement is valid
    const excludeId = currentDragData.isReposition ? currentDragData.originalId : null;
    const isValid = isAreaAvailable(gridX, gridY, itemSize.width, itemSize.height, excludeId);
    
    // Highlight affected cells
    for (let dy = 0; dy < itemSize.height; dy++) {
        for (let dx = 0; dx < itemSize.width; dx++) {
            const targetCell = document.querySelector(`[data-x="${gridX + dx}"][data-y="${gridY + dy}"]`);
            if (targetCell) {
                targetCell.classList.add(isValid ? 'drag-over' : 'drag-invalid');
            }
        }
    }
    
    // Update drag preview position
    if (dragPreview) {
        dragPreview.style.display = 'block';
        dragPreview.style.left = (gridX * CELL_SIZE) + 'px';
        dragPreview.style.top = (gridY * CELL_SIZE) + 'px';
        dragPreview.style.width = (itemSize.width * CELL_SIZE) + 'px';
        dragPreview.style.height = (itemSize.height * CELL_SIZE) + 'px';
        dragPreview.innerHTML = `<img src="../${currentDragData.image}" alt="${currentDragData.name}" style="width: 100%; height: 100%; object-fit: contain;">`;
        dragPreview.style.opacity = isValid ? '0.7' : '0.3';
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
    
    // Get grid coordinates
    const gridX = parseInt(cell.dataset.x);
    const gridY = parseInt(cell.dataset.y);
    
    // Get item data
    const isReposition = e.dataTransfer.getData('isReposition') === 'true';
    const itemSize = getItemSize(currentDragData.image || currentDragData.name);
    
    // Check if area is available
    const excludeId = isReposition ? currentDragData.originalId : null;
    if (!isAreaAvailable(gridX, gridY, itemSize.width, itemSize.height, excludeId)) {
        showNotification('Cannot place item here!', 'warning');
        return;
    }
    
    if (isReposition) {
        // Update existing item position
        const itemToMove = placedItems.find(i => i.id == currentDragData.originalId);
        if (itemToMove) {
            itemToMove.grid_x = gridX;
            itemToMove.grid_y = gridY;
            
            // Update visual position
            const itemElement = document.querySelector(`[data-id="${currentDragData.originalId}"]`);
            if (itemElement) {
                itemElement.style.left = (gridX * CELL_SIZE) + 'px';
                itemElement.style.top = (gridY * CELL_SIZE) + 'px';
                itemElement.dataset.gridX = gridX;
                itemElement.dataset.gridY = gridY;
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
            rotation: 0,
            z_index: placedItems.length + 1,
            image_path: currentDragData.image,
            name: currentDragData.name
        };
        
        // Add to placed items
        placedItems.push(newItem);
        
        // Create and add element
        const itemElement = createPlacedItem(newItem);
        document.getElementById('placed-items').appendChild(itemElement);
        
        showNotification('Item placed! Remember to save your layout.', 'info');
    }
    
    // Clear drag state
    isDragging = false;
    currentDragData = null;
    dragPreview.style.display = 'none';
    document.querySelectorAll('.grid-cell').forEach(c => {
        c.classList.remove('drag-over', 'drag-invalid');
    });
}

// Select an item
function selectItem(e) {
    e.stopPropagation();
    
    // Deselect previous item
    deselectItem();
    
    // Select new item
    const item = e.target.closest('.placed-item');
    item.classList.add('selected');
    selectedItem = item;
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
    selectItem(e);
    contextMenuItem = item;
    
    const menu = document.getElementById('item-context-menu');
    menu.style.display = 'block';
    menu.style.left = e.pageX + 'px';
    menu.style.top = e.pageY + 'px';
}

// Hide context menu
function hideContextMenu() {
    const menu = document.getElementById('item-context-menu');
    menu.style.display = 'none';
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
    
    // Get highest z-index
    const maxZ = Math.max(...placedItems.map(i => i.z_index || 0));
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
    
    contextMenuItem.style.zIndex = 1;
    
    // Update z-indices for all items
    placedItems.forEach(item => {
        if (item.id != contextMenuItem.dataset.id && item.z_index > 0) {
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
    document.querySelectorAll('.placed-item').forEach(el => {
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

// Toggle grid visibility
function toggleGrid() {
    gridVisible = !gridVisible;
    document.getElementById('room-grid').style.display = gridVisible ? 'block' : 'none';
}

// Rotate view (placeholder - would need 3D transformation)
function rotateView() {
    showNotification('View rotation coming soon!', 'info');
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
            rotation: item.rotation,
            z_index: item.z_index
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
    document.getElementById('placed-items').innerHTML = '';
    
    // Re-add drag preview
    createDragPreview();
    
    showNotification('Room cleared', 'info');
}

// Close room modal
function closeRoomModal() {
    document.getElementById('room-modal').style.display = 'none';
}

// Save room name
function saveRoomName() {
    const name = document.getElementById('room-name-input').value.trim();
    if (!name) {
        showNotification('Please enter a room name', 'error');
        return;
    }
    
    const isNew = document.getElementById('modal-title').textContent.includes('Create');
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
                document.querySelector('#room-select option:checked').textContent = name;
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