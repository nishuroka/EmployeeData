const express = require("express")
const app = express()

var jsonParser = express.json()
const toPdf = require('pdfkit')
const fs = require('fs')
const { google } = require('googleapis')
const { client_id, client_secret, redirect_uris, refresh_token } = require('./config.json')
const moment = require('moment')
const { rejects } = require("assert")

app.post('/', jsonParser, async (request, response) => {

    let ourPdf = new toPdf
    ourPdf.pipe(fs.createWriteStream(`${request.body.formName}.pdf`))


    for (const key in request.body) {
        if (Object.hasOwnProperty.call(request.body, key)) {
            const element = request.body[key];
            ourPdf.text(`${key.toUpperCase()}: ${element}`)
        }
    }

    ourPdf.end()
    let folder = await createFolder(request.body.email)
    let subFolder = await createFolder(moment(new Date(request.body.date)).format('DD-MM-yyyy'), folder.data.id)
    await saveFile(`${request.body.formName}.pdf`, `./${request.body.formName}.pdf`, 'application/pdf', subFolder.data.id, response)


})

function createFolder(folderName, parentId){
    const client = new google.auth.OAuth2(client_id, client_secret, redirect_uris)
        client.setCredentials({ refresh_token: refresh_token })
        let drive = google.drive({ version: 'v3', auth: client })
    return drive.files.create({
    //   resource: {
    //     name: folderName,
    //     mimeType: 'application/vnd.google-apps.folder', parent
    //   },
    requestBody: {
                        name: folderName,
                        mimeType: 'application/vnd.google-apps.folder',
                        parents: parentId ? [parentId] : [],
                    },
      fields: 'id, name',
    });
  }


function saveFile(fileName, filePath, fileMimeType, folderId, response) {
    const client = new google.auth.OAuth2(client_id, client_secret, redirect_uris);
    client.setCredentials({ refresh_token: refresh_token });

    drive = google.drive({
        version: 'v3',
        auth: client,
    });

    return drive.files.create({
        requestBody: {
            name: fileName,
            mimeType: fileMimeType,
            parents: folderId ? [folderId] : [],
        },
        media: {
            mimeType: fileMimeType,
            body: fs.createReadStream(filePath),
        },
    }, (err, file) => {
        if (err) {
            console.log("Error while savinging file to google drive.", err);
            response.statusCode(500).send({
                "message": "File has been uploaded successfully"
            })
        } else {
            fs.unlinkSync(filePath)
            response.send({
                "message": "File has been uploaded successfully"
            })
        }
    });
}

app.listen(3003, () => {
    console.log("The app is running")
})