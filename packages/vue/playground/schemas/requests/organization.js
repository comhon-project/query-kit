export default {
  id: "organization",
  filtrable: {
    properties: ["address", "brand_name", "contacts", "country", "description", "offices"],
    scopes: ["scope"],
  },
  sortable: ["brand_name"],
};
