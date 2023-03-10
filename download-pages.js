const fs = require('fs')
const fetch = require('node-fetch')

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
    const urls = fs.readFileSync('pages-index.txt', 'utf-8').split("\r\n")

    for (let i = 0; i < urls.length; i++) {
        const url = urls[i]
        const folder_struct = url.substring(url.indexOf("/latest") + '/latest'.length)
            .replaceAll("/", "\\")

        const path = __dirname + '\\index' + folder_struct
        const file = path + "\\page.html"

        if (!fs.existsSync(path)) {
            fs.mkdirSync(path)
        }

        let text = await fetch(url).then(res => res.text())

        if (text.indexOf("Request unsuccessful") >= 0) {
            console.log(`Got error on ${url}`)
            await sleep(30 * 1000)
            i--;
            continue
        }

        fs.writeFileSync(file, text)

        console.log(file)
        await sleep(1000)
    }
}

main()


