import { biontechCrawler } from "./biontech.js";
import { euroclearCrawler } from "./euroclear.js";

export const CRAWLERS = {
  euroclear: euroclearCrawler,
  biontech: biontechCrawler,
};
