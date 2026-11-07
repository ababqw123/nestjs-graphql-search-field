# NestJS GraphQL Search Field Decorator

[![npm version](https://img.shields.io/npm/v/@jaeyeong/nestjs-graphql-search-field)](https://www.npmjs.com/package/@jaeyeong/nestjs-graphql-search-field)
[![CI](https://github.com/ababqw123/nestjs-graphql-search-field/actions/workflows/ci.yml/badge.svg)](https://github.com/ababqw123/nestjs-graphql-search-field/actions/workflows/ci.yml)

A small NestJS GraphQL decorator that stores metadata for building TypeORM `where` inputs.

## Install

```
npm i @jaeyeong/nestjs-graphql-search-field
```

## Usage

### SearchField

`SearchField` is a decorator that attaches metadata to an input field. The metadata includes:

- `type`: how to build the condition (see `SearchType`)
- `targetField`: optional actual column name (defaults to the property name)
- `graphqlType`: GraphQL field type for the input
- `joinColumn`: optional relation alias for joined fields (e.g. `user.name`)

### SearchType

`SearchType` defines how the value is translated into a query condition:

- `EQUAL`: `field = value`
- `LIKE`: `field LIKE %value%`
- `DATE_BETWEEN`: `field BETWEEN start AND end`
- `IN`: `field IN (...)`
- `IS_NULL`: `field IS NULL`
- `NOT`: `field != value`
- `NOT_IN`: `field NOT IN (...)`

```ts
import "reflect-metadata";
import { InputType } from "@nestjs/graphql";
import {
  SearchField,
  SearchType,
  searchAndFilter,
} from "@jaeyeong/nestjs-graphql-search-field";
import GraphQLJSON from "graphql-type-json";

@InputType()
export class ExampleWhereInput {
  @SearchField(
    {
      type: SearchType.EQUAL,
      graphqlType: () => [String],
    },
    { nullable: true },
  )
  entityId: string;

  @SearchField(
    {
      type: SearchType.LIKE,
      graphqlType: () => String,
      joinColumn: "user",
    },
    { nullable: true },
  )
  name: string;

  @SearchField(
    {
      type: SearchType.EQUAL,
      graphqlType: () => String,
    },
    { nullable: true },
  )
  category: string;

  @SearchField(
    {
      type: SearchType.DATE_BETWEEN,
      graphqlType: () => GraphQLJSON,
    },
    { nullable: true },
  )
  createdAt: {
    start: Date;
    end: Date;
  };

  @SearchField(
    {
      type: SearchType.IN,
      graphqlType: () => [String],
    },
    { nullable: true },
  )
  categoryIn: string[];

  @SearchField(
    {
      type: SearchType.IS_NULL,
      graphqlType: () => Boolean,
    },
    { nullable: true },
  )
  deletedAtIsNull: boolean;

  @SearchField(
    {
      type: SearchType.NOT,
      graphqlType: () => String,
    },
    { nullable: true },
  )
  categoryNot: string;

  @SearchField(
    {
      type: SearchType.NOT_IN,
      graphqlType: () => [String],
    },
    { nullable: true },
  )
  categoryNotIn: string[];
}
```

## Where Helpers

Helpers convert decorator metadata into TypeORM query conditions.

Build `FindOperator` filters:

```ts
import { searchAndFilter } from "@jaeyeong/nestjs-graphql-search-field";
import { Repository } from "typeorm";

const filter = searchAndFilter(where, ExampleWhereInput);
const results = await repo.find({ where: filter });
```

Apply to `QueryBuilder`:

```ts
import { applyWhereFromDecorators } from "@jaeyeong/nestjs-graphql-search-field";

const qb = repo.createQueryBuilder("entity");
applyWhereFromDecorators(qb, where, ExampleWhereInput);
const results = await qb.getMany();
```

## Exports

- `SearchField`
- `SearchType`
- `SEARCH_TYPE_KEY`
- `SEARCH_FIELD_KEY`
- `JOIN_COLUMN_KEY`
- `searchAndFilter`
- `applyWhereFromDecorators`

## Development

Use Node.js 24 (see `.nvmrc`).

```sh
npm ci
npm run typecheck
npm run build
npm pack --dry-run
```

GitHub Actions checks types, builds the package, loads its CommonJS and ESM entry
points, and inspects the package contents on Node.js 22 and 24 for pushes and pull
requests to `main`.

## Publishing

The package is published to the public npm registry. Publishing is manual and
requires an npm account with access to `@jaeyeong/nestjs-graphql-search-field`.

After validating the changes, update the version and publish:

```sh
npm version patch
git push origin main --follow-tags
npm publish
```

`prepublishOnly` builds the package before publishing. The repository, homepage,
and issue links in `package.json` will appear on npm with the next published
version; pushing to GitHub alone does not update an existing npm release.

## Issues

Report bugs and feature requests on [GitHub Issues](https://github.com/ababqw123/nestjs-graphql-search-field/issues).

## License

MIT
