import { initialize } from "koalanlp/Util";
import { CrawlerCoordinator } from "./libs/crawlerCoordinator";
import database from "./config/database";

(async () => {
  database.sync({
    alter: true,
  });

  await initialize({
    packages: { KMR: "2.0.4", KKMA: "2.0.4" },
    verbose: true,
  });

  const coordinator = new CrawlerCoordinator();
  coordinator.reportUrl("https://news.naver.com/");
  await coordinator.start();
})();