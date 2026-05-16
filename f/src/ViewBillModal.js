import React from 'react';

const getWhatsAppLink = (bill) => {
  if (!bill.customerPhone) return '#';
  
  // Format phone for WhatsApp (assume India country code if not present)
  let phone = bill.customerPhone.trim();
  if (!phone.startsWith('+')) {
    phone = '+91' + phone;
  }
  
  // Create detailed bill message with all items
  let message = `*BILL RECEIPT*%0A%0A`;
  message += `*Bill Number:* ${bill.billNumber}%0A`;
  message += `*Customer Name:* ${bill.customerName}%0A`;
  message += `*Date:* ${new Date(bill.createdAt).toLocaleDateString()}%0A`;
  message += `*Payment Status:* ${bill.paymentStatus.toUpperCase()}%0A%0A`;
  
  // Add all items
  if (bill.items && bill.items.length > 0) {
    message += `*ITEMS PURCHASED:*%0A`;
    message += `━━━━━━━━━━━━━━━━━━━━%0A`;
    bill.items.forEach((item, idx) => {
      message += `${idx + 1}. *${item.productName}*%0A`;
      message += `   Quantity: ${item.quantity} x ₹${item.unitPrice} = ₹${item.totalPrice}%0A`;
    });
    message += `━━━━━━━━━━━━━━━━━━━━%0A`;
  }
  
  message += `*TOTAL AMOUNT:* ₹${bill.totalAmount}%0A%0A`;
  message += `Thank you for shopping with us! 🙏%0A`;
  message += `Please visit again! 🛒`;
  
  return `https://wa.me/${phone.replace(/[^\d]/g, '')}?text=${message}`;
};

const ViewBillModal = ({ bill, onClose }) => {
  if (!bill) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Bill Details</h3>
              <p className="text-sm text-gray-500">Bill #{bill.billNumber}</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Bill Content */}
        <div className="p-6 space-y-6">
          {/* Customer Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-blue-900 mb-3">Customer Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-blue-700">Customer Name</label>
                <p className="text-blue-900 font-semibold">{bill.customerName}</p>
              </div>
              {bill.customerPhone && (
                <div>
                  <label className="text-sm font-medium text-blue-700">Phone Number</label>
                  <p className="text-blue-900 font-semibold">{bill.customerPhone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Bill Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Bill Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Bill Date</label>
                <p className="text-gray-900 font-semibold">{new Date(bill.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Payment Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  bill.paymentStatus === 'paid' 
                    ? 'bg-green-100 text-green-800'
                    : bill.paymentStatus === 'partial'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {bill.paymentStatus.toUpperCase()}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Payment Method</label>
                <p className="text-gray-900 font-semibold capitalize">{bill.paymentMethod || 'Cash'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Total Items</label>
                <p className="text-gray-900 font-semibold">{bill.items?.length || 0}</p>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
              <h4 className="text-lg font-semibold text-gray-900">Items Purchased</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bill.items && bill.items.length > 0 ? (
                    bill.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {item.productName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          ₹{item.unitPrice}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ₹{item.totalPrice}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                        No items found in this bill
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total Amount */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold text-green-900">Total Amount</h4>
              <span className="text-2xl font-bold text-green-900">₹{bill.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-lg">
          <div className="flex justify-end space-x-3">
            {bill.customerPhone && (
              <a
                href={getWhatsAppLink(bill)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 mr-2">
                  <path d="M20.52 3.48A11.94 11.94 0 0012 0C5.37 0 0 5.37 0 12c0 2.12.55 4.13 1.6 5.92L0 24l6.18-1.62A11.94 11.94 0 0012 24c6.63 0 12-5.37 12-12 0-3.19-1.24-6.19-3.48-8.52zM12 22c-1.85 0-3.63-.5-5.18-1.44l-.37-.22-3.67.96.98-3.58-.24-.37A9.94 9.94 0 012 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.07-7.75c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.44-2.25-1.4-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.34.42-.51.14-.17.18-.29.28-.48.09-.19.05-.36-.02-.5-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.62-.47-.16-.01-.36-.01-.56-.01-.19 0-.5.07-.76.34-.26.27-1 1-.97 2.43.03 1.43 1.03 2.81 1.18 3 .15.19 2.03 3.1 4.93 4.23.69.3 1.23.48 1.65.61.69.22 1.32.19 1.81.12.55-.08 1.65-.67 1.88-1.32.23-.65.23-1.2.16-1.32-.07-.12-.25-.19-.53-.33z" />
                </svg>
                Send via WhatsApp
              </a>
            )}
            <button 
              onClick={onClose} 
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewBillModal; 