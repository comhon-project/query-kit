export default {
  name: "office",
  properties: [
    {
      id: "id",
      name: "identifier",
      type: "string",
    },
    {
      id: "address",
      name: "address",
      type: "string",
    },
    {
      id: "surface",
      name: "surface",
      type: "integer",
    },
  ],
  unique_identifier: "id",
  search: {
    properties: ["address", "surface"],
    sort: ["address"],
  },
};
