"use client";
import { Button } from "@/components/ui/button";

interface PDFExporterProps {
  clientName: string;
  progressData: any[];
  onExport: () => void;
  isLoading?: boolean;
  siteName?: string;
}

export function PDFExporter({ clientName, progressData, onExport, isLoading = false, siteName = "GZnutrition" }: PDFExporterProps) {
  const handleExport = async () => {
    try {
      // Create a new window for PDF generation
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      // Generate HTML content for PDF
      const htmlContent = generatePDFContent(clientName, progressData);
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };
      
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const generatePDFContent = (clientName: string, data: any[]) => {
    const currentDate = new Date().toLocaleDateString('it-IT');
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Report Progressi - ${clientName}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #3B82F6;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #1F2937;
              margin: 0;
              font-size: 28px;
            }
            .header p {
              color: #6B7280;
              margin: 5px 0 0 0;
              font-size: 14px;
            }
            .client-info {
              background: #F9FAFB;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .client-info h2 {
              color: #374151;
              margin: 0 0 15px 0;
              font-size: 20px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            .info-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #E5E7EB;
            }
            .info-label {
              font-weight: 600;
              color: #4B5563;
            }
            .info-value {
              color: #1F2937;
            }
            .progress-section {
              margin-bottom: 30px;
            }
            .progress-section h2 {
              color: #374151;
              margin: 0 0 20px 0;
              font-size: 20px;
              border-left: 4px solid #3B82F6;
              padding-left: 15px;
            }
            .progress-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .progress-table th,
            .progress-table td {
              border: 1px solid #D1D5DB;
              padding: 12px;
              text-align: left;
            }
            .progress-table th {
              background: #F3F4F6;
              font-weight: 600;
              color: #374151;
            }
            .progress-table tr:nth-child(even) {
              background: #F9FAFB;
            }
            .chart-placeholder {
              background: #F3F4F6;
              border: 2px dashed #D1D5DB;
              padding: 40px;
              text-align: center;
              border-radius: 8px;
              margin: 20px 0;
            }
            .chart-placeholder p {
              color: #6B7280;
              margin: 0;
              font-size: 16px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #E5E7EB;
              text-align: center;
              color: #6B7280;
              font-size: 12px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin: 20px 0;
            }
            .stat-card {
              background: #F9FAFB;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
              border: 1px solid #E5E7EB;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #3B82F6;
              margin-bottom: 5px;
            }
            .stat-label {
              color: #6B7280;
              font-size: 14px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
            <div class="header">
              <h1>📊 Report Progressi Cliente</h1>
              <p>Generato il ${currentDate} - ${siteName}</p>
            </div>

          <div class="client-info">
            <h2>👤 Informazioni Cliente</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Nome:</span>
                <span class="info-value">${clientName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Data Report:</span>
                <span class="info-value">${currentDate}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Progressi Registrati:</span>
                <span class="info-value">${data.length}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Periodo:</span>
                <span class="info-value">${data.length > 0 ? 
                  `${new Date(data[0].date).toLocaleDateString('it-IT')} - ${new Date(data[data.length - 1].date).toLocaleDateString('it-IT')}` : 
                  'Nessun dato'
                }</span>
              </div>
            </div>
          </div>

          ${data.length > 0 ? `
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${data.length}</div>
                <div class="stat-label">Progressi Registrati</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${data.filter(d => d.weight).length}</div>
                <div class="stat-label">Misurazioni Peso</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${data.filter(d => d.bodyFat).length}</div>
                <div class="stat-label">Analisi Massa Grassa</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${data.filter(d => d.muscleMass).length}</div>
                <div class="stat-label">Massa Muscolare</div>
              </div>
            </div>

            <div class="progress-section">
              <h2>📈 Storico Progressi</h2>
              <table class="progress-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Peso (kg)</th>
                    <th>Massa Grassa (%)</th>
                    <th>Massa Muscolare (kg)</th>
                    <th>Vita (cm)</th>
                    <th>Petto (cm)</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.map(entry => `
                    <tr>
                      <td>${new Date(entry.date).toLocaleDateString('it-IT')}</td>
                      <td>${entry.weight || '-'}</td>
                      <td>${entry.bodyFat || '-'}</td>
                      <td>${entry.muscleMass || '-'}</td>
                      <td>${entry.measurements?.waist || '-'}</td>
                      <td>${entry.measurements?.chest || '-'}</td>
                      <td>${entry.notes || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="progress-section">
              <h2>📊 Grafici Progressi</h2>
              <div class="chart-placeholder">
                <p>📈 I grafici visuali sono disponibili nell'applicazione web</p>
                <p>Utilizza la funzione di stampa per salvare questo report</p>
              </div>
            </div>
          ` : `
            <div class="progress-section">
              <h2>📊 Nessun Progresso Registrato</h2>
              <div class="chart-placeholder">
                <p>📝 Inizia a registrare i progressi del cliente per generare report dettagliati</p>
              </div>
            </div>
          `}

          <div class="footer">
            <p>Report generato automaticamente da ${siteName}</p>
            <p>Per domande o supporto, contatta il tuo personal trainer</p>
          </div>
        </body>
      </html>
    `;
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isLoading}
      className="bg-red-600 hover:bg-red-700 text-white"
    >
      {isLoading ? '⏳ Generando...' : '📄 Export PDF'}
    </Button>
  );
}
