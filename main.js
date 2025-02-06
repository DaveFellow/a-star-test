let closedTiles = [];
let openTiles = [];
let origin = null;
let destination = null;
let current = null;

let tiles = [];

function setTilesData(obstacles = 0.2) {
    const grid = [];
    for (let row = 0; row < 20; row++) {
        const gridRow = [];
        for (let column = 0; column < 20; column++) {
            gridRow.push({
                row,
                column,
                g: null,
                h: null,
                f: null,
                isObstacle: Math.random() < obstacles,
                parent: null,
            });
        }
        grid.push(gridRow);
    }
    return grid;
}

function renderTiles() {
    const grid = document.querySelector('.grid');
    for (let row of tiles) {
        const rowElem = document.createElement('div');
        rowElem.classList.add('row');
        grid.appendChild(rowElem);
        for (let column of row) {
            const tile = document.createElement('div');
            tile.classList.add('tile');

            if (column.isObstacle) {
                tile.classList.add('obstacle');
                rowElem.appendChild(tile);
                continue;
            }

            const gElem = document.createElement('div');
            gElem.classList.add('weight-g');
            tile.appendChild(gElem);
            
            const hElem = document.createElement('div');
            hElem.classList.add('weight-h');
            tile.appendChild(hElem);
            
            const fElem = document.createElement('div');
            fElem.classList.add('weight-f');
            tile.appendChild(fElem);

            rowElem.appendChild(tile);
            tile.addEventListener('click', () => handleTileClick(tile, tiles.indexOf(row), row.indexOf(column)));
        }
    }

}

function handleTileClick(element, row, column) {
    if (origin === null || destination !== null) {
        clearOriginDestination();
        clearPath();
        clear();
        setOrigin(row, column);
        return;
    } 
    element.classList.add('destination');
    destination = getTile(row, column);
    search();
}

function clearOriginDestination() {
    const elements = document.querySelectorAll('.origin, .destination');
    Array.from(elements).forEach(element => {
        for (let child of element.children) {
            child.innerText = '';
        }
        if (element.classList.contains('origin')) {
            setWeight(origin.row, origin.column, { g: null, h: null });
        }
        if (element.classList.contains('destination')) {
            setWeight(destination.row, destination.column, { g: null, h: null });
        }
        element.classList.remove('origin', 'destination');
    });
    origin = null;
    destination = null;
}

function clear() {
    document.querySelectorAll('.tile').forEach(tile => tile.classList.remove('closed', 'open'));

    for (let row = 0; row < 20; row++) {
        for (let column = 0; column < 20; column++) {
            setWeight(row, column, { g: null, h: null });
        }
    }

    openTiles = [];
    closedTiles = [];
    current = null;
}

function getTile(row, column) {
    return tiles[row][column];
}

function getTileElem(row, column) {
    return document.querySelector(`.row:nth-child(${row + 1}) .tile:nth-child(${column + 1})`);
}

function setWeight(row, column, { g, h }) {
    const tile = getTile(row, column);
    tile.g = g;
    tile.h = h;
    tile.f = g === null || h === null ? null : g + h;
    
    const elem = getTileElem(row, column);
    if (elem.childElementCount === 0) return;
    elem.querySelector('.weight-g').innerText = g ?? '';
    elem.querySelector('.weight-h').innerText = h ?? '';
    elem.querySelector('.weight-f').innerText = tile.f ?? '';
}

function setOrigin(row, column) {
    origin = getTile(row, column);
    getTileElem(row, column).classList.add('origin');
    setWeight(origin.row, origin.column, { g: 0, h: 0 });
}

function setDestination(row, column) {
    destination = getTile(row, column);
    getTileElem(row, column).classList.add('destination');
}

function findNeighbors(row, column) {
    return [
        { row: row - 1, column },
        { row: row + 1, column },
        { row, column: column - 1 },
        { row, column: column + 1 },
        { row: row - 1, column: column - 1 },
        { row: row - 1, column: column + 1 },
        { row: row + 1, column: column - 1 },
        { row: row + 1, column: column + 1 },
    ].filter(data => {
        return data.row > -1 && data.row < 20 && data.column > -1 && data.column < 20;
    }).map(data => {
        return getTile(data.row, data.column);
    }).filter(data => {
        return !data.isObstacle && data !== origin;
    });
}

