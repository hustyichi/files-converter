//index.js
//获取应用实例
const app = getApp();

Page({
  data: {
    uploadFileName: '',
    localFilePath: '',
    convertedUrl: '',
  },

  cb: function(res) {
    this.setData({
      convertedUrl: res.data.Files[0].Url,
    });
  },

  chooseFile: function() {
    this.setData({
      convertedUrl: ''
    });
    const _this = this;

    wx.chooseMessageFile({
      count: 1,
      success: function(res) {
        const tmpFile = res.tempFiles[0];
        const tmpFileName = tmpFile.name;
        const tmpFilePath = tmpFile.path;

        _this.setData({
          uploadFileName: tmpFileName,
          localFilePath: tmpFilePath,
        });
        wx.navigateTo({
          url: '../confirm/confirm',
          success: function (res) {
            res.eventChannel.emit("confirmPageParams", {
              name: _this.data.uploadFileName,
              path: _this.data.localFilePath,
              type: 'file',
            });
          },
        });
      }
    });
  },

  convertFile: function(tmpFilePath, tmpFileName, convertedType, cb) {
    const prevType = tmpFileName.split('.').pop().toLowerCase();
    const requestUrl = 'https://team02.hackathon.ebincr.com/convert/' + prevType + '/to/' + convertedType + '?Secret=Y2qbHnYrTZj1aX8t';

    var fileMgr = new wx.getFileSystemManager();
    fileMgr.readFile({
      filePath: tmpFilePath,
      encoding: 'base64',
      success: function (res) {
        wx.request({
          url: requestUrl,
          data: {
            Parameters: [
              {
                Name: 'File',
                FileValue: {
                  Name: tmpFileName,
                  Data: res.data,
                },
              },
              {
                Name: 'StoreFile',
                Value: 'true',
              },
            ],
          },
          method: 'POST',
          success: function (res) {
            cb(res);
          },
        });
      },
    });
  },
})
