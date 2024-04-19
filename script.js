document.addEventListener("DOMContentLoaded", function () {
    // Add logic to show next 3 tiles you will hit.
    // Add logic to show next 3 tiles you will hit if you complete the board.
    // Complete the undo function
    // Make the plane face the direction of travel
    // Ensure that when moves are logged in the log they spread over multiple lines.
    // Look at styling for mobile - e.g. the plane not positioning correctly on iPhone
    // Can this be made into an app?

    let startPosition
    let previousTile
    let boardReset = false; // Flag to track if the board is reset
    let movesMade = 0; // Variable to keep track of the current position during replay
    let actualMoves = []; // Array to store actual moves made during replay
    const board = document.getElementById('board');
    const counterSpan = this.getElementById('move-count')
    const moveStatusSpan = this.getElementById('move-status')
    const resetButton = this.getElementById('reset-button')
    const undoButton = this.getElementById('undo-button')
    const setStartButton = this.getElementById('set-start-button')
    const startSpan = this.getElementById('starting-pos')
    const planeIcon = this.getElementById('plane-icon')
    const infoDiv = document.getElementById('log-content');


    // Function to create tiles on the board
    function createTile(tile) {
        const tileElement = document.createElement('div');
        tileElement.classList.add('tile');
        tileElement.style.backgroundColor = tile.color || 'white'; // Default to white if no color is provided
        tileElement.innerText = tile.name;

        // Adjust x and y coordinates for Monopoly board
        let adjustedX = tile.x;
        let adjustedY = tile.y; // Keep y-coordinate as is

        tileElement.style.gridColumn = adjustedX + 1; // Adding 1 to match grid indices
        tileElement.style.gridRow = adjustedY + 1; // Adding 1 to match grid indices
        tileElement.dataset.name = tile.name;
        tileElement.dataset.id = `${tile.x}${tile.y}`;
        tileElement.dataset.x = tile.x;
        tileElement.dataset.y = tile.y;

        // Add icon based on tile name
        switch (tile.name) {
            case "Go":
                tileElement.innerHTML += '<i class="fas fa-arrow-left"></i>';
                break;
            case "Go to Jail":
                tileElement.innerHTML += '<i class="fas fa-gavel"></i>';
                break;
            case "Community Chest":
                tileElement.innerHTML += '<i class="fas fa-box-open"></i>';
                break;
            case "Chance":
                tileElement.innerHTML += '<i class="fas fa-question-circle"></i>';
                break;
            case "Water Works":
                tileElement.innerHTML += '<i class="fas fa-faucet"></i>';
                break;
            case "Electric Company":
                tileElement.innerHTML += '<i class="fas fa-bolt"></i>';
                break;
            case "Free Parking":
                tileElement.innerHTML += '<i class="fas fa-car"></i>';
                break;
            case "Income Tax":
            case "Super Tax":
                tileElement.innerHTML += '<i class="fas fa-dollar-sign"></i>';
                break;
            case "Train Station":
                tileElement.innerHTML += '<i class="fas fa-train"></i>';
                break;
            case "Jail":
                tileElement.innerHTML += '<i class="fas fa-bars"></i>';
                break;
            default:
                if (tile.name.toLowerCase().includes('station')) {
                    tileElement.innerHTML += '<i class="fas fa-train"></i>';
                } else {
                    tileElement.innerHTML += '<i class="fas fa-home"></i>';
                }
                break;
        }

        // Assign default color if not specified
        const colorMap = {
            'brown': 'brown',
            'light-blue': 'lightblue',
            'pink': 'pink',
            'orange': 'orange',
            'red': 'red',
            'yellow': 'yellow',
            'green': 'green',
            'blue': 'blue',
            'none': 'white' // Default color for tiles with no specified color
        };
        const tileColor = colorMap[tile.color] || 'white';
        tileElement.style.backgroundColor = tileColor;

        // Set text color based on background color
        if (tileColor === 'white') {
            tileElement.style.color = 'black';
        }

        // Append tile to the board
        board.appendChild(tileElement);

        // Add click event listener to each tile
        tileElement.addEventListener('click', function () {
            if (startPosition !== undefined && tileElement.dataset.name === "Chance") {
                swal.fire({
                    title: "Chance Tile",
                    text: "You have landed on a Chance tile. Do you want to move to the next station?",
                    icon: "info",
                    showCancelButton: true,
                    confirmButtonText: "Move to Next Station",
                    cancelButtonText: "Stay Here"
                }).then((result) => {
                    if (result.isConfirmed) {
                        // User wants to move to the next station
                        nextStation = document.querySelector(`.tile[data-name="${nextStationTile(tileElement)}"]`)
                        previousTile = nextStation
                        document.querySelectorAll('.tile').forEach(tile => {
                            tile.classList.remove('active');
                        });
                        nextStation.classList.add('active');
                        movePlaneToTile(nextStation);
                        if (boardReset) highlightNextTile(nextStation, actualMoves[movesMade]);

                    } else {
                        movePlaneToTile(tileElement);
                        if (boardReset) highlightNextTile(tileElement, actualMoves[movesMade]);
                    }
                });

            } else {
            movePlaneToTile(tileElement);
            }
            if (!boardReset) {
                logMove(tileElement);
                document.querySelectorAll('.tile').forEach(tile => {
                    tile.classList.remove('active');
                });
                tileElement.classList.add('active');
            } else {
                // Calculate the next tile based on the number of moves
                movesMade++; // Increment the current position
                highlightNextTile(tileElement, actualMoves[movesMade]);
                counterSpan.dataset.remaining = counterSpan.dataset.remaining -1
                moveStatusSpan.innerText = 'Remaining Moves'
                counterSpan.innerText = counterSpan.dataset.remaining
                document.querySelectorAll('.tile').forEach(tile => {
                    tile.classList.remove('active');
                });
                tileElement.classList.add('active');
            }
        });
    }

    function movePlaneToTile(tileElement) {
        // Get the coordinates of the center of the clicked tile
        const rect = tileElement.getBoundingClientRect();
        const tileCenterX = rect.left + rect.width / 2; // X-coordinate of the center of the tile
        const tileCenterY = rect.top + rect.height / 2; // Y-coordinate of the center of the tile
        // Move the plane icon to the center of the clicked tile
        if (planeIcon) {
            // Show the plane icon
            planeIcon.style.display = 'block';
            // Adjust the position to center the plane icon
            const planeWidth = planeIcon.offsetWidth;
            const planeHeight = planeIcon.offsetHeight;
            planeIcon.style.left = `${tileCenterX - planeWidth / 2}px`; // Adjusted left position
            planeIcon.style.top = `${tileCenterY - planeHeight / 2}px`; // Adjusted top position
        }
    }


    function logMove(clickedTile) {
        // Extract relevant data from the clicked tile
        const name = clickedTile.getAttribute('data-name') || '';
        const color = clickedTile.style.backgroundColor || '';
        const x = parseInt(clickedTile.getAttribute('data-x')) || 0;
        const y = parseInt(clickedTile.getAttribute('data-y')) || 0;

        // Create an object with the extracted data
        const tileData = { name, color, x, y };

        if (previousTile === undefined) {
            const startInfo = `Starting Position \n ${name}`;
            startPosition = name;
            // const startDiv = document.createElement('div');
            // startDiv.innerText = startInfo;
            // startDiv.dataset.name = name;
            // startDiv.classList.add('log-entry'); // Add class for styling and event handling
            // infoDiv.appendChild(startDiv);
            resetButton.hidden = false;
            undoButton.hidden = false;
            startSpan.innerText = startInfo;
            previousTile = clickedTile
        } else {
            // Display the tile name and the number of moves from the previous tile
            if (previousTile !== undefined) {
                const moves = calculateMoves(previousTile, clickedTile);
                if (moves <= 12) {
                const moveInfo = `${name} (${moves} moves)`;
                actualMoves.push(moves)
                // Create a new div element for the move and append it to the info div
                // const moveDiv = document.createElement('div');
                // moveDiv.innerText = moveInfo;
                // moveDiv.dataset.name = name;
                // moveDiv.classList.add('log-entry'); // Add class for styling and event handling
                // infoDiv.appendChild(moveDiv);
                infoDiv.textContent = `Moves \n ${actualMoves}`
                previousTile = clickedTile
                console.log(moves)
                console.log(previousTile)
            } else {
                movePlaneToTile(previousTile);
                Swal.fire({
                    icon: 'warning',
                    title: 'Warning!',
                    text: 'You cannot move that many spaces.',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 5000 // Adjust the duration as needed
                });
            }
                // Add event listener to toggle strikethrough on click
                // moveDiv.addEventListener('click', function () {
                //     this.classList.toggle('strikethrough');
                // });
            }
        }
        

    }

    function calculateMoves(previousTile, currentTile) {
        // Get the index of the previous and current tiles in the tiles array
        const prevIndex = tiles.findIndex(tile => {
            return parseInt(tile.x, 10) === parseInt(previousTile.dataset.x, 10) && parseInt(tile.y, 10) === parseInt(previousTile.dataset.y, 10);
        });
        // const currIndex = tiles.findIndex(tile => tile.name === currentTile.innerText);
        const currIndex = tiles.findIndex(tile => {
            return parseInt(tile.x, 10) === parseInt(currentTile.dataset.x, 10) && parseInt(tile.y, 10) === parseInt(currentTile.dataset.y, 10);
        });
        // Calculate the number of moves based on the indices
        let moves = currIndex - prevIndex;
        if (moves < 0) {
            // If the current tile index is smaller than the previous tile index, it means we've wrapped around the board
            moves += tiles.length;
        }
        return moves;
    }

    // Function to handle replay button click
    resetButton.addEventListener('click', function () {
        // Reset the game state
        resetBoard();
    });

    setStartButton.addEventListener('click', function () {
        setStart();
    })


    function resetBoard() {
        // Reset the board state
        boardReset = true;

        document.querySelectorAll('.tile').forEach(tile => {
            tile.classList.remove('active');
        });

        const startingTileName = startPosition;
        const startingTile = document.querySelector(`.tile[data-name="${startingTileName}"]`);
        if (startingTile) {
            startingTile.classList.add('highlighted');
            previousTile = startingTile; // Set previousTile to the starting tile
            startingTile.classList.add('active');
        }
        resetButton.hidden = true;
        undoButton.hidden = true
        setStartButton.hidden = false;
        movePlaneToTile(startingTile)

        // Call highlightNextTile after resetting the board
        highlightNextTile(startingTile, actualMoves[movesMade]);
        counterSpan.dataset.remaining = actualMoves.length
        moveStatusSpan.innerText = 'Moves Logged'
        counterSpan.innerText = actualMoves.length
    }

    function highlightNextTile(currentTile, moves) {
        // Remove highlight from all tiles
        document.querySelectorAll('.tile').forEach(tile => {
            tile.classList.remove('highlighted');
        });
        // Get the index of the current tile in the tiles array
        const currentIndex = tiles.findIndex(tile => {
            return parseInt(tile.x, 10) === parseInt(currentTile.dataset.x, 10) && parseInt(tile.y, 10) === parseInt(currentTile.dataset.y, 10);
        });

        if (currentIndex === -1) {
            console.error('Current tile not found.');
            return null;
        }

        // Calculate the index of the target tile
        let targetIndex = currentIndex + moves;
        if (targetIndex < 0) {
            targetIndex += tiles.length; // Wrap around the board
        } else if (targetIndex >= tiles.length) {
            targetIndex %= tiles.length; // Wrap around the board
        }

        // Get the target tile from the tiles array
        const targetTile = tiles[targetIndex];
        if (targetTile !== undefined) {
        const targetX = targetTile.x; // Ensure the result is positive and within bounds
        const targetY = targetTile.y;
        const targetTileElement = document.querySelector(`[data-x="${targetX}"][data-y="${targetY}"]`);
        if (targetTileElement) {
            targetTileElement.classList.add('highlighted');
        }
    } else {
        // The end of logged moves has been reached.
        counterSpan.innerHTML = 0
    }
    }

    function setStart() {
        boardReset = false;
        actualMoves = [];
        planeIcon.style.display = 'none';
        previousTile = undefined;
        infoDiv.innerHTML = ''
        document.querySelectorAll('.tile').forEach(tile => {
            tile.classList.remove('highlighted');
            tile.classList.remove('active');
        });
        moveStatusSpan.innerHTML = ''
        counterSpan.innerHTML = ''
        startSpan.innerHTML = ''
        movesMade = 0;
        setStartButton.hidden = true;
    }

    function nextStationTile(currentTile) {
        const currIndex = tiles.findIndex(tile => {
            return parseInt(tile.x, 10) === parseInt(currentTile.dataset.x, 10) && parseInt(tile.y, 10) === parseInt(currentTile.dataset.y, 10);
        });

        let currentIndex = (currIndex + 1) % tiles.length;

    // Loop through the array until a station tile is found or we reach the startIndex again
    while (currentIndex !== currIndex) {
        if (tiles[currentIndex].name.includes("Station")) {
            // Found a station tile, return its index
            return tiles[currentIndex].name;
        }
        // Move to the next index
        currentIndex = (currentIndex + 1) % tiles.length;
    }

    // If no station tile is found between the startIndex and the end of the array,
    // return -1 to indicate that no such index was found
    return -1;
    }
    tiles.forEach(createTile);
});
