import React, { useMemo, useState } from 'react';
import { CaseData } from '../types';
import { Download, Printer, Trash2 } from 'lucide-react';

interface ReportTableProps {
  data: CaseData[];
  onDelete: (ids: string[]) => void;
}

export const ReportTable: React.FC<ReportTableProps> = ({ data, onDelete }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Group data by Referrer
  const groupedData = useMemo(() => {
    const groups: Record<string, CaseData[]> = {};
    data.forEach(item => {
      if (!groups[item.referrer]) {
        groups[item.referrer] = [];
      }
      groups[item.referrer].push(item);
    });
    // Sort keys alphabetically
    return Object.keys(groups).sort().reduce((acc, key) => {
      acc[key] = groups[key];
      return acc;
    }, {} as Record<string, CaseData[]>);
  }, [data]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(data.map(d => d.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDelete = () => {
    onDelete(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // 1. Group data by Month-Year for separate files
    const filesToExport: Record<string, CaseData[]> = {};
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    data.forEach(item => {
      // Date format is DD MM YYYY (e.g. 01 10 2025)
      const parts = item.date.split(' ');
      if (parts.length === 3) {
        const monthIndex = parseInt(parts[1], 10) - 1;
        const year = parts[2];
        if (monthIndex >= 0 && monthIndex < 12) {
          const key = `DC_Records_${monthNames[monthIndex]}_${year}`;
          if (!filesToExport[key]) {
            filesToExport[key] = [];
          }
          filesToExport[key].push(item);
        } else {
           const key = `DC_Records_Unknown_Date`;
           if (!filesToExport[key]) filesToExport[key] = [];
           filesToExport[key].push(item);
        }
      } else {
         const key = `DC_Records_Unknown_Date`;
         if (!filesToExport[key]) filesToExport[key] = [];
         filesToExport[key].push(item);
      }
    });

    if (Object.keys(filesToExport).length === 0) {
      alert("No data to export.");
      return;
    }

    // 2. Generate HTML Table for each month group and trigger download
    Object.entries(filesToExport).forEach(([filename, monthData], index) => {
      // Group this month's data by Referrer for the report structure
      const groupedByReferrer: Record<string, CaseData[]> = {};
      monthData.forEach(item => {
        if (!groupedByReferrer[item.referrer]) {
          groupedByReferrer[item.referrer] = [];
        }
        groupedByReferrer[item.referrer].push(item);
      });
      
      const sortedReferrers = Object.keys(groupedByReferrer).sort();

      let htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>${filename}</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #000000; padding: 5px; }
            .header { font-weight: bold; background-color: #dff0d8; text-align: center; }
            .group-header { font-weight: bold; background-color: #fffcf0; text-align: left; }
            .dc-cell { background-color: #fff2cc; font-weight: bold; text-align: right; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                <th class="header">Date</th>
                <th class="header">Patient Name</th>
                <th class="header">Test Name</th>
                <th class="header">Remark</th>
                <th class="header">Gross Amount</th>
                <th class="header">Discount</th>
                <th class="header">Payment Received</th>
                <th class="header">Balance</th>
                <th class="header">DC</th>
              </tr>
            </thead>
            <tbody>
      `;

      sortedReferrers.forEach(doctor => {
        const cases = groupedByReferrer[doctor];
        const totalDC = cases.reduce((sum, c) => sum + c.dcAmount, 0);
        
        // Referrer Header Row - BOLD
        htmlContent += `
          <tr>
            <td colspan="8" class="group-header"><b>${doctor}</b></td>
            <td class="dc-cell">${totalDC}</td>
          </tr>
        `;

        cases.forEach(row => {
          htmlContent += `
            <tr>
              <td class="text-center" style="white-space: nowrap;">${row.date}</td>
              <td>${row.patientName}</td>
              <td>${row.investigations}</td>
              <td>${row.remark}</td>
              <td class="text-right">${row.totalFee}</td>
              <td class="text-right">${row.discount}</td>
              <td class="text-right">${row.feePaid}</td>
              <td class="text-right">${row.feeDue}</td>
              <td class="text-right">${row.dcAmount}</td>
            </tr>
          `;
        });
      });

      htmlContent += `
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Trigger download with delay to prevent browser blocking multiple downloads
      setTimeout(() => {
        const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, index * 500);
    });
  };

  return (
    <div className="flex flex-col h-full bg-white shadow-lg border border-gray-300 overflow-hidden">
      {/* Toolbar */}
      <div className="p-3 border-b border-gray-300 flex justify-between items-center bg-gray-100 print:hidden">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wide">
            DCREPORT
          </h2>
          {selectedIds.size > 0 && (
            <button 
              onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors"
            >
              <Trash2 size={14} />
              Delete ({selectedIds.size})
            </button>
          )}
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-700 text-white text-sm font-medium rounded hover:bg-green-800 transition-colors"
            >
                <Download size={14} />
                Export to Excel
            </button>
            <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-700 text-white text-sm font-medium rounded hover:bg-blue-800 transition-colors"
            >
                <Printer size={14} />
                Print
            </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-white">
        <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
          <thead className="text-gray-800 bg-[#dff0d8] sticky top-0 z-20 shadow-sm">
            <tr>
              <th className="px-2 py-2 border border-gray-400 w-10 text-center">
                <input 
                  type="checkbox" 
                  className="rounded cursor-pointer accent-blue-600"
                  checked={data.length > 0 && selectedIds.size === data.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="px-2 py-2 border border-gray-400 font-bold text-center w-28">Date</th>
              <th className="px-2 py-2 border border-gray-400 font-bold text-center w-64">Patient Name</th>
              <th className="px-2 py-2 border border-gray-400 font-bold text-center">Test Name</th>
              <th className="px-2 py-2 border border-gray-400 font-bold text-center w-32">Remark</th>
              <th className="px-2 py-2 border border-gray-400 font-bold text-center w-28">Gross Amount</th>
              <th className="px-2 py-2 border border-gray-400 font-bold text-center w-20">Discount</th>
              <th className="px-2 py-2 border border-gray-400 font-bold text-center w-28">Payment Received</th>
              <th className="px-2 py-2 border border-gray-400 font-bold text-center w-20">Balance</th>
              <th className="px-2 py-2 border border-gray-400 font-bold text-center w-20 bg-[#fff2cc]">DC</th>
            </tr>
          </thead>
          <tbody className="text-gray-900">
            {Object.keys(groupedData).length === 0 ? (
                <tr>
                    <td colSpan={10} className="p-8 text-center text-gray-500">No records found.</td>
                </tr>
            ) : (
                Object.entries(groupedData).map(([doctor, cases]: [string, CaseData[]]) => {
                const totalDC = cases.reduce((sum, c) => sum + c.dcAmount, 0);

                return (
                    <React.Fragment key={doctor}>
                    {/* Group Header */}
                    <tr className="bg-[#fffcf0] font-bold">
                        <td colSpan={9} className="px-2 py-1.5 border border-gray-400 text-left text-gray-900">
                            {doctor}
                        </td>
                        <td className="px-2 py-1.5 border border-gray-400 text-right bg-[#fff2cc]">
                            {totalDC}
                        </td>
                    </tr>
                    
                    {/* Rows */}
                    {cases.map((c) => (
                        <tr key={c.id} className={`bg-white ${c.canceled ? 'line-through text-red-600' : ''} ${selectedIds.has(c.id) ? 'bg-blue-50' : ''}`}>
                            <td className="px-2 py-1 border border-gray-300 text-center">
                              <input 
                                type="checkbox" 
                                className="rounded cursor-pointer accent-blue-600"
                                checked={selectedIds.has(c.id)}
                                onChange={() => handleSelectRow(c.id)}
                              />
                            </td>
                            <td className="px-2 py-1 border border-gray-300 whitespace-nowrap text-center">{c.date}</td>
                            <td className="px-2 py-1 border border-gray-300 text-left">{c.patientName}</td>
                            <td className="px-2 py-1 border border-gray-300 text-left truncate max-w-xs" title={c.investigations}>{c.investigations}</td>
                            <td className="px-2 py-1 border border-gray-300 text-left">{c.remark}</td>
                            <td className="px-2 py-1 border border-gray-300 text-right">{c.totalFee}</td>
                            <td className="px-2 py-1 border border-gray-300 text-right">{c.discount}</td>
                            <td className="px-2 py-1 border border-gray-300 text-right">{c.feePaid}</td>
                            <td className="px-2 py-1 border border-gray-300 text-right">{c.feeDue}</td>
                            <td className="px-2 py-1 border border-gray-300 text-right font-medium">{c.dcAmount}</td>
                        </tr>
                    ))}
                    </React.Fragment>
                );
                })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};