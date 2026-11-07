import 'reflect-metadata';
import { Field, FieldOptions, ReturnTypeFunc } from '@nestjs/graphql';
import { SearchType } from '../enum/search-type.enum';

export const SEARCH_TYPE_KEY = 'searchType';
export const SEARCH_FIELD_KEY = 'searchField';
export const JOIN_COLUMN_KEY = 'joinColumn';

export interface SearchFieldOptions {
  type: SearchType;
  targetField?: string;
  graphqlType?: ReturnTypeFunc;
  joinColumn?: string;
}

export function SearchField(
  searchOptions: SearchFieldOptions,
  fieldOptions: FieldOptions = {},
): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    if (typeof propertyKey === 'symbol') {
      return;
    }
    const graphqlType = searchOptions.graphqlType ?? (() => String);

    Field(graphqlType, { ...fieldOptions, nullable: true })(target, propertyKey);

    Reflect.defineMetadata(SEARCH_TYPE_KEY, searchOptions.type, target, propertyKey);

    if (searchOptions.targetField) {
      Reflect.defineMetadata(SEARCH_FIELD_KEY, searchOptions.targetField, target, propertyKey);
    }

    if (searchOptions.joinColumn) {
      Reflect.defineMetadata(JOIN_COLUMN_KEY, searchOptions.joinColumn, target, propertyKey);
    }
  };
}
