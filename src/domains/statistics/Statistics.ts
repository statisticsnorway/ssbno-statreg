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

import { StatisticsResponse } from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class Statistics<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description Returns all active statistics and their non-discontinued variants.
   *
   * @name ListStatistics
   * @summary List all statistics (JSON)
   * @request GET:/statistics
   */
  listStatistics = (params: RequestParams = {}) =>
    this.request<StatisticsResponse, any>({
      path: `/statistics`,
      method: "GET",
      format: "json",
      ...params,
    });
}
