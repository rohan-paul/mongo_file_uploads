const express = require('express');
const bodyParser = require('body-parser')
const path = require('path');
const crypto = require ('crypto') // this is node's built-in crypto module
const mongoose = require('mongoose');
const multer = require('multer');
const port = 5080;

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

// Streaming files to and from MongoDB
// https://github.com/aheckmann/gridfs-stream#using-with-mongoose
conn.once('open', () => {
    // Initialize the gfs
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
})


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

/* 1> crypto.randomBytes - https://nodejs.org/api/crypto.html#crypto_crypto_randombytes_size_callback -

Generates cryptographically strong pseudo-random data. The size argument is a number indicating the number of bytes to generate. So basically the crypto.randomBytes() is used to generate random string.

2> buf.toString - https://nodejs.org/api/buffer.html#buffer_buf_tostring_encoding_start_end

Decodes buf to a string according to the specified character encoding in encoding. */


/* Now Set multer storage engine to the newly created object - https://github.com/devconcept/multer-gridfs-storage
The below code effectively defines where I want to save my uploaded files. When an image is received by the route, it will be automatically saved by multer to this directory. */
const upload = multer({ storage });

/* @route GET /
@desc Loads form
Below codes to first access file metadata and check if it exists and is an image, and then render the index file.
gfs.files.find() - All file meta-data (file name, upload date, contentType, etc) are stored in a special mongodb collection separate from the actual file data. This collection can be queried directly: */
app.get('/', (req, res) => {
    gfs.files.find().toArray((err, files) => {
        if (!files || files.length === 0) {
            res.render('index', { files: false });
        } else {
            files.map(file => {
                if (
                    file.contentType === 'image/jpeg' ||
                    file.contentType === 'image/png'
                ) {
                    file.isImage = true;
                } else {
                    file.isImage = false;
                }
            })
            res.render('index', { files: files });
        }
    })
})


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

// @route GET /files
// @desc  Display all files in JSON - same logic as above for rendering the index.ejs file
app.get('/files', (req, res) => {
    gfs.files.find().toArray((err, files) => {
        if (!files || files.length === 0 ) {
            return res.status(404).json({
                err: 'No files exists'
            });
        }

        // Else files exists, hence return it
        return res.json(files)
    })
})

// @route GET /files/:filename
// @desc  Display single file object
app.get('/files/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        if (!file || file.length === 0 ) {
            return res.status(404).json({
                err: 'No file exists'
            });
        }
        // Else the files exists, hence return it
        return res.json(file)
    })
})

// @route GET /image/:filename
// @desc Display Image
app.get('/images/:filename', (req, res) => {
    gfs.files.findOnde({ filename: req.params.filename }, (err, file) => {
        if (!file || file.length === 0) {
            return res.status(404).json({
                err: 'No file exists'
            })
        }

        // check for image and if true, then I have to create a readStream to read that file
        if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
            const readStream = gfs.createReadStream(file.filename);
            readStream.pipe(res)
        } else {
            res.status(404).json({
                err: 'File is not a jpeg or png file type'
            });
        }
    });
})


// In the pipe function above, I am reading from the readStream once it becomes available, and writing it to a destination writable stream. Note - in a Node.js based HTTP server, request is a readable stream and response is a writable stream.

// @route DELETE /files/:id
// @desc Delete file
app.delete('/files/:id', (req, res) => {
    gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
        if (err) {
            return res.status(404).json({
                err: err
            })
        }
        res.redirect('/')
    })
})

app.listen(port, () => console.log(`The server started on port ${port}`))