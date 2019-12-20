const utils = require('../../utils/util.js');
const app = getApp();
const extensionDict = {
  doc: ['pdf', 'png'],
  docx: ['pdf', 'png'],
  xlsx: ['pdf', 'png'],
  jpg: ['pdf'],
  pdf: ['png'],
};

Page({
  data: {
    fileName: '',
    filePath: '',
    dialog: {
      show: false,
      title: 'Oh!NO!',
      message: '',
      buttons: [{text: '确定'}],
    },
    convertType: [],
    selectedConvertType: '',
  },

  onLoad: function (option) {
    const _this = this;
    const evnetChannel = this.getOpenerEventChannel();
    evnetChannel.on('confirmPageParams', function (data) {
      const { name, path } = data;
      _this.setData({
        fileName: name,
        filePath: path,
      });
      _this.validConvertType(name);
    });
  },

  validConvertType: function (name) {
    const extension = utils.getExtension(name);
    if (Object.keys(extensionDict).indexOf(extension) == -1) {
      this.showDialog('暂时不支持这样的格式T_T');
      return;
    }
    this.setData({
      convertType: extensionDict[extension],
      selectedConvertType: extensionDict[extension][0],
    });
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

  tapNavigateToConvertPage: function (e) {
    const _this = this;
    wx.navigateTo({
      url: '../convert/convert',
      success: function (res) {
        res.eventChannel.emit("convertPageParams", {
          name: _this.data.fileName,
          path: _this.data.filePath,
          convertType: _this.data.selectedConvertType
        });
      },
    });
  },
});