import axios, { AxiosError } from "axios";
import parse from "node-html-parser";
import chardet from "chardet";
import { KMR } from "koalanlp/API";
import { Tagger } from "koalanlp/proc";
import { CrawlerCoordinator } from "./crawlerCoordinator";
import { Keyword } from "../models/Keyword";
import { Link } from "../models/Link";
import { KeywordLink } from "../models/KeywordLink";

export class Crawler {
  private url: string;
  private content?: string;
  private coordinator: CrawlerCoordinator;
  private host?: string; //도메인(http://www.naver.com)

  public constructor(url: string, coordinator: CrawlerCoordinator) {
    this.url = url;
    this.coordinator = coordinator;
  }

  //1) get메서드 사용
  //2)어느서버에 접속했을떄 응답이 없을경우, =>3000(3s) 있다가 다음 사항에 응답
  //3) data에는 string 타입으로 html이 들어옴
  private async fetch(): Promise<string | null> {
    const browser = await this.coordinator.getBrowser().getInstance();
    if (!browser) {
      return null;
    }
    const page = await browser.newPage();
    await page.goto(this.url);
    const result = await page.content();

    if (result) {
      this.content = result;
      return this.content;
    }

    return null;
  }

  private detectEncoding(data: Buffer): string | null {
    return chardet.detect(data);
  }

  /*반환값이 Promise의 void타입으로 되어있음  */
  public async trip(): Promise<void> {
    const result = await this.fetch();

    if (result) {
      this.content = result;
      await this.parseContent();
    } else {
      console.log("Failed to get url data");
    }
  }

  //1. 크롤링에서 결과로 받은 content(.html)에서 anchor태그 모두 찾아냄 ->url패턴을 찾아내기
  //2. 이후 anchor태그에서 url리스트 추출하기
  private async parseContent(): Promise<void> {
    if (!this.content) {
      return;
    }

    const html = parse(this.content).querySelector("body");
    const anchors = html.querySelectorAll("a");

    anchors.forEach((anchor) => {
      const href = anchor.getAttribute("href");
      if (!href) {
        return;
      }

      // '/^' 뜻은 처음부터 보겠다는 것
      const matched = href.match(
        /^(((http|ftp|https):\/\/)|(\/))*[\w-]+(\.[\w-]+)*([\w.,@?^=%&amp;:/~+#-]*[\w@?^=%&amp;/~+#-])?/i
      );

      if (!matched) {
        return null;
      }

      let url = matched[0];

      if (url.startsWith("/")) {
        url = this.host + url;
      } else if (!href.startsWith("http")) {
        url = this.host + "/" + url;
      }

      //this.coordinator.reportUrl(url);
    });

    html.querySelectorAll("script").forEach((script) => script.remove());

    const text = html.text.replace(/\s{2,}/g, " ");
    await this.parseKeywords(text);

    // //1. anchor태그 ->
    // // '/gi' (gi는 전체를 뜻함 -> 곧 List로 가져와야 한다 => 반복문으로 돌려야 한다)
    // // '\1' : 1회이상 매칭되는 경우를 의미
    // //반복문을 돌리기 위해서 가장 best? 'forEach()' => href(url)을 끌고 올 수 있게 해야함

    // const anchors = this.content.match(
    //   //(<a href='여기서 내가 이제 이동할 url'>) 추출
    //   /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1>/gi
    // );

    // if (!anchors) {
    //   return;
    // }

    // //2.url 찾기 (정규표현식 ) -> 불필요한 부분 href부터 찾아서 함-> 이후 replace()이용
    // /* 'forEach()'는 주로 어떤 값을 뽑아내고 싶을때 씀
    // (((http|ftp|https):\/\/)|(\/))*[\w-]+(\.[\w-]+)*([\w.,@?^=%&amp;:/~+#-]*[\w@?^=%&amp;/~+#-]) )
    // href href="" 이런 식으로 나올 것이며
    // replace(a,b)  => a를 b로 치환*/

    // anchors.forEach((anchor) => {
    //   const matched = anchor.match(
    //     /href=('|")(((http|ftp|https):\/\/)|(\/))*[\w-]+(\.[\w-]+)*([\w.,@?^=%&amp;:/~+#-]*[\w@?^=%&amp;/~+#-])?('|")/i
    //   );

    //   if (!matched) {
    //     return null;
    //   }

    //   let url = matched[0]
    //     .replace("href=", "")
    //     .replace(/"/g, "")
    //     .replace(/'/g, "");

    //   //console.log(url); //출력

    //   // 1. url 찾아냄
    //   // 2. 상대경로인지 판단("/"로 시작되어 있는 아이들)
    //   // 3. this.host + 내가 만들어준 url
    //   if (url.startsWith("/")) {
    //     url = this.host + url;
    //   }

    //   this.coordinator.reportUrl(url);
    //});
  }

  private async parseKeywords(text: string) {
    const tagger = new Tagger(KMR);
    const tagged = await tagger(text);
    const newKeywords: Set<string> = new Set();
    const existKeywords: Keyword[] = [];

    for (const sent of tagged) {
      for (const word of sent._items) {
        for (const morpheme of word._items) {
          if (morpheme._tag === "NNG" || morpheme._tag === "NNP" ||
            morpheme._tag === "NNB" || morpheme._tag === "NP" || morpheme._tag === "NR" ||
            morpheme._tag === "VV" || morpheme._tag === "SL") {
            console.log(morpheme.toString());
          }

          /*try {
            await Keyword.create({
              name: morpheme._surface,
            });
          } catch (e) {
            console.error("duplicated or error occurrer", e);
          }*/

          {
            const keyword = morpheme._surface.toLowerCase();
            // findAll(), findOne()은 객체를 전달하는 방식으로 사용
            const exist = await Keyword.findOne({
              // where절은 일반적으로 And 연산
              // {name:"name",age:15} : name이 name이고 age가 15인 조건
              where: {
                name: morpheme._surface
              },
            });

            // 중복되는 keyword가 Keyword Table에 존재하지 않도록
            if (!exist) {
              newKeywords.add(keyword);
            } else {
              existKeywords.push(exist);
            }
          }
        }
      }
    }

    const isURLExist = await Link.findOne({
      where: {
        url: this.url,
      },
    });
    if (!isURLExist) {
      // Links Table 생성
      let newLink;
      if (newKeywords.size > 0) {
        const keywords = Array.from(newKeywords).map((keyword) => {
          return { name: keyword };
        });

        newLink = await Link.create(
          {
            url: this.url,
            description: text.slice(0, 512),
            keywords: keywords
          },
          {
            include: [Keyword],
          }
        );
      }

      // Keywordlinks Table 생성
      if (newLink) {
        const addedIds: Set<bigint> = new Set();
        for (const keyword of existKeywords) {
          if (!addedIds.has(keyword.id)) {
            await KeywordLink.create({
              keywordId: keyword.id,
              linkId: newLink.id,
            });
            addedIds.add(keyword.id);
          }
        }
      }
    }
  }
}
