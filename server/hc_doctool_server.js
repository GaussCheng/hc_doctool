
var http = require('http');
var fs = require('fs');
var url = require('url');
const { parse } = require('querystring');
const { execSync } = require('child_process');
let path = require('path');
var formidable = require('formidable')

function removeDir(dir) {
    let files = fs.readdirSync(dir)
    for(var i=0;i<files.length;i++){
        let newPath = path.join(dir,files[i]);
        let stat = fs.statSync(newPath)
        if(stat.isDirectory()){
            removeDir(newPath);
        }else {
            fs.unlinkSync(newPath);
        }
    }
    fs.rmdirSync(dir)//如果文件夹是空的，就将自己删除掉
}
  
http.createServer( function (request, response) {  

    var post = '';  
    if (request.method === 'POST') {
        collectRequestData(request, result => {
            try{
                fs.accessSync("/tmp/hc_doctooltmp",fs.constants.R_OK);   
                removeDir("/tmp/hc_doctooltmp");
            }catch (e){
            }
            fs.mkdirSync("/tmp/hc_doctooltmp");
            // console.log(result)
            if(result.type == "zip")
            {
                result = result.data;
                var oldpath = result.zip.zippacket.path;
                var newpath = '/tmp/hc_doctooltmp/' + result.zip.zippacket.name;
                fs.rename(oldpath, newpath, function (err) {
                  if (err) throw err;
                  try{
                    fs.accessSync("/tmp/hc_doctooltmp/zipout",fs.constants.R_OK);   
                        removeDir("/tmp/hc_doctooltmp/zipout");
                  }catch (e){
                  }
                  execSync("unzip -d /tmp/hc_doctooltmp/ -q " + newpath);
                  execSync("./makedoc /tmp/hc_doctooltmp /tmp/hc_doctooltmp/zipout /tmp/hc_doctooltmp " + result.fields.doctype, {cwd:"../"});
                  execSync("zip -q -r hcdoc.zip zipout", {cwd:"/tmp/hc_doctooltmp"});
                  var filePath = '/tmp/hc_doctooltmp/hcdoc.zip';
                  var stat = fs.statSync(filePath);
              
                  response.writeHead(200, {
                      'Content-Type': 'application/'+result.doctype,
                      'Content-Length': stat.size,
                      'Content-Disposition': "attachment; filename=hcdoc.zip"
                  });
              
                  var readStream = fs.createReadStream(filePath);
                  // We replaced all the event handlers with a simple call to readStream.pipe()
                  readStream.pipe(response);
                });
            }
            else
            { 
               result = result.data;
                try{     
                    // console.log("datra", result.doctype);
                    fs.writeFileSync('/tmp/hc_doctooltmp/hcdoc.md', result.markdowntext);
                    var ret = execSync("./makedoc /tmp/hc_doctooltmp /tmp/hc_doctooltmp /tmp/hc_doctooltmp " + result.doctype, {cwd:"../"});
                    var filePath = '/tmp/hc_doctooltmp/hcdoc.' + result.doctype;
                    var stat = fs.statSync(filePath);
                
                    response.writeHead(200, {
                        'Content-Type': 'application/'+result.doctype,
                        'Content-Length': stat.size,
                        'Content-Disposition': "attachment; filename=hcdoc." + result.doctype
                    });
                
                    var readStream = fs.createReadStream(filePath);
                    // We replaced all the event handlers with a simple call to readStream.pipe()
                    readStream.pipe(response);
                }catch(e){
                    response.end(`err1:` + console.error(e));
                }
            }

        });
    }
    else
    {
        // 解析请求，包括文件名
        var pathname = url.parse(request.url).pathname;
        
        // 从文件系统中读取请求的文件内容
        fs.readFile(pathname.substr(1), function (err, data) {
            if (err) {
                console.log(err);
                // HTTP 状态码: 404 : NOT FOUND
                // Content Type: text/html
                response.writeHead(404, {'Content-Type': 'text/html'});
            }else{             
                // HTTP 状态码: 200 : OK
                // Content Type: text/html
                response.writeHead(200, {'Content-Type': 'text/html'});    
                
                // 响应文件内容
                response.write(data.toString());        
            }
            //  发送响应数据
            response.end();
        });   
    }


}).listen(8000);

function collectRequestData(request, callback) {
    const FORM_URLENCODED = 'application/x-www-form-urlencoded';
    if(request.headers['content-type'] === FORM_URLENCODED) {
        let body = '';
        request.on('data', chunk => {
            body += chunk.toString();
        });
        request.on('end', () => {
            callback({"type":"text", "data":parse(body)});
        });
    }
    else if(request.headers['content-type'].includes("multipart/form-data")){
        var form = new formidable.IncomingForm();
        form.parse(request, function(err, fields, files) {
            if (err) {
      
              // Check for and handle any errors here.
      
              console.error(err.message);
              return;
            }
            callback({"type":"zip", "data":{"fields":fields, "zip":files}});
        });
    }
    else {
        callback(null);
    }
}

// 控制台会输出以下信息
console.log('Server running at http://127.0.0.1:8000/');
