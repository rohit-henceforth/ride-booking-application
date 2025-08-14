import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as PDFDocument from 'pdfkit';
import * as moment from 'moment-timezone';

interface InvoiceItem {
  description: string;
  distance: number;
  total: number;
}

interface InvoiceI {
  invoiceNumber: string;
  invoiceDate: Date;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  items: InvoiceItem[];
  taxPercent?: number;
  discount?: number;
  currency?: string;
  logoPath?: string;
  rideId : string ;
}

@Injectable()
export class PdfService {
  private readonly PAGE_MARGIN = 50;

  async createInvoice(invoiceData: InvoiceI): Promise<string> {
    const doc = new (PDFDocument as any)({ size: 'A4', margin: this.PAGE_MARGIN });

    // Output path
    const fileName = `invoice_${invoiceData.invoiceNumber || Date.now()}.pdf`;
    const filePath = path.join(__dirname, `../../uploads/invoices/${fileName}`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const pageWidth = doc.page.width;
    const usableWidth = pageWidth - this.PAGE_MARGIN * 2;
    const logoPath = invoiceData.logoPath || path.join(__dirname, '../../uploads/logo.png');

    // ----- Header -----
    this.drawHeader(doc, logoPath, invoiceData, usableWidth);

    // ----- Client & Invoice Info Box -----
    doc.moveDown(4);
    this.drawClientAndInvoiceBox(doc, invoiceData, usableWidth);

    doc.moveDown(3);

    // ----- Items Table -----
    this.drawTable(doc, invoiceData, usableWidth);

    doc.moveDown(1);

    // ----- Totals (Full Width) -----
    this.drawTotals(doc, invoiceData, usableWidth);

    // ----- Footer (Full Width) -----
    doc.moveDown(2);
    this.drawFooter(doc, usableWidth);

    doc.end();

    await new Promise<void>((resolve, reject) => {
      stream.on('finish', () => resolve());
      stream.on('error', (err) => reject(err));
    });

    return filePath;
  }

  private drawHeader(doc: any, logoPath: string, invoiceData: InvoiceI, usableWidth: number) {
    const leftX = this.PAGE_MARGIN;
    const logoWidth = 110;

    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, leftX, 40, { width: logoWidth, align: 'left' });
      } catch (err) {}
    }

    const company = {
      name: 'Ride Booking Application',
      address: 'Mohali, Punjab, India',
      email: 'info@ridebooking.com',
      phone: '(123)456-7890',
    };

    const companyBlockX = leftX + logoWidth + 10;
    doc.fontSize(20).fillColor('#333').text(company.name, companyBlockX, 40);
    doc.fontSize(9).fillColor('#666')
      .text(company.address || '', companyBlockX, 64)
      .text(`Email: ${company.email || ''}`, companyBlockX)
      .text(`Phone: ${company.phone || ''}`, companyBlockX);

    // Title border
    doc.moveTo(this.PAGE_MARGIN, 140).lineTo(this.PAGE_MARGIN + usableWidth, 140).strokeColor('#e6e6e6').lineWidth(1).stroke();
    doc.fillColor('#000');
  }

  private drawClientAndInvoiceBox(doc: any, invoiceData: InvoiceI, usableWidth: number) {
    const startY = doc.y + 10;
    const boxHeight = 80;
    const leftX = this.PAGE_MARGIN;
    const midX = leftX + usableWidth / 2;

    doc.roundedRect(leftX, startY, usableWidth, boxHeight, 6).strokeColor('#ddd').lineWidth(1).stroke();

    const padding = 12;
    const leftTextX = leftX + padding;
    let y = startY + padding;

    doc.fontSize(10).fillColor('#333').font('Helvetica-Bold').text('Invoice To:', leftTextX, y);
    doc.font('Helvetica').fontSize(10).fillColor('#444');
    y += 16;
    doc.text(invoiceData.clientName || '-', leftTextX, y);
    y += 12;
    if (invoiceData.clientEmail) doc.text(`Email: ${invoiceData.clientEmail}`, leftTextX, y);
    y += 12;
    if (invoiceData.clientPhone) doc.text(`Phone: ${invoiceData.clientPhone}`, leftTextX, y);

    const rightTextX = midX + padding;
    let ry = startY + padding;
    doc.font('Helvetica-Bold').text('Invoice Number', rightTextX, ry, { align: 'left' });
    doc.font('Helvetica').text(invoiceData.invoiceNumber || '-', rightTextX + 80, ry);
    ry += 16;
    doc.font('Helvetica-Bold').text('Ride Id', rightTextX, ry);
    doc.font('Helvetica').text(invoiceData.rideId, rightTextX + 80, ry);
    ry += 16;
    doc.font('Helvetica-Bold').text('Invoice Date', rightTextX, ry);
    doc.font('Helvetica').text(moment(invoiceData.invoiceDate).tz('Asia/Kolkata').format('DD MMM, YYYY'), rightTextX + 80, ry);
  }

  private drawTable(doc: any, invoiceData: InvoiceI, usableWidth: number) {
    const col1 = usableWidth * 0.45;
    const col2 = usableWidth * 0.15;
    const col3 = usableWidth * 0.2;
    const col4 = usableWidth * 0.2;
    const startX = this.PAGE_MARGIN;
    let y = doc.y;

    doc.rect(startX, y, usableWidth, 22).fill('#f5f5f7').fillColor('#333').font('Helvetica-Bold').fontSize(10);
    doc.text('Description', startX + 8, y + 6, { width: col1 - 16 });
    doc.text('Distance', startX + col1 + col2 + 8, y + 6, { width: col3 - 16, align: 'right' });
    doc.text('Fare', startX + col1 + col2 + col3 + 8, y + 6, { width: col4 - 16, align: 'right' });
    y += 22;
    doc.fillColor('#000').font('Helvetica').fontSize(10);

    let rowIndex = 0;
    let subtotal = 0;
    for (const item of invoiceData.items) {
      if (y + 30 > doc.page.height - 150) {
        doc.addPage();
        y = this.PAGE_MARGIN;
      }
      const rowHeight = 22;
      if (rowIndex % 2 === 0) {
        doc.rect(startX, y, usableWidth, rowHeight).fill('#fbfbfb').fillColor('#000');
      }

      doc.fillColor('#333').text(item.description, startX + 8, y + 6, { width: col1 - 16 });
      doc.text(item.distance, startX + col1 + col2 + 8, y + 6, { width: col3 - 16, align: 'right' });
      doc.text(this.formatCurrency(item.total, invoiceData.currency), startX + col1 + col2 + col3 + 8, y + 6, { width: col4 - 16, align: 'right' });

      y += rowHeight;
      rowIndex++;
      subtotal += item.total;
      doc.fillColor('#000');
    }

    doc.moveTo(startX, y).lineTo(startX + usableWidth, y).strokeColor('#e6e6e6').lineWidth(1).stroke();
    doc.y = y + 8;
    (doc as any).__invoice_subtotal = subtotal;
  }

  private drawTotals(doc: any, invoiceData: InvoiceI, usableWidth: number) {
    const subtotal: number = (doc as any).__invoice_subtotal || 0;
    const taxPercent = invoiceData.taxPercent || 0;
    const discount = invoiceData.discount || 0;
    const tax = +(subtotal * (taxPercent / 100));
    const total = +(subtotal + tax - discount);

    const startX = this.PAGE_MARGIN;
    const labelWidth = usableWidth * 0.5;
    const valueWidth = usableWidth * 0.5;

    doc.fontSize(10).font('Helvetica');

    // Subtotal
    doc.text('Subtotal', startX, doc.y, { width: labelWidth, align: 'left' });
    doc.text(this.formatCurrency(subtotal, invoiceData.currency), startX + labelWidth, doc.y, { width: valueWidth, align: 'right' });
    doc.moveDown(0.5);

    // Tax
    doc.text(`Tax (${taxPercent}%)`, startX, doc.y, { width: labelWidth, align: 'left' });
    doc.text(this.formatCurrency(tax, invoiceData.currency), startX + labelWidth, doc.y, { width: valueWidth, align: 'right' });
    doc.moveDown(0.5);

    // Discount
    doc.text('Discount', startX, doc.y, { width: labelWidth, align: 'left' });
    doc.text(this.formatCurrency(discount, invoiceData.currency), startX + labelWidth, doc.y, { width: valueWidth, align: 'right' });
    doc.moveDown(1);

    // Total box (full width)
    const boxY = doc.y;
    const boxHeight = 36;
    doc.roundedRect(startX, boxY, usableWidth, boxHeight, 6).fill('#f7f7f8').fillColor('#000');
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text('Total Amount Due', startX + 8, boxY + 8, { width: usableWidth / 2 - 8, align: 'left' });
    doc.text(this.formatCurrency(total, invoiceData.currency), startX + usableWidth / 2, boxY + 8, { width: usableWidth / 2 - 8, align: 'right' });
    doc.moveDown(3);
  }

  private drawFooter(doc: any, usableWidth: number) {
    doc.fontSize(9).font('Helvetica').fillColor('#666');
    doc.text('Payment is due within 30 days', this.PAGE_MARGIN, doc.y, { width: usableWidth, align: 'center' });
    doc.moveDown(0.3);
    doc.text('Thank you for your business!', this.PAGE_MARGIN, doc.y, { width: usableWidth, align: 'center' });
    doc.moveDown(0.5);
    doc.text('If you have questions about this invoice, contact support@company.com', this.PAGE_MARGIN, doc.y, { width: usableWidth, align: 'center' });
  }

  private formatCurrency(amount: number, currency?: string) {
    const symbol = currency || '₹';
    return `${symbol}${Number(amount).toFixed(2)}`;
  }

}
