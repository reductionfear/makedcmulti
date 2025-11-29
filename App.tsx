import React, { useState, useEffect, useMemo } from 'react';
import { parseData } from './utils';
import { CaseData } from './types';
import { ReportTable } from './components/ReportTable';
import { Dashboard } from './components/Dashboard';
import { AddEntryModal } from './components/AddEntryModal';
import { LayoutDashboard, FileSpreadsheet, Search, Calendar, Plus } from 'lucide-react';

const App: React.FC = () => {
  const [rawData, setRawData] = useState<CaseData[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'report'>('report');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    const data = parseData();
    setRawData(data);
  }, []);

  const handleAddEntry = (newEntry: CaseData) => {
    setRawData(prev => [newEntry, ...prev]);
    setIsAddModalOpen(false);
  };

  const handleDeleteEntries = (ids: string[]) => {
    if (confirm(`Are you sure you want to delete ${ids.length} entries?`)) {
      setRawData(prev => prev.filter(item => !ids.includes(item.id)));
    }
  };

  // Filtering Logic
  const filteredData = useMemo(() => {
    let processed = rawData;

    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      processed = processed.filter(item => 
        item.patientName.toLowerCase().includes(lower) ||
        item.referrer.toLowerCase().includes(lower) ||
        item.investigations.toLowerCase().includes(lower)
      );
    }

    if (selectedDate) {
       processed = processed.filter(item => {
           // item.date is format DD MM YYYY (e.g. 01 10 2025)
           // selectedDate is YYYY-MM-DD (e.g. 2025-10-01)
           const parts = item.date.split(' ');
           if(parts.length === 3) {
             const itemIso = `${parts[2]}-${parts[1]}-${parts[0]}`;
             return itemIso === selectedDate;
           }
           return false;
       });
    }

    return processed;
  }, [rawData, searchQuery, selectedDate]);

  return (
    <div className="flex h-screen w-full bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col transition-all duration-300">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-lg">D</div>
             <h1 className="text-xl font-bold tracking-tight">DC Manager</h1>
          </div>
          <p className="text-xs text-slate-400 mt-2">Diagnostic Center Report</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab('report')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'report' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileSpreadsheet size={20} />
            <span className="font-medium">DC Report</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
            <div className="text-xs text-slate-500 text-center">
                v1.1.0 &copy; 2025
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header / Filter Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-20">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {activeTab === 'dashboard' ? 'Overview' : 'Daily Collection Report'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
                {filteredData.length} records found
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors shadow-sm mr-2"
            >
              <Plus size={16} />
              Add Entry
            </button>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <Calendar size={18} />
                </div>
                <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
                />
            </div>

            {(searchQuery || selectedDate) && (
                <button 
                    onClick={() => { setSearchQuery(''); setSelectedDate(''); }}
                    className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    Clear
                </button>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden p-4">
          {activeTab === 'dashboard' ? (
            <Dashboard data={filteredData} />
          ) : (
            <ReportTable data={filteredData} onDelete={handleDeleteEntries} />
          )}
        </div>
      </main>

      {isAddModalOpen && (
        <AddEntryModal 
          onClose={() => setIsAddModalOpen(false)} 
          onSave={handleAddEntry}
        />
      )}
    </div>
  );
};

export default App;