const express = require("express");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
const app = express();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.cb3wozl.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const filesCOllection = client.db("fileUpload").collection("files");
    const dataCollection = client.db("fileUpload").collection("data");

    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        return cb(null, "./Files/Files");
      },
      filename: (req, file, cb) => {
        return cb(null, `${Date.now()}_${file.originalname}`);
      },
    });


    // multer middleware
    const upload = multer({
      storage: storage,
      limits: {
        fileSize: 1000000,
      },
    });

    app.post("/upload", upload.single("file"), async (req, res) => {
      console.log(req.body);
      console.log(req.file);
      const newImg = req.file;
      const encImg = newImg.toString("base64");

      const image = {
        contentType: newImg.mimetype,
        size: newImg.size,
        img: Buffer.from(encImg, "base64"),
      };

      const result = await filesCOllection.insertOne(image);
      console.log(result);
      if (result) {
        res.send(result);
      } else {
        res.send(false);
      }
    });

    app.get("/upload", async (req, res) => {
      const result = await filesCOllection.find({});
      const data = await result.toArray();
      res.send(data);
    });

    app.get("/download", async (req, res) => {
      const result = await dataCollection.find({}).toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("I am gonna upload files to mongodb!");
});

app.listen(port, () => {
  console.log(`File uploader is running on the port: ${port}`);
});
