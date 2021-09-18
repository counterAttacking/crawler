// CrawlerCoordinator는 URL (Uniform Resource Locator) 리스트 관리 및 Crawler의 요청을 생성

import { Browser } from "./browser";
import { Crawler } from "./crawler";

export class CrawlerCoordinator {
  // URL List는 성능을 향상시기키 위하여 queue로 관리
  private urlQueue: string[];
  private browser: Browser;

  public constructor() {
    this.urlQueue = [];
    this.browser = new Browser();
  }

  public getBrowser(): Browser {
    return this.browser;
  }

  public reportUrl(url: string): void {
    this.urlQueue.push(url);
  }

  public async start(): Promise<void> {
    while (this.urlQueue) {
      const url = this.urlQueue.shift();
      if (!url) {
        continue;
      }

      const crawler = new Crawler(url, this);
      await crawler.trip();
    }
  }
}
