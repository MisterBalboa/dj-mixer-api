const express = require('express')
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const app = express()
const port = "7777";
const mongoClient = new MongoClient('mongodb://localhost:27017/djmix');

app.use(cors());

app.use(function(req, res, next) {
  console.log('req.method', req.method, req.path);
  return next();
})

mongoClient.connect().then(function(connection) {
  const db = connection.db('djmix');
  const albums = db.collection('albums');
  const allAlbums = albums.find({});

  app.get('/curated-albums', (req, res) => {
    var pipeline = [
      {
        $lookup: {
          from: "tracks",
          localField: "vinyls.sideA",
          foreignField: "_id",
          as: "tracksA"
        }
      },
      {
        $lookup: {
          from: "tracks",
          localField: "vinyls.sideB",
          foreignField: "_id",
          as: "tracksB"
        }
      },
      {
        $project: {
          artist: "$artist",
          title: "$title",
          vinyls: {
            sideA: "$tracksA",
            sideB: "$tracksB"
          }
        }
      }
    ];

    const allAlbums = albums.aggregate(pipeline);

    function albumCuration(album) {
      for (var i = 0; i < album.vinyls.length; i++) {
        var vinyl = album.vinyls[i];

        for (var k = 0; k < vinyl.sideA.length; k++) {
          var track = vinyl.sideA[k];

          if (!track.key || !track.mode || !track.tempo) {
            return false;
          }
        }

        for (var m = 0; m < vinyl.sideB.length; m++) {
          var track = vinyl.sideB[m];

          if (!track.key || !track.mode || !track.tempo) {
            return false;
          }
        }
      }

      return true;
    }

    allAlbums.toArray(function(err, data) {
      if (err) {
        return res.status(500).send();
      }

      var filteredAlbums = data.filter(albumCuration);

      filteredAlbums.forEach(function(album) {
        album.vinyls.forEach(function(vinyl) {
          vinyl.sideA.forEach(function(track) {
            console.log('curated track: ', track);
          })
          vinyl.sideB.forEach(function(track) {
            console.log('curated track: ', track);
          })
        })
      });

      return res.status(200).json(filteredAlbums);
    })
  })

  app.get('/albums', (req, res) => {
    var pipeline = [
      {
        $lookup: {
          from: "tracks",
          localField: "vinyls.sideA",
          foreignField: "_id",
          as: "tracksA"
        }
      },
      {
        $lookup: {
          from: "tracks",
          localField: "vinyls.sideB",
          foreignField: "_id",
          as: "tracksB"
        }
      },
      {
        $project: {
          artist: "$artist",
          title: "$title",
          vinyls: {
            sideA: "$tracksA",
            sideB: "$tracksB"
          }
        }
      }
    ];

    const allAlbums = albums.aggregate(pipeline);

    allAlbums.toArray(function(err, data) {
      if (err) {
        return res.status(500).send();
      }

      return res.status(200).json(data);
      console.log('arrayData: ', err, data);
    })
  })

  app.get('/albums/:id', (req, res) => {
    console.log('req.params', req.params);

    albums.findOne({ _id: ObjectId(req.params.id) }).then(function(album) {
      console.log('album', album);
      return res.status(200).json(album);
    });
  });

  app.listen(port, () => {
    console.log(`DJ Mix listening on port ${port}`)
  });
});


