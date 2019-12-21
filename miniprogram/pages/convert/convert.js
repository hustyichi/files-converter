const utils = require('../../utils/util.js');
const app = getApp();
const supportType = [
  'doc', 'docx', 'xls', 'xlsx', 'pdf', 'ppt', 'pptx'
];
const cache_dict = {
  '美登产学研结合牵头需求_v20181115.pptx_pdf': 'cloud://converter-v56wq.636f-converter-v56wq-1300961948/美登产学研结合牵头需求_v20181115.pdf',
  '简历.docx_pdf': 'cloud://converter-v56wq.636f-converter-v56wq-1300961948/简历.pdf',
  'https://mp.weixin.qq.com/s/lDz1FtGD6BBmVVQZFO1nZg_pdf': 'cloud://converter-v56wq.636f-converter-v56wq-1300961948/mp_weixin_qq_com.pdf',
  'https://news.sina.cn/gj/2019-12-20/detail-iihnzahi8945458.d.html_png': 'cloud://converter-v56wq.636f-converter-v56wq-1300961948/news_sina_cn.png',
};

Page({
  data: {
    originFile: {
      name: '',
      extension: '',
      path: '',
      convertType: '',
      webUrl: '',
      type: 'file',
    },
    convertedFile: {
      name: '',
      convertUrl: '',
      fileID: '',
      downloadUrl: '',
      tempFilePath: '',
    },
    validPreview: false,
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

  onShareAppMessage: function () {
    let users = wx.getStorageSync('user');
    if (res.from === 'button') { }
    return {
      title: '转发',
      path: '/pages/index/',
      success: function (res) { }
    }
  },

  onLoad: function (option) {
    console.log(option);
    const _this = this;
    const evnetChannel = this.getOpenerEventChannel();
    evnetChannel.on('convertPageParams', function (data) {
      const { name, path, convertType, webUrl, type } = data;
      let extension = 'web';
      if (type == 'file') {
        extension = utils.getExtension(name);
      }
      _this.setData({
        originFile: { name, path, convertType, extension, webUrl, type },
        validPreview: supportType.indexOf(convertType) != -1,
      });
      if (type == 'file') {
        _this.convertFile(name, path, convertType);
      } else {
        _this.convertWeb(webUrl, convertType)
      }
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
        duration: (fileSize / 2500).toFixed(0),
      }
    });
    this.rawUploadToCloud(fileData.Url);
  },

  onConvertedFail: function (res) {
    this.showDialog('转换调用失败了 [${res.statusCode}]');
  },

  copyToClipBoard: function() {
    const _this = this;
    wx.setClipboardData({
      data: _this.data.convertedFile.downloadUrl,
    });
  },

  getCacheFileId: function() {
    let name = this.data.originFile.name;
    if (this.data.originFile.type == 'web') {
      name = this.data.originFile.webUrl;
    }

    name += '_' + this.data.originFile.convertType;

    console.log('--------> cache name');
    console.log(name);

    console.log(cache_dict);
    return cache_dict[name];
  },

  cacheUpload: function(fileId) {
    const _this = this;
    console.log('start cache upload');
    wx.cloud.downloadFile({
      fileID: fileId,
      success: function (res) {
        var filePath = res.tempFilePath;
        const convertedFileData = _this.data.convertedFile;

        _this.setData({
          convertedFile: {
            ...convertedFileData,
            tempFilePath: filePath,
            fileId: fileId,
          },
          process: {
            percent: 95,
            duration: 300,
          },
        });

        wx.cloud.getTempFileURL({
          fileList: [fileId],
          success: function (res) {
            const data = _this.data.convertedFile;
            console.log(data);
            _this.setData({
              convertedFile: {
                ...data,
                downloadUrl: res.fileList[0].tempFileURL,
              },
              process: { percent: 100, duration: 30 },
            });
          },
        })
      },
    })
  },

  rawUploadToCloud: function(convertUrl) {
    const _this = this;

    console.log('------------->')
    console.log(this.data.originFile.name);

    const cacheFileId = this.getCacheFileId();
    console.log('Got ' + cacheFileId);
    if (cacheFileId) {
      return this.cacheUpload(cacheFileId);
    }

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
          cloudPath: _this.data.convertedFile.name,
          filePath: filePath,
          success: res => {
            console.log('------file id ===>')
            console.log(res.fileID);
            const data = _this.data.convertedFile;
            _this.setData({ convertedFile: { ...data, fileID: res.fileID } });

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
                    downloadUrl: res.fileList[0].tempFileURL,
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

  convertWeb: function (url, convertType) {
    const _this = this;
    const prevType = "web";
    const requestUrl = `${utils.requestUrl}/convert/${prevType}/to/${convertType}?Secret=Y2qbHnYrTZj1aX8t`;

    wx.request({
      url: requestUrl,
      data: {
        Parameters: [
          {
            Name: 'Url',
            Value: url,
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

  previewFile: function () {
    const _this = this;
    console.log('previewFile');
    console.log(this);
    console.log(_this);
    wx.openDocument({
      filePath: _this.data.convertedFile.tempFilePath,
      fail: function (res) {
        console.log(res);
        _this.showDialog(`文件不支持预览 [${res.errMsg}]`);
      },
    });
  },

  tapProcessDone: function (e) {
    if (this.data.process.percent < 100) {
      return;
    }
    this.setData({ processDone: true });
    console.log('process done!!!');
  },

  showDialog: function (msg) {
    const dialogData = this.data.dialog;
    this.setData({
      dialog: {...dialogData, show: true, message: msg},
    });
  },

  tapDialogButton: function (e) {
    const dialogData = this.data.dialog;
    this.setData({
      dialog: {...dialogData, show: false},
    });
    wx.navigateBack({
      success: function (e) {
        console.log('success back to step 1');
      },
    });
  },
});
