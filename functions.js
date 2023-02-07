const { connect, uri, MongoClient } = require("./mongodb");

async function getClient() {
const client = await connect();
return client;
}

async function last_ten_episodes() {
const client = await getClient();
const episodes = await client
.db("NAPDB")
.collection("episodes")
.find()
.sort({ _id: -1 })
.limit(10)
    .toArray();
  client.close();
return episodes;
}

async function last_ten_credits() {
const client = await getClient();
const credits = await client
.db("NAPDB")
.collection("credits")
.find().sort({ _id: -1 })
.limit(10)
    .toArray();
  client.close();
return credits;
}

async function producer_credits(alias) {
if (alias === undefined) alias = "";
if (alias.indexOf("getalby.com") > -1) {
let arr = alias.split(" ");
arr.pop();
alias = arr.join(" ");
alias = alias.replace(/ -$/i, "");
}
const searchQuery = RegExp("." + alias + ".", "i");
const client = await getClient();
const credits = await client
.db("NAPDB")
  .collection("credits")
  .find({$or: [
          { producer: { $regex: searchQuery } },
          { type: { $regex: searchQuery } },
          { episode_number: parseInt(searchQuery) },
        ],
      })
      .sort({ episode_number: -1 })
    .toArray();
  await client.close();
return credits;
}

async function search_credits(searchTerm) {
const searchQuery = RegExp("." + searchTerm + ".", "i");
const client = await getClient();
const producerCredits = await client
.db("NAPDB")
.collection("credits")
.find({ producer: searchQuery })
.sort({ episode_number: -1 })
    .toArray();
  client.close();
return producerCredits;
}

async function top_twenty_producers() {
const client = await getClient();
const producers = await client
.db("NAPDB")
.collection("credits")
.aggregate([
{ $match: { producer: { $exists: true, $ne: "" } } },
{ $match: { producer: { $exists: true, $ne: "Anonymous" } } },
{ $group: { _id: "$producer", count: { $sum: 1 } } },
{ $sort: { count: -1 } },
{ $limit: 20 },
])
    .toArray();
  client.close();
return producers;
}

async function episode_credits(query) {
const client = await getClient();
await client
.db("NAPDB")
.collection("credits")
.createIndex({ producer: 1, type: 1, episode_number: -1 });
const episodes = await client
.db("NAPDB")
.collection("credits")
.find({$or: [
          { producer: { $regex: query, $options: "i" } },
          { type: { $regex: query, $options: "i" } },
          { episode_number: parseInt(query) },
        ],
      })
      .sort({ episode_number: -1 })
    .toArray();
    await client.close();
    return episodes;
  }
  
async function get_episode_info(ep_number) {
  const client = await getClient();
  const episode = await client
    .db("NAPDB")
    .collection("episodes")
    .findOne({ number: ep_number });
  client.close();
  return episode;
}

module.exports = {
  last_ten_credits,
  last_ten_episodes,
  producer_credits,
  episode_credits,
  get_episode_info,
  top_twenty_producers,
  search_credits,
  }