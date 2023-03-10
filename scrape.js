const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')
const TurndownService = require('turndown')
const turndownService = new TurndownService({
    emDelimiter: "",
    strongDelimiter: "",
})

turndownService.addRule('fenceAllPreformattedText', {
    filter: ['pre'],
    replacement: function (content, node, options) {
        return (
            '\n\n' + options.fence + '\n' +
            node.firstChild.textContent +
            '\n' + options.fence + '\n\n'
        )
    },
});

function readDir(directory = path.join(__dirname, 'index')) {
    fs.readdirSync(directory).forEach(child => {
        const file = path.join(directory, child)

        if (fs.statSync(file).isDirectory()) {
            readDir(file)
        } else if (file.endsWith(".html")) {
            processFile(file)
        }

    })
}

function processFile(file) {
    const rawFileContent = fs.readFileSync(file, 'utf-8')
    const $ = cheerio.load(rawFileContent, { xmlMode: true })
    const title = $('title').text()
    const content = $('div.aui-item').first()

    // Convert table to csv in a <pre> tag
    content.find('table').each((i, table) => {
        const rows = $(table).find('tr')
        const csvData = []

        rows.each((i, row) => {
            const rowdata = []
            $(row).find('td, th').each((j, cell) => {
                rowdata.push(
                    '"' + $(cell).text().trim()
                        .replaceAll('<', '&lt;')
                        .replaceAll('>', '&gt;')
                        .replaceAll(/[\r\n]+/gm, ' ')
                        .replaceAll('"', '""') + '"'
                )
            })

            csvData.push(rowdata)
        })

        const csv = csvData.map(row => row.join(',')).join('\n')
        $(table).replaceWith(`<pre>${csv}</pre>`)
    });

    content.find('a').each((i, anchor) => {
        $(anchor).replaceWith($(anchor).text())
    })

    content.find('img').each((i, img) => {
        $(img).remove()
    })

    const md = `# ${title}\n\n` + turndownService.turndown(content.html())
        .replaceAll("&nbsp;", " ")
        .replaceAll(/^ +$/gm, "")
        .replaceAll(/(?<=\S) {2,}/gm, " ")

    const outfile = path.join(path.dirname(file), "page.md")
    fs.writeFileSync(outfile, md)
    console.log(`Processed ${file}`)
}

readDir()