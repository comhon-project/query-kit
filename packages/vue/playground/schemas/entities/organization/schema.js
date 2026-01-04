export default {
  id: "organization",
  name: "organization",
  properties: [
    {
      id: "id",
      name: "identifier",
      type: "string",
      nullable: false,
    },
    {
      id: "brand_name",
      name: "brand name",
      type: "string",
      nullable: false,
    },
    {
      id: "address",
      name: "the address",
      type: "string",
      nullable: true,
    },
    {
      id: "description",
      name: "the description",
      type: "html",
      nullable: true,
    },
    {
      id: "contacts",
      name: "the contacts",
      type: "relationship",
      relationship_type: "has_many",
      related: "user",
    },
    {
      id: "offices",
      name: "offices",
      type: "relationship",
      relationship_type: "has_many",
      related: "office",
    },
  ],
  unique_identifier: "id",
  primary_identifiers: ["brand_name"],
  scopes: [],
};
