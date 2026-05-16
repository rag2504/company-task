import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { getReportDataset } from './analyticsService.js';
import { chatComplete, isGroqConfigured } from './groqService.js';

function streamToBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

export async function buildCsvReport(userId, range) {
  const data = await getReportDataset(userId, range);
  const lines = [];
  lines.push('Bill Number,Date,Customer,Total,Payment Status,Payment Method');
  for (const b of data.bills) {
    lines.push(
      [
        b.billNumber,
        new Date(b.createdAt).toISOString(),
        `"${(b.customerName || '').replace(/"/g, '""')}"`,
        b.totalAmount,
        b.paymentStatus,
        b.paymentMethod,
      ].join(',')
    );
  }
  return {
    filename: `quickbill-report-${range}-${Date.now()}.csv`,
    mime: 'text/csv',
    body: lines.join('\n'),
  };
}

export async function buildExcelReport(userId, range) {
  const data = await getReportDataset(userId, range);
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Quickbill POS';
  const ws = wb.addWorksheet('Bills');
  ws.columns = [
    { header: 'Bill Number', key: 'billNumber', width: 22 },
    { header: 'Date', key: 'date', width: 24 },
    { header: 'Customer', key: 'customer', width: 28 },
    { header: 'Total', key: 'total', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Method', key: 'method', width: 12 },
  ];
  for (const b of data.bills) {
    ws.addRow({
      billNumber: b.billNumber,
      date: new Date(b.createdAt).toISOString(),
      customer: b.customerName,
      total: b.totalAmount,
      status: b.paymentStatus,
      method: b.paymentMethod,
    });
  }

  const ws2 = wb.addWorksheet('Products');
  ws2.columns = [
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Category', key: 'category', width: 22 },
    { header: 'Stock', key: 'stock', width: 10 },
    { header: 'Price', key: 'price', width: 10 },
    { header: 'Cost', key: 'cost', width: 10 },
  ];
  for (const p of data.products) {
    ws2.addRow({
      name: p.name,
      category: p.category,
      stock: p.units,
      price: p.price,
      cost: p.cost ?? 0,
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  return {
    filename: `quickbill-report-${range}-${Date.now()}.xlsx`,
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    body: Buffer.from(buf),
  };
}

export async function buildPdfReport(userId, range) {
  const data = await getReportDataset(userId, range);
  let aiSummary = '';
  if (isGroqConfigured()) {
    aiSummary = await chatComplete(
      [
        {
          role: 'system',
          content:
            'You summarize retail POS reports in 2 short paragraphs for shop owners. Plain text.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            range: data.range,
            totals: data.analyticsSnapshot.totals,
            pending: data.analyticsSnapshot.pendingPayments,
            profit: data.analyticsSnapshot.profitAnalysis,
            billCount: data.bills.length,
          }),
        },
      ],
      { maxTokens: 400 }
    );
  }

  const doc = new PDFDocument({ margin: 50 });
  doc.fontSize(18).text(`Quickbill POS — ${range} report`, { underline: true });
  doc.moveDown();
  doc.fontSize(11).text(`Period: ${data.period.start.toDateString()} → ${data.period.end.toDateString()}`);
  doc.moveDown();
  doc.fontSize(12).text('Snapshot');
  doc.fontSize(10).text(
    `Total sales (all time in snapshot): ₹${data.analyticsSnapshot.totals.totalSales}`
  );
  doc.text(`Today's sales: ₹${data.analyticsSnapshot.totals.todaySales}`);
  doc.text(`Monthly revenue (MTD): ₹${data.analyticsSnapshot.totals.monthlyRevenue}`);
  doc.text(`Pending payments: ${data.analyticsSnapshot.pendingPayments.count} bills`);
  doc.moveDown();
  if (aiSummary) {
    doc.fontSize(12).text('AI summary');
    doc.fontSize(10).text(aiSummary);
    doc.moveDown();
  }
  doc.fontSize(12).text('Recent bills');
  doc.fontSize(9);
  data.bills.slice(0, 40).forEach((b) => {
    doc.text(
      `${b.billNumber} | ${new Date(b.createdAt).toLocaleString()} | ${b.customerName} | ₹${b.totalAmount} | ${b.paymentStatus}`
    );
  });
  doc.end();

  const buffer = await streamToBuffer(doc);
  return {
    filename: `quickbill-report-${range}-${Date.now()}.pdf`,
    mime: 'application/pdf',
    body: buffer,
  };
}
