const utils = require('../../utils/util.js');
const app = getApp();

Page({
  data: {
    originFile: {
      name: '',
      extension: '',
      path: '',
      convertType: '',
    },
    convertedFile: {
      name: '',
      convertUrl: '',
      fileID: '',
      downloadUrl: '',
      tempFilePath: '',
    },
    converting: 1,
    process: {
      percent: 40,
      duration: 750,
    },
    processDone: false,
    dialog: {
      show: false,
      title: '转换失败！',
      message: '',
      buttons: [{text: '确定'}],
    },
  },

  onLoad: function (option) {
    console.log(option);
    const _this = this;
    const evnetChannel = this.getOpenerEventChannel();
    evnetChannel.on('convertPageParams', function (data) {
      const { name, path, convertType } = data;
      const extension = utils.getExtension(name);
      _this.setData({
        originFile: { name, path, convertType, extension },
      });
      _this.convertFile(name, path, convertType);
    });
  },

  onConvertedDone: function (res) {
    console.log(res);
    console.log(this);
    const fileData = res.data.Files[0];
    const convertedFileData = this.data.convertedFile;
    const fileSize = fileData.fileSize || 200000;
    this.setData({
      convertedFile: {
        ...convertedFileData,
        convertUrl: fileData.Url,
        name: fileData.FileName,
      },
      process: {
        percent: 90,
        duration: (fileSize / 5000).toFixed(0),
      }
    });
    this.rawUploadToCloud(fileData.Url);
  },

  onConvertedFail: function (res) {
    const dialogData = this.data.dialog;
    this.setData({ dialog: { ...dialogData, message: '转换调用失败了 [${res.statusCode}]' } });
  },

  copyToClipBoard: function() {
    const _this = this;
    wx.setClipboardData({
      data: _this.data.convertedFile.downloadUrl,
    });
  },

  rawUploadToCloud: function(convertUrl) {
    const _this = this;
    convertUrl = convertUrl.replace('v2.convertapi.com', 'team02.hackathon.ebincr.com');
    wx.downloadFile({
      url: convertUrl,
      success(res) {
        var filePath = res.tempFilePath; // 这里都下下来了，干嘛不直接用这个预览呢
        console.log(filePath);
        const convertedFileData = _this.data.convertedFile;
        _this.setData({
          convertedFile: {
            ...convertedFileData,
            tempFilePath: filePath,
          },
          process: {
            percent: 95,
            duration: 300,
          },
        });

        wx.cloud.uploadFile({
          cloudPath: 'a.pdf',
          filePath: filePath,
          success: res => {
            console.log(res.fileID);
            const data = _this.data.convertedFile;
            _this.setData({ convertedFile: { ...data, fileID: res.fileID } });

            // todo 这里需要请求一次 下载链接
            // wx.cloud.downloadFile({
            //   fileID: res.fileID,
            //   success: res => {
            //     console.log(res.tempFilePath);
            //   }
            // });

            wx.cloud.getTempFileURL({
              fileList: [res.fileID],
              success: function (res) {
                console.log('getTempffffiledur');
                console.log(res);
                console.log(res.fileList);
                const data = _this.data.convertedFile;
                console.log(data);
                _this.setData({
                  convertedFile: {
                    ...data,
                    downloadUrl: res.fileList[0].tempFileURL
                  },
                  process: { percent: 100, duration: 30 },
                });
              },
            })
          }
        });
      },
    });
  },

  convertFile: function (name, path, convertType) {
    const _this = this;
    const prevType = utils.getExtension(name);
    const requestUrl = `${utils.requestUrl}/convert/${prevType}/to/${convertType}?Secret=Y2qbHnYrTZj1aX8t`;

    var fileMgr = new wx.getFileSystemManager();
    fileMgr.readFile({
      filePath: path,
      encoding: 'base64',
      success: function (res) {
        wx.request({
          url: requestUrl,
          data: {
            Parameters: [
              {
                Name: 'File',
                FileValue: { Name: name, Data: res.data},
              },
              {
                Name: 'StoreFile',
                Value: 'true',
              },
            ],
          },
          method: 'POST',
          success: _this.onConvertedDone,
          fail: _this.onConvertedFail,
        });
      },
    });
  },

  previewFile: function () {
    const _this = this;
    console.log('previewFile');
    console.log(this);
    console.log(_this);
    wx.openDocument({
      filePath: _this.data.convertedFile.tempFilePath,
    });
  },

  tapProcessDone: function (e) {
    if (this.data.process.percent < 100) {
      return;
    }
    this.setData({ processDone: true });
    console.log('process done!!!');
  }
});
