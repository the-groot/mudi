var template = require('./template.js');
var db = require('./db.js');
var url = require('url');
var qs = require('querystring');

exports.home=function(request,response){
db.query(`SELECT * FROM playlist`, function(error,playlists){
    if(error){
        throw error;
    }
    var title = 'Welcome';
    var description = 'Hello, It is mudi';
    var list = template.list(playlists);
    var html = template.HTML(title, list,
      `<h2>${title}</h2>${description}`,
      `<a href="/create">create</a>`
    );
    response.writeHead(200);
    response.end(html);
  });
}


exports.page=function(request,response){
    var _url = request.url;
    var queryData = url.parse(_url, true).query;

    db.query(`SELECT * FROM playlist`, function(error,playlists){
        if(error){
          throw error;
        }
        db.query(`SELECT * FROM playlist LEFT JOIN song ON playlist.id=song.playlist_id WHERE playlist.id=?`,[queryData.id], function(error2, playlist){
          if(error2){
            throw error2;
          }
         
         let i=0;
         let body='<hr>';
         let title,description,singer;
         while(i<playlist.length){      //song목록 불러오는과정
            title=playlist[i].title;
            description=playlist[i].description;
            singer=playlist[i].singer;
            body=body+`${title}-${singer}<p>${description}</p><hr>`;
             i++;
         }
         console.log(body);
        
         var list = template.list(playlists);
         var html = template.HTML(title, list,
           //`<h2>${title}</h2>${description} <p>by ${playlist[0].singer}</p>`,
           `${body}`,
           ` <a href="/create">create</a>
               <a href="/update?id=${queryData.id}">update</a>
               <form action="delete_process" method="post">
                 <input type="hidden" name="id" value="${queryData.id}">
                 <input type="submit" value="delete">
               </form>`
         );
         response.writeHead(200);
         response.end(html);
        })
     });
}


exports.create=function(request,response){
    db.query(`SELECT * FROM topic`, function(error,topics){
        db.query(`SELECT * FROM author`,function(error2, authors){
  
          var title = 'Create';
          var list = template.list(topics);
          var author=template.authorSelect(authors);
          var html = template.HTML(title, list,
            `
            <form action="/create_process" method="post">
              <p><input type="text" name="title" placeholder="title"></p>
              <p>
                <textarea name="description" placeholder="description"></textarea>
              </p>
              ${author}
              <p>
                <input type="submit">
              </p>
            </form>
            `,
            `<a href="/create">create</a>`
          );
          response.writeHead(200);
          response.end(html);
        })
    
      });
}


exports.create_process=function(request,response){
    var body = '';
    request.on('data', function(data){
        body = body + data;
    });
    request.on('end', function(){
        var post = qs.parse(body);
        db.query(`
          INSERT INTO topic (title, description, created, author_id) 
            VALUES(?, ?, NOW(), ?)`,
          [post.title, post.description, post.author], 
          function(error, result){
            if(error){
              throw error;
            }
            response.writeHead(302, {Location: `/?id=${result.insertId}`});
            response.end();
          }
        )
    });
}


exports.update = function(request, response){
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    db.query('SELECT * FROM topic', function(error, topics){
        if(error){
          throw error;
        }
        db.query(`SELECT * FROM topic WHERE id=?`,[queryData.id], function(error2, topic){
          if(error2){
            throw error2;
          }
          db.query('SELECT * FROM author', function(error2, authors){
            var list = template.list(topics);
            var html = template.HTML(topic[0].title, list,
              `
              <form action="/update_process" method="post">
                <input type="hidden" name="id" value="${topic[0].id}">
                <p><input type="text" name="title" placeholder="title" value="${topic[0].title}"></p>
                <p>
                  <textarea name="description" placeholder="description">${topic[0].description}</textarea>
                </p>
                <p>
                  ${template.authorSelect(authors, topic[0].author_id)}
                </p>
                <p>
                  <input type="submit">
                </p>
              </form>
              `,
              `<a href="/create">create</a> <a href="/update?id=${topic[0].id}">update</a>`
            );
            response.writeHead(200);
            response.end(html);
          });

        });
      });
}


exports.update_process=function(request,response){
    var body = '';
      request.on('data', function(data){
          body = body + data;
      });
      request.on('end', function(){
        var post=qs.parse(body);
        db.query(`UPDATE topic SET title=?, description=?, author_id=? WHERE id=?`,
        [post.title,post.description,post.author,post.id],
        function(error,result){
          if(error){
            throw error;
          }
          response.writeHead(302, {Location: `/?id=${post.id}`});
          response.end();
        })
      });
}


exports.delete_process=function(request,response){
    var body = '';
      request.on('data', function(data){
          body = body + data;
      });
      request.on('end', function(){
          var post = qs.parse(body);
          db.query(`DELETE FROM topic WHERE id=?`, [post.id], function(error,result){
            if(error){
              throw error;
            }
            response.writeHead(302, {Location: `/`});
            response.end();
          })
      });
}