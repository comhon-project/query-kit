export default {
  name: "organization",
  properties: [
    {
      id: "id",
      name: "identifier",
      type: "string",
    },
    {
      id: "brand_name",
      name: "brand name",
      type: "string",
    },
    {
      id: "address",
      name: "the address",
      type: "string",
    },
    {
      id: "description",
      name: "the description",
      type: "html",
    },
    {
      id: "contacts",
      name: "the contacts",
      type: "relationship",
      relationship_type: "has_many",
      model: "user",
    },
    {
      id: "offices",
      name: "offices",
      type: "relationship",
      relationship_type: "has_many",
      model: "office",
    },
  ],
  unique_identifier: "id",
  primary_identifiers: ["brand_name"],
  search: {
    properties: ["address", "brand_name", "contacts", "description", "offices"],
    sort: ["brand_name"],
  },
};
