const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5001;

// middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());




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

        app.post('/jwt', async (req, res) => {
            const user = req.body
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: false, // http://localhost:5173/login
                    // sameSite: 'none'
                })
                .send({ success: true })
        })

        app.get('/services', async (req, res) => {
            const filter = req.query
            const quary = {
                title: { $regex: filter.search, $options: 'i'},
            };
            const options = {
                sort: {
                    price: filter.sort === 'asc' ? 1 : -1
                }
            }
            const cursor = serviceCollection.find(quary, options);
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
        app.get('/orders', async (req, res) => {
            let quary = {}
            if (req.query?.email) {
                quary = { email: req.query.email }
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
        app.patch('/orders/:id', async (req, res) => {
            const id = req.params.id;

            const filter = { _id: new ObjectId(id) }
            const updateOrder = req.body;
            const updateDoc = {
                $set: {
                    status: updateOrder.status,
                }
            }
            const result = await orderCollection.updateOne(filter, updateDoc)
            res.send(result)
        })
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id
            const cursor = { _id: new ObjectId(id) }
            const result = await orderCollection.deleteOne(cursor)
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