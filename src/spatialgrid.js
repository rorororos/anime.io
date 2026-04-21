function SpatialGrid(w, h, cellSize) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(w / cellSize);
    this.rows = Math.ceil(h / cellSize);
    this.cells = {};
}

SpatialGrid.prototype.clear = function () {
    this.cells = {};
};

SpatialGrid.prototype._key = function (c, r) {
    return c * 10000 + r;
};

SpatialGrid.prototype.insert = function (e) {
    var minC = Math.max(0, Math.floor((e.x - e.radius) / this.cellSize));
    var maxC = Math.min(this.cols - 1, Math.floor((e.x + e.radius) / this.cellSize));
    var minR = Math.max(0, Math.floor((e.y - e.radius) / this.cellSize));
    var maxR = Math.min(this.rows - 1, Math.floor((e.y + e.radius) / this.cellSize));
    for (var c = minC; c <= maxC; c++) {
        for (var r = minR; r <= maxR; r++) {
            var k = this._key(c, r);
            if (!this.cells[k]) this.cells[k] = [];
            this.cells[k].push(e);
        }
    }
};

SpatialGrid.prototype.query = function (x, y, radius) {
    var results = [];
    var seen = {};
    var minC = Math.max(0, Math.floor((x - radius) / this.cellSize));
    var maxC = Math.min(this.cols - 1, Math.floor((x + radius) / this.cellSize));
    var minR = Math.max(0, Math.floor((y - radius) / this.cellSize));
    var maxR = Math.min(this.rows - 1, Math.floor((y + radius) / this.cellSize));
    for (var c = minC; c <= maxC; c++) {
        for (var r = minR; r <= maxR; r++) {
            var cell = this.cells[this._key(c, r)];
            if (cell) {
                for (var i = 0; i < cell.length; i++) {
                    if (!seen[cell[i].id]) {
                        seen[cell[i].id] = true;
                        results.push(cell[i]);
                    }
                }
            }
        }
    }
    return results;
};