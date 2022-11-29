import cloneDeep from 'lodash.clonedeep';

const schemas = {
  user: {
    name: 'user',
    properties: [
      {
          id: 'first_name',
          name: 'first name',
          type: 'string',
      },
      {
          id: 'last_name',
          name: 'last name',
          type: 'string',
      },
      {
          id: 'age',
          name: 'the age',
          type: 'integer',
      },
      {
          id: 'weight',
          name: 'the weight',
          type: 'float',
      },
      {
          id: 'married',
          name: 'is married',
          type: 'boolean',
      },
      {
          id: 'gender',
          name: 'the gender',
          type: 'string',
          enum: {
            male: 'Mr.',
            female: 'Ms.',
          }
      },
      {
          id: 'birth_date',
          name: 'birth date',
          type: 'datetime',
      },
      {
          id: 'birth_day',
          name: 'birth day',
          type: 'date',
      },
      {
          id: 'birth_hour',
          name: 'birth hour',
          type: 'time',
      },
      {
          id: 'countries',
          name: 'the countries',
          type: 'choice',
      },
      {
          id: 'company',
          name: 'the company',
          type: 'relationship',
          model: 'organization',
      },
      {
          id: 'friend',
          name: 'the friend',
          type: 'relationship',
          model: 'user',
      },
    ],
    search: {
      filters: ['first_name', 'age', 'weight', 'gender', 'married', 'birth_date', 'birth_day', 'birth_hour', 'company', 'friend', 'countries'],
      scopes: [
        'scope_string_definition',
        {
          id: 'scope',
          name: 'scope without value',
        },
        {
          id: 'string_scope',
          name: 'string scope',
          type: 'string',
          useOperator: true,
        },
        {
          id: 'datetime_scope',
          name: 'datetime scope',
          type: 'datetime'
        },
        {
          id: 'enum_scope',
          name: 'enum scope',
          type: 'string',
          enum: {
            one: 'value one',
            two: 'value two',
          }
        }
      ]
    }
  },
  organization: {
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
          id: 'contacts',
          name: 'the contacts',
          type: 'relationship',
          model: 'user',
      },
    ],
    search: {
      filters: ['address', 'brand_name', 'contacts']
    }
  }
}
const computedSchemas = {};
  
  class SchemaLoader {
  
    async getSchema(name) {
      // TODO add loader registration
      return schemas[name];
    }
  
    async getComputedSchema(name) {
      let res = null;
      if (computedSchemas[name]) {
        res = computedSchemas[name];
      } else {
        const mapProperties = {}; 
        const mapScopes = {}; 
        const loadedSchema = cloneDeep(await this.getSchema(name));
        if (loadedSchema) {
          for (const property of loadedSchema.properties) {
            mapProperties[property.id] = property;
          }
          if (loadedSchema.search && loadedSchema.search.scopes && Array.isArray(loadedSchema.search.scopes)) {
            const scopes = []; 
            for (let scope of loadedSchema.search.scopes) {
              scope = typeof scope == 'object' ? scope : {id : scope, name : scope};
              mapScopes[scope.id] = scope;
              scopes.push(scope);
            }
            loadedSchema.search.scopes = scopes;
          }
          res = Object.assign({ mapProperties, mapScopes }, loadedSchema);
          computedSchemas[name] = res;
        }
      }
      return res;
    }
  
  }
  
  export default new SchemaLoader();