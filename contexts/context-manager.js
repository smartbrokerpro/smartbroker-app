// contexts/context-manager.js
import { getProjectContext } from './projects-context';
import { getClientContext } from './clients-context';
import { getStockContext } from './stock-context';

import Project from '../models/projectModel';
import Client from '../models/clientModel';
import Stock from '../models/stockModel';

export function getContextForModel(modelName) {
  switch(modelName.toLowerCase()) {
    case 'projects':
      return getProjectContext(Project);
    case 'clients':
      return getClientContext(Client);
    case 'stock':
      return getStockContext(Stock);
    default:
      throw new Error(`Context for model ${modelName} not found`);
  }
}