export default {
  name: 'organization',
  properties: [
    {
      id: 'brand_name',
      name: 'brand name',
      type: 'string',
    },
    {
      id: 'address',
      name: 'the address',
      type: 'string',
    },
    {
      id: 'description',
      name: 'the description',
      type: 'html',
    },
    {
      id: 'contacts',
      name: 'the contacts',
      type: 'relationship',
      model: 'user',
    },
  ],
  search: {
    filters: ['address', 'brand_name', 'contacts', 'description'],
    sort: ['brand_name'],
  },
};
