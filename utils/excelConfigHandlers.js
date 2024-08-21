export async function getLastExcelConfig(realEstateCompanyId) {
    try {
      const response = await fetch(`/api/real-estate-companies/${realEstateCompanyId}/excel-config`);
      if (!response.ok) {
        throw new Error('Failed to fetch last Excel config');
      }
      const data = await response.json();
      return data.lastExcelConfig?.fieldMapping || null;
    } catch (error) {
      console.error('Error fetching last Excel config:', error);
      return null;
    }
  }
  
  export async function updateExcelConfig(realEstateCompanyId, newConfig) {
    try {
      const response = await fetch(`/api/real-estate-companies/${realEstateCompanyId}/excel-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fieldMapping: newConfig }),
      });
      if (!response.ok) {
        throw new Error('Failed to update Excel config');
      }
    } catch (error) {
      console.error('Error updating Excel config:', error);
    }
  }
  
  export function createAutoMapping(modelFields, excelHeaders) {
    const mapping = {};
    const normalizedModelFields = modelFields.map(field => ({
      original: field,
      normalized: normalizeString(field)
    }));
  
    excelHeaders.forEach(header => {
      const normalizedHeader = normalizeString(header);
      const match = normalizedModelFields.find(field => field.normalized === normalizedHeader);
      if (match) {
        mapping[header] = match.original;
      }
    });
  
    return mapping;
  }
  
  function normalizeString(str) {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
  }