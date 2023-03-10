const path = require('path')
const fs = require('fs')
const { encode, decode } = require('gpt-3-encoder')
const createCsvWriter = require('csv-writer').createArrayCsvWriter;

const REGEX_HEADERS = /^#+ ([^\r\n]+)$|^([^\r\n]+)[\r\n]-+$/gm
const REGEX_HEADERS_SPLIT = /^#+ [^\r\n]+$|^[^\r\n]+[\r\n]-+$/gm

const csvWriter = createCsvWriter({
    header: ['String'],
    path: 'Output.csv',
    append: true
});

function assertAllSectionsSmallEnough(content, file, headers) {
    for (let i = 0; i < content.length; i++) {
        const sectionLength = encode(content[i])
        if (sectionLength > 1000) {
            //todo deal with this later because I haven't ran into it yet
            throw new Error(`${file}: ${headers[i]} tokens is > 1000`)
        }
    }
}

function getHeadersAndContent(data) {
    // Get the headers ([0] is the page title)
    const headers = []
    let match
    while ((match = REGEX_HEADERS.exec(data)) !== null) {
        headers.push(match[1] ?? match[2])
    }

    // Get the content between the headers
    const content = data.split(REGEX_HEADERS_SPLIT)
    content.shift()

    return { headers, content };
}

const readDir = directory => {
    const files = fs.readdirSync(directory)

    files.forEach(async file => {
        const fullPath = path.join(directory, file)

        if (fs.statSync(fullPath).isDirectory()) {
            readDir(fullPath)
        } else if (fullPath.endsWith(".md")) {
            await readFile(fullPath)
        }
    })
}

const readFile = async file => {
    const data = fs.readFileSync(file, 'utf-8')
    const allEncoded = encode(data)

    if (allEncoded.length <= 1000) {
        await handleEncoding([{ string: data }])
        return
    }

    const {headers, content} = getHeadersAndContent(data);

    assertAllSectionsSmallEnough(content, file, headers);

    const chunks = []
    let combinedLength = 0
    let currentChunk = ''

    for (let i = 0; i < content.length; i++) {
        const string = '# ' + headers[i] + '\n' + content[i].trim();
        const encoded = encode(string)

        if (combinedLength + encoded.length <= 1000) {
            currentChunk += string
            combinedLength += encoded
        } else {
            chunks.push({
                string: currentChunk
            })

            currentChunk = string
            combinedLength = encoded.length
        }
    }

    if (currentChunk.length > 0) {
        chunks.push({
            string: currentChunk
        })
    }

    await handleEncoding(chunks)
    return chunks
}

const handleEncoding = async (chunks) => {
    const records = chunks.map(chunk => [chunk.string])
    await csvWriter.writeRecords(records)
}

readDir(path.join(__dirname, 'index'))