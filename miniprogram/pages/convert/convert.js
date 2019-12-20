const utils = require('../../utils/util.js');
const app = getApp();

Page({
  data: {
    originFile: {
      name: '',
      path: '',
      convertType: '',
    },
    convertedFile: {
      name: '',
      downloadUrl: '',
    },
    converting: 1,
    process: {},
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
      _this.setData({
        originFile: { name, path, convertType },
      });
      _this.convertFile(name, path, convertType);
    });
  },

  onConvertedDone: function (res) {
    console.log(res);
    console.log(this);
    const fileData = res.data.Files[0];
    this.setData({
      convertedFile: {
        downloadUrl: fileData.Url,
        name: fileData.FileName,
      },
    });
  },

  onConvertedFail: function (res) {
    const dialogData = this.data.dialog;
    this.setData({ ...dialogData, message: '转换调用失败了 [${res.statusCode}]' });
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
});
