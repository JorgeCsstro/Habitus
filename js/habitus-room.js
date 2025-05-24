// habitus-room.js - Isometric room system with grid-based placement

// Room state
let currentRoom = null;
let selectedItem = null;
let isDragging = false;
let placedItems = [];
let gridVisible = true;
let currentRotation = 0;
let contextMenuItem = null;

// Grid configuration
const GRID_SIZE = 20; // 20x20 grid
const CELL_SIZE = 25; // Size of each grid cell in pixels
const ROOM_WIDTH = 500;
const ROOM_HEIGHT = 500;

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
    
    // Load room customizations (walls, floor)
    if (roomData.floor_color) {
        document.getElementById('room-floor').style.backgroundColor = roomData.floor_color;
    }
    if (roomData.wall_color) {
        document.getElementById('wall-left').style.backgroundColor = roomData.wall_color;
        document.getElementById('wall-right').style.backgroundColor = roomData.wall_color;
    }
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
            
            // Calculate isometric position
            const isoPos = cartesianToIsometric(x * CELL_SIZE, y * CELL_SIZE);
            cell.style.left = isoPos.x + 'px';
            cell.style.top = isoPos.y + 'px';
            
            // Mark door area as non-placeable
            if (isDoorArea(x, y)) {
                cell.classList.add('non-placeable');
            }
            
            // Add drop listeners
            cell.addEventListener('dragover', handleDragOver);
            cell.addEventListener('drop', handleDrop);
            
            gridContainer.appendChild(cell);
        }
    }
}

// Convert cartesian coordinates to isometric
function cartesianToIsometric(x, y) {
    return {
        x: (x - y) + ROOM_WIDTH / 2,
        y: (x + y) / 2
    };
}

// Convert isometric coordinates to cartesian
function isometricToCartesian(x, y) {
    const adjustedX = x - ROOM_WIDTH / 2;
    return {
        x: (adjustedX + 2 * y) / 2,
        y: (2 * y - adjustedX) / 2
    };
}

// Check if coordinates are in door area
function isDoorArea(x, y) {
    // Door is on the left wall, around grid position 2-4, 0-3
    return x >= 2 && x <= 4 && y >= 0 && y <= 3;
}

// Load placed items into the room
function loadPlacedItems() {
    const itemsContainer = document.getElementById('placed-items');
    itemsContainer.innerHTML = '';
    
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
    
    // Calculate position
    const isoPos = cartesianToIsometric(item.grid_x * CELL_SIZE, item.grid_y * CELL_SIZE);
    itemDiv.style.left = isoPos.x + 'px';
    itemDiv.style.top = isoPos.y + 'px';
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
    
    return itemDiv;
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
        if (e.target.classList.contains('isometric-room') || 
            e.target.classList.contains('room-floor') ||
            e.target.classList.contains('room-wall-left') ||
            e.target.classList.contains('room-wall-right')) {
            deselectItem();
        }
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
    isDragging = true;
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    
    const cell = e.target.closest('.grid-cell');
    if (cell && !cell.classList.contains('non-placeable')) {
        e.dataTransfer.dropEffect = 'copy';
        cell.classList.add('drag-over');
    }
    
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    e.preventDefault();
    
    const cell = e.target.closest('.grid-cell');
    if (!cell || cell.classList.contains('non-placeable')) return;
    
    // Get grid coordinates
    const gridX = parseInt(cell.dataset.x);
    const gridY = parseInt(cell.dataset.y);
    
    // Get item data
    const itemId = e.dataTransfer.getData('itemId');
    const itemDataId = e.dataTransfer.getData('itemDataId');
    const image = e.dataTransfer.getData('image');
    const name = e.dataTransfer.getData('name');
    
    // Check if cell is occupied
    if (isCellOccupied(gridX, gridY)) {
        showNotification('This spot is already occupied!', 'warning');
        return;
    }
    
    // Create new placed item
    const newItem = {
        id: 'temp_' + Date.now(), // Temporary ID until saved
        inventory_id: itemId,
        item_id: itemDataId,
        grid_x: gridX,
        grid_y: gridY,
        rotation: 0,
        z_index: placedItems.length + 1,
        image_path: image,
        name: name
    };
    
    // Add to placed items
    placedItems.push(newItem);
    
    // Create and add element
    const itemElement = createPlacedItem(newItem);
    document.getElementById('placed-items').appendChild(itemElement);
    
    // Clear drag state
    isDragging = false;
    document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('drag-over'));
    
    showNotification('Item placed! Remember to save your layout.', 'info');
}

// Check if a grid cell is occupied
function isCellOccupied(x, y) {
    return placedItems.some(item => item.grid_x === x && item.grid_y === y);
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
                            item.id = newId;
                            // Update element
                            const element = document.querySelector(`[data-id="${item.id}"]`);
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
    showNotification('Room cleared', 'info');
}

// Change room
function changeRoom(roomId) {
    window.location.href = `habitus.php?room_id=${roomId}`;
}

// Create new room
function createNewRoom() {
    document.getElementById('modal-title').textContent = 'Create New Room';
    document.getElementById('room-name-input').value = '';
    document.getElementById('room-modal').style.display = 'flex';
}

// Rename room
function renameRoom() {
    document.getElementById('modal-title').textContent = 'Rename Room';
    document.getElementById('room-name-input').value = currentRoom.name;
    document.getElementById('room-modal').style.display = 'flex';
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