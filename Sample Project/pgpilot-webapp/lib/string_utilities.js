String.prototype.contains = function(str, ignoreCase) {
    return (ignoreCase ? this.toUpperCase() : this)
            .indexOf(ignoreCase ? str.toUpperCase() : str) >= 0;
};


String.prototype.startsWith = function(str) {
    return this.indexOf(str) == 0;
};
