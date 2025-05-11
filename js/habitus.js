// habitus.js

let canvas;
let selectedItem;
let roomId;
let modifiedItems = {};

/**
 * Initialize the room editor
 * @param {number} id - Room ID
 * @param {Array} placedItems - Items already placed in the room
 */
function initRoomEditor(id, placedItems) {
    roomId = id;
    
    // Create fabric.js canvas
    canvas = new fabric.Canvas('room-canvas', {
        width: 800,
        height: 600,
        backgroundColor: '#f5f5f5'
    });
    
    // Make canvas responsive
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Add placed items to canvas
    if (placedItems && placedItems.length > 0) {
        placedItems.forEach(item => {
            addItemToCanvas(item);
        });
    }
    
    // Set up canvas event listeners
    canvas.on('selection:created', onItemSelected);
    canvas.on('selection:updated', onItemSelected);
    canvas.on('selection:cleared', onItemDeselected);
    canvas.on('object:moving', onItemModified);
    canvas.on('object:scaling', onItemModified);
    canvas.on('object:rotating', onItemModified);
    
    // Set up item control buttons
    setupItemControls();
}

/**
 * Make canvas responsive
 */
function resizeCanvas() {
    const container = document.querySelector('.room-canvas-container');
    const ratio = canvas.width / canvas.height;
    
    let newWidth = container.clientWidth;
    let newHeight = newWidth / ratio;
    
    if (newHeight > container.clientHeight) {
        newHeight = container.clientHeight;
        newWidth = newHeight * ratio;
    }
    
    canvas.setDimensions({
        width: newWidth,
        height: newHeight
    });
    
    canvas.setZoom(newWidth / 800);
}

/**
 * Add an item to the canvas
 * @param {Object} item - Item data
 */
function addItemToCanvas(item) {
    fabric.Image.fromURL('../' + item.image_path, (img) => {
        // Set item properties
        img.set({
            left: item.position_x,
            top: item.position_y,
            angle: item.rotation || 0,
            scaleX: item.scale || 1,
            scaleY: item.scale || 1,
            originX: 'center',
            originY: 'center',
            inventoryId: item.inventory_id,
            id: item.id || null,
            zIndex: item.z_index || 0
        });
        
        // Add to canvas
        canvas.add(img);
        
        // Set z-index order
        if (item.z_index) {
            canvas.moveTo(img, item.z_index);
        }
        
        canvas.renderAll();
    });
}

/**
 * Handle item selection
 * @param {Object} e - Selection event
 */
function onItemSelected(e) {
    selectedItem = e.selected[0];
    
    // Show item controls
    const controls = document.querySelector('.room-item-controls');
    controls.style.display = 'flex';
    
    // Position controls near selected item
    positionItemControls();
}

/**
 * Handle item deselection
 */
function onItemDeselected() {
    selectedItem = null;
    
    // Hide item controls
    const controls = document.querySelector('.room-item-controls');
    controls.style.display = 'none';
}

/**
 * Handle item modification (moving, scaling, rotating)
 * @param {Object} e - Modification event
 */
function onItemModified(e) {
    const item = e.target;
    
    // Keep track of modified items
    if (item.id) {
        modifiedItems[item.id] = item;
    } else if (item.inventoryId) {
        modifiedItems[item.inventoryId] = item;
    }
}

/**
 * Position item controls near the selected item
 */
function positionItemControls() {
    if (!selectedItem) return;
    
    const controls = document.querySelector('.room-item-controls');
    const canvasEl = document.querySelector('.canvas-container');
    const canvasRect = canvasEl.getBoundingClientRect();
    
    // Get item position relative to canvas
    const zoom = canvas.getZoom();
    const itemLeft = (selectedItem.left * zoom) + canvasRect.left + canvasEl.scrollLeft;
    const itemTop = (selectedItem.top * zoom) + canvasRect.top + canvasEl.scrollTop;
    
    // Position controls above the item
    controls.style.left = itemLeft + 'px';
    controls.style.top = (itemTop - controls.offsetHeight - 10) + 'px';
}

/**
 * Set up item control buttons
 */
