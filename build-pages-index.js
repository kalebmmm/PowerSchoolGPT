const querystring = require("querystring")
const fetch = require('node-fetch')
const BASE_URL = 'https://docs.powerschool.com/rest/scroll-viewport/1.0/tree/children'

const links = []
async function getChildren(
    parent = '/PSHSA/latest',
    root = '/PSHSA/latest',
    current = '/PSHSA/latest',
    viewportId = 'AC1F2D3201721AF2D490849B6294105E',
) {

    links.push(parent)
    console.log(parent)

    const queryParams = {
        parent: parent,
        root: root,
        current: current,
        viewportId: viewportId,
    }

    let query = querystring.stringify(queryParams)
    let url = `${BASE_URL}?${query}`

    let res = await fetch(url).then(res => res.json())

    res.forEach(page => {
        getChildren(parent=page.link, current="")
    })

}

async function main() {
    await getChildren()
}

main()