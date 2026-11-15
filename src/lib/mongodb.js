import { MongoClient, ServerApiVersion } from "mongodb";

const options = {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
};

// Returns a shared MongoClient, created on first use instead of at import
// time, so the app can start without MONGODB_URI (local mode never calls this).
//
// The client is not connected explicitly: the driver connects automatically
// on the first database operation. Connection errors then surface in the code
// that actually needs the database (and are retried on the next operation)
// instead of becoming unhandled promise rejections.
//
// The client is cached on globalThis so that hot reloads in development reuse
// it instead of opening a new connection each time.
export function getMongoClient() {
    if (!globalThis._mongoClient) {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
        }
        globalThis._mongoClient = new MongoClient(uri, options);
    }
    return globalThis._mongoClient;
}
