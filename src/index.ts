import request, { Response } from 'request'

const access_token = 'xxx'

function getListPromise(pageNumber: number): Promise<Array<any>> {
  const auth_options = {
    uri: `https://qiita.com/api/v2/authenticated_user/items?page=${pageNumber}&per_page=100`,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${access_token}`,
    },
  }
  const promise: Promise<any> = new Promise((resolve, reject) => {
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

function getViews(id: string): Promise<any> {
  const auth_options = {
    uri: `https://qiita.com/api/v2/items/${id}`,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${access_token}`,
    },
  }
  const promise: Promise<any> = new Promise((resolve, reject) => {
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

if (!module.parent) {
  const dest = process.argv[3] ? process.argv[3] : 'tick_qiita'
  const postFlag = process.argv[2] ? process.argv[2].toLowerCase() === 'true' : false
  // console.log(postFlag)
  // console.log(dest)

  const elastic_url = `http://192.168.10.200:9202/${dest}/_doc/`

  async function main() {
    for (let number = 1; number < 30; number++) {
      const itemList: Array<any> = await getListPromise(number)
      const filtered = itemList.filter((item) => {
        // // UiPath タグが付いてる場合OK
        // const fTags = (item.tags as Array<any>).filter(
        //   (tag) => tag.name === "UiPath"
        // );
        // return fTags.length > 0;
        return true
      })

      for (const item of filtered) {
        const result = await getViews(item.id)
        // console.log(result);
        const postData = {
          baseDate: new Date(),
          id: result.id,
          created_at: result.created_at,
          updated_at: result.updated_at,
          title: result.title,
          page_views_count: result.page_views_count,
          likes_count: result.likes_count,
          tags: item.tags.map((tag: any) => tag.name),
          url: result.url,
        }
        if (postFlag) {
          postLog(elastic_url, postData)
        } else {
          console.log(postData)
        }
        // const row = `${item.created_at},'${item.title}',${result.page_views_count},${item.likes_count},${item.url}`;
        // console.log(row);
      }

      if (itemList.length !== 100) {
        break
      }
    }
  }
  main()
}

export const postLog = (elastic_url: string, postData: any) => {
  const optionEla = {
    url: elastic_url,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    json: postData,
  }
  request(optionEla, function (error, response, body) {
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
