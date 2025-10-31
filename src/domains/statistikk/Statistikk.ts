/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Statistikk<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description Renders the HTML list view of all statistics with optional filters, pagination, and sorting. Mirrors `StatistikkController.list`. This is the UI counterpart to `/statistics`, which provides the same data in JSON form.
   *
   * @name StatistikkListView
   * @summary List statistics (UI)
   * @request GET:/statistikk/list
   */
  statistikkListView = (
    query?: {
      /**
       * @min 1
       * @max 100
       * @default 20
       */
      max?: number;
      /**
       * @min 0
       * @default 0
       */
      offset?: number;
      /**
       * Field to sort by (default `statistikknavn`). When `kortnavn`, sorting happens on the nested `Kortnavn` association.
       * @default "statistikknavn"
       */
      sort?: "statistikknavn" | "kortnavn" | "dateCreated" | "id";
      /** @default "asc" */
      order?: "asc" | "desc";
      /** Filter by owner section code (e.g. "350") */
      "filter.seksjon"?: string;
      /** Filter by short name (`Kortnavn.navn`, LIKE) */
      "filter.kortnavn"?: string;
      /** Filter by contact initials (LIKE) */
      "filter.initialer"?: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<string, any>({
      path: `/statistikk/list`,
      method: "GET",
      query: query,
      ...params,
    });
  /**
   * @description Renders the HTML create form. Mirrors `StatistikkController.create`.
   *
   * @name StatistikkCreateView
   * @summary Create statistikk (UI form)
   * @request GET:/statistikk/create
   */
  statistikkCreateView = (params: RequestParams = {}) =>
    this.request<void, any>({
      path: `/statistikk/create`,
      method: "GET",
      ...params,
    });
  /**
   * @description Currently does not delete; sets a flash message and redirects to list. Mirrors `StatistikkController.delete` (POST).
   *
   * @name StatistikkDelete
   * @summary Delete statistikk (UI action placeholder)
   * @request POST:/statistikk/delete
   */
  statistikkDelete = (data?: object, params: RequestParams = {}) =>
    this.request<any, void>({
      path: `/statistikk/delete`,
      method: "POST",
      body: data,
      type: ContentType.UrlEncoded,
      ...params,
    });
  /**
   * @description Renders the HTML edit view for a given statistikk. Mirrors `StatistikkController.edit`.
   *
   * @name StatistikkEditView
   * @summary Edit statistikk (UI form)
   * @request GET:/statistikk/edit
   */
  statistikkEditView = (
    query: {
      /** Statistikk ID (`params.id`) */
      id: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/statistikk/edit`,
      method: "GET",
      query: query,
      ...params,
    });
  /**
   * @description Updates a statistikk and redirects. Mirrors `StatistikkController.update` (POST).
   *
   * @name StatistikkUpdate
   * @summary Update statistikk (UI action)
   * @request POST:/statistikk/update
   */
  statistikkUpdate = (
    data: {
      /** Statistikk ID */
      id: number;
      /** Optimistic locking version */
      version?: number;
      /** Section ID */
      eierseksjon?: string;
      "kortnavn.navn"?: string;
      "statistikk.internKommentar"?: string;
      "statistikk.forstegangspublisering"?: string;
      "statistikk.kontakter"?: string[];
      [key: string]: any;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/statistikk/update`,
      method: "POST",
      body: data,
      type: ContentType.UrlEncoded,
      ...params,
    });
  /**
   * @description Renders an HTML page with grouped audit entries. Mirrors `StatistikkController.versjoner`.
   *
   * @name StatistikkVersionsView
   * @summary Show audit versions for a statistikk (UI)
   * @request GET:/statistikk/versjoner
   */
  statistikkVersionsView = (
    query: {
      /** Statistikk ID (`params.id`) */
      id: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/statistikk/versjoner`,
      method: "GET",
      query: query,
      ...params,
    });
  /**
   * @description Mirrors `StatistikkController.avvisDesk`. Rejects with internal comment and redirects.
   *
   * @name StatistikkAvvisDesk
   * @summary Reject a statistikk in Desk (UI action, placeholder)
   * @request POST:/statistikk/avvisDesk
   */
  statistikkAvvisDesk = (
    data: {
      /** Statistikk ID (`params.id`) */
      id: number;
      /** Internal comment explaining the rejection (`params.internKommentar`) */
      internKommentar: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/statistikk/avvisDesk`,
      method: "POST",
      body: data,
      type: ContentType.UrlEncoded,
      ...params,
    });
  /**
   * @description Mirrors `StatistikkController.godkjennDesk`. Approves and redirects.
   *
   * @name StatistikkGodkjennDesk
   * @summary Approve a statistikk in Desk (UI action, placeholder)
   * @request POST:/statistikk/godkjennDesk
   */
  statistikkGodkjennDesk = (
    data: {
      /** Statistikk ID (`params.id`) */
      id: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<any, void>({
      path: `/statistikk/godkjennDesk`,
      method: "POST",
      body: data,
      type: ContentType.UrlEncoded,
      ...params,
    });
  /**
   * @description Placeholder for `StatistikkController.lagreVarianter`. Intended to save or update multiple `Variant` records associated with a `Statistikk`. Exact payload TBD.
   *
   * @name StatistikkSaveVariants
   * @summary Save one or more variants (UI action, placeholder)
   * @request POST:/statistikk/lagreVarianter
   */
  statistikkSaveVariants = (
    data?: Record<string, any>,
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/statistikk/lagreVarianter`,
      method: "POST",
      body: data,
      type: ContentType.UrlEncoded,
      ...params,
    });
  /**
   * @description Listed in inventory but the current controller declares `oppdaterVarianter` as a helper closure that takes parameters `(params, variantInstanceList)` and is not exposed as an action. If later exposed via a proper action, replace this placeholder with the actual contract.
   *
   * @name StatistikkOppdaterVarianter
   * @summary Update variants helper (non-routable in current code, placeholder)
   * @request POST:/statistikk/oppdaterVarianter
   */
  statistikkOppdaterVarianter = (
    data?: Record<string, any>,
    params: RequestParams = {},
  ) =>
    this.request<void, any>({
      path: `/statistikk/oppdaterVarianter`,
      method: "POST",
      body: data,
      type: ContentType.UrlEncoded,
      ...params,
    });
  /**
   * @description Mirrors `StatistikkController.show`. Displays a statistikk page.
   *
   * @name StatistikkShow
   * @summary Show statistikk (UI view, placeholder)
   * @request GET:/statistikk/show
   */
  statistikkShow = (
    query: {
      /** Statistikk ID (`params.id`) */
      id: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/statistikk/show`,
      method: "GET",
      query: query,
      ...params,
    });
  /**
   * @description Deletes a Variant and redirects. Mirrors `StatistikkController.slettVariant` (POST).
   *
   * @name StatistikkDeleteVariant
   * @summary Delete a variant from a statistikk (UI action)
   * @request POST:/statistikk/slettVariant
   */
  statistikkDeleteVariant = (
    data: {
      /** Variant ID to delete (`params.variant.id`) */
      "variant.id": number;
    },
    params: RequestParams = {},
  ) =>
    this.request<any, void>({
      path: `/statistikk/slettVariant`,
      method: "POST",
      body: data,
      type: ContentType.UrlEncoded,
      ...params,
    });
  /**
   * @description Returns a list of shortnames for all statistics (used in UI selectors and XML fetchers).
   *
   * @name GetKortnavn
   * @summary Retrieve the list of kortnavn
   * @request GET:/statistikk/hentKortnavn
   */
  getKortnavn = (params: RequestParams = {}) =>
    this.request<
      {
        kortnavn?: string[];
      },
      any
    >({
      path: `/statistikk/hentKortnavn`,
      method: "GET",
      format: "json",
      ...params,
    });
}