function setupItemControls() {
    // Rotate left
    document.querySelector('.rotate-left-btn').addEventListener('click', () => {
        if (!selectedItem) return;
        selectedItem.rotate(selectedItem.angle - 15);
        canvas.renderAll();
        onItemModified({ target: selectedItem });
    });
    
    // Rotate right
    document.querySelector('.rotate-right-btn').addEventListener('click', () => {
        if (!selectedItem) return;
        selectedItem.rotate(selectedItem.angle + 15);
        canvas.renderAll();
        onItemModified({ target: selectedItem });
    });
    
    // Bring forward
    document.querySelector('.bring-forward-btn').addEventListener('click', () => {
        if (!selectedItem) return;
        canvas.bringForward(selectedItem);
        onItemModified({ target: selectedItem });
    });
    
    // Send backward
    document.querySelector('.send-backward-btn').addEventListener('click', () => {
        if (!selectedItem) return;
        canvas.sendBackwards(selectedItem);
        onItemModified({ target: selectedItem });
    });
    
    // Remove item
    document.querySelector('.remove-item-btn').addEventListener('click', () => {
        if (!selectedItem) return;
        
        if (confirm('Remove this item from the room?')) {
            // If item was already placed and has an ID, mark it for removal
            if (selectedItem.id) {
                removeItemFromRoom(selectedItem.id);
            }
            
            // Remove from canvas
            canvas.remove(selectedItem);
            selectedItem = null;
            
            // Hide controls
            document.querySelector('.room-item-controls').style.display = 'none';
        }
    });
}

/**
 * Initialize inventory drag and drop functionality
 */
function initInventoryDragDrop() {
    const inventoryItems = document.querySelectorAll('.inventory-item');
    const canvasContainer = document.querySelector('.room-canvas-container');
    
    inventoryItems.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', item.dataset.id);
        });
    });
    
    canvasContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    
    canvasContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        
        const inventoryId = e.dataTransfer.getData('text/plain');
        if (!inventoryId) return;
        
        // Get drop position relative to canvas
        const canvasRect = canvasContainer.getBoundingClientRect();
        const zoom = canvas.getZoom();
        const x = (e.clientX - canvasRect.left) / zoom;
        const y = (e.clientY - canvasRect.top) / zoom;
        
        // Get item data
        getInventoryItemData(inventoryId)
            .then(itemData => {
                if (itemData) {
                    // Add to canvas
                    const placedItem = {
                        inventory_id: itemData.id,
                        image_path: itemData.image_path,
                        position_x: x,
                        position_y: y,
                        rotation: 0,
                        scale: 1,
                        z_index: canvas.getObjects().length
                    };
                    
                    addItemToCanvas(placedItem);
                    
                    // Add to modified items to save later
                    modifiedItems[itemData.id] = placedItem;
                }
            })
            .catch(error => {
                console.error('Error getting item data:', error);
            });
    });
}

/**
 * Get inventory item data by ID
 * @param {number} inventoryId - Inventory item ID
 * @returns {Promise} - Promise resolving to item data
 */
function getInventoryItemData(inventoryId) {
    return new Promise((resolve, reject) => {
        fetch(`../php/api/habitus/get_inventory_item.php?id=${inventoryId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    resolve(data.item);
                } else {
                    reject(new Error(data.message));
                }
            })
            .catch(error => {
                reject(error);
            });
    });
}

/**
 * Remove an item from the room
 * @param {number} itemId - Placed item ID
 */
function removeItemFromRoom(itemId) {
    fetch('../php/api/habitus/remove.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `id=${itemId}`
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('Error removing item:', data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

/**
 * Save the room layout
 */
function saveRoomLayout() {
    // Get all objects from canvas
    const items = [];
    canvas.getObjects().forEach((obj, index) => {
        if (obj.inventoryId) {
            items.push({
                id: obj.id || null,
                inventory_id: obj.inventoryId,
                position_x: Math.round(obj.left),
                position_y: Math.round(obj.top),
                rotation: Math.round(obj.angle),
                scale: parseFloat(obj.scaleX.toFixed(2)),
                z_index: index
            });
        }
    });
    
    // Save to server
    fetch('../php/api/habitus/place.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            room_id: roomId,
            items: items
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Room layout saved successfully');
            
            // Update item IDs for newly placed items
            if (data.item_ids) {
                updateItemIds(data.item_ids);
            }
            
            // Reset modified items
            modifiedItems = {};
        } else {
            showNotification('Error saving layout: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('An error occurred while saving', 'error');
    });
}

/**
 * Update item IDs for newly placed items
 * @param {Object} itemIds - Map of inventory IDs to placed item IDs
 */
function updateItemIds(itemIds) {
    canvas.getObjects().forEach(obj => {
        if (obj.inventoryId && !obj.id && itemIds[obj.inventoryId]) {
            obj.id = itemIds[obj.inventoryId];
        }
    });
}

/**
 * Show notification message
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error)
 */
function showNotification(message, type = 'success') {
    // Check if notifications container exists
    let container = document.querySelector('.notifications-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notifications-container';
        document.body.appendChild(container);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to container
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