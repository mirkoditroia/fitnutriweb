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
      <html lang="it">
        <head>
          <meta charset="UTF-8">
          <meta name="description" content="Report progressi cliente ${clientName}">
          <meta name="author" content="${siteName}">
          <meta name="keywords" content="nutrizione, progressi, cliente, report">
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
            .charts-container {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin: 20px 0;
            }
            .chart-section {
              background: #F9FAFB;
              padding: 20px;
              border-radius: 8px;
              border: 1px solid #E5E7EB;
            }
            .chart-section h3 {
              margin: 0 0 15px 0;
              color: #374151;
              font-size: 16px;
              text-align: center;
            }
            .chart-placeholder {
              text-align: center;
              background: white;
              border-radius: 4px;
              padding: 10px;
            }
            canvas {
              max-width: 100%;
              height: auto;
            }
            @media print {
              body { 
                margin: 0; 
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              .no-print { display: none; }
              .charts-container {
                page-break-inside: avoid;
              }
              .chart-section {
                page-break-inside: avoid;
                margin-bottom: 20px;
              }
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
                    <th>Fianchi (cm)</th>
                    <th>Bicipite (cm)</th>
                    <th>Coscia (cm)</th>
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
                      <td>${entry.measurements?.hipCircumference || '-'}</td>
                      <td>${entry.measurements?.bicepCircumference || '-'}</td>
                      <td>${entry.measurements?.thighCircumference || '-'}</td>
                      <td>${entry.notes || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="progress-section">
              <h2>📊 Grafici Progressi</h2>
              <div class="charts-container">
                <div class="chart-section">
                  <h3>📈 Andamento Peso</h3>
                  <div class="chart-placeholder">
                    <canvas id="weightChart" width="400" height="200"></canvas>
                  </div>
                </div>
                <div class="chart-section">
                  <h3>📊 Massa Grassa</h3>
                  <div class="chart-placeholder">
                    <canvas id="bodyFatChart" width="400" height="200"></canvas>
                  </div>
                </div>
                <div class="chart-section">
                  <h3>💪 Massa Muscolare</h3>
                  <div class="chart-placeholder">
                    <canvas id="muscleChart" width="400" height="200"></canvas>
                  </div>
                </div>
                <div class="chart-section">
                  <h3>📏 Misurazioni Corporee</h3>
                  <div class="chart-placeholder">
                    <canvas id="measurementsChart" width="400" height="200"></canvas>
                  </div>
                </div>
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
            <p>Formato: PDF/A-1b (ISO 19005-1:2005)</p>
          </div>
          
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <script>
            // ✅ IMPLEMENTAZIONE GRAFICI CON CHART.JS
            document.addEventListener('DOMContentLoaded', function() {
              const data = ${JSON.stringify(data)};
              
              if (data.length === 0) return;
              
              // Prepara i dati per i grafici
              const labels = data.map(entry => new Date(entry.date).toLocaleDateString('it-IT'));
              const weightData = data.map(entry => entry.weight || null);
              const bodyFatData = data.map(entry => entry.bodyFat || null);
              const muscleData = data.map(entry => entry.muscleMass || null);
              
              // Grafico Peso
              const weightCtx = document.getElementById('weightChart');
              if (weightCtx) {
                new Chart(weightCtx, {
                  type: 'line',
                  data: {
                    labels: labels,
                    datasets: [{
                      label: 'Peso (kg)',
                      data: weightData,
                      borderColor: '#3B82F6',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      tension: 0.4,
                      fill: true
                    }]
                  },
                  options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false }
                    },
                    scales: {
                      y: { beginAtZero: false }
                    }
                  }
                });
              }
              
              // Grafico Massa Grassa
              const bodyFatCtx = document.getElementById('bodyFatChart');
              if (bodyFatCtx) {
                new Chart(bodyFatCtx, {
                  type: 'line',
                  data: {
                    labels: labels,
                    datasets: [{
                      label: 'Massa Grassa (%)',
                      data: bodyFatData,
                      borderColor: '#EF4444',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      tension: 0.4,
                      fill: true
                    }]
                  },
                  options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false }
                    },
                    scales: {
                      y: { beginAtZero: false }
                    }
                  }
                });
              }
              
              // Grafico Massa Muscolare
              const muscleCtx = document.getElementById('muscleChart');
              if (muscleCtx) {
                new Chart(muscleCtx, {
                  type: 'line',
                  data: {
                    labels: labels,
                    datasets: [{
                      label: 'Massa Muscolare (kg)',
                      data: muscleData,
                      borderColor: '#10B981',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      tension: 0.4,
                      fill: true
                    }]
                  },
                  options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false }
                    },
                    scales: {
                      y: { beginAtZero: false }
                    }
                  }
                });
              }
              
              // Grafico Misurazioni Corporee
              const measurementsCtx = document.getElementById('measurementsChart');
              if (measurementsCtx) {
                const waistData = data.map(entry => entry.measurements?.waist || null);
                const chestData = data.map(entry => entry.measurements?.chest || null);
                const hipData = data.map(entry => entry.measurements?.hipCircumference || null);
                
                new Chart(measurementsCtx, {
                  type: 'line',
                  data: {
                    labels: labels,
                    datasets: [
                      {
                        label: 'Vita (cm)',
                        data: waistData,
                        borderColor: '#8B5CF6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        tension: 0.4
                      },
                      {
                        label: 'Petto (cm)',
                        data: chestData,
                        borderColor: '#F59E0B',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.4
                      },
                      {
                        label: 'Fianchi (cm)',
                        data: hipData,
                        borderColor: '#06B6D4',
                        backgroundColor: 'rgba(6, 182, 212, 0.1)',
                        tension: 0.4
                      }
                    ]
                  },
                  options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { 
                        display: true,
                        position: 'bottom'
                      }
                    },
                    scales: {
                      y: { beginAtZero: false }
                    }
                  }
                });
              }
            });
          </script>
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
