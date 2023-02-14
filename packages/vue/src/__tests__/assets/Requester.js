export default {
  request: (query) => {
    const lastCompleteBulk = 3;
    const limit = query.offset > lastCompleteBulk * query.limit ? query.limit - 1 : query.limit;
    const collection = [];
    for (let index = 0; index < limit; index++) {
      const element = {};
      for (const name of query.properties) {
        switch (name) {
          case 'birth.birth_date':
            element[name] = '2023-01-03T20:45:04Z';
            break;
          case 'birth.birth_day':
            element[name] = '2023-01-03';
            break;
          case 'birth.birth_hour':
            element[name] = '20:45:04';
            break;
          case 'gender':
            element[name] = Math.random() > 0.5 ? 'male' : 'female';
            break;
          case 'married':
            element[name] = Math.random() > 0.5 ? true : false;
            break;
          default:
            element[name] = Math.random().toString(36);
            break;
        }
      }
      collection.push(element);
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          count: lastCompleteBulk * query.limit + (query.limit - 1),
          collection: collection,
        });
      }, 1000);
    });
  },
};
