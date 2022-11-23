/**
 * @format
 */

 const multer = require('multer');
 const axios = require('axios');
 const FormData = require('form-data');
 const fs = require('fs');
 const path = require('path');
 
 // eslint-disable-next-line import/no-unresolved
 const uploadConfig = require('../../configUpload/upload');
 
 const { fileTmp } = uploadConfig;
 
 const storage = multer.diskStorage({
     destination: (req, file, cb) => {
         cb(null, fileTmp);
     },
     filename: (req, file, cb) => {
         cb(null, file.originalname);
     },
 });
 
 function fileFilter(req, file, cb) {
     const msg = {
         header: {
             message: 'Error',
             status: 500,
             access: null,
         },
         data: null,
     };
 
     if (file) {
         // only running with content-type multipart/form
         const splitFilename = file.originalname.split(' ');
         const joinFilename = splitFilename.join('_');
         const splitExt = joinFilename.split('.');
         const ext = splitExt[1];
         const checkExt = uploadConfig.fileExt.indexOf(ext.toLowerCase());
 
         if (splitExt.length > 2) {
             msg.header.message = uploadConfig.message.error.filename;
             return cb(msg);
         }
         if (checkExt < 0) {
             msg.header.message = uploadConfig.message.error.supportExt;
             return cb(msg);
         }
         if (file.size > uploadConfig.fileSize) {
             msg.header.message = uploadConfig.message.error.size;
             return cb(msg);
         }
 
         // eslint-disable-next-line no-param-reassign
         file.data = {
             filename: `${splitExt[0]}_${Date.now()}.${ext}`,
             path: uploadConfig.filePath,
         };
         if (uploadConfig.prefixFile !== undefined && uploadConfig.prefixFile) {
             // eslint-disable-next-line no-param-reassign
             file.data.filename = `${
                 uploadConfig.prefixFile
             }${Date.now()}.${ext}`;
         }
 
         // eslint-disable-next-line no-param-reassign
         file.originalname = file.data.filename;
 
         return cb(null, true);
     }
     // request not multipart
     return cb(null, false);
 }
 
 const uploads = multer({
     fileFilter,
     storage,
     limits: uploadConfig.limits,
 });
 
 module.exports = {
     files_upload: uploads,
     multer_err: multer.MulterError,
     sendToFileManager: (data, cb) => {
         const bodyFormData = new FormData();
         if (data.action === 'save') {
             bodyFormData.append(
                 'filebuffer',
                 fs.createReadStream(`${fileTmp}/${data.filename}`),
             );
         } else if (data.action === 'replace') {
             bodyFormData.append(
                 'filebuffer',
                 fs.createReadStream(`${fileTmp}/${data.currentFilename}`),
             );
         }
 
         if (data.path === undefined || data.filename === undefined) {
             return cb('Upload Failed : Path or Filename is required.', null);
         } else {
             bodyFormData.append('filepath', `${data.path}${data.filename}`);
             bodyFormData.append('action', data.action);
             axios
                 .create({
                     headers: bodyFormData.getHeaders(),
                     maxBodyLength : 20971520,
                     maxContentLength : 20971520
                 })
                 .post(uploadConfig.urlStore, bodyFormData)
                 .then((response) => {
                     if (response.data.header.status === 200) {
                         try {
                             fs.readdir(`${fileTmp}`, (err, files) => {
                                 if (err) return cb(null, data);
     
                                 // eslint-disable-next-line no-restricted-syntax
                                 for (const file of files) {
                                     // eslint-disable-next-line no-shadow
                                     fs.unlink(path.join(`${fileTmp}`, file), (err) => {
                                     });
                                 }
                             });   
                         } catch (error) {
                             
                         }
                         return cb(null, data);
                     } else {
                         return cb('Upload Failed', null);
                     }
                 })
                 .catch((error) => {
                     const msg = error;
                     // eslint-disable-next-line no-console
                     console.log(msg.toString(), 'UPLOADFILES');
                     return cb('Cannot find file update.', null);
                 });
         }
     },
     getFileManager: (data, cb) => {
         async function downloadImage(cbDownload) {
             const url = uploadConfig.urlGet;
             const paths = path.resolve(
                 __dirname,
                 '../../tmp',
                 data.filename,
             );
             const writer = fs.createWriteStream(paths);
 
             let filepaths = `${data.path}${data.filename}`;
             const split = data.path.split('/');
             const checkLast = split[split.length - 1];
             if (checkLast !== '/') {
                 filepaths = `${data.path}/${data.filename}`;
             }
             // const response = await axios({
             //     url,
             //     method: 'GET',
             //     responseType: 'stream',
             //     data: { filepath: filepaths },
             // });
 
             const response = await axios({
                 url,
                 method: 'GET',
                 responseType: 'stream',
                 data: { filepath: filepaths },
             }).catch((err)=>{
                 return cbDownload(err, null);
                 console.log(err.toString(), 77)
             });
 
             if(response){
                 response.data.pipe(writer);
                 cbDownload(response);
                 return new Promise((resolve, reject) => {
                     console.log(resolve, reject, 77)
                     writer.on('finish', resolve);
                     writer.on('error', reject);
                 });
             }else{
                 return cbDownload(response, null);
             }
             // response.data.pipe(writer);
             // cbDownload(response);
             // return new Promise((resolve, reject) => {
             //     writer.on('finish', resolve);
             //     writer.on('error', reject);
             // });
         }
 
         downloadImage((resp) => {
             setTimeout(() => {
                 return cb(resp);
             }, 500);
         });
     },
 };
 