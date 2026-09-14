# OpenAPI spec and generated types for Statistikkregisteret

## Description

This package contains types and access information for the Statistikkregisteret API at Statistics Norway. The API is an internal tool, but the code is open source and freely available. This package is intended to facilitate access to the API resources offered, and to make it easy to integrate with.

## Installation

Install the package with your chosen package manager.

```PNPM
pnpm install @statisticsnorway/statreg-api-types
```

## Usage

Using the the package in your own project can, as an example, be done like this:

``` Typescript
import createClient from "openapi-fetch";
import type { paths } from "@statisticsnorway/statreg-api-types";

const client = createClient<paths>({ baseUrl: "https://ssbno-statreg.intern.test.ssb.no/statistikkregisteret/api" });
const { data, error } = await client.GET("/statistics", { params: { query: { count: 20 } } });
```
