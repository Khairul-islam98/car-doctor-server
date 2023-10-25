const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5001;

// middleware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.clvlvsk.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const serviceCollection = client.db('carDoctor').collection('services');
        const orderCollection = client.db('carDoctor').collection('orders');

        app.get('/services', async (req, res) => {
            const cursor = serviceCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id
            const quary = { _id: new ObjectId(id) }
            const options = { projection: { service_id: 1, title: 1, price: 1, img: 1 } }
            const result = await serviceCollection.findOne(quary, options)
            res.send(result)
        })

        // order
        app.get('/orders', async(req, res) => {
            let quary = {}
            if(req.query?.email) {
                quary = { email: req.query.email}
            }
            const result = await orderCollection.find(quary).toArray()
            res.send(result)
        })
        app.post('/orders', async (req, res) => {
            const order = req.body
            console.log(order);
            const result = await orderCollection.insertOne(order);
            res.send(result)
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send("doctors server is running")
})

app.listen(port, () => {
    console.log(`Car Doctors server is running on port ${port}`);
});