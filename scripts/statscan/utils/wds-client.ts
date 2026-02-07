/**
 * Client for the Statistics Canada Web Data Service (WDS) REST API.
 * API docs: https://www.statcan.gc.ca/en/developers/wds
 *
 * Free, no auth required. Rate limits are generous but undocumented.
 */

const WDS_BASE = "https://www150.statcan.gc.ca/t1/wds/rest";

interface WdsResponse<T> {
  status: string;
  object: T;
}

interface CubeMetadata {
  productId: number;
  cansimId: number;
  cubeTitleEn: string;
  cubeTitleFr: string;
  cubeStartDate: string;
  cubeEndDate: string;
  nbSeriesCube: number;
  nbDatapointsCube: number;
  archiveStatusCode: number;
  archiveStatusEn: string;
  subjectCode: number[];
  surveyCode: string[];
  dimension: DimensionMetadata[];
  footnote: FootnoteMetadata[];
  correctionFootnote: unknown[];
}

interface DimensionMetadata {
  dimensionPositionId: number;
  dimensionNameEn: string;
  dimensionNameFr: string;
  hasUom: boolean;
  member: MemberMetadata[];
}

interface MemberMetadata {
  memberId: number;
  parentMemberId: number | null;
  memberNameEn: string;
  memberNameFr: string;
  classificationCode: string | null;
  classificationTypeCode: string | null;
  geoLevel: number | null;
  vintage: number | null;
  terminated: number;
  memberUomCode: number | null;
}

interface FootnoteMetadata {
  link: { footnoteId: number };
  footnoteEn: string;
  footnoteFr: string;
}

interface FullTableDownloadResponse {
  status: string;
  object: string; // URL to the CSV zip
}

interface ChangedCube {
  productId: number;
  releaseTime: string;
}

interface SeriesMetadata {
  productId: number;
  coordinate: string;
  vectorId: number;
  frequencyCode: number;
  scalarFactorCode: number;
  decimals: number;
  terminated: number;
  latestRefPeriod: string;
  latestValue: number;
  seriesTitleEn: string;
  seriesTitleFr: string;
  memberUomCode: number;
}

async function wdsFetch<T>(path: string, body?: unknown): Promise<T> {
  const url = `${WDS_BASE}${path}`;
  const options: RequestInit = {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(
      `WDS API error: ${response.status} ${response.statusText} for ${path}`,
    );
  }

  return response.json();
}

/** Get metadata for a single cube */
export async function getCubeMetadata(
  productId: number,
): Promise<CubeMetadata> {
  const results = await wdsFetch<WdsResponse<CubeMetadata>[]>(
    "/getCubeMetadata",
    [{ productId }],
  );
  if (!results[0] || results[0].status !== "SUCCESS") {
    throw new Error(
      `Failed to get metadata for product ${productId}: ${results[0]?.status}`,
    );
  }
  return results[0].object;
}

/** Get the CSV download URL for a full table */
export async function getFullTableDownloadURL(
  productId: number,
  lang: "en" | "fr" = "en",
): Promise<string> {
  const result = await wdsFetch<FullTableDownloadResponse>(
    `/getFullTableDownloadCSV/${productId}/${lang}`,
  );
  if (result.status !== "SUCCESS") {
    throw new Error(
      `Failed to get download URL for product ${productId}: ${result.status}`,
    );
  }
  return result.object;
}

/** Get list of cubes changed since a date (YYYY-MM-DD) */
export async function getChangedCubes(
  sinceDate: string,
): Promise<ChangedCube[]> {
  const results = await wdsFetch<WdsResponse<ChangedCube[]>>(
    `/getChangedCubeList/${sinceDate}`,
  );
  if (results.status !== "SUCCESS") {
    throw new Error(`Failed to get changed cubes: ${results.status}`);
  }
  return results.object;
}

/** Get series metadata for specific vectors */
export async function getSeriesInfoFromVector(
  vectorIds: number[],
): Promise<SeriesMetadata[]> {
  const results = await wdsFetch<WdsResponse<SeriesMetadata>[]>(
    "/getSeriesInfoFromVector",
    vectorIds.map((id) => ({ vectorId: id })),
  );
  return results.filter((r) => r.status === "SUCCESS").map((r) => r.object);
}

/** Get data points for specific vectors within a date range */
export async function getDataFromVectors(
  vectorIds: number[],
  startDate: string,
  endDate: string,
): Promise<
  { vectorId: number; refPeriod: string; value: number; status: string }[]
> {
  const results = await wdsFetch<
    WdsResponse<{
      vectorId: number;
      vectorDataPoint: {
        refPer: string;
        refPer2: string;
        value: number;
        statusCode: number;
        symbolCode: number;
        releaseTime: string;
      }[];
    }>[]
  >("/getDataFromVectorsAndLatestNPeriods", {
    vectorIds,
    startRefPeriod: startDate,
    endRefPeriod: endDate,
  });

  const flat: {
    vectorId: number;
    refPeriod: string;
    value: number;
    status: string;
  }[] = [];
  for (const r of results) {
    if (r.status === "SUCCESS" && r.object.vectorDataPoint) {
      for (const dp of r.object.vectorDataPoint) {
        flat.push({
          vectorId: r.object.vectorId,
          refPeriod: dp.refPer,
          value: dp.value,
          status: String(dp.statusCode),
        });
      }
    }
  }
  return flat;
}

export type {
  CubeMetadata,
  DimensionMetadata,
  MemberMetadata,
  SeriesMetadata,
  ChangedCube,
};
