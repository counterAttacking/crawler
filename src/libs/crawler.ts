import axios, { AxiosError } from "axios";

export class Crawler {
  private url: string;
  private content?: string;

  public constructor(url: string) {
    this.url = url;
  }

  //1) get메서드 사용 2)어느서버에 접속했을떄 응답이 없을경우, =>3000(3s) 있다가 다음 사항에 응답
  //3) data에는 string 타입으로 html이 들어옴
  private async fetch(): Promise<string | null> {
    try {
      const { data } = await axios.get(this.url, {
        timeout: 3030,
      });

      return data;
    } catch (error) {
      if (error.isAxiosError) {
        const e: AxiosError = error;
        console.error(e.response?.status); //에러가 있다면 status를 넘겨주어라.
      }
    }
    return null;
  }

  /*반환값이 Promise의 void타입으로 되어있음  */
  public async trip(): Promise<void> {
    const result = await this.fetch();

    if (result) {
      this.content = result;
      console.log(result);
    } else {
      console.log("Failed to get url data");
    }
  }
}
