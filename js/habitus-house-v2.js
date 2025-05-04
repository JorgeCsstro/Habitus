function initHabitusRoom(containerId) {
    // Only initialize if the container exists
    if (document.getElementById(containerId)) {
        const container = document.getElementById(containerId);
        
        // Create a canvas element
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);
        
        // Set canvas ID
        canvas.id = containerId + '-canvas';
        
        // Make canvas responsive
        function resizeCanvas() {
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            const aspectRatio = 500 / 400; // Original aspect ratio
            
            // Set size based on container dimensions while maintaining aspect ratio
            if (containerWidth / containerHeight > aspectRatio) {
                canvas.height = containerHeight;
                canvas.width = containerHeight * aspectRatio;
            } else {
                canvas.width = containerWidth;
                canvas.height = containerWidth / aspectRatio;
            }
            
            // Draw the room
            createIsometricRoom(canvas.id);
        }
        
        // Add resize listener
        window.addEventListener('resize', resizeCanvas);
        
        // Initial resize
        resizeCanvas();
        
        // Return cleanup function
        return function cleanup() {
            window.removeEventListener('resize', resizeCanvas);
        };
    }
    return null;
}

function createIsometricRoom(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Calculate scaling factor
  const scaleX = canvas.width / 500;
  const scaleY = canvas.height / 400;
  
  // Helper function to scale coordinates
  function scale(x, y) {
    return [x * scaleX, y * scaleY];
  }
  
  // Draw floor
  ctx.beginPath();
  let [x, y] = scale(100, 200);
  ctx.moveTo(x, y);
  [x, y] = scale(300, 300);
  ctx.lineTo(x, y);
  [x, y] = scale(500, 200);
  ctx.lineTo(x, y);
  [x, y] = scale(300, 100);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fillStyle = '#e6e6e6';
  ctx.strokeStyle = '#cccccc';
  ctx.fill();
  ctx.stroke();
  
  // Draw left wall
  ctx.beginPath();
  [x, y] = scale(100, 200);
  ctx.moveTo(x, y);
  [x, y] = scale(100, 50);
  ctx.lineTo(x, y);
  [x, y] = scale(300, -50);
  ctx.lineTo(x, y);
  [x, y] = scale(300, 100);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fillStyle = '#7fba6d';
  ctx.strokeStyle = '#5a9c4c';
  ctx.fill();
  ctx.stroke();
  
  // Draw right wall
  ctx.beginPath();
  [x, y] = scale(300, 100);
  ctx.moveTo(x, y);
  [x, y] = scale(300, -50);
  ctx.lineTo(x, y);
  [x, y] = scale(500, 50);
  ctx.lineTo(x, y);
  [x, y] = scale(500, 200);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fillStyle = '#5a9c4c';
  ctx.strokeStyle = '#4a8c3c';
  ctx.fill();
  ctx.stroke();
  
  // Draw door frame
  ctx.beginPath();
  [x, y] = scale(150, 170);
  ctx.moveTo(x, y);
  [x, y] = scale(150, 70);
  ctx.lineTo(x, y);
  [x, y] = scale(210, 40);
  ctx.lineTo(x, y);
  [x, y] = scale(210, 140);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fillStyle = '#8b5a2b';
  ctx.strokeStyle = '#6b4a1b';
  ctx.fill();
  ctx.stroke();
  
  // Draw door
  ctx.beginPath();
  [x, y] = scale(155, 165);
  ctx.moveTo(x, y);
  [x, y] = scale(155, 75);
  ctx.lineTo(x, y);
  [x, y] = scale(205, 50);
  ctx.lineTo(x, y);
  [x, y] = scale(205, 140);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fillStyle = '#ba8c4c';
  ctx.strokeStyle = '#8b5a2b';
  ctx.fill();
  ctx.stroke();
  
  // Draw door handle
  ctx.beginPath();
  [x, y] = scale(190, 110);
  ctx.arc(x, y, 5 * Math.min(scaleX, scaleY), 0, Math.PI * 2);
  ctx.fillStyle = '#4a4a4a';
  ctx.fill();
  
  // Draw door window
  ctx.beginPath();
  [x, y] = scale(170, 90);
  ctx.moveTo(x, y);
  [x, y] = scale(170, 65);
  ctx.lineTo(x, y);
  [x, y] = scale(190, 55);
  ctx.lineTo(x, y);
  [x, y] = scale(190, 80);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fillStyle = '#a0d8ef';
  ctx.strokeStyle = '#8b5a2b';
  ctx.fill();
  ctx.stroke();
  
  // Draw room edges
  ctx.beginPath();
  [x, y] = scale(100, 200);
  ctx.moveTo(x, y);
  [x, y] = scale(100, 50);
  ctx.lineTo(x, y);
  ctx.strokeStyle = '#4a8c3c';
  ctx.lineWidth = 2 * Math.min(scaleX, scaleY);
  ctx.stroke();
  
  ctx.beginPath();
  [x, y] = scale(300, 100);
  ctx.moveTo(x, y);
  [x, y] = scale(300, -50);
  ctx.lineTo(x, y);
  ctx.stroke();
  
  ctx.beginPath();
  [x, y] = scale(300, 100);
  ctx.moveTo(x, y);
  [x, y] = scale(500, 200);
  ctx.lineTo(x, y);
  ctx.stroke();
  
  ctx.beginPath();
  [x, y] = scale(300, 100);
  ctx.moveTo(x, y);
  [x, y] = scale(100, 200);
  ctx.lineTo(x, y);
  ctx.stroke();
}