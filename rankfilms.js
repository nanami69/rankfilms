var spreadsheet = SpreadsheetApp.openById({ id });
var channel_access_token = { channel_access_token };
var sheet = spreadsheet.getSheetByName("webhook");
var url = "https://api.line.me/v2/bot/message/reply";
var headers = {
  "Content-Type": "application/json; charset=UTF-8",
  Authorization: "Bearer " + channel_access_token
};

function doPost(e) {
  var webhookData = JSON.parse(e.postData.contents).events[0];
  var message, replyToken, replyMessage;
  message = webhookData.message.text;
  replyToken = webhookData.replyToken;
  replyMessage = decideReplyMessage(replyToken, message);
  return sendPlainText(replyToken, replyMessage);
}

function sendPlainText(token, replyMessage) {
  var postData = {
    replyToken: token,
    messages: [
      {
        type: "text",
        text: replyMessage
      }
    ]
  };
  sendLineMessageFromReplyToken(postData);
}

function sendButton(message, replyToken) {
  var postData = {
    replyToken: replyToken,
    messages: [
      {
        type: "template",
        altText: "select",
        template: {
          type: "buttons",
          title: "Menu",
          text: "「" + message + "」を登録しますか？\nそれとも削除しますか？",
          actions: [
            {
              type: "message",
              label: "登録",
              text: "1:" + message
            },
            {
              type: "message",
              label: "削除",
              text: "2:" + message
            }
          ]
        }
      }
    ]
  };
  sendLineMessageFromReplyToken(postData);
}

function sendLineMessageFromReplyToken(postData) {
  var options = {
    method: "POST",
    headers: headers,
    payload: JSON.stringify(postData)
  };
  return UrlFetchApp.fetch(url, options);
}

function decideReplyMessage(replyToken, message) {
  var replyMessage;
  if (message === "一覧") {
    replyMessage = obtainList();
  } else if (message.charAt(0) === "1") {
    replyMessage = "「" + message.substr(2) + "」を登録します";
    appendToSheet(message.substr(2));
  } else if (message.charAt(0) === "2") {
    replyMessage = "「" + message.substr(2) + "」を削除します";
    deleteToSheet(message.substr(2), replyToken);
  } else {
    sendButton(message, replyToken);
  }
  return replyMessage;
}

function appendToSheet(title) {
  sheet.appendRow([title]);
}

function deleteToSheet(deleteTitle, replyToken) {
  var lastRow = sheet.getLastRow();
  var replyMessage;
  for (var i = 1; i <= lastRow; i++) {
    if (deleteTitle === sheet.getRange(i, 1).getValue()) {
      sheet.getRange(i, 1).clear();
      return;
    }
  }
  replyMessage = "「" + deleteTitle + "」は登録されていません。";
  sendPlainText(replyToken, replyMessage);
}

function obtainList() {
  var lastRow = sheet.getLastRow();
  var values = "";
  for (var i = 1; i <= lastRow; i++) {
    values += sheet.getRange(i, 1).getValue() + "\n";
  }
  return values;
}
