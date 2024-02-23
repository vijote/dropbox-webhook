console.info("main.js")

const { Dropbox: Dbx, DropboxAuth: DbxAuth } = Dropbox
const form = document.getElementById("file-form")

form.addEventListener('submit', (event => {
    event.preventDefault()

    const formData = new FormData(event.target)
    const file = formData.get('file')
    
    uploadFileInSession(file)
}))

const dbxAuth = new DbxAuth({
    
})

async function uploadFileInSession(file) {
    if (!file) throw new Error("No seleccionaste un archivo")

    const chunksData = splitFileSize(file.size)
    sessionStorage.setItem('file_session_chunk_count', chunksData.length.toString())

    await startUpload(chunksData, file)

    for (let chunkIndex = 1; chunkIndex < chunksData.length - 1; chunkIndex++) {
        const offset = chunksData.at(chunkIndex - 1).end
        const currentChunkData = chunksData[chunkIndex]
        const currentChunk = file.slice(currentChunkData.start, currentChunkData.end)

        await appendFileChunk(currentChunk, offset, chunkIndex)
    }

    const offset = chunksData.at(-2).end
    const currentChunkData = chunksData.at(-1)
    const currentChunk = file.slice(currentChunkData?.start, currentChunkData?.end)

    closeUpload(currentChunk, offset)
}

async function startUpload(chunksData, file) {
    const dbx = await createDropboxClient()

    const fileSessionStart = await dbx.filesUploadSessionStart({
        contents: file.slice(chunksData[0].start, chunksData[0].end)
    })

    sessionStorage.setItem('file_session_id', fileSessionStart.result.session_id)
    sessionStorage.setItem('file_session_next_chunk', '1')

    return fileSessionStart
}

async function appendFileChunk(chunk, offset, index) {
    const dbx = await createDropboxClient()

    const sessionContinue = await dbx.filesUploadSessionAppendV2({
        cursor: {
            session_id: sessionStorage.getItem('file_session_id'),
            offset
        },
        contents: chunk
    })

    sessionStorage.setItem('file_session_next_chunk', String(index + 1))

    return sessionContinue
}

async function closeUpload(chunk, offset) {
    const dbx = await createDropboxClient()

    const sessionContinue = await dbx.filesUploadSessionFinish({
        cursor: {
            offset,
            session_id: sessionStorage.getItem('file_session_id'),
        },
        contents: chunk,
        commit: {
            path: '/metal2.mp4'
        }
    })

    sessionStorage.removeItem('file_session_next_chunk')
    sessionStorage.removeItem('file_session_id')

    // TODO: Analizar que hacer en caso de que ya exista el archivo, subidas dobles
    return sessionContinue
}

async function createDropboxClient() {
    // Casteo a promise necesario ya que esta mal documentado en el sdk, puede llegar a ser una promesa
    await (dbxAuth.checkAndRefreshAccessToken())

    return new Dbx({
        accessToken: dbxAuth.getAccessToken(),
        refreshToken: dbxAuth.getAccessToken()
    })
}

async function getFiles() {
    const dbx = await createDropboxClient()

    dbx.filesListFolder({
        path: ''
    })
}

function splitFileSize(fileSize) {
    const chunkSize = 4 * 1024 * 1024; // 4 mb
    const chunkCount = Math.ceil(fileSize / chunkSize);

    const chunksData = []

    for (let currentChunk = 0; currentChunk < chunkCount; currentChunk++)
        chunksData.push({
            start: currentChunk * chunkSize,
            end: Math.min(currentChunk * chunkSize + chunkSize, fileSize)
        })

    return chunksData;
}

