require('dotenv').config();
const { MongoClient } = require('mongodb');

async function showCollectionsAndSamples() {
    const uri = process.env.MONGODB_URI.trim();
    const dbName = 'TSness';
    const client = new MongoClient(uri, { useUnifiedTopology: true });

    try {
        await client.connect();
        const db = client.db(dbName);
        const collections = await db.listCollections().toArray();
        console.log(`Collections in '${dbName}':`);
        for (const coll of collections) {
            const name = coll.name;
            const sample = await db.collection(name).findOne();
            console.log(`\nCollection: ${name}`);
            if (sample) {
                console.dir(sample, { depth: null, colors: true });
            } else {
                console.log('  (Aucun document dans cette collection)');
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

showCollectionsAndSamples();
