import request, { Response } from 'request'
import moment from 'moment-timezone'

export interface Item {
  rendered_body: string
  coediting: boolean
  comments_count: number
  created_at: Date
  group: null
  id: string
  likes_count: number
  private: boolean
  reactions_count: number
  tags: Tag[]
  title: string
  updated_at: Date
  url: string
  user: User
  page_views_count: number
}

export interface Tag {
  name: string
  versions: any[]
}

export interface User {
  description: string
  facebook_id: string
  followees_count: number
  followers_count: number
  github_login_name: string
  id: string
  items_count: number
  linkedin_id: string
  location: string
  name: string
  organization: string
  permanent_id: number
  profile_image_url: string
  team_only: boolean
  twitter_screen_name: string
  website_url: string
}

export interface Stocker {
  description: string
  facebook_id: string
  followees_count: number
  followers_count: number
  github_login_name: string
  id: string
  items_count: number
  linkedin_id: string
  location: string
  name: string
  organization: string
  permanent_id: number
  profile_image_url: string
  team_only: boolean
  twitter_screen_name: string
  website_url: string
}

export interface QiitaData {
  baseDate: Date
  id: string
  created_at: Date
  updated_at: Date
  title: string
  page_views_count: number
  likes_count: number
  tags: string[]
  url: string
  stockers_count: number
}

function getListPromise(access_token: string, pageNumber: number, per_page: number): Promise<Array<Item>> {
  const auth_options = {
    uri: 'https://qiita.com/api/v2/authenticated_user/items',
    qs: {
      page: pageNumber,
      per_page: per_page,
    },
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${access_token}`,
    },
  }
  const promise: Promise<Array<Item>> = new Promise((resolve, reject) => {
    request.get(auth_options, (err: any, _response: Response, body: any): void => {
      if (err) {
        reject(err)
        return
      }
      resolve(JSON.parse(body))
    })
  })
  return promise
}

function getViewPromise(access_token: string, id: string): Promise<Item> {
  const auth_options = {
    uri: `https://qiita.com/api/v2/items/${id}`,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${access_token}`,
    },
  }
  const promise: Promise<Item> = new Promise((resolve, reject) => {
    request.get(auth_options, (err: any, _response: Response, body: any): void => {
      if (err) {
        reject(err)
        return
      }
      resolve(JSON.parse(body))
    })
  })
  return promise
}

function getStockersPromise(access_token: string, id: string): Promise<Array<Stocker>> {
  const auth_options = {
    uri: `https://qiita.com/api/v2/items/${id}/stockers`,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${access_token}`,
    },
  }
  const promise: Promise<Array<Stocker>> = new Promise((resolve, reject) => {
    request.get(auth_options, (err: any, _response: Response, body: any): void => {
      if (err) {
        reject(err)
        return
      }
      resolve(JSON.parse(body))
    })
  })
  return promise
}

// https://qiita.com/notakaos/items/3bbd2293e2ff286d9f49

// $ npx ts-node src/index.ts xxx         -> コンソール出力のみ
// $ npx ts-node src/index.ts xxx true    -> tick_qiita に追加POST
// $ npx ts-node src/index.ts xxx true qiita  -> qiita にPOST(記事ID_YYYYMMDD をIDとして存在したらUpdate)

if (!module.parent) {
  const access_token = process.argv[2]
  const postFlagArg = process.argv[3]
  const destArg = process.argv[4]
  const per_page = 100

  const dest = destArg ? destArg : 'tick_qiita'
  const postFlag = postFlagArg ? postFlagArg.toLowerCase() === 'true' : false
  // console.log(postFlag)
  // console.log(dest)

  async function main() {
    for (let number = 1; number < 5; number++) {
      // デフォルト100x5記事までは検索する
      const itemList: Array<Item> = await getListPromise(access_token, number, per_page)
      // const filtered = itemList.filter((item) => {
      //   // // UiPath タグが付いてる場合OK
      //   // const fTags = (item.tags as Array<any>).filter(
      //   //   (tag) => tag.name === "UiPath"
      //   // );
      //   // return fTags.length > 0;
      //   return true
      // })

      const now = moment()
      const baseDate = now.toDate()
      const baseDateStr = now.format('YYYYMMDD')
      for (const item of itemList) {
        // itemList のItemには、page_views_countが入っていないので個別に取得する必要がある。
        const resultWithViewCount: Item = await getViewPromise(access_token, item.id)
        const stockers: Array<Stocker> = await getStockersPromise(access_token, item.id)
        const postData: QiitaData = {
          baseDate: baseDate,
          id: item.id,
          created_at: item.created_at,
          updated_at: item.updated_at,
          title: item.title,
          page_views_count: resultWithViewCount.page_views_count,
          likes_count: item.likes_count,
          stockers_count: stockers.length,
          tags: item.tags.map((tag: any) => tag.name),
          url: item.url,
        }
        if (postFlag) {
          // destが tick_qiita のときだけは、都度追加。それ以外は、記事ID_YYYYMMDDと日毎のデータを蓄積
          const elastic_url =
            dest === 'tick_qiita'
              ? `http://192.168.10.200:9202/${dest}/_doc/`
              : `http://192.168.10.200:9202/${dest}/_doc/${item.id}_${baseDateStr}`
          postLog(elastic_url, postData)
        } else {
          console.log(postData)
        }
        // const row = `${item.created_at},'${item.title}',${result.page_views_count},${item.likes_count},${item.url}`;
        // console.log(row);
      }

      if (itemList.length !== per_page) {
        break
      }
    }
  }
  main()
}

export const postLog = (elastic_url: string, postData: any) => {
  const option = {
    url: elastic_url,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    json: postData,
  }
  request(option, function (error, response, body) {
    if (!error) {
      console.log(body)
    }
  })
}

// if (!module.parent) {
//   function main() {
//     getListPromise()
//       .then((itemList) => {
//         const filtered = itemList.filter((item) => {
//           // UiPath タグが付いてる場合OK
//           const fTags = (item.tags as Array<any>).filter(
//             (tag) => tag.name === "UiPath"
//           );
//           return fTags.length > 0;
//         });

//         const promises = [];
//         for (const item of filtered) {
//           // const row = `'${item.title}',${item.likes_count},${item.url}`;
//           // console.log(row)
//           promises.push(getViews(item.id));
//         }
//         return Promise.all(promises);
//       })
//       .then((results) => {

//         for (const result of results) {
//           const row = `${result.page_views_count},`;
//           console.log(row);
//         }
//       });
//   }
//   main();
// }
