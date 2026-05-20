# 这是websocket请求的信息
GET http://8.136.131.169:8878/im HTTP/1.1
Host: 8.136.131.169:8878
Connection: Upgrade
Pragma: no-cache
Cache-Control: no-cache
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) yipianhong/1.0.5 Chrome/100.0.4896.143 Electron/18.2.0 Safari/537.36
Upgrade: websocket
Origin: app://.
Sec-WebSocket-Version: 13
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN
Sec-WebSocket-Key: 9u3OcvpKdCZp0nQBge50hA==
Sec-WebSocket-Extensions: permessage-deflate; client_max_window_bits


HTTP/1.1 101 Switching Protocols
Connection: upgrade
Sec-Websocket-Accept: fHx5M2tov/d3t7OonUQvAjrIICg=
Upgrade: websocket

# 这是日志的摘要
## up
DoneRead:	10:39:14.279
BeginSend:	10:39:14.280
DoneSend:	10:39:14.281

{"cmd":0,"data":{"accessToken":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyMTEiLCJleHAiOjE3NzkyNDY0OTMsImluZm8iOiJ7XCJuaWNrTmFtZVwiOlwiMTUwMTgzNDk4OTBcIixcInRlcm1pbmFsXCI6MCxcInVzZXJJZFwiOjIxMSxcInVzZXJOYW1lXCI6XCIxNTAxODM0OTg5MFwifSJ9.lnWOxkeu1QhSohlE-50hzzTFVquF2AOO4w2_QdjR7bM","devId":96687}}

## down
DoneRead:	10:39:14.322
BeginSend:	10:39:14.322
DoneSend:	10:39:14.322

{"cmd":0,"data":null}


## up
DoneRead:	10:39:14.323
BeginSend:	10:39:14.323
DoneSend:	10:39:14.323
{"cmd":1,"data":{}}

## down
DoneRead:	10:39:14.355
BeginSend:	10:39:14.355
DoneSend:	10:39:14.355
{"cmd":1,"data":null}

## up
DoneRead:	10:39:35.349
BeginSend:	10:39:35.349
DoneSend:	10:39:35.349
{"cmd":1,"data":{}}

## down
DoneRead:	10:39:35.378
BeginSend:	10:39:35.378
DoneSend:	10:39:35.378
{"cmd":1,"data":null}

## down
{"cmd":4,"data":{"groupId":9,"readedCount":5,"receiptOk":false,"id":2257,"type":12}}


## up
DoneRead:	10:39:56.358
BeginSend:	10:39:56.358
DoneSend:	10:39:56.358
{"cmd":1,"data":{}}

## down
DoneRead:	10:39:56.391
BeginSend:	10:39:56.391
DoneSend:	10:39:56.391
{"cmd":1,"data":null}

# 这是收到的消息（注意：我只需要"groupId":9的消息）
{"cmd":4,"data":{"sendNickName":"一片红思美人","sendId":26,"groupId":9,"tmpId":"1779249306654532","readedCount":0,"receipt":true,"id":2271,"type":1,"content":"{\"originUrl\":\"http://8.136.131.169:19000/box-im/image/20260520/QQ20260520-115458_Uyap.png\",\"thumbUrl\":\"http://8.136.131.169:19000/box-im/image/20260520/QQ20260520-115458_Uyap.png\",\"width\":731,\"height\":162}","sendTime":1779249307141,"status":0}}

{"cmd":4,"data":{"sendNickName":"一片红思美人","atUserIds":[],"sendId":26,"groupId":25,"tmpId":"1779247432911925","readedCount":0,"receipt":false,"id":2261,"type":0,"content":"在重申一遍，如果收不到消息，是因为手机端把本APP挂在后台了，需要退出到登录界面 重新进   你挂在后台 掉线了","sendTime":1779247433281,"status":0}}