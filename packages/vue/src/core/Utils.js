class Utils {
  constructor() {
    this.uniqueId = 0;
  }

  getUniqueId(useRandomSuffix) {
    this.uniqueId++;
    return useRandomSuffix ? this.uniqueId + '-' + Math.floor(Math.random() * 1000000000000000) : this.uniqueId;
  }

  /**
   *
   * @param {Object} object
   * @param {string} property
   * @returns {*} return undefined if value doesn't exists
   */
  getNestedValue(object, property) {
    if (property.indexOf('.') === -1) {
      return object[property];
    }

    const split = property.split('.');
    for (let index = 0; index < split.length - 1; index++) {
      object = object[split[index]];
      if (typeof object !== 'object') {
        return undefined;
      }
    }

    return object[split[split.length - 1]];
  }
}

export default new Utils();
