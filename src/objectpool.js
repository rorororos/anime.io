function ObjectPool(factory, resetFn, initialSize) {
    this.factory = factory;
    this.resetFn = resetFn;
    this.pool = [];
    this.active = [];
    initialSize = initialSize || 100;
    for (var i = 0; i < initialSize; i++) {
        this.pool.push(this.factory());
    }
}

ObjectPool.prototype.get = function () {
    var obj;
    if (this.pool.length > 0) {
        obj = this.pool.pop();
    } else {
        obj = this.factory();
    }
    this.active.push(obj);
    return obj;
};

ObjectPool.prototype.release = function (obj) {
    var idx = this.active.indexOf(obj);
    if (idx !== -1) {
        this.active.splice(idx, 1);
        this.resetFn(obj);
        this.pool.push(obj);
    }
};

ObjectPool.prototype.getActive = function () {
    return this.active;
};

Object.defineProperty(ObjectPool.prototype, 'activeCount', {
    get: function () { return this.active.length; }
});