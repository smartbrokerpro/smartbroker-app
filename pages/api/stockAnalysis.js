// pages/api/complexStockAnalysis.js

import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const client = await MongoClient.connect(process.env.MONGODB_URI);
      const db = client.db('real_estate_management_prod');

      const result = await db.collection('stock').aggregate([
        {
          $facet: {
            "byProject": [
              {
                $group: {
                  _id: "$project_name",
                  totalUnits: { $sum: 1 },
                  availableUnits: { $sum: { $cond: [{ $eq: ["$available", 1] }, 1, 0] } },
                  avgPrice: { $avg: "$current_list_price" },
                  totalSurface: { $sum: "$total_surface" },
                  typologies: { $addToSet: "$typology" }
                }
              },
              {
                $project: {
                  _id: 0,
                  project: "$_id",
                  totalUnits: 1,
                  availableUnits: 1,
                  occupancyRate: {
                    $cond: [
                      { $eq: ["$totalUnits", 0] },
                      0,
                      {
                        $round: [
                          { $multiply: [
                            { $divide: [
                              { $subtract: ["$totalUnits", "$availableUnits"] },
                              "$totalUnits"
                            ] },
                            100
                          ] },
                          2
                        ]
                      }
                    ]
                  },
                  avgPrice: { $round: ["$avgPrice", 2] },
                  avgPricePerSqm: {
                    $cond: [
                      { $eq: ["$totalSurface", 0] },
                      0,
                      { $round: [{ $divide: ["$avgPrice", { $divide: ["$totalSurface", "$totalUnits"] }] }, 2] }
                    ]
                  },
                  typologyCount: { $size: "$typologies" }
                }
              },
              { $sort: { totalUnits: -1 } }
            ],
            "byTypology": [
              {
                $group: {
                  _id: "$typology",
                  count: { $sum: 1 },
                  avgPrice: { $avg: "$current_list_price" },
                  avgSurface: { $avg: "$total_surface" }
                }
              },
              {
                $project: {
                  _id: 0,
                  typology: "$_id",
                  count: 1,
                  avgPrice: { $round: ["$avgPrice", 2] },
                  avgSurface: { $round: ["$avgSurface", 2] },
                  avgPricePerSqm: {
                    $cond: [
                      { $eq: ["$avgSurface", 0] },
                      0,
                      { $round: [{ $divide: ["$avgPrice", "$avgSurface"] }, 2] }
                    ]
                  }
                }
              },
              { $sort: { count: -1 } }
            ],
            "byOrientation": [
              {
                $group: {
                  _id: "$orientation",
                  count: { $sum: 1 },
                  avgPrice: { $avg: "$current_list_price" },
                  total: { $sum: 1 }
                }
              },
              {
                $project: {
                  _id: 0,
                  orientation: "$_id",
                  count: 1,
                  avgPrice: { $round: ["$avgPrice", 2] },
                  percentage: {
                    $cond: [
                      { $eq: ["$total", 0] },
                      0,
                      { $round: [{ $multiply: [{ $divide: ["$count", "$total"] }, 100] }, 2] }
                    ]
                  }
                }
              },
              { $sort: { count: -1 } }
            ],
            "priceRanges": [
              {
                $bucket: {
                  groupBy: "$current_list_price",
                  boundaries: [0, 2000, 3000, 4000, 5000, Infinity],
                  default: "Other",
                  output: {
                    count: { $sum: 1 },
                    avgSurface: { $avg: "$total_surface" }
                  }
                }
              },
              {
                $project: {
                  range: {
                    $switch: {
                      branches: [
                        { case: { $eq: ["$_id", 0] }, then: "< 2000" },
                        { case: { $eq: ["$_id", 2000] }, then: "2000 - 2999" },
                        { case: { $eq: ["$_id", 3000] }, then: "3000 - 3999" },
                        { case: { $eq: ["$_id", 4000] }, then: "4000 - 4999" },
                        { case: { $eq: ["$_id", 5000] }, then: "5000+" }
                      ],
                      default: "Other"
                    }
                  },
                  count: 1,
                  avgSurface: { $round: ["$avgSurface", 2] }
                }
              },
              { $sort: { "_id": 1 } }
            ]
          }
        }
      ]).toArray();

      client.close();

      res.status(200).json(result[0]);
    } catch (error) {
      console.error('Database Error:', error);
      res.status(500).json({ error: 'Error connecting to the database', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}