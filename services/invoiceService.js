const PDFDocument = require('pdfkit');

/**
 * Generates a PDF invoice for a given order and pipes it to a writable stream.
 *
 * @param {Object} user - The user object (buyer).
 * @param {Object} order - The populated order object.
 * @param {stream.Writable} dataCallback - The writable stream (e.g., res) to pipe the PDF to.
 * @param {Function} endCallback - Callback when the stream ends.
 */
const buildInvoice = (user, order, dataCallback, endCallback) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    doc.on('data', dataCallback);
    doc.on('end', endCallback);

    generateHeader(doc);
    generateCustomerInformation(doc, user, order);
    generateInvoiceTable(doc, order);
    generateFooter(doc);

    doc.end();
};

function generateHeader(doc) {
    doc
        .fillColor('#4F46E5')
        .fontSize(20)
        .text('Project1 Store', 50, 45)
        .fillColor('#444444')
        .fontSize(10)
        .text('123 Store Street', 200, 50, { align: 'right' })
        .text('Mumbai, India 400001', 200, 65, { align: 'right' })
        .moveDown();
}

function generateCustomerInformation(doc, user, order) {
    doc
        .fillColor('#444444')
        .fontSize(20)
        .text('INVOICE', 50, 160);

    generateHr(doc, 185);

    const customerInformationTop = 200;

    doc
        .fontSize(10)
        .text('Invoice Number:', 50, customerInformationTop)
        .font('Helvetica-Bold')
        .text(order._id.toString(), 150, customerInformationTop)
        .font('Helvetica')
        .text('Invoice Date:', 50, customerInformationTop + 15)
        .text(formatDate(order.createdAt), 150, customerInformationTop + 15)
        .text('Payment ID:', 50, customerInformationTop + 30)
        .text(order.paymentId || 'Pending', 150, customerInformationTop + 30)

        .text('Billed To:', 300, customerInformationTop)
        .font('Helvetica-Bold')
        .text(order.shippingAddress.fullName, 300, customerInformationTop + 15)
        .font('Helvetica')
        .text(order.shippingAddress.address, 300, customerInformationTop + 30)
        .text(
            order.shippingAddress.city +
            ', ' +
            order.shippingAddress.postalCode +
            ', ' +
            order.shippingAddress.country,
            300,
            customerInformationTop + 45
        )
        .moveDown();

    generateHr(doc, 267);
}

function generateInvoiceTable(doc, order) {
    let i;
    const invoiceTableTop = 330;

    doc.font('Helvetica-Bold');
    generateTableRow(
        doc,
        invoiceTableTop,
        'Item',
        'Unit Price',
        'Quantity',
        'Line Total'
    );
    generateHr(doc, invoiceTableTop + 20);
    doc.font('Helvetica');

    let position = 0;
    for (i = 0; i < order.orderItems.length; i++) {
        const item = order.orderItems[i];
        position = invoiceTableTop + (i + 1) * 30;

        // Add product name (+ size if applicable)
        let itemName = item.name;
        if (item.size) itemName += ` (Size: ${item.size})`;

        generateTableRow(
            doc,
            position,
            itemName,
            formatCurrency(item.price),
            item.quantity,
            formatCurrency(item.price * item.quantity)
        );

        generateHr(doc, position + 20);
    }

    const subtotalPosition = invoiceTableTop + (i + 1) * 30;
    generateTableRow(
        doc,
        subtotalPosition,
        '',
        '',
        'Subtotal',
        formatCurrency(order.itemsPrice)
    );

    const taxPosition = subtotalPosition + 20;
    generateTableRow(
        doc,
        taxPosition,
        '',
        '',
        'Tax (18%)',
        formatCurrency(order.taxPrice)
    );

    const shippingPosition = taxPosition + 20;
    generateTableRow(
        doc,
        shippingPosition,
        '',
        '',
        'Shipping',
        formatCurrency(order.shippingPrice)
    );

    const duePosition = shippingPosition + 25;
    doc.font('Helvetica-Bold');
    generateTableRow(
        doc,
        duePosition,
        '',
        '',
        'Grand Total',
        formatCurrency(order.totalPrice)
    );
    doc.font('Helvetica');
}

function generateFooter(doc) {
    doc
        .fontSize(10)
        .text(
            'Payment is due within 15 days. Thank you for your business.',
            50,
            720,
            { align: 'center', width: 500 }
        );
}

function generateTableRow(
    doc,
    y,
    item,
    unitCost,
    quantity,
    lineTotal
) {
    doc
        .fontSize(10)
        .text(item, 50, y, { width: 200 })
        .text(unitCost, 280, y, { width: 90, align: 'right' })
        .text(quantity, 370, y, { width: 90, align: 'right' })
        .text(lineTotal, 0, y, { align: 'right' });
}

function generateHr(doc, y) {
    doc
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
}

function formatCurrency(value) {
    return 'Rs. ' + value.toFixed(2);
}

function formatDate(date) {
    const d = new Date(date);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return year + '/' + month + '/' + day;
}

module.exports = {
    buildInvoice
};
