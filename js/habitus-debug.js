// habitus-debug.js - Debug helper for grid visualization

// Add this script to habitus.php to help visualize the grid system

// Debug mode toggle
let debugMode = false;

// Toggle debug mode
function toggleDebugMode() {
    debugMode = !debugMode;
    const room = document.getElementById('isometric-room');
    
    if (debugMode) {
        room.classList.add('debug-mode');
        
        // Add grid coordinates to cells
        document.querySelectorAll('.grid-cell').forEach(cell => {
            if (!cell.querySelector('.debug-coords')) {
                const coords = document.createElement('div');
                coords.className = 'debug-coords';
                coords.textContent = `${cell.dataset.x},${cell.dataset.y}`;
                coords.style.cssText = `
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    font-size: 8px;
                    color: rgba(0,0,0,0.5);
                    pointer-events: none;
                `;
                cell.appendChild(coords);
            }
        });
        
        showNotification('Debug mode enabled - Grid coordinates visible', 'info');
    } else {
        room.classList.remove('debug-mode');
        
        // Remove debug coordinates
        document.querySelectorAll('.debug-coords').forEach(el => el.remove());
        
        showNotification('Debug mode disabled', 'info');
    }
}

// Add debug button to controls
function addDebugButton() {
    const controls = document.querySelector('.room-controls');
    if (controls && !document.getElementById('debug-toggle')) {
        const debugBtn = document.createElement('button');
        debugBtn.id = 'debug-toggle';
        debugBtn.innerHTML = '<img src="../images/icons/bug.svg" alt="Debug"> Debug';
        debugBtn.onclick = toggleDebugMode;
        controls.appendChild(debugBtn);
    }
}

// Test grid placement
function testGridPlacement() {
    // Clear existing items
    placedItems = [];
    loadPlacedItems();
    
    // Add test items at specific coordinates
    const testItems = [
        { x: 0, y: 0, name: 'Corner Test', color: '#FF0000' },
        { x: 10, y: 10, name: 'Center Test', color: '#00FF00' },
        { x: 19, y: 19, name: 'Far Corner', color: '#0000FF' },
        { x: 5, y: 5, name: 'Multi Cell', color: '#FFFF00', width: 2, height: 2 }
    ];
    
    testItems.forEach((test, index) => {
        const newItem = {
            id: 'test_' + index,
            inventory_id: 'test',
            item_id: 'test',
            grid_x: test.x,
            grid_y: test.y,
            rotation: 0,
            z_index: index + 1,
            image_path: 'images/items/furniture/wooden_chair.webp',
            name: test.name
        };
        
        placedItems.push(newItem);
        
        // Create visual element
        const itemDiv = document.createElement('div');
        itemDiv.className = 'placed-item';
        itemDiv.dataset.id = newItem.id;
        itemDiv.dataset.gridX = test.x;
        itemDiv.dataset.gridY = test.y;
        
        const width = test.width || 1;
        const height = test.height || 1;
        
        itemDiv.style.left = (test.x * CELL_SIZE) + 'px';
        itemDiv.style.top = (test.y * CELL_SIZE) + 'px';
        itemDiv.style.width = (width * CELL_SIZE) + 'px';
        itemDiv.style.height = (height * CELL_SIZE) + 'px';
        itemDiv.style.backgroundColor = test.color;
        itemDiv.style.opacity = '0.7';
        itemDiv.style.display = 'flex';
        itemDiv.style.alignItems = 'center';
        itemDiv.style.justifyContent = 'center';
        itemDiv.style.fontSize = '10px';
        itemDiv.style.color = 'white';
        itemDiv.style.fontWeight = 'bold';
        itemDiv.textContent = test.name;
        
        document.getElementById('placed-items').appendChild(itemDiv);
    });
    
    showNotification('Test items placed on grid', 'info');
}

// Log grid information
function logGridInfo() {
    console.group('Habitus Grid Information');
    console.log('Grid Size:', GRID_SIZE + 'x' + GRID_SIZE);
    console.log('Cell Size:', CELL_SIZE + 'px');
    console.log('Room Dimensions:', ROOM_WIDTH + 'x' + ROOM_HEIGHT + 'px');
    console.log('Placed Items:', placedItems.length);
    console.log('Current Room ID:', currentRoom ? currentRoom.id : 'None');
    
    console.group('Placed Items Details');
    placedItems.forEach(item => {
        console.log(`Item ${item.id}: Grid(${item.grid_x},${item.grid_y}) Z:${item.z_index}`);
    });
    console.groupEnd();
    
    console.groupEnd();
}

// Initialize debug features when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Add debug button after a short delay to ensure controls are loaded
    setTimeout(addDebugButton, 500);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + D for debug mode
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            toggleDebugMode();
        }
        
        // Ctrl/Cmd + T for test placement
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            testGridPlacement();
        }
        
        // Ctrl/Cmd + I for grid info
        if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
            e.preventDefault();
            logGridInfo();
        }
    });
    
    console.log('Habitus Debug Helper loaded. Shortcuts:');
    console.log('- Ctrl+D: Toggle debug mode');
    console.log('- Ctrl+T: Test grid placement');
    console.log('- Ctrl+I: Log grid information');
});

// Make debug functions globally available
window.toggleDebugMode = toggleDebugMode;
window.testGridPlacement = testGridPlacement;
window.logGridInfo = logGridInfo;