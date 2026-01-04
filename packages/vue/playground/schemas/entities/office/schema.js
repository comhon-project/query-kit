export default {
  id: "office",
  name: "office",
  properties: [
    {
      id: "id",
      name: "identifier",
      type: "string",
      nullable: false,
    },
    {
      id: "address",
      name: "address",
      type: "string",
      nullable: false,
    },
    {
      id: "surface",
      name: "surface",
      type: "integer",
      nullable: true,
    },
  ],
  unique_identifier: "id",
  scopes: [],
};
