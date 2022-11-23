/** @format */

const appCnf = require('./app');

// Filter
const fileExt = ['doc', 'docx', 'pdf', 'jpg', 'jpeg', 'png'];
const content_type = ['image/jpg','image/jpeg','image/png','application/pdf'];
const maxSizeString = '1 MB';
const fileSize = 1048576;
let msgSupportExt = '';
for (let i = 0; i < fileExt.length; i += 1) {
    if (i === fileExt.length - 1) {
        msgSupportExt += `and ${fileExt[i]}.`;
    } else {
        msgSupportExt += `${fileExt[i]}, `;
    }
}

module.exports = {
    urlStore: `${appCnf.FILE_MANAGER.url}:${appCnf.FILE_MANAGER.port}/uploadFile`,
    urlGet: `${appCnf.FILE_MANAGER.url}:${appCnf.FILE_MANAGER.port}/getFile`,
    // destination folder
    filePath: '/hrms_upload/',
    prefixFile: 'hrmsUpload_',
    fileExt,
    fileSize,
    content_type,
    limits: {
        files: 1,
        fileSize,
    },
    fileTmp: './tmp',
    message: {
        error: {
            filename: "file name must be ('Letter - _ 0-9').",
            supportExt: `unsupported format, only support for extension file ${msgSupportExt}`,
            size: `File upload only accept up to ${maxSizeString}.`,
        },
    },
};
