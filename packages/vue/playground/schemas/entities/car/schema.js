export default {
  id: "car",
  name: "car",
  properties: [
    {
      id: "id",
      name: "identifier",
      type: "string",
      nullable: false,
    },
    {
      id: "brand",
      name: "brand",
      type: "string",
      nullable: false,
    },
    {
      id: "numberplate",
      name: "numberplate",
      type: "string",
      nullable: true,
    },
  ],
  unique_identifier: "id",
  scopes: [],
};
