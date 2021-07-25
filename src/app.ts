import { Crawler } from "./libs/crawler";

//crawler 객체 생성
/* 비동기로 처리 */
(async () => {
  const crawler = new Crawler("https://naver.com/");
  await crawler.trip();
})();
