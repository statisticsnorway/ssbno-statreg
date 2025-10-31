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

export class Publisering<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description Renders the HTML list view with optional filters and sorting. Mirrors `PubliseringController.list`.
   *
   * @name PubliseringListView
   * @summary List publications (UI)
   * @request GET:/publisering/list
   */
  publiseringListView = (
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
       * Field to sort by (default `tidspunkt`). When `statistikknavn`, sorting happens via nested association.
       * @default "tidspunkt"
       */
      sort?: "tidspunkt" | "statistikknavn" | "dateCreated" | "id";
      /** @default "asc" */
      order?: "asc" | "desc";
      /** Filter by owner section code (e.g. "350") */
      "filter.seksjon"?: string;
      /** Filter by `kortnavn` (LIKE) */
      "filter.kortnavn"?: string;
      /** Filter by contact initials (LIKE) */
      "filter.initialer"?: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, any>({
      path: `/publisering/list`,
      method: "GET",
      query: query,
      ...params,
    });
  /**
   * @description Renders the HTML form to create a publication. Mirrors `PubliseringController.create`.
   *
   * @name PubliseringCreateForm
   * @summary Open create-publication form (UI)
   * @request GET:/publisering/create
   */
  publiseringCreateForm = (
    query?: {
      /** Statistikk ID the new publication belongs to (`params.statistikk.id`) */
      statistikkId?: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/publisering/create`,
      method: "GET",
      query: query,
      ...params,
    });
  /**
   * @description Deletes a publication and redirects. Mirrors `PubliseringController.delete` (POST).
   *
   * @name PubliseringDelete
   * @summary Delete a publication (UI action)
   * @request POST:/publisering/delete
   */
  publiseringDelete = (
    data: {
      /** Publisering ID to delete (`params.id`) */
      id: number;
      /** Optional Statistikk ID for redirect (`params.statistikk`) */
      statistikk?: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<any, void>({
      path: `/publisering/delete`,
      method: "POST",
      body: data,
      type: ContentType.UrlEncoded,
      ...params,
    });
  /**
   * @description Renders the HTML form to edit an existing publication. Mirrors `PubliseringController.edit`.
   *
   * @name PubliseringEditForm
   * @summary Open edit-publication form (UI)
   * @request GET:/publisering/edit
   */
  publiseringEditForm = (
    query: {
      /** Publisering ID to edit (`params.id`) */
      id: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/publisering/edit`,
      method: "GET",
      query: query,
      ...params,
    });
  /**
   * @description Updates a publication and redirects. Mirrors `PubliseringController.update` (POST).
   *
   * @name PubliseringUpdate
   * @summary Update a publication (UI action)
   * @request POST:/publisering/update
   */
  publiseringUpdate = (
    data: {
      /** Publisering ID (`params.id`) */
      id: number;
      /** Optimistic locking version (`params.version`) */
      version?: number;
      /** New publish timestamp (`params.tidspunkt`) */
      tidspunkt?: string;
      /** Internal comment */
      internKommentar?: string;
      [key: string]: any;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/publisering/update`,
      method: "POST",
      body: data,
      type: ContentType.UrlEncoded,
      ...params,
    });
  /**
   * @description Renders an HTML page grouping audit entries by version. Mirrors `PubliseringController.versjoner`.
   *
   * @name PubliseringVersionsView
   * @summary Show audit versions for a publication (UI)
   * @request GET:/publisering/versjoner
   */
  publiseringVersionsView = (
    query: {
      /** Publisering ID (`params.id`) */
      id: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/publisering/versjoner`,
      method: "GET",
      query: query,
      ...params,
    });
  /**
   * @description Shows a UI to move a publication to a different variant. Mirrors `PubliseringController.flytt`.
   *
   * @name PubliseringFlyttForm
   * @summary Move publication to another variant (UI)
   * @request GET:/publisering/flytt
   */
  publiseringFlyttForm = (
    query: {
      /** Publisering ID to move (`params.id`) */
      id: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/publisering/flytt`,
      method: "GET",
      query: query,
      ...params,
    });
  /**
   * @description Assigns a different Variant to the publication and redirects. Mirrors `PubliseringController.lagreVariant` (POST).
   *
   * @name PubliseringSaveVariant
   * @summary Change the variant of a publication (UI action)
   * @request POST:/publisering/lagreVariant
   */
  publiseringSaveVariant = (
    data: {
      /** Publisering ID (`params.id`) */
      id: number;
      /** Optimistic locking version (`params.version`) */
      version?: number;
      /** Variant ID to assign (`params.variant`) */
      variant: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/publisering/lagreVariant`,
      method: "POST",
      body: data,
      type: ContentType.UrlEncoded,
      ...params,
    });
  /**
   * @description Returns holidays and per-day summaries of proposed/approved publication counts for one or more months.
   *
   * @name GetHolidaysBlockedAndPublications
   * @summary Get holidays and publication-day summaries
   * @request GET:/publisering/hentHelligdagerSperredeOgPubliseringer
   */
  getHolidaysBlockedAndPublications = (
    query?: {
      /**
       * Month (1–12)
       * @min 1
       * @max 12
       */
      mnd?: number;
      /** Year (e.g. 2025) */
      ar?: number;
      /**
       * Number of months to include starting from (mnd, ar). If omitted, returns only (mnd, ar).
       * @min 1
       * @max 24
       */
      antallMnd?: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<
      {
        /** List of holiday date strings (format decided by server) */
        helligdager?: string[];
        /** List of tuples [dateString, level] where level describes load (e.g. "maks") */
        publiseringsTidspunktSummer?: string[][];
      },
      any
    >({
      path: `/publisering/hentHelligdagerSperredeOgPubliseringer`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * @description Mirrors `PubliseringController.avvisDesk`. Rejects a publication with an internal comment and redirects.
   *
   * @name PubliseringAvvisDesk
   * @summary Reject a publication in Desk (UI action, placeholder)
   * @request POST:/publisering/avvisDesk
   */
  publiseringAvvisDesk = (
    data: {
      /** Publisering ID (`params.id`) */
      id: number;
      /** Internal comment explaining the rejection (`params.internKommentar`) */
      internKommentar: string;
    },
    params: RequestParams = {},
  ) =>
    this.request<void, void>({
      path: `/publisering/avvisDesk`,
      method: "POST",
      body: data,
      type: ContentType.UrlEncoded,
      ...params,
    });
  /**
   * @description Mirrors `PubliseringController.godkjennDesk`. Approves a publication and redirects.
   *
   * @name PubliseringGodkjennDesk
   * @summary Approve a publication in Desk (UI action, placeholder)
   * @request POST:/publisering/godkjennDesk
   */
  publiseringGodkjennDesk = (
    data: {
      /** Publisering ID (`params.id`) */
      id: number;
    },
    params: RequestParams = {},
  ) =>
    this.request<any, void>({
      path: `/publisering/godkjennDesk`,
      method: "POST",
      body: data,
      type: ContentType.UrlEncoded,
      ...params,
    });
  /**
   * @description Mirrors `PubliseringController.listDesk`. Shows publications with `deskFlyt=FORSLAG`, not canceled.
   *
   * @name PubliseringListDesk
   * @summary List publications awaiting Desk (UI view, placeholder)
   * @request GET:/publisering/listDesk
   */
  publiseringListDesk = (
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
      /** @default "tidspunkt" */
      sort?: "tidspunkt" | "statistikknavn" | "dateCreated" | "id";
      /** @default "asc" */
      order?: "asc" | "desc";
    },
    params: RequestParams = {},
  ) =>
    this.request<void, any>({
      path: `/publisering/listDesk`,
      method: "GET",
      query: query,
      ...params,
    });
}
