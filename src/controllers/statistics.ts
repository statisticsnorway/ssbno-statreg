import { Request, Response, NextFunction } from 'express';
import { components } from '../types/openapi-types';

type StatisticsResponse = components['schemas']['StatisticsResponse'];

export async function listAllStatistics(_req: Request, res: Response, next: NextFunction) {
  try {
    const payload: StatisticsResponse = {
      statistics: [
        {
          id: 4110,
          shortName: 'lonnvare',
          name: 'Lønn for ansatte i varehandel',
          nameEN: 'Earnings in domestic trade and repair of goods',
          modifiedTime: '2019-08-26 12:42:22.056',
          status: 'SA',
          variants: [
            {
              id: 9114,
              frekvens: 'År',
              previousRelease: '2014-12-09 10:00:00.0',
              previousFrom: '2014-09-01 00:00:00.0',
              previousTo: '2014-09-01 00:00:00.0',
              nextRelease: '',
              nextReleaseId: '',
              upcomingReleases: [],
            },
          ],
        },
      ],
    };

    res.status(200).json(payload);
  } catch (err) {
    next(err);
  }
}
