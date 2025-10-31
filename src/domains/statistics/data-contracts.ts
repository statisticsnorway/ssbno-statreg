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

export interface StatisticsResponse {
  statistics?: StatisticItem[];
}

export interface StatisticItem {
  id?: number;
  shortName?: string;
  name?: string;
  nameEN?: string;
  /** lastUpdated as string */
  modifiedTime?: string;
  status?: "A" | "IA" | "UT" | "SA";
  /** Only non-discontinued variants (!erOpphort) */
  variants?: VariantItem[];
}

export interface VariantItem {
  id?: number;
  /** Human-readable frequency (e.g., "År", "Måned") */
  frekvens?: string;
  /** Timestamp of previous release, or empty string */
  previousRelease?: string;
  /** Period start of previous release, or empty string */
  previousFrom?: string;
  /** Period end of previous release, or empty string */
  previousTo?: string;
  /** Timestamp of next release, or empty string */
  nextRelease?: string;
  /** Next release ID or empty string */
  nextReleaseId?: number | string;
  /** From getUpcomingReleases(...). Empty array if none. */
  upcomingReleases?: UpcomingRelease[];
}

/** Exact shape from getUpcomingReleases(...) */
export interface UpcomingRelease {
  id?: number;
  /** release.tidspunkt.toString() */
  publishTime?: string;
  /** release.periodeFra.toString() */
  periodFrom?: string;
  /** release.periodeTil.toString() */
  periodTo?: string;
}
