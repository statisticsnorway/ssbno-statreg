# default_api

All URIs are relative to *https://ssb.no/statreg-api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**KortnavnGet**](default_api.md#KortnavnGet) | **GET** /kortnavn | List all kortnavn
[**KortnavnNameGet**](default_api.md#KortnavnNameGet) | **GET** /kortnavn/{name} | Get statistics under a kortnavn
[**KortnavnNamePut**](default_api.md#KortnavnNamePut) | **PUT** /kortnavn/{name} | Update a kortnavn
[**KortnavnPost**](default_api.md#KortnavnPost) | **POST** /kortnavn | Create a kortnavn
[**PubliseringGet**](default_api.md#PubliseringGet) | **GET** /publisering | List all publications
[**PubliseringIdGet**](default_api.md#PubliseringIdGet) | **GET** /publisering/{id} | Get a publication
[**PubliseringIdPut**](default_api.md#PubliseringIdPut) | **PUT** /publisering/{id} | Update a publication
[**PubliseringKalenderHelligOgSperredeDagerGet**](default_api.md#PubliseringKalenderHelligOgSperredeDagerGet) | **GET** /publisering/kalenderHelligOgSperredeDager | List publications for a variant
[**PubliseringPost**](default_api.md#PubliseringPost) | **POST** /publisering | Create a publication
[**PubliseringVariantVariantIdGet**](default_api.md#PubliseringVariantVariantIdGet) | **GET** /publisering/variant/{variantId} | List publications for a variant
[**SeksjonerGet**](default_api.md#SeksjonerGet) | **GET** /seksjoner | List all sections
[**SeksjonerKodeGet**](default_api.md#SeksjonerKodeGet) | **GET** /seksjoner/{kode} | List statistics owned by a section
[**StatisticsGet**](default_api.md#StatisticsGet) | **GET** /statistics | List all statistics
[**StatisticsIdGet**](default_api.md#StatisticsIdGet) | **GET** /statistics/{id} | Get a statistic
[**StatisticsIdPut**](default_api.md#StatisticsIdPut) | **PUT** /statistics/{id} | Update a statistic
[**StatisticsKortnavnGet**](default_api.md#StatisticsKortnavnGet) | **GET** /statistics/kortnavn | List all kortnavn under all statistics
[**StatisticsPost**](default_api.md#StatisticsPost) | **POST** /statistics | Create a statistic
[**StatisticsVariantsGet**](default_api.md#StatisticsVariantsGet) | **GET** /statistics/variants | List all variants under all statistics
[**VariantsGet**](default_api.md#VariantsGet) | **GET** /variants | List all variants
[**VariantsIdGet**](default_api.md#VariantsIdGet) | **GET** /variants/{id} | Get a variant
[**VariantsIdPut**](default_api.md#VariantsIdPut) | **PUT** /variants/{id} | Update a variant
[**VariantsPost**](default_api.md#VariantsPost) | **POST** /variants | Create a variant


<a name="KortnavnGet"></a>
# **KortnavnGet**
> KortnavnGet()

List all kortnavn
<a name="KortnavnNameGet"></a>
# **KortnavnNameGet**
> KortnavnNameGet(name)

Get statistics under a kortnavn
<a name="KortnavnNamePut"></a>
# **KortnavnNamePut**
> KortnavnNamePut(name, body)

Update a kortnavn
<a name="KortnavnPost"></a>
# **KortnavnPost**
> KortnavnPost(body)

Create a kortnavn
<a name="PubliseringGet"></a>
# **PubliseringGet**
> PubliseringGet()

List all publications
<a name="PubliseringIdGet"></a>
# **PubliseringIdGet**
> PubliseringIdGet(Id_)

Get a publication
<a name="PubliseringIdPut"></a>
# **PubliseringIdPut**
> PubliseringIdPut(Id_, body)

Update a publication
<a name="PubliseringKalenderHelligOgSperredeDagerGet"></a>
# **PubliseringKalenderHelligOgSperredeDagerGet**
> PubliseringKalenderHelligOgSperredeDagerGet(variantId)

List publications for a variant
<a name="PubliseringPost"></a>
# **PubliseringPost**
> PubliseringPost(body)

Create a publication
<a name="PubliseringVariantVariantIdGet"></a>
# **PubliseringVariantVariantIdGet**
> PubliseringVariantVariantIdGet(variantId)

List publications for a variant
<a name="SeksjonerGet"></a>
# **SeksjonerGet**
> SeksjonerGet()

List all sections
<a name="SeksjonerKodeGet"></a>
# **SeksjonerKodeGet**
> SeksjonerKodeGet(kode)

List statistics owned by a section
<a name="StatisticsGet"></a>
# **StatisticsGet**
> StatisticsGet()

List all statistics
<a name="StatisticsIdGet"></a>
# **StatisticsIdGet**
> Statistic StatisticsIdGet(Id_)

Get a statistic
<a name="StatisticsIdPut"></a>
# **StatisticsIdPut**
> StatisticsIdPut(Id_, body)

Update a statistic
<a name="StatisticsKortnavnGet"></a>
# **StatisticsKortnavnGet**
> StatisticsKortnavnGet()

List all kortnavn under all statistics
<a name="StatisticsPost"></a>
# **StatisticsPost**
> StatisticsPost(body)

Create a statistic
<a name="StatisticsVariantsGet"></a>
# **StatisticsVariantsGet**
> StatisticsVariantsGet()

List all variants under all statistics
<a name="VariantsGet"></a>
# **VariantsGet**
> VariantsGet()

List all variants
<a name="VariantsIdGet"></a>
# **VariantsIdGet**
> VariantsIdGet(Id_)

Get a variant
<a name="VariantsIdPut"></a>
# **VariantsIdPut**
> VariantsIdPut(Id_, body)

Update a variant
<a name="VariantsPost"></a>
# **VariantsPost**
> VariantsPost(body)

Create a variant
