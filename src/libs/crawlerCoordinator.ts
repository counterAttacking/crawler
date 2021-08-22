//0815
//url리스트 관리 및 크롤러의 요청을 생성
//프로그램 메인
//
import { Crawler } from "./crawler";

export class CrawlerCoordinator {
  //url리스트는 '큐'로 관리 -> why? 성능을 끌어올리고자
  private urlQueue: string[];

  public constructor() {
    this.urlQueue = [];
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
