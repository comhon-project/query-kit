export default {
  name: "car",
  properties: [
    {
      id: "id",
      name: "identifier",
      type: "string",
    },
    {
      id: "brand",
      name: "brand",
      type: "string",
    },
    {
      id: "numberplate",
      name: "numberplate",
      type: "string",
    },
  ],
  unique_identifier: "id",
  search: {
    properties: ["brand", "numberplate"],
    sort: ["brand"],
  },
};
