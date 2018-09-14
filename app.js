const express = require('express');
const bodyParser = require('body-parser')
const path = require('path');
const crypto = require ('crypto') // this is node's built-in crypto module
const mongoose = require('mongoose');
const multer = require('multer');

/* Why multer-gridfs-storage - https://github.com/devconcept/multer-gridfs-storage/wiki/Using-generator-functions - GridFS storage engine for Multer to store uploaded files directly to MongoDb
*/
const GridFsStorage = require('multer-gridfs-storage')

/* gridfs-stream is required for streaming files to and from MongoDB GridFS.
The gridfs-stream module exports a constructor that accepts an open mongodb-native db and the mongodb-native driver you are using. The db must already be opened before calling createWriteStream or createReadStream. */
const Grid = require('gridfs-stream')

/* methodOveerride - Lets you use HTTP verbs such as PUT or DELETE in places where the client doesn't support it.

The methodOverride() middleware is for requests from clients that only natively support simple verbs like GET and POST. So in those cases you could specify a special query field (or a hidden form field for example) that indicates the real verb to use instead of what was originally sent. That way your backend .put()/.delete()/.patch()/etc. routes don't have to change and will still work and you can accept requests from all kinds of clients
HTML forms only support GET and POST as HTTP request methods (https://www.w3schools.com/tags/att_form_method.asp).

A workaround for this is to tunnel other methods through POST by using a hidden form field which is read by the server and the request dispatched accordingly.

However, GET, POST, PUT and DELETE are supported by the implementations of XMLHttpRequest (i.e. AJAX calls) in all the major web browsers (IE, Firefox, Safari, Chrome, Opera)..
*/
const methodOverride = require('method-override')

const app = express()

// Middleware
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.set('view engine', 'ejs')

// Mongo URI
const mongoURI = 'mongodb://root:abc123@ds153552.mlab.com:53552/mongo-node-file-upload-testing-app'

// Create mongo connection
const conn = mongoose.createConnection(mongoURI)

// Init gridfs-stream
let gfs;

// https://github.com/aheckmann/gridfs-stream#using-with-mongoose


/* Create a storage object with a given configuration
https://github.com/devconcept/multer-gridfs-storage/wiki/Using-generator-functions

https://github.com/devconcept/multer-gridfs-storage
Internally the function crypto.randomBytes is used to generate names. In this example, files are named using the same format plus the extension as received from the client, also changing the collection where to store files to uploads
*/
const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname)
                const fileInfo = {
                    filename: filename,
                    bucketName: 'upload'
                }
                resolve(fileInfo)
            })
        })
    }
})
// Set multer storage engine to the newly created object - https://github.com/devconcept/multer-gridfs-storage
// The below code effectively defines where I want to save my uploaded files. When an image is received by the route, it will be automatically saved by multer to this directory.
const upload = multer({ storage });


/* @route POST /upload
 @desc  Uploads file to DB
For multer It's very crucial that the file name in upload.single() matches the name attribute in my index.html. i.e. the part < name="file >
When an image is received by the route, it will be automatically saved by multer to the directory I previously specified. The upload.single call is handled by the multer middleware.

https://github.com/expressjs/multer#usage - Multer adds a body object and a file or files object to the request object. The body object contains the values of the text fields of the form, the file or files object contains the files uploaded via the form. Thats why I can use req.file in the below

https://github.com/expressjs/multer#singlefieldname - .single(fieldname) - Accept a single file with the name fieldname. The single file will be stored in req.file.
*/
app.post('/upload', upload.single('file'), (req, res) => {
    res.redirect('/')
})
