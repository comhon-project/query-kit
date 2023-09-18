class Utils {
  constructor() {
    this.uniqueId = 0;
  }

  getUniqueId() {
    return ++this.uniqueId;
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
