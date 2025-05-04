<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    
    <!-- In your habitus.php room view section -->
    <div id="habitus-room-container" class="habitus-room-container"></div>

    <!-- At the end of habitus.php before closing body tag -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="../js/habitus-house.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            if (document.getElementById('habitus-room-container')) {
                initHabitusRoom('habitus-room-container');
            }
        });
</script>
</body>
</html>