import ExcelJS from 'exceljs';
import Project from '../models/projectModel';
import Stock from '../models/stockModel';

export async function processExcel(file, mapping, realEstateCompanyId) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const worksheet = workbook.worksheets[0];

  const headers = worksheet.getRow(1).values;
  const projects = new Map();
  const stocks = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {  // Skip header row
      const rowData = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber];
        if (mapping[header]) {
          rowData[mapping[header]] = cell.value;
        }
      });

      // Process Project
      if (!projects.has(rowData.project_name)) {
        projects.set(rowData.project_name, {
          name: rowData.project_name,
          real_estate_company_id: realEstateCompanyId,
          // Add other project fields as needed
        });
      }

      // Process Stock
      stocks.push({
        ...rowData,
        real_estate_company_id: realEstateCompanyId,
      });
    }
  });

  // Save Projects
  for (const project of projects.values()) {
    await Project.findOneAndUpdate(
      { name: project.name, real_estate_company_id: realEstateCompanyId },
      project,
      { upsert: true, new: true }
    );
  }

  // Save Stocks
  for (const stock of stocks) {
    const project = await Project.findOne({ name: stock.project_name, real_estate_company_id: realEstateCompanyId });
    if (project) {
      await Stock.findOneAndUpdate(
        { 
          project_id: project._id, 
          apartment: stock.apartment,
          real_estate_company_id: realEstateCompanyId 
        },
        { ...stock, project_id: project._id },
        { upsert: true, new: true }
      );
    }
  }

  return { projectsProcessed: projects.size, stocksProcessed: stocks.length };
}