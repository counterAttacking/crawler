// //crawler 객체 생성
// /* 비동기로 처리 */

// import { CrawlerCoordinator } from "./libs/crawlerCoordinator";

// const text = `<body>
// <a href = "https://naver.com"> hello </a>
// <div>sdfdsfsf</div>
// <a href="https://kakao.com">world</a>
// </body>`;

// //gi-> 대소문자 가리지 않음
// const matched = text.match(/<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1>/gi);
// console.log(matched);
// //<a>로 시작되는 아이들이 나옴
// const multipleMatched = text.match(/<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1>/g);
// console.log(multipleMatched);

// (async () => {
//   const coordinator = new CrawlerCoordinator();
//   coordinator.reportUrl("https://naver.com/");
//   await coordinator.start();
// })();

import { parse } from "node-html-parser";
import { CrawlerCoordinator } from "./libs/crawlerCoordinator";

const text = `<body>
<a href="https://naver.com"> hello </a>
<div> sdfdsfsf </div>
<a href="https://kakao.com">world</a>
</body>`;

const html = parse(text);
console.log(html.querySelector("a"));

(async () => {
  const coordinator = new CrawlerCoordinator();
  coordinator.reportUrl("https://news.naver.com/");
  await coordinator.start();
})();
