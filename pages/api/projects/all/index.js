// pages/api/projects/all/index.js
import { MongoClient, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { organizationId } = req.query;

  if (!organizationId) {
    return res.status(400).json({ error: 'organizationId is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const projects = await db.collection('projects').aggregate([
      { $match: { organization_id: new ObjectId(organizationId) } },
      {
        $lookup: {
          from: 'stock',
          localField: '_id',
          foreignField: 'project_id',
          as: 'stock_items'
        }
      },
      {
        $addFields: {
          typologies: {
            $reduce: {
              input: '$stock_items.typology',
              initialValue: [],
              in: {
                $cond: {
                  if: { $in: ['$$this', '$$value'] },
                  then: '$$value',
                  else: { $concatArrays: ['$$value', ['$$this']] }
                }
              }
            }
          },
          min_price: { $min: '$stock_items.current_list_price' },
          max_price: { $max: '$stock_items.current_list_price' },
          hasStock: { $gt: [{ $size: '$stock_items' }, 0] },
          unitsCount: { $size: '$stock_items' }
        }
      },
      {
        $lookup: {
          from: 'counties',
          localField: 'county_id',
          foreignField: '_id',
          as: 'county'
        }
      },
      {
        $unwind: {
          path: '$county',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'real_estate_companies',
          localField: 'real_estate_company_id',
          foreignField: '_id',
          as: 'real_estate_company'
        }
      },
      {
        $unwind: {
          path: '$real_estate_company',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          name: 1,
          address: 1,
          gallery: 1,
          county: {
            id: '$county._id',
            name: '$county.name'
          },
          real_estate_company: {
            id: '$real_estate_company._id',
            name: '$real_estate_company.name'
          },
          country_id: 1,
          location: 1,
          typologies: 1,
          min_price: 1,
          max_price: 1,
          updatedAt: 1,
          hasStock: 1,
          unitsCount: 1,
          commercialConditions: 1,
          discount: 1,
          down_payment_bonus: 1,
          installments: 1,
          deliveryDateDescr: 1,
          downpayment: 1,
          deliveryType: 1
        }
      },
      {
        $sort: { updatedAt: -1 }
      }
    ]).toArray();

    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}