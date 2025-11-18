# DefaultApi

All URIs are relative to *https://ssb.no/statreg-api*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**kortnavnGet**](DefaultApi.md#kortnavnget) | **GET** /kortnavn | List all kortnavn |
| [**kortnavnNameGet**](DefaultApi.md#kortnavnnameget) | **GET** /kortnavn/{name} | Get statistics under a kortnavn |
| [**kortnavnNamePut**](DefaultApi.md#kortnavnnameput) | **PUT** /kortnavn/{name} | Update a kortnavn |
| [**kortnavnPost**](DefaultApi.md#kortnavnpost) | **POST** /kortnavn | Create a kortnavn |
| [**publiseringGet**](DefaultApi.md#publiseringget) | **GET** /publisering | List all publications |
| [**publiseringIdGet**](DefaultApi.md#publiseringidget) | **GET** /publisering/{id} | Get a publication |
| [**publiseringIdPut**](DefaultApi.md#publiseringidput) | **PUT** /publisering/{id} | Update a publication |
| [**publiseringKalenderHelligOgSperredeDagerGet**](DefaultApi.md#publiseringkalenderhelligogsperrededagerget) | **GET** /publisering/kalenderHelligOgSperredeDager | List publications for a variant |
| [**publiseringPost**](DefaultApi.md#publiseringpost) | **POST** /publisering | Create a publication |
| [**publiseringVariantVariantIdGet**](DefaultApi.md#publiseringvariantvariantidget) | **GET** /publisering/variant/{variantId} | List publications for a variant |
| [**seksjonerGet**](DefaultApi.md#seksjonerget) | **GET** /seksjoner | List all sections |
| [**seksjonerKodeGet**](DefaultApi.md#seksjonerkodeget) | **GET** /seksjoner/{kode} | List statistics owned by a section |
| [**statisticsGet**](DefaultApi.md#statisticsget) | **GET** /statistics | List all statistics |
| [**statisticsIdGet**](DefaultApi.md#statisticsidget) | **GET** /statistics/{id} | Get a statistic |
| [**statisticsIdPut**](DefaultApi.md#statisticsidput) | **PUT** /statistics/{id} | Update a statistic |
| [**statisticsKortnavnGet**](DefaultApi.md#statisticskortnavnget) | **GET** /statistics/kortnavn | List all kortnavn under all statistics |
| [**statisticsPost**](DefaultApi.md#statisticspost) | **POST** /statistics | Create a statistic |
| [**statisticsVariantsGet**](DefaultApi.md#statisticsvariantsget) | **GET** /statistics/variants | List all variants under all statistics |
| [**variantsGet**](DefaultApi.md#variantsget) | **GET** /variants | List all variants |
| [**variantsIdGet**](DefaultApi.md#variantsidget) | **GET** /variants/{id} | Get a variant |
| [**variantsIdPut**](DefaultApi.md#variantsidput) | **PUT** /variants/{id} | Update a variant |
| [**variantsPost**](DefaultApi.md#variantspost) | **POST** /variants | Create a variant |



## kortnavnGet

> kortnavnGet()

List all kortnavn

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { KortnavnGetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  try {
    const data = await api.kortnavnGet();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | List of kortnavn |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## kortnavnNameGet

> kortnavnNameGet(name)

Get statistics under a kortnavn

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { KortnavnNameGetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    name: name_example,
  } satisfies KortnavnNameGetRequest;

  try {
    const data = await api.kortnavnNameGet(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **name** | `string` |  | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Statistics under the kortnavn |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## kortnavnNamePut

> kortnavnNamePut(name, body)

Update a kortnavn

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { KortnavnNamePutRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    name: name_example,
    // any
    body: ...,
  } satisfies KortnavnNamePutRequest;

  try {
    const data = await api.kortnavnNamePut(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **name** | `string` |  | [Defaults to `undefined`] |
| **body** | `any` |  | |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Kortnavn updated |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## kortnavnPost

> kortnavnPost(body)

Create a kortnavn

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { KortnavnPostRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // any
    body: ...,
  } satisfies KortnavnPostRequest;

  try {
    const data = await api.kortnavnPost(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **body** | `any` |  | |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Kortnavn created |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## publiseringGet

> publiseringGet()

List all publications

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { PubliseringGetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  try {
    const data = await api.publiseringGet();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | List of publications |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## publiseringIdGet

> publiseringIdGet(id)

Get a publication

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { PubliseringIdGetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    id: id_example,
  } satisfies PubliseringIdGetRequest;

  try {
    const data = await api.publiseringIdGet(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Publication details |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## publiseringIdPut

> publiseringIdPut(id, body)

Update a publication

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { PubliseringIdPutRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    id: id_example,
    // any
    body: ...,
  } satisfies PubliseringIdPutRequest;

  try {
    const data = await api.publiseringIdPut(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` |  | [Defaults to `undefined`] |
| **body** | `any` |  | |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Publication updated |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## publiseringKalenderHelligOgSperredeDagerGet

> publiseringKalenderHelligOgSperredeDagerGet(variantId)

List publications for a variant

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { PubliseringKalenderHelligOgSperredeDagerGetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    variantId: variantId_example,
  } satisfies PubliseringKalenderHelligOgSperredeDagerGetRequest;

  try {
    const data = await api.publiseringKalenderHelligOgSperredeDagerGet(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **variantId** | `string` |  | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Publications linked to the variant |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## publiseringPost

> publiseringPost(body)

Create a publication

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { PubliseringPostRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // any
    body: ...,
  } satisfies PubliseringPostRequest;

  try {
    const data = await api.publiseringPost(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **body** | `any` |  | |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Publication created |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## publiseringVariantVariantIdGet

> publiseringVariantVariantIdGet(variantId)

List publications for a variant

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { PubliseringVariantVariantIdGetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    variantId: variantId_example,
  } satisfies PubliseringVariantVariantIdGetRequest;

  try {
    const data = await api.publiseringVariantVariantIdGet(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **variantId** | `string` |  | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Publications linked to the variant |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## seksjonerGet

> seksjonerGet()

List all sections

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { SeksjonerGetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  try {
    const data = await api.seksjonerGet();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | List of sections |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## seksjonerKodeGet

> seksjonerKodeGet(kode)

List statistics owned by a section

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { SeksjonerKodeGetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    kode: kode_example,
  } satisfies SeksjonerKodeGetRequest;

  try {
    const data = await api.seksjonerKodeGet(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **kode** | `string` |  | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Statistics belonging to the section |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## statisticsGet

> statisticsGet()

List all statistics

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { StatisticsGetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  try {
    const data = await api.statisticsGet();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | List of statistics |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## statisticsIdGet

> Statistic statisticsIdGet(id)

Get a statistic

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { StatisticsIdGetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    id: id_example,
  } satisfies StatisticsIdGetRequest;

  try {
    const data = await api.statisticsIdGet(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

[**Statistic**](Statistic.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Statistic details |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## statisticsIdPut

> statisticsIdPut(id, body)

Update a statistic

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { StatisticsIdPutRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    id: id_example,
    // any
    body: ...,
  } satisfies StatisticsIdPutRequest;

  try {
    const data = await api.statisticsIdPut(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` |  | [Defaults to `undefined`] |
| **body** | `any` |  | |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Statistic updated |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## statisticsKortnavnGet

> statisticsKortnavnGet()

List all kortnavn under all statistics

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { StatisticsKortnavnGetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  try {
    const data = await api.statisticsKortnavnGet();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | List of kortnavn under all statistics |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## statisticsPost

> statisticsPost(body)

Create a statistic

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { StatisticsPostRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // any
    body: ...,
  } satisfies StatisticsPostRequest;

  try {
    const data = await api.statisticsPost(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **body** | `any` |  | |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Statistic created |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## statisticsVariantsGet

> statisticsVariantsGet()

List all variants under all statistics

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { StatisticsVariantsGetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  try {
    const data = await api.statisticsVariantsGet();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | List of variants under all statistics |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## variantsGet

> variantsGet()

List all variants

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { VariantsGetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  try {
    const data = await api.variantsGet();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | List of variants |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## variantsIdGet

> variantsIdGet(id)

Get a variant

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { VariantsIdGetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    id: id_example,
  } satisfies VariantsIdGetRequest;

  try {
    const data = await api.variantsIdGet(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` |  | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Variant details |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## variantsIdPut

> variantsIdPut(id, body)

Update a variant

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { VariantsIdPutRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    id: id_example,
    // any
    body: ...,
  } satisfies VariantsIdPutRequest;

  try {
    const data = await api.variantsIdPut(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | `string` |  | [Defaults to `undefined`] |
| **body** | `any` |  | |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Variant updated |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## variantsPost

> variantsPost(body)

Create a variant

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { VariantsPostRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // any
    body: ...,
  } satisfies VariantsPostRequest;

  try {
    const data = await api.variantsPost(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **body** | `any` |  | |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Variant created |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

