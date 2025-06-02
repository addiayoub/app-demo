import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  BarChart2,
  Printer,
  FileText,
  FileSliders,
  FileSignature,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const DashboardViewer = ({ dashboard, user, setSelectedDashboard }) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const handleExport = async (type) => {
    const dashboardElement = document.getElementById('dashboard-iframe-container');
    
    try {
      switch (type) {
        case 'png':
          const canvas = await html2canvas(dashboardElement);
          const pngUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = `${dashboard.name}-dashboard.png`;
          link.click();
          break;
          
        case 'pdf':
          const pdfCanvas = await html2canvas(dashboardElement);
          const imgData = pdfCanvas.toDataURL('image/png');
          const pdf = new jsPDF('landscape');
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`${dashboard.name}-dashboard.pdf`);
          break;
          
        case 'excel':
          const ws = XLSX.utils.json_to_sheet([
            {
              'Nom du Dashboard': dashboard.name,
              'Description': dashboard.description || '',
              'URL': dashboard.url,
              'Date de création': new Date(dashboard.createdAt).toLocaleDateString(),
              'Statut': dashboard.active ? 'Actif' : 'Inactif',
              'Visibilité': dashboard.isPublic ? 'Public' : 'Privé'
            }
          ]);
          
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Dashboard Info');
          XLSX.writeFile(wb, `${dashboard.name}-metadata.xlsx`);
          break;
          
        case 'csv':
          const csvData = [
            ['Nom du Dashboard', 'Description', 'URL', 'Date de création', 'Statut', 'Visibilité'],
            [
              dashboard.name,
              dashboard.description || '',
              dashboard.url,
              new Date(dashboard.createdAt).toLocaleDateString(),
              dashboard.active ? 'Actif' : 'Inactif',
              dashboard.isPublic ? 'Public' : 'Privé'
            ]
          ];
          
          const csvContent = csvData.map(row => row.join(',')).join('\n');
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          saveAs(blob, `${dashboard.name}-metadata.csv`);
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Une erreur est survenue lors de l\'export.');
    }
  };

  const printDashboard = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${dashboard.name} - Impression</title>
        <style>
          body { margin: 0; padding: 0; }
          .print-header { 
            padding: 20px; 
            text-align: center; 
            border-bottom: 1px solid #eee;
            margin-bottom: 20px;
          }
          .print-footer { 
            padding: 10px; 
            text-align: center; 
            font-size: 12px; 
            color: #666;
            margin-top: 20px;
          }
          iframe { 
            width: 100%; 
            height: calc(100vh - 100px); 
            border: none;
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>${dashboard.name}</h1>
          <p>${dashboard.description || ''}</p>
          <p>Imprimé le ${new Date().toLocaleDateString()} par ${user.name}</p>
        </div>
        
        <iframe src="${dashboard.url}"></iframe>
        
        <div class="print-footer">
          © ${new Date().getFullYear()} ${window.location.hostname}
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 1000);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <motion.div
      key={dashboard._id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden"
    >
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            {dashboard.name}
            {!dashboard.active && (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Inactif</span>
            )}
            {dashboard.isPublic && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Public</span>
            )}
          </h2>
          {dashboard.description && (
            <p className="text-gray-600 mt-1">{dashboard.description}</p>
          )}
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-all"
            >
              <Download size={16} />
              Exporter
              {isExportMenuOpen ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
            </button>
            
            <AnimatePresence>
              {isExportMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200"
                  onMouseLeave={() => setIsExportMenuOpen(false)}
                >
                  <div className="py-1">
                    <button
                      onClick={() => {
                        handleExport('png');
                        setIsExportMenuOpen(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <FileText className="mr-2" size={14} />
                      Image (PNG)
                    </button>
                    <button
                      onClick={() => {
                        handleExport('pdf');
                        setIsExportMenuOpen(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <FileSignature className="mr-2" size={14} />
                      PDF
                    </button>
                    <button
                      onClick={() => {
                        handleExport('excel');
                        setIsExportMenuOpen(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <FileSliders className="mr-2" size={14} />
                      Excel
                    </button>
                    <div className="border-t border-gray-200"></div>
                    <button
                      onClick={() => {
                        printDashboard();
                        setIsExportMenuOpen(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <Printer className="mr-2" size={14} />
                      Imprimer
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      <div className="h-[calc(100vh-250px)] min-h-[500px] relative">
        {dashboard.active ? (
          <div id="dashboard-iframe-container" className="w-full h-full">
            <iframe 
              src={dashboard.url} 
              title={dashboard.name}
              className="w-full h-full border-0"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center p-6 max-w-md">
              <div className="mx-auto bg-red-100 text-red-600 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
                <BarChart2 size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Dashboard désactivé</h3>
              <p className="text-gray-500 mb-4">
                Ce tableau de bord a été désactivé par l'administrateur et n'est plus accessible.
              </p>
              <button
                onClick={() => setSelectedDashboard(null)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Retour à la liste
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
        <div>
          Assigné le {new Date(dashboard.createdAt).toLocaleDateString()}
        </div>
        <div>
          Dernière mise à jour : {new Date(dashboard.updatedAt).toLocaleDateString()}
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardViewer;