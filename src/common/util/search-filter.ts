import 'reflect-metadata';
import {
  Between,
  Equal,
  IsNull,
  Like,
  In,
  Not,
  FindOperator,
  SelectQueryBuilder,
} from 'typeorm';
import { SearchType } from '../enum/search-type.enum';
import {
  SEARCH_FIELD_KEY,
  SEARCH_TYPE_KEY,
  JOIN_COLUMN_KEY,
} from '../decorators/search-field.decorators';

function isDateRange(value: any): value is { start: Date; end: Date } {
  return value && typeof value === 'object' && 'start' in value && 'end' in value;
}

export function searchAndFilter<T extends object>(
  where: T,
  whereClass: new () => T,
): Record<string, FindOperator<any>> {
  const filter: Record<string, FindOperator<any>> = {};

  if (!where) return filter;

  const prototype = whereClass.prototype;

  for (const key in where) {
    const value = (where as any)[key];
    if (value === undefined || value === null) continue;

    const searchType = Reflect.getMetadata(SEARCH_TYPE_KEY, prototype, key);
    const targetField = Reflect.getMetadata(SEARCH_FIELD_KEY, prototype, key) || key;
    const joinColumn = Reflect.getMetadata(JOIN_COLUMN_KEY, prototype, key);

    const finalField = joinColumn && targetField ? `${joinColumn}.${targetField}` : targetField;

    switch (searchType) {
      case SearchType.DATE_BETWEEN:
        if (isDateRange(value)) {
          filter[finalField] = Between(value.start, value.end);
        }
        break;

      case SearchType.LIKE:
        filter[finalField] = Like(`%${String(value)}%`);
        break;

      case SearchType.IN:
        filter[finalField] = In(Array.isArray(value) ? value : [value]);
        break;

      case SearchType.IS_NULL:
        filter[finalField] = IsNull();
        break;

      case SearchType.NOT:
        filter[finalField] = Not(value);
        break;

      case SearchType.NOT_IN:
        filter[finalField] = Not(In(Array.isArray(value) ? value : [value]));
        break;

      case SearchType.EQUAL:
      default:
        filter[finalField] = Equal(value);
        break;
    }
  }

  return filter;
}

export function applyWhereFromDecorators<T extends object>(
  qb: SelectQueryBuilder<any>,
  where: T,
  whereClass: new () => T,
): SelectQueryBuilder<any> {
  if (!where) return qb;

  const prototype = whereClass.prototype;

  for (const key in where) {
    const value = (where as any)[key];
    if (value === undefined || value === null) continue;

    const searchType = Reflect.getMetadata(SEARCH_TYPE_KEY, prototype, key);
    const targetField = Reflect.getMetadata(SEARCH_FIELD_KEY, prototype, key) || key;
    const joinColumn = Reflect.getMetadata(JOIN_COLUMN_KEY, prototype, key);

    const finalField = joinColumn && targetField ? `${joinColumn}.${targetField}` : targetField;

    switch (searchType) {
      case SearchType.DATE_BETWEEN:
        if (isDateRange(value) && value.start && value.end) {
          qb.andWhere(`${finalField} BETWEEN :start AND :end`, {
            start: value.start,
            end: value.end,
          });
        }
        break;

      case SearchType.LIKE:
        qb.andWhere(`${finalField} LIKE :${key}`, {
          [key]: `%${value}%`,
        });
        break;

      case SearchType.IN:
        qb.andWhere(`${finalField} IN (:...${key})`, {
          [key]: Array.isArray(value) ? value : [value],
        });
        break;

      case SearchType.IS_NULL:
        qb.andWhere(`${finalField} IS NULL`);
        break;

      case SearchType.NOT:
        qb.andWhere(`${finalField} != :${key}`, { [key]: value });
        break;

      case SearchType.NOT_IN:
        qb.andWhere(`${finalField} NOT IN (:...${key})`, {
          [key]: Array.isArray(value) ? value : [value],
        });
        break;

      case SearchType.EQUAL:
      default:
        qb.andWhere(`${finalField} = :${key}`, { [key]: value });
        break;
    }
  }

  return qb;
}
