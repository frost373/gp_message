POST http://8.136.131.169:8890/login HTTP/1.1
Host: 8.136.131.169:8890
Proxy-Connection: keep-alive
Content-Length: 62
Accept: application/json, text/plain, */*
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) yipianhong/1.0.5 Chrome/100.0.4896.143 Electron/18.2.0 Safari/537.36
Content-Type: application/json
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN

{"terminal":0,"userName":"15018349890","password":"wu1219883"}
HTTP/1.1 200
Connection: keep-alive
Content-Type: application/json
Date: Wed, 20 May 2026 02:38:13 GMT
Keep-Alive: timeout=4
Proxy-Connection: keep-alive
Vary: accept-encoding
Content-Length: 640

{"code":200,"message":"成功","data":{"accessToken":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyMTEiLCJleHAiOjE3NzkyNDY0OTMsImluZm8iOiJ7XCJuaWNrTmFtZVwiOlwiMTUwMTgzNDk4OTBcIixcInRlcm1pbmFsXCI6MCxcInVzZXJJZFwiOjIxMSxcInVzZXJOYW1lXCI6XCIxNTAxODM0OTg5MFwifSJ9.lnWOxkeu1QhSohlE-50hzzTFVquF2AOO4w2_QdjR7bM","accessTokenExpiresIn":1800,"refreshToken":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyMTEiLCJleHAiOjE3Nzk4NDk0OTMsImluZm8iOiJ7XCJuaWNrTmFtZVwiOlwiMTUwMTgzNDk4OTBcIixcInRlcm1pbmFsXCI6MCxcInVzZXJJZFwiOjIxMSxcInVzZXJOYW1lXCI6XCIxNTAxODM0OTg5MFwifSJ9.LUQeVHQv9Iamjz-2xCGYkOlGDjUKS_tzxVhL9dkLyhU","refreshTokenExpiresIn":604800}}







PUT http://8.136.131.169:8890/message/group/readed?groupId=9 HTTP/1.1
Host: 8.136.131.169:8890
Proxy-Connection: keep-alive
Content-Length: 0
Accept: application/json, text/plain, */*
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) yipianhong/1.0.5 Chrome/100.0.4896.143 Electron/18.2.0 Safari/537.36
accessToken: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyMTEiLCJleHAiOjE3NzkyNDg4NzEsImluZm8iOiJ7XCJuaWNrTmFtZVwiOlwiMTUwMTgzNDk4OTBcIixcInRlcm1pbmFsXCI6MCxcInVzZXJJZFwiOjIxMSxcInVzZXJOYW1lXCI6XCIxNTAxODM0OTg5MFwifSJ9.H-L6SFPNwWhh9cb4pLNhlRLP4rvT5lpEgiml0sBdcAI
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN


HTTP/1.1 200
Connection: keep-alive
Content-Type: application/json
Date: Wed, 20 May 2026 03:56:15 GMT
Keep-Alive: timeout=4
Proxy-Connection: keep-alive
Vary: accept-encoding
Content-Length: 60

{"code":401,"message":"token无效或已过期","data":null}



PUT http://8.136.131.169:8890/refreshToken HTTP/1.1
Host: 8.136.131.169:8890
Proxy-Connection: keep-alive
Content-Length: 0
Accept: application/json, text/plain, */*
refreshToken: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyMTEiLCJleHAiOjE3Nzk4NTE4NzEsImluZm8iOiJ7XCJuaWNrTmFtZVwiOlwiMTUwMTgzNDk4OTBcIixcInRlcm1pbmFsXCI6MCxcInVzZXJJZFwiOjIxMSxcInVzZXJOYW1lXCI6XCIxNTAxODM0OTg5MFwifSJ9.OAheQplS_bEC3RCRqbg-NFzv4xH9WOkWJKfZZNozofg
accessToken: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyMTEiLCJleHAiOjE3NzkyNDg4NzEsImluZm8iOiJ7XCJuaWNrTmFtZVwiOlwiMTUwMTgzNDk4OTBcIixcInRlcm1pbmFsXCI6MCxcInVzZXJJZFwiOjIxMSxcInVzZXJOYW1lXCI6XCIxNTAxODM0OTg5MFwifSJ9.H-L6SFPNwWhh9cb4pLNhlRLP4rvT5lpEgiml0sBdcAI
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) yipianhong/1.0.5 Chrome/100.0.4896.143 Electron/18.2.0 Safari/537.36
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN


HTTP/1.1 200
Connection: keep-alive
Content-Type: application/json
Date: Wed, 20 May 2026 03:56:15 GMT
Keep-Alive: timeout=4
Proxy-Connection: keep-alive
Vary: accept-encoding
Content-Length: 640

{"code":200,"message":"成功","data":{"accessToken":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyMTEiLCJleHAiOjE3NzkyNTExNzUsImluZm8iOiJ7XCJuaWNrTmFtZVwiOlwiMTUwMTgzNDk4OTBcIixcInRlcm1pbmFsXCI6MCxcInVzZXJJZFwiOjIxMSxcInVzZXJOYW1lXCI6XCIxNTAxODM0OTg5MFwifSJ9.aoLcCONdtcvotGmR0Jz3njQmRaW4TAyQbfn1PZvbPSU","accessTokenExpiresIn":1800,"refreshToken":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyMTEiLCJleHAiOjE3Nzk4NTQxNzUsImluZm8iOiJ7XCJuaWNrTmFtZVwiOlwiMTUwMTgzNDk4OTBcIixcInRlcm1pbmFsXCI6MCxcInVzZXJJZFwiOjIxMSxcInVzZXJOYW1lXCI6XCIxNTAxODM0OTg5MFwifSJ9.yoTAacsjNymSbIDmeLaY99jBp0UndwvwhhdMMp1p2Wk","refreshTokenExpiresIn":604800}}



PUT http://8.136.131.169:8890/message/group/readed?groupId=9 HTTP/1.1
Host: 8.136.131.169:8890
Proxy-Connection: keep-alive
Content-Length: 0
Accept: application/json, text/plain, */*
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) yipianhong/1.0.5 Chrome/100.0.4896.143 Electron/18.2.0 Safari/537.36
accessToken: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyMTEiLCJleHAiOjE3NzkyNTExNzUsImluZm8iOiJ7XCJuaWNrTmFtZVwiOlwiMTUwMTgzNDk4OTBcIixcInRlcm1pbmFsXCI6MCxcInVzZXJJZFwiOjIxMSxcInVzZXJOYW1lXCI6XCIxNTAxODM0OTg5MFwifSJ9.aoLcCONdtcvotGmR0Jz3njQmRaW4TAyQbfn1PZvbPSU
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN


HTTP/1.1 200
Connection: keep-alive
Content-Type: application/json
Date: Wed, 20 May 2026 03:56:15 GMT
Keep-Alive: timeout=4
Proxy-Connection: keep-alive
Vary: accept-encoding
Content-Length: 43

{"code":200,"message":"成功","data":null}



