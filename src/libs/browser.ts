import { launch, Browser as HeadlessBrowser } from "puppeteer";

export class Browser {
  private browser?: HeadlessBrowser;

  public async getInstance(): Promise<HeadlessBrowser | null> {
    if (this.browser) {
      return this.browser;
    }
    this.browser = await launch();

    if (!this.browser) {
      return null;
    }
    return this.browser;
  }
} //싱글톤 패턴 객체가 너무 무겁거나 그 외의 경우 객체가 하나만 생성되길 원할때 사용
