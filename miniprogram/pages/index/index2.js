const app = getApp();

Page({
  data: {
    inputUrl: '',
    dialog: {
      show: false,
      title: 'Oh!NO!',
      message: '',
      buttons: [{text: '确定'}],
    },
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
  },

  bindUrlInput: function (e) {
    this.setData({
      inputUrl: e.detail.value
    });
  },

  tapNavigateToConfirmPage: function (e) {
    const _this = this;
    if (_this.data.inputUrl.length <= 0) {
      _this.showDialog('请输入网址');
      return;
    }
    wx.navigateTo({
      url: '../confirm/confirm',
      success: function (res) {
        res.eventChannel.emit("confirmPageParams", {
          url: _this.data.inputUrl,
          type: 'web',
        });
      }
    })
  }

});
