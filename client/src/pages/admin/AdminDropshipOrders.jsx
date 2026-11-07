import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  Search,
  Calendar,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Filter,
  DollarSign,
  TrendingUp,
  Copy,
  Check,
  Package,
  MapPin,
  User,
  Phone,
  Mail,
  Download,
  FileSpreadsheet,
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Zap,
  Building,
  Archive,
  ArrowUpDown,
  ShoppingBag,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminDropshipOrders = () => {
  const { success, error, info } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all'); // 'all' | 'YYYY-MM'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [copiedAddressId, setCopiedAddressId] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Fulfillment Modal
  const [fulfillModal, setFulfillModal] = useState(null); // { order, item }
  const [sourceOrderId, setSourceOrderId] = useState('');
  const [sourceTrackingNumber, setSourceTrackingNumber] = useState('');
  const [fulfillmentStatus, setFulfillmentStatus] = useState('ordered_on_source');
  const [submittingFulfillment, setSubmittingFulfillment] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/admin/all').catch(() => null);
      if (res?.data?.success && Array.isArray(res.data.orders)) {
        setOrders(res.data.orders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error(err);
      error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Copy helper for single values (e.g. phone, pin, name, sku)
  const handleCopySingle = (text, fieldKey) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldKey);
    success(`Copied: ${text}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Copy full customer shipping address formatted for DeoDap checkout paste
  const handleCopyCustomerAddress = (order) => {
    const addr = order.shippingAddress;
    if (!addr) return;
    const formatted = `Name: ${addr.fullName}\nPhone: ${addr.phone}\nAddress: ${addr.street}\nCity: ${addr.city}\nState: ${addr.state}\nPIN: ${addr.zipCode}\nCountry: ${addr.country || 'India'}`;
    navigator.clipboard.writeText(formatted);
    setCopiedAddressId(order._id);
    success('Customer shipping address copied in DeoDap checkout format!');
    setTimeout(() => setCopiedAddressId(null), 2500);
  };

  const handleOpenFulfillment = (order, item) => {
    setFulfillModal({ order, item });
    setSourceOrderId(item.sourceOrderId || '');
    setSourceTrackingNumber(item.sourceTrackingNumber || '');
    setFulfillmentStatus(item.fulfillmentStatus || 'ordered_on_source');
  };

  const handleSaveDropshipFulfillment = async () => {
    if (!fulfillModal) return;
    const { order, item } = fulfillModal;

    try {
      setSubmittingFulfillment(true);
      const res = await api.put(`/orders/${order._id}/items/${item._id}/dropship-fulfillment`, {
        sourceOrderId,
        sourceTrackingNumber,
        fulfillmentStatus,
      });

      if (res.data?.success) {
        success('DeoDap supplier fulfillment status updated!');
        setFulfillModal(null);
        fetchOrders();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update fulfillment');
    } finally {
      setSubmittingFulfillment(false);
    }
  };

  // Filter dropship / DeoDap orders only
  const dropshipOrdersList = useMemo(() => {
    return orders
      .map((order) => {
        const dropshipItems = (order.items || []).filter(
          (item) => item.isDropshipped || ['deodap', 'amazon', 'flipkart', 'meesho', 'other'].includes(item.sourcePlatform)
        );
        const dropshipTotal = dropshipItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const dropshipCost = dropshipItems.reduce((sum, i) => sum + (i.sourcePrice || 0) * i.quantity, 0);
        const dropshipMargin = dropshipItems.reduce((sum, i) => sum + (i.profitMargin || 0), 0);

        return {
          ...order,
          dropshipItems,
          dropshipTotal,
          dropshipCost,
          dropshipMargin,
        };
      })
      .filter((order) => order.dropshipItems.length > 0);
  }, [orders]);

  // Extract distinct months for the month-wise filter dropdown
  const availableMonths = useMemo(() => {
    const months = new Set();
    dropshipOrdersList.forEach((ord) => {
      if (ord.createdAt) {
        const d = new Date(ord.createdAt);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        months.add(`${yyyy}-${mm}`);
      }
    });
    return Array.from(months).sort().reverse();
  }, [dropshipOrdersList]);

  // Filtered orders by Search, Status, Month, and Date Range
  const filteredOrders = useMemo(() => {
    return dropshipOrdersList.filter((order) => {
      const orderNum = (order.invoiceNumber || order._id || '').toLowerCase();
      const custName = (order.customer?.name || order.shippingAddress?.fullName || '').toLowerCase();
      const phone = (order.shippingAddress?.phone || '').toLowerCase();
      const city = (order.shippingAddress?.city || '').toLowerCase();

      const matchesSearch =
        !searchQuery ||
        orderNum.includes(searchQuery.toLowerCase()) ||
        custName.includes(searchQuery.toLowerCase()) ||
        phone.includes(searchQuery.toLowerCase()) ||
        city.includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === 'all' ||
        order.dropshipItems.some((i) => (i.fulfillmentStatus || 'unfulfilled').toLowerCase() === selectedStatus.toLowerCase());

      // Date Filtering
      const orderDate = new Date(order.createdAt);

      let matchesMonth = true;
      if (selectedMonth !== 'all') {
        const yyyy = orderDate.getFullYear();
        const mm = String(orderDate.getMonth() + 1).padStart(2, '0');
        matchesMonth = `${yyyy}-${mm}` === selectedMonth;
      }

      let matchesDateRange = true;
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (orderDate < start) matchesDateRange = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (orderDate > end) matchesDateRange = false;
      }

      return matchesSearch && matchesStatus && matchesMonth && matchesDateRange;
    });
  }, [dropshipOrdersList, searchQuery, selectedStatus, selectedMonth, startDate, endDate]);

  // Export / Backup to CSV formatted for DeoDap Official Order Entry
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      error('No orders available to export');
      return;
    }

    const headers = [
      'Order ID / Invoice',
      'Order Date',
      'Product Title',
      'SKU',
      'Quantity',
      'Supplier Cost Price',
      'Customer Selling Price',
      'Profit Margin',
      'Customer Name',
      'Customer Phone',
      'Delivery Street',
      'Delivery City',
      'Delivery State',
      'Delivery PIN Code',
      'Country',
      'DeoDap Order ID',
      'Tracking Number',
      'Fulfillment Status',
      'Payment Status',
    ];

    const rows = [];

    filteredOrders.forEach((ord) => {
      const addr = ord.shippingAddress || {};
      ord.dropshipItems.forEach((item) => {
        rows.push([
          `"${ord.invoiceNumber || ord._id}"`,
          `"${new Date(ord.createdAt).toISOString().split('T')[0]}"`,
          `"${(item.title || '').replace(/"/g, '""')}"`,
          `"${item.sku || ''}"`,
          item.quantity || 1,
          item.sourcePrice || 0,
          item.price || 0,
          item.profitMargin || 0,
          `"${(addr.fullName || '').replace(/"/g, '""')}"`,
          `"${addr.phone || ''}"`,
          `"${(addr.street || '').replace(/"/g, '""')}"`,
          `"${(addr.city || '').replace(/"/g, '""')}"`,
          `"${(addr.state || '').replace(/"/g, '""')}"`,
          `"${addr.zipCode || ''}"`,
          `"${addr.country || 'India'}"`,
          `"${item.sourceOrderId || ''}"`,
          `"${item.sourceTrackingNumber || ''}"`,
          `"${item.fulfillmentStatus || 'unfulfilled'}"`,
          `"${ord.paymentStatus || 'paid'}"`,
        ]);
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `DeoDap_Orders_Backup_${selectedMonth !== 'all' ? selectedMonth : dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success(`Exported ${rows.length} order items to CSV!`);
  };

  // Export / Print to Clean Formatted PDF Report
  const handleExportPDF = () => {
    if (filteredOrders.length === 0) {
      error('No orders available to export to PDF');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      error('Please allow popups to generate the PDF report');
      return;
    }

    const dateStr = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const monthLabel =
      selectedMonth !== 'all'
        ? new Date(`${selectedMonth}-01`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
        : 'All Months';

    const orderRowsHtml = filteredOrders
      .map((ord, idx) => {
        const addr = ord.shippingAddress || {};
        return ord.dropshipItems
          .map(
            (item) => `
          <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
            <td style="padding: 10px 8px; font-family: monospace; font-weight: bold; color: #0c2a5e;">
              ${ord.invoiceNumber || ord._id.slice(-6).toUpperCase()}
              <div style="font-size: 9px; color: #64748b; font-family: sans-serif; font-weight: normal;">
                ${new Date(ord.createdAt).toLocaleDateString('en-IN')}
              </div>
            </td>
            <td style="padding: 10px 8px;">
              <strong>${item.title}</strong>
              <div style="font-size: 10px; color: #64748b; font-family: monospace;">SKU: ${item.sku || 'N/A'}</div>
            </td>
            <td style="padding: 10px 8px; text-align: center; font-weight: bold;">
              ${item.quantity || 1}
            </td>
            <td style="padding: 10px 8px; font-family: monospace; text-align: right;">
              ${Number(item.sourcePrice || 0).toLocaleString('en-IN')}
            </td>
            <td style="padding: 10px 8px; font-family: monospace; text-align: right; font-weight: bold; color: #047857;">
              ${Number(item.price || 0).toLocaleString('en-IN')}
            </td>
            <td style="padding: 10px 8px; font-family: monospace; text-align: right; font-weight: bold; color: #1d4ed8;">
              +${Number(item.profitMargin || 0).toLocaleString('en-IN')}
            </td>
            <td style="padding: 10px 8px; line-height: 1.4;">
              <strong>${addr.fullName || 'N/A'}</strong> (${addr.phone || 'N/A'})
              <div style="font-size: 10px; color: #475569;">
                ${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} - ${addr.zipCode || ''}
              </div>
            </td>
            <td style="padding: 10px 8px; text-align: center;">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: bold; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;">
                ${item.fulfillmentStatus || 'Unfulfilled'}
              </span>
            </td>
          </tr>
        `
          )
          .join('');
      })
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>DeoDap_Orders_Report_${selectedMonth !== 'all' ? selectedMonth : 'Full'}</title>
          <meta charset="utf-8" />
          <style>
            @media print {
              @page { size: A4 landscape; margin: 12mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .no-print { display: none !important; }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 20px;
              background: #ffffff;
            }
            .header-bar {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #0c2a5e;
              padding-bottom: 14px;
              margin-bottom: 16px;
            }
            .title-area h1 {
              margin: 0;
              font-size: 20px;
              font-weight: 900;
              color: #0c2a5e;
            }
            .title-area p {
              margin: 4px 0 0 0;
              font-size: 11px;
              color: #64748b;
            }
            .stats-bar {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              margin-bottom: 16px;
            }
            .stat-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 10px 14px;
            }
            .stat-label {
              font-size: 9px;
              text-transform: uppercase;
              font-weight: bold;
              color: #64748b;
            }
            .stat-val {
              font-size: 16px;
              font-weight: 900;
              font-family: monospace;
              margin-top: 2px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              text-align: left;
            }
            th {
              background: #f1f5f9;
              padding: 10px 8px;
              font-size: 10px;
              text-transform: uppercase;
              font-weight: 800;
              color: #475569;
              border-bottom: 2px solid #cbd5e1;
            }
            .print-btn {
              background: #0c2a5e;
              color: white;
              border: none;
              padding: 10px 20px;
              font-weight: bold;
              border-radius: 8px;
              cursor: pointer;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div class="title-area">
              <h1>DeoDap Dropship Orders &amp; Fulfillment Statement</h1>
              <p>Period: ${monthLabel} • Generated On: ${dateStr} • Total Orders: ${filteredOrders.length}</p>
            </div>
            <div class="no-print">
              <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
            </div>
          </div>

          <div class="stats-bar">
            <div class="stat-box">
              <div class="stat-label">Total Filtered Orders</div>
              <div class="stat-val" style="color: #0c2a5e;">${filteredOrders.length}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Gross Customer Revenue</div>
              <div class="stat-val" style="color: #047857;">${totalGross.toLocaleString('en-IN')}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Net Profit Margin</div>
              <div class="stat-val" style="color: #1d4ed8;">+${totalMargin.toLocaleString('en-IN')}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Pending Supplier Placement</div>
              <div class="stat-val" style="color: #b45309;">${totalPendingFulfill}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 12%;">Invoice / Date</th>
                <th style="width: 25%;">Product Title &amp; SKU</th>
                <th style="width: 5%; text-align: center;">Qty</th>
                <th style="width: 9%; text-align: right;">Cost</th>
                <th style="width: 9%; text-align: right;">Selling Price</th>
                <th style="width: 9%; text-align: right;">Profit Margin</th>
                <th style="width: 21%;">Customer Shipping Details</th>
                <th style="width: 10%; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${orderRowsHtml}
            </tbody>
          </table>

          <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center;">
            Official DeoDap Fulfillment Report • Generated automatically by Multi-Vendor Ecommerce Platform
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Auto-prompt print dialog after content paints
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);

    success('PDF export dialog opened!');
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  // Aggregate Metrics
  const totalGross = filteredOrders.reduce((sum, o) => sum + o.dropshipTotal, 0);
  const totalMargin = filteredOrders.reduce((sum, o) => sum + o.dropshipMargin, 0);
  const totalPendingFulfill = filteredOrders.reduce((count, o) => {
    const unfulfilled = (o.dropshipItems || []).filter(
      (i) => !i.fulfillmentStatus || i.fulfillmentStatus === 'unfulfilled'
    );
    return count + unfulfilled.length;
  }, 0);

  return (
    <AdminLayout
      title="DeoDap Orders & Supplier Fulfillment"
      subtitle="Copy buyer shipping addresses, export monthly backup files, and place orders directly on DeoDap"
      onRefresh={fetchOrders}
    >
      <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
        {/* TOP CONTROLS & EXPORT BAR */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  DeoDap Wholesale Orders Hub
                </h1>
                <p className="text-xs text-slate-500">
                  Ready-to-copy buyer shipping details for manual or API order placement on DeoDap
                </p>
              </div>
            </div>

            {/* Export & External Link Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href="https://deodap.in"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition"
              >
                <span>Open DeoDap Website</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>

              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-98 transition cursor-pointer"
                title="Download CSV Spreadsheet backup of all filtered orders"
              >
                <Download className="w-4 h-4" />
                <span>Export Orders Backup (CSV)</span>
              </button>

              <button
                onClick={handleExportPDF}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#0c2a5e] hover:bg-[#153e85] text-white font-bold text-xs shadow-md shadow-blue-900/15 active:scale-98 transition cursor-pointer"
                title="Print or Save clean landscape PDF statement of all filtered orders"
              >
                <FileText className="w-4 h-4 text-amber-300" />
                <span>Export Orders (PDF)</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filtered Orders</span>
              <div className="text-xl font-black text-slate-900 mt-0.5 font-mono">{filteredOrders.length}</div>
              <span className="text-[10px] text-slate-400">Total matched transactions</span>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Sales</span>
              <div className="text-xl font-black text-slate-900 mt-0.5 font-mono">
                {totalGross.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-emerald-600 font-bold">Gross revenue</span>
            </div>

            <div className="bg-emerald-50/40 rounded-2xl p-3.5 border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Net Margin Earned</span>
              <div className="text-xl font-black text-emerald-700 mt-0.5 font-mono">
                +{totalMargin.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-emerald-600 font-medium">Auto-credited profit</span>
            </div>

            <div className="bg-amber-50/40 rounded-2xl p-3.5 border border-amber-200">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Pending On DeoDap</span>
              <div className="text-xl font-black text-amber-700 mt-0.5 font-mono">{totalPendingFulfill}</div>
              <span className="text-[10px] text-amber-600 font-medium">Requires placement</span>
            </div>
          </div>
        </div>

        {/* SEARCH & MULTI-FILTER BAR (Date-wise, Month-wise, Status) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by invoice #, buyer name, phone, city..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Month-Wise Dropdown */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-bold text-slate-500">Month:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Months</option>
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>
                      {new Date(`${m}-01`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="unfulfilled">Unfulfilled (Need to Order)</option>
                <option value="ordered_on_source">Ordered on DeoDap</option>
                <option value="shipped_by_source">Shipped by Courier</option>
                <option value="delivered_to_customer">Delivered</option>
              </select>
            </div>
          </div>

          {/* Date-Range Pickers */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date Range:</span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-800"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-800"
              />
            </div>

            {(startDate || endDate || selectedMonth !== 'all' || selectedStatus !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setSelectedMonth('all');
                  setSelectedStatus('all');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="text-[11px] font-bold text-rose-600 hover:underline ml-auto cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* ORDERS LIST */}
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-2xs space-y-3 animate-pulse">
            <RotateCcw className="w-8 h-8 text-[#0c2a5e] animate-spin mx-auto" />
            <div className="text-sm font-bold text-slate-700">Loading DeoDap Orders...</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-2xs space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Package className="w-8 h-8" />
            </div>
            <div className="text-base font-black text-slate-900">No Orders Match Your Filters</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              When customers place orders for DeoDap catalog items, they will appear here with 1-click address copy for easy fulfillment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedOrders.map((order) => {
              const addr = order.shippingAddress || {};
              const isCopied = copiedAddressId === order._id;

              return (
                <div
                  key={order._id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden transition hover:shadow-md hover:border-slate-300"
                >
                  {/* Order Header: Invoice, Date, Payment, and Master Copy Address Button */}
                  <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-xs sm:text-sm font-black text-[#0c2a5e] bg-blue-50 px-3 py-1 rounded-xl border border-blue-100">
                        {order.invoiceNumber || `ORD-${order._id.slice(-6).toUpperCase()}`}
                      </span>

                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Payment: {order.paymentStatus || 'Paid'} ({order.paymentMethod || 'Online'})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
                      {/* COPY WHOLE ADDRESS BUTTON FOR DEODAP WEBSITE */}
                      <button
                        onClick={() => handleCopyCustomerAddress(order)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          isCopied
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}
                        title="Copy full shipping address formatted for DeoDap checkout"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Address Copied!' : 'Copy Full Address for DeoDap'}</span>
                      </button>

                      <div className="text-right pl-2 font-mono">
                        <span className="text-[10px] font-sans font-bold text-slate-400 block uppercase">Order Total</span>
                        <span className="text-base sm:text-lg font-black text-slate-900">
                          {order.dropshipTotal.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Items in this Order */}
                  <div className="divide-y divide-slate-100">
                    {order.dropshipItems.map((item, idx) => {
                      const cost = item.sourcePrice || 0;
                      const sell = item.price || 0;
                      const qty = item.quantity || 1;
                      const itemRevenue = sell * qty;
                      const itemCost = cost * qty;
                      const itemProfit = Math.max(0, itemRevenue - itemCost);
                      const status = item.fulfillmentStatus || 'unfulfilled';

                      return (
                        <div
                          key={item._id || idx}
                          className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-4 flex-1">
                            {/* Lazy Loaded Product Image */}
                            <img
                              src={item.image || '/logo.png'}
                              alt={item.title}
                              loading="lazy"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/logo.png';
                              }}
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 bg-slate-50 flex-shrink-0"
                            />

                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                                  DEODAP WHOLESALE
                                </span>

                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    status === 'ordered_on_source'
                                      ? 'bg-blue-100 text-blue-800'
                                      : status === 'shipped_by_source'
                                      ? 'bg-amber-100 text-amber-800'
                                      : status === 'delivered_to_customer'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  ●{' '}
                                  {status === 'ordered_on_source'
                                    ? 'Ordered on DeoDap'
                                    : status === 'shipped_by_source'
                                    ? 'Shipped by Courier'
                                    : status === 'delivered_to_customer'
                                    ? 'Delivered to Customer'
                                    : 'Action Required: Place on DeoDap'}
                                </span>

                                {item.sku && (
                                  <button
                                    onClick={() => handleCopySingle(item.sku, `sku-${item._id}`)}
                                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold inline-flex items-center gap-1 cursor-pointer"
                                    title="Click to copy SKU"
                                  >
                                    <span>SKU: {item.sku}</span>
                                    {copiedField === `sku-${item._id}` ? (
                                      <Check className="w-2.5 h-2.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-2.5 h-2.5 text-slate-400" />
                                    )}
                                  </button>
                                )}
                              </div>

                              <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                                {item.title}
                              </h3>

                              {/* Price & Margin Calculation Details */}
                              <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap font-mono">
                                <span>
                                  Qty: <b className="text-slate-900 font-sans">{qty}</b>
                                </span>
                                <span>•</span>
                                <span>
                                  DeoDap Cost: <b className="text-slate-800">{cost}</b>
                                </span>
                                <span>•</span>
                                <span>
                                  Selling Price: <b className="text-slate-900">{sell}</b>
                                </span>
                                <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                  Margin: +{itemProfit.toLocaleString('en-IN')}
                                </span>

                                {item.sourceOrderId && (
                                  <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                    DeoDap Ref: {item.sourceOrderId}
                                  </span>
                                )}
                                {item.sourceTrackingNumber && (
                                  <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                    AWB: {item.sourceTrackingNumber}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Button: Update DeoDap Order ID & Courier AWB */}
                          <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                            <button
                              onClick={() => handleOpenFulfillment(order, item)}
                              className="px-4 py-2 rounded-xl bg-[#0c2a5e] hover:bg-[#153e85] text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Package className="w-3.5 h-3.5 text-amber-300" />
                              <span>Fulfill on DeoDap</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Individual Copyable Shipping Address Fields */}
                  <div className="px-4 sm:px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between text-xs text-slate-600 gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{addr.fullName || 'N/A'}</span>
                        <button
                          onClick={() => handleCopySingle(addr.fullName, `name-${order._id}`)}
                          className="p-1 hover:bg-slate-200 rounded transition cursor-pointer"
                          title="Copy Customer Name"
                        >
                          {copiedField === `name-${order._id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono">{addr.phone || 'N/A'}</span>
                        <button
                          onClick={() => handleCopySingle(addr.phone, `phone-${order._id}`)}
                          className="p-1 hover:bg-slate-200 rounded transition cursor-pointer"
                          title="Copy Customer Phone"
                        >
                          {copiedField === `phone-${order._id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {addr.street}, {addr.city}, {addr.state} - <b className="font-mono">{addr.zipCode}</b>
                        </span>
                        <button
                          onClick={() => handleCopySingle(`${addr.street}, ${addr.city}, ${addr.state} - ${addr.zipCode}`, `addr-${order._id}`)}
                          className="p-1 hover:bg-slate-200 rounded transition cursor-pointer"
                          title="Copy Full Street & City"
                        >
                          {copiedField === `addr-${order._id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span>Customer ID: {order.customer?._id?.slice(-6) || 'Guest'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* RESPONSIVE PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Showing page <b className="text-slate-800">{currentPage}</b> of <b className="text-slate-800">{totalPages}</b> ({filteredOrders.length} total orders)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                  const num = idx + 1;
                  return (
                    <button
                      key={num}
                      onClick={() => setCurrentPage(num)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition cursor-pointer ${
                        currentPage === num
                          ? 'bg-[#0c2a5e] text-white shadow-xs'
                          : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* FULFILLMENT MODAL (Save DeoDap Order ID and Tracking Courier) */}
        {fulfillModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Record DeoDap Official Order
                    </h3>
                    <p className="text-[11px] text-slate-500">Order #{fulfillModal.order.invoiceNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setFulfillModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer Address Preview & Copy */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">Buyer Delivery Address (Copy &amp; Paste to DeoDap)</span>
                  <button
                    onClick={() => handleCopyCustomerAddress(fulfillModal.order)}
                    className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Address</span>
                  </button>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-mono">
                  {fulfillModal.order.shippingAddress?.fullName}, {fulfillModal.order.shippingAddress?.phone}
                  <br />
                  {fulfillModal.order.shippingAddress?.street}, {fulfillModal.order.shippingAddress?.city},{' '}
                  {fulfillModal.order.shippingAddress?.state} - {fulfillModal.order.shippingAddress?.zipCode}
                </p>
              </div>

              {/* Input: Source Order ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  DeoDap Order Number / ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. DEODAP-10294 or DD-987654"
                  value={sourceOrderId}
                  onChange={(e) => setSourceOrderId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Input: Source Tracking Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Courier Tracking / AWB Number</label>
                <input
                  type="text"
                  placeholder="e.g. DELHIVERY-9876543210 or BLUEDART-123456"
                  value={sourceTrackingNumber}
                  onChange={(e) => setSourceTrackingNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Select: Fulfillment Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Fulfillment Status</label>
                <select
                  value={fulfillmentStatus}
                  onChange={(e) => setFulfillmentStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none"
                >
                  <option value="unfulfilled">Unfulfilled (Need to Order on DeoDap)</option>
                  <option value="ordered_on_source">Ordered on DeoDap</option>
                  <option value="shipped_by_source">Shipped by DeoDap / Courier</option>
                  <option value="delivered_to_customer">Delivered to Customer</option>
                </select>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFulfillModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDropshipFulfillment}
                  disabled={submittingFulfillment}
                  className="px-5 py-2 rounded-xl bg-[#0c2a5e] hover:bg-[#153e85] text-white font-bold text-xs shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {submittingFulfillment ? 'Saving...' : 'Save DeoDap Order Info'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDropshipOrders;
