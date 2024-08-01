// /src/controllers/UniversalCRUDController.js
import DatabaseModelFactory from '../utils/DatabaseModelFactory';
import { ObjectId } from 'mongodb';

export const fetchItemsByOrganization = async (req, res) => {
  const { modelName, organizationId } = req.query;
  
  try {
    const Model = DatabaseModelFactory.getModelByName(modelName);
    const items = await Model.find({ organization_id: organizationId });
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createNewItem = async (req, res) => {
  const { modelName, organizationId, ...itemData } = req.body;
  
  try {
    const Model = DatabaseModelFactory.getModelByName(modelName);
    const validationErrors = DatabaseModelFactory.validateData(itemData, modelName);

    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, errors: validationErrors });
    }

    const newItem = new Model({ ...itemData, organization_id: organizationId });
    await newItem.save();
    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateExistingItem = async (req, res) => {
  const { modelName, organizationId, id, ...updateData } = req.body;
  
  try {
    const Model = DatabaseModelFactory.getModelByName(modelName);
    const validationErrors = DatabaseModelFactory.validateData(updateData, modelName);

    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, errors: validationErrors });
    }

    const updatedItem = await Model.findOneAndUpdate(
      { _id: id, organization_id: organizationId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.status(200).json({ success: true, data: updatedItem });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const removeExistingItem = async (req, res) => {
  const { modelName, organizationId, id } = req.query;
  
  try {
    const Model = DatabaseModelFactory.getModelByName(modelName);
    const deletedItem = await Model.findOneAndDelete({ _id: id, organization_id: organizationId });

    if (!deletedItem) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.status(200).json({ success: true, data: deletedItem });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};