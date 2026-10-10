import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface InvoiceItem {
  date: string;
  description: string;
  reference: string;
  rechargeAmount: number | null;
  consumedAmount: number | null;
  balanceAfter: number | null;
}

export interface InvoiceData {
  statementNo: string;
  generatedAt: string;
  billingPeriod: {
    from: string;
    to: string;
  };
  customer: {
    name: string;
    email: string;
    phone?: string | null;
  };
  meter: {
    name: string;
    meterNumber: string;
    accountNumber: string;
    address?: string | null;
    tariff?: string | null;
    sanctionLoad?: number | null;
    phase?: string | null;
    currentBalance: number | null;
    status: string;
  };
  financials: {
    openingBalance: number;
    totalRecharged: number;
    totalConsumed: number;
    closingBalance: number;
  };
  items: InvoiceItem[];
}

export function generateInvoicePDF(data: InvoiceData): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // 1. Top Header Banner
  doc.setFillColor(15, 23, 42); // slate-900 / dark navy
  doc.rect(0, 0, pageWidth, 32, "F");

  // Emerald accent stripe
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 31, pageWidth, 1.5, "F");

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("DESCO SMART", margin, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(
    "Prepaid Electricity Balance Statement & Monthly Invoice",
    margin,
    21,
  );
  doc.text(
    "Dhaka Electric Supply Company Limited — Customer Portal",
    margin,
    26,
  );

  // Right-aligned Statement Info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `STATEMENT: #${data.statementNo}`,
    pageWidth - margin,
    14,
    { align: "right" },
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Date: ${data.generatedAt}`,
    pageWidth - margin,
    20,
    { align: "right" },
  );
  doc.text(
    `Period: ${data.billingPeriod.from} to ${data.billingPeriod.to}`,
    pageWidth - margin,
    26,
    { align: "right" },
  );

  let cursorY = 40;

  // 2. Customer & Meter Details (Two columns)
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 34, 2, 2, "FD");

  // Column 1: Customer Info
  const col1X = margin + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("CUSTOMER & ACCOUNT DETAILS", col1X, cursorY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Customer Name: ${data.customer.name}`, col1X, cursorY + 14);
  doc.text(`Email: ${data.customer.email}`, col1X, cursorY + 20);
  doc.text(
    `Premises: ${data.meter.address || "Dhaka Metropolitan Area, Bangladesh"}`,
    col1X,
    cursorY + 26,
  );

  // Column 2: Meter Technical Info
  const col2X = pageWidth / 2 + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("METER SPECIFICATIONS", col2X, cursorY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Meter Number: ${data.meter.meterNumber}`,
    col2X,
    cursorY + 14,
  );
  doc.text(
    `Account Number: ${data.meter.accountNumber}`,
    col2X,
    cursorY + 20,
  );
  doc.text(
    `Tariff: ${data.meter.tariff || "Residential (LT-A)"}  |  Load: ${data.meter.sanctionLoad ? `${data.meter.sanctionLoad} kW` : "1.0 kW"}`,
    col2X,
    cursorY + 26,
  );

  cursorY += 40;

  // 3. Financial Summary Bar (4 Blocks)
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const cards = [
    {
      label: "Opening Balance",
      value: `BDT ${data.financials.openingBalance.toFixed(2)}`,
      color: [241, 245, 249],
      textColor: [30, 41, 59],
    },
    {
      label: "Total Recharges",
      value: `BDT ${data.financials.totalRecharged.toFixed(2)}`,
      color: [236, 253, 245],
      textColor: [5, 150, 105],
    },
    {
      label: "Total Consumed",
      value: `BDT ${data.financials.totalConsumed.toFixed(2)}`,
      color: [254, 242, 242],
      textColor: [220, 38, 38],
    },
    {
      label: "Closing Balance",
      value: `BDT ${data.financials.closingBalance.toFixed(2)}`,
      color: [240, 253, 250],
      textColor: [13, 148, 136],
    },
  ];

  cards.forEach((card, i) => {
    const cardX = margin + i * (cardWidth + 3);
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, cursorY, cardWidth, 18, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(card.label, cardX + 3.5, cursorY + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(card.textColor[0], card.textColor[1], card.textColor[2]);
    doc.text(card.value, cardX + 3.5, cursorY + 13.5);
  });

  cursorY += 24;

  // 4. Ledger & Readings Table
  const tableData =
    data.items.length > 0
      ? data.items.map((item) => [
          item.date,
          item.description,
          item.reference || "—",
          item.rechargeAmount !== null
            ? `+ BDT ${item.rechargeAmount.toFixed(2)}`
            : "—",
          item.consumedAmount !== null
            ? `- BDT ${item.consumedAmount.toFixed(2)}`
            : "—",
          item.balanceAfter !== null
            ? `BDT ${item.balanceAfter.toFixed(2)}`
            : "—",
        ])
      : [
          [
            data.billingPeriod.from,
            "Opening Stored Balance",
            "INITIAL",
            "—",
            "—",
            `BDT ${data.financials.openingBalance.toFixed(2)}`,
          ],
          [
            data.billingPeriod.to,
            "Period Current Balance Status",
            "STATUS_SYNC",
            data.financials.totalRecharged > 0
              ? `+ BDT ${data.financials.totalRecharged.toFixed(2)}`
              : "—",
            data.financials.totalConsumed > 0
              ? `- BDT ${data.financials.totalConsumed.toFixed(2)}`
              : "—",
            `BDT ${data.financials.closingBalance.toFixed(2)}`,
          ],
        ];

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    head: [
      [
        "Date & Time",
        "Activity / Description",
        "Reference",
        "Recharge (+)",
        "Usage (-)",
        "Balance",
      ],
    ],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 55 },
      2: { cellWidth: 26 },
      3: { cellWidth: 23, halign: "right" },
      4: { cellWidth: 23, halign: "right" },
      5: { cellWidth: 25, halign: "right" },
    },
  });

  // Calculate table end position
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } })
    .lastAutoTable.finalY;

  let noticeY = finalY + 8;
  if (noticeY > pageHeight - 35) {
    doc.addPage();
    noticeY = 20;
  }

  // 5. Official Recharge Guidelines Box
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, noticeY, pageWidth - margin * 2, 22, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text("OFFICIAL RECHARGE INSTRUCTIONS & CUSTOMER CARE", margin + 4, noticeY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "- bKash: Pay Bill -> Electricity (Prepaid) -> DESCO -> Enter Account Number.",
    margin + 4,
    noticeY + 11,
  );
  doc.text(
    "- Nagad / Rocket (Biller 202) / DESCO Web Portal: https://prepaid.desco.org.bd",
    margin + 4,
    noticeY + 15.5,
  );
  doc.text(
    "- DESCO 24/7 Helpline: 16120 | Enter the 20-digit generated token into your meter keypad and press Enter.",
    margin + 4,
    noticeY + 20,
  );

  // 6. Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    "Generated securely via DESCO SMART Prepaid Monitoring System. This is an electronic statement and requires no physical signature.",
    margin,
    pageHeight - 8,
  );
  doc.text(
    `Page 1 of 1`,
    pageWidth - margin,
    pageHeight - 8,
    { align: "right" },
  );

  // Save the PDF to client
  const filename = `DESCO_Invoice_${data.meter.meterNumber}_${data.billingPeriod.to}.pdf`;
  doc.save(filename);
}
