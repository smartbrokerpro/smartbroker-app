import clientPromise from '../lib/mongodb';

let cachedContext = null;

export const loadChatContext = async () => {
  if (cachedContext) {
    return cachedContext;
  }

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);
  const stock = await db.collection('stock').aggregate([
    {
      $lookup: {
        from: 'projects',
        localField: 'project_id',
        foreignField: '_id',
        as: 'project_details'
      }
    },
    {
      $unwind: '$project_details'
    },
    {
      $project: {
        _id: 1,
        project_id: 1,
        apartment: 1,
        typology: 1,
        current_list_price: 1,
        'project_details.name': 1,
        'project_details.county_id': 1
      }
    },
    {
      $lookup: {
        from: 'counties',
        localField: 'project_details.county_id',
        foreignField: '_id',
        as: 'county_details'
      }
    },
    {
      $unwind: '$county_details'
    },
    {
      $project: {
        _id: 1,
        project_id: 1,
        apartment: 1,
        typology: 1,
        current_list_price: 1,
        project_name: '$project_details.name',
        county_name: '$county_details.name'
      }
    }
  ]).toArray();

  cachedContext = stock.map(unit => ({
    _id: unit._id.toString(),
    project_id: unit.project_id.toString(),
    apartment: unit.apartment,
    typology: unit.typology,
    current_list_price: unit.current_list_price,
    project: unit.project_name,
    county: unit.county_name
  }));

  return cachedContext;
};

export const summarizeContext = (context) => {
  return context.map(unit => ({
    project: unit.project,
    county: unit.county,
    typology: unit.typology,
    price: unit.current_list_price
  }));
};

export const fragmentContext = (context, maxTokens) => {
  const fragments = [];
  let fragment = [];

  for (const item of context) {
    const itemLength = JSON.stringify(item).length;
    if (fragment.join(',').length + itemLength > maxTokens) {
      fragments.push(fragment);
      fragment = [item];
    } else {
      fragment.push(item);
    }
  }

  if (fragment.length > 0) {
    fragments.push(fragment);
  }

  return fragments;
};
