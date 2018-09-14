An app to only implement a functionality to upload image files ( only .jpeg or .png are accepted) to mongodb database in a node app. I am using mLab for mongodb and multer and multer-gridfs-storage (the GridFS storage engine for Multer to store uploaded files directly to MongoDb) for file uploading.

Deployed in Heroku, just click on the below image.

[<img src="Upload-photo-to-mongo.jpeg">](https://morning-waters-65063.herokuapp.com/)

App.js is our server-side code and the client-side of the application ``( ./view/index.ejs )`` would make request to the API in ``app.js`` to get the data from the database (hosted in mLab).

Using gridfs-stream for streaming files to and from MongoDB GridFS.

Bootstrap is used for the responsiveness of the upload form.

### How GridFS works and why we would need this

Mongodb provides us with a very efficient way to store files directly in db rather than in file system. So basically what this means is, suppose you need to store an image file or an audio or video file you can directly store that in mongodb itself.

However, MongoDB is a NoSQL document-database, meaning it stores the data in the form of documents. Default document size limit in MongoDB is 16MB. That is if you want to store files upto 16MB then it’s not a big deal. But to store heavy files of size exceeding 16MB, MongoDB provides a module called GridFS. What GridFS does is that it divides your files into the chunks of 255kB (initially it was 256kB) and then stores it into the database.

What exactly happens is it creates two collections in your database instance that you are currently using. In one collection, it stores the 255kB chunks of the files and the other collection is a document that contains the meta-data of your file.

### More reading on GridFS

[https://docs.mongodb.com/manual/core/gridfs/](https://docs.mongodb.com/manual/core/gridfs/)


### Why I need methodOverride -

1> [https://stackoverflow.com/questions/165779/are-the-put-delete-head-etc-methods-available-in-most-web-browsers/166501#166501](https://stackoverflow.com/questions/165779/are-the-put-delete-head-etc-methods-available-in-most-web-browsers/166501#166501)

HTML forms only support GET and POST as HTTP request methods (https://www.w3schools.com/tags/att_form_method.asp).

A workaround for this is to tunnel other methods through POST by using a hidden form field which is read by the server and the request dispatched accordingly.

However, GET, POST, PUT and DELETE are supported by the implementations of XMLHttpRequest (i.e. AJAX calls) in all the major web browsers (IE, Firefox, Safari, Chrome, Opera).

2> methodOverride lets you use HTTP verbs such as PUT or DELETE in places where the client doesn't support it.

The methodOverride() middleware is for requests from clients that only natively support simple verbs like GET and POST. So in those cases you could specify a special query field (or a hidden form field for example) that indicates the real verb to use instead of what was originally sent. That way your backend .put()/.delete()/.patch()/etc. routes don't have to change and will still work and you can accept requests from all kinds of clients.

https://stackoverflow.com/questions/23643694/whats-the-role-of-the-method-override-middleware-in-express-4](https://stackoverflow.com/questions/23643694/whats-the-role-of-the-method-override-middleware-in-express-4)

3> [http://philipm.at/2017/method-override_in_expressjs.html](http://philipm.at/2017/method-override_in_expressjs.html)

In trying to send data from an HTML form to an ExpressJS backend I soon discovered two things:

FORM elements only support GET and POST, not PUT, nor DELETE;
ExpressJS does not have a built-in way to address this but fortunately there’s a middleware plugin, method-override, that does.

4> However mostly now PUT, DELETE, HEAD etc HTTP methods are available in all modern browsers.

To be compliant with XMLHttpRequest Level 2 browsers must support these methods.
[https://stackoverflow.com/questions/165779/are-the-put-delete-head-etc-methods-available-in-most-web-browsers/166501#166501](https://stackoverflow.com/questions/165779/are-the-put-delete-head-etc-methods-available-in-most-web-browsers/166501#166501)