function getDistance(tile1, tile2) {
    return Math.abs(tile1.row - tile2.row) + Math.abs(tile1.column - tile2.column);
}
 
function search() {
    openTiles.push(origin);

    while(openTiles.length) {
        current = openTiles.sort((a, b) => a.f - b.f)[0];

        openTiles = openTiles.filter(tile => tile !== current);
        closedTiles.push(current);

        if (current === destination) {
            setPath();
            return;
        }

        const neighbors = findNeighbors(current.row, current.column);
        
        for (let neighbor of neighbors) {
            if (closedTiles.includes(neighbor)) {
                continue;
            }

            const inLine = neighbor.row === current.row || neighbor.column === current.column;
            const g = (inLine ? 10 : 14) + current.g;
            const h = getDistance(neighbor, destination);
            const possibleNeighbor = { row: neighbor.row, column: neighbor.column, g, h };

            const tileInSamePosition = openTiles.find(tile => tile.row === possibleNeighbor.row && tile.column === possibleNeighbor.column);
            if (tileInSamePosition) {
                if (possibleNeighbor.g > tileInSamePosition.g) {
                    continue;
                }
            }
            setWeight(neighbor.row, neighbor.column, { g, h });
            getTileElem(neighbor.row, neighbor.column).classList.add('open');
            neighbor.parent = current;
            openTiles.push(neighbor);
        }

        const tileElem = getTileElem(current.row, current.column);
        tileElem.classList.add('closed');
        tileElem.classList.remove('open');
    }
    clear();
}

function setPath() {
    let pathCurrent = destination;
    while (pathCurrent !== origin) {
        if (pathCurrent === destination) {
            pathCurrent = pathCurrent.parent;
            continue;
        }
        const tileElem = getTileElem(pathCurrent.row, pathCurrent.column);
        tileElem.classList.remove('open', 'closed');
        tileElem.classList.add('path');
        pathCurrent = pathCurrent.parent;
    }
}

function clearPath() {
    document.querySelectorAll('.path').forEach(tile => tile.classList.remove('path'));
}

function fillObstaclesHoles() {
    for (let row = 1; row < tiles.length - 1; row++) {
        for (let column = 1; column < tiles[row].length - 1; column++) {
            if (getTile(row, column).isObstacle === false) continue;

            const obsTopLeft = () => getTile(row - 1, column - 1)?.isObstacle;
            const obsTopRight = () => getTile(row - 1, column + 1)?.isObstacle;
            const obsBottomLeft = () => getTile(row + 1, column - 1)?.isObstacle;
            const obsBottomRight = () => getTile(row + 1, column + 1)?.isObstacle;
        
            const noObsTop = () => getTile(row - 1, column)?.isObstacle === false;
            const noObsRight = () => getTile(row, column + 1)?.isObstacle === false;
            const noObsLeft = () => getTile(row, column - 1)?.isObstacle === false;
            const noObsBottom = () => getTile(row + 1, column)?.isObstacle === false;
        
            if (obsTopLeft() && noObsTop() && noObsLeft()) {
                getTile(row - 1, column - 1).isObstacle = false;
            }
        
            if (obsTopRight() && noObsTop() && noObsRight()) {
                getTile(row - 1, column + 1).isObstacle = false;
            }
        
            if (obsBottomLeft() && noObsBottom() && noObsLeft()) {
                getTile(row + 1, column - 1).isObstacle = false;
            }
        
            if (obsBottomRight() && noObsBottom() && noObsRight()) {
                getTile(row + 1, column + 1).isObstacle = false;
            }
        }
    }
}

document.querySelector('#obs').value = localStorage.getItem('obs') ?? 0.2;
document.querySelector('#obs').addEventListener('change', () => localStorage.setItem('obs', document.querySelector('#obs').value));
document.querySelector('.refresh-btn').addEventListener('click', () => window.location.reload());

tiles = setTilesData(document.querySelector('#obs').value);
fillObstaclesHoles();
renderTiles();