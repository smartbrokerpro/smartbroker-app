// /src/utils/DatabaseModelFactory.js
import Client from '../models/clientModel';
import Organization from '../models/organizationModel';
import Project from '../models/projectModel';
import PromptLog from '../models/promptLogModel';
import Stock from '../models/stockModel';

class DatabaseModelFactory {
  static getModelByName(modelName) {
    switch(modelName.toLowerCase()) {
      case 'clients':
        return Client;
      case 'organizations':
        return Organization;
      case 'projects':
        return Project;
      case 'promptlogs':
        return PromptLog;
      case 'stock':
        return Stock;
      default:
        throw new Error(`Model ${modelName} not found`);
    }
  }

  static getModelSchema(modelName) {
    const model = this.getModelByName(modelName);
    return model.schema;
  }

  static validateData(data, modelName) {
    const model = this.getModelByName(modelName);
    const newDocument = new model(data);
    const validationError = newDocument.validateSync();
    
    if (validationError) {
      return Object.values(validationError.errors).map(error => error.message);
    }
    
    return [];
  }
}

export default DatabaseModelFactory;