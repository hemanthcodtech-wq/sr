import React, { useState, useEffect, useMemo } from 'react';
import {
  Store,
  Search,
  Calendar,
  RotateCcw,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  Eye,
  Filter,
  DollarSign,
  TrendingUp,
  User,
  Wallet,
  Check,
  X,
  Package,
  MapPin,
  Phone,
  Mail,
  Send,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  CreditCard,
  Download,
  FileText,
  Copy,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminVendorOrders = () => {
  const { success, error } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState('all'); // Filter by specific vendor
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [settlingItemId, setSettlingItemId] = useState(null);
  const [copiedAddressId, setCopiedAddressId] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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
      error('Failed to load marketplace orders');
    } finally {
      setLoading(false);
    }
  };

  // Copy helper for single values
  const handleCopySingle = (text, fieldKey) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldKey);
    success(`Copied: ${text}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Copy customer address
  const handleCopyCustomerAddress = (order) => {
    const addr = order.shippingAddress;
    if (!addr) return;
    const formatted = `Name: ${addr.fullName}\nPhone: ${addr.phone}\nAddress: ${addr.street}\nCity: ${addr.city}\nState: ${addr.state}\nPIN: ${addr.zipCode}\nCountry: ${addr.country || 'India'}`;
    navigator.clipboard.writeText(formatted);
    setCopiedAddressId(order._id);
    success('Customer shipping address copied to clipboard!');
    setTimeout(() => setCopiedAddressId(null), 2500);
  };

  // Settle vendor item payout to vendor wallet
  const handleSettleToVendor = async (orderId, itemId, vendorName, earning) => {
    try {
      setSettlingItemId(itemId);
      const res = await api.post(`/orders/${orderId}/items/${itemId}/settle-vendor`);
      if (res.data?.success) {
        success(`✓ Settled ${earning} directly to ${vendorName}'s wallet!`);
        fetchOrders();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to settle order item');
    } finally {
      setSettlingItemId(null);
    }
  };

  // Filter only items that belong to third-party vendors (own store items or admin sourced items listed by vendor)
  const vendorOrdersList = useMemo(() => {
    return orders
      .map((order) => {
        const vendorItems = (order.items || []).filter((item) => {
          return (
            !item.isDropshipped ||
            item.sourceType === 'admin_catalog' ||
            item.fulfillmentType === 'admin_central' ||
            !!item.sourceAdminProduct ||
            (item.vendor && item.vendor.role === 'vendor') ||
            item.sourcePlatform === 'in_house'
          );
        });

        const vendorTotal = vendorItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const commission = Math.round((vendorTotal * 10) / 100);
        const vendorPayout = vendorTotal - commission;

        return {
          ...order,
          vendorItems,
          vendorTotal,
          commission,
          vendorPayout,
        };
      })
      .filter((order) => order.vendorItems.length > 0);
  }, [orders]);

  // Extract unique vendors for the dedicated Vendor Filter dropdown
  const vendorOptions = useMemo(() => {
    const map = new Map();
    vendorOrdersList.forEach((order) => {
      order.vendorItems.forEach((item) => {
        const vId = (item.vendor?._id || item.vendor || '').toString();
        const vName = item.store?.storeName || item.vendor?.name || 'Third-Party Merchant';
        if (vId && !map.has(vId)) {
          map.set(vId, vName);
        }
      });
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [vendorOrdersList]);

  // Extract distinct months for the month-wise filter dropdown
  const availableMonths = useMemo(() => {
    const months = new Set();
    vendorOrdersList.forEach((ord) => {
      if (ord.createdAt) {
        const d = new Date(ord.createdAt);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        months.add(`${yyyy}-${mm}`);
      }
    });
    return Array.from(months).sort().reverse();
  }, [vendorOrdersList]);

  // Multi-Filtered orders by Search, Status, Vendor, Month, and Date Range
  const filteredOrders = useMemo(() => {
    return vendorOrdersList.filter((order) => {
      const invoice = (order.invoiceNumber || order._id || '').toLowerCase();
      const custName = (order.customer?.name || order.shippingAddress?.fullName || '').toLowerCase();
      const phone = (order.shippingAddress?.phone || '').toLowerCase();
      const city = (order.shippingAddress?.city || '').toLowerCase();

      const matchesSearch =
        !searchQuery ||
        invoice.includes(searchQuery.toLowerCase()) ||
        custName.includes(searchQuery.toLowerCase()) ||
        phone.includes(searchQuery.toLowerCase()) ||
        city.includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'settled' && order.vendorItems.every((i) => i.vendorSettled)) ||
        (selectedStatus === 'unsettled' && order.vendorItems.some((i) => !i.vendorSettled)) ||
        order.vendorItems.some((i) => i.deliveryStatus?.toLowerCase() === selectedStatus.toLowerCase());

      // Filter by specific vendor
      const matchesVendor =
        selectedVendor === 'all' ||
        order.vendorItems.some((i) => (i.vendor?._id || i.vendor || '').toString() === selectedVendor);

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

      return matchesSearch && matchesStatus && matchesVendor && matchesMonth && matchesDateRange;
    });
  }, [vendorOrdersList, searchQuery, selectedStatus, selectedVendor, selectedMonth, startDate, endDate]);

  // Financial Aggregates
  const totalVolume = useMemo(() => filteredOrders.reduce((sum, o) => sum + o.vendorTotal, 0), [filteredOrders]);
  const totalCommission = useMemo(() => Math.round((totalVolume * 10) / 100), [totalVolume]);
  const totalPayouts = totalVolume - totalCommission;
  const pendingSettlementCount = useMemo(() => {
    return filteredOrders.reduce((count, o) => count + o.vendorItems.filter((i) => !i.vendorSettled).length, 0);
  }, [filteredOrders]);

  // Export Vendor Orders to CSV
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      error('No vendor orders available to export');
      return;
    }

    const headers = [
      'Order Invoice',
      'Order Date',
      'Merchant / Vendor',
      'Product Title',
      'Quantity',
      'Customer Unit Price',
      'Item Gross Total',
      'Admin Commission (10%)',
      'Vendor Payable (90%)',
      'Settlement Status',
      'Customer Name',
      'Customer Phone',
      'Delivery Street',
      'Delivery City',
      'Delivery State',
      'Delivery PIN',
      'Vendor Delivery Status',
      'Courier Tracking AWB',
    ];

    const rows = [];
    filteredOrders.forEach((ord) => {
      const addr = ord.shippingAddress || {};
      ord.vendorItems.forEach((item) => {
        const itemGross = (item.price || 0) * (item.quantity || 1);
        const comm = Math.round((itemGross * 10) / 100);
        const payable = itemGross - comm;
        const vName = item.store?.storeName || item.vendor?.name || 'Third-Party Vendor';

        rows.push([
          `"${ord.invoiceNumber || ord._id}"`,
          `"${new Date(ord.createdAt).toISOString().split('T')[0]}"`,
          `"${vName.replace(/"/g, '""')}"`,
          `"${(item.title || '').replace(/"/g, '""')}"`,
          item.quantity || 1,
          item.price || 0,
          itemGross,
          comm,
          payable,
          `"${item.vendorSettled ? 'Settled' : 'Pending'}"`,
          `"${(addr.fullName || '').replace(/"/g, '""')}"`,
          `"${addr.phone || ''}"`,
          `"${(addr.street || '').replace(/"/g, '""')}"`,
          `"${(addr.city || '').replace(/"/g, '""')}"`,
          `"${(addr.state || '').replace(/"/g, '""')}"`,
          `"${addr.zipCode || ''}"`,
          `"${item.deliveryStatus || 'Processing'}"`,
          `"${item.trackingNumber || ''}"`,
        ]);
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `Vendor_Orders_Report_${selectedMonth !== 'all' ? selectedMonth : dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success(`Exported ${rows.length} vendor order items to CSV!`);
  };

  // Export Vendor Orders to Clean Printable PDF
  const handleExportPDF = () => {
    if (filteredOrders.length === 0) {
      error('No vendor orders available to export to PDF');
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

    const vendorFilterLabel =
      selectedVendor !== 'all'
        ? vendorOptions.find((v) => v.id === selectedVendor)?.name || 'Specific Merchant'
        : 'All Merchants';

    const orderRowsHtml = filteredOrders
      .map((ord) => {
        const addr = ord.shippingAddress || {};
        return ord.vendorItems
          .map((item) => {
            const itemGross = (item.price || 0) * (item.quantity || 1);
            const comm = Math.round((itemGross * 10) / 100);
            const payable = itemGross - comm;
            const vName = item.store?.storeName || item.vendor?.name || 'Third-Party Merchant';

            return `
              <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
                <td style="padding: 10px 8px; font-family: monospace; font-weight: bold; color: #0c2a5e;">
                  ${ord.invoiceNumber || ord._id.slice(-6).toUpperCase()}
                  <div style="font-size: 9px; color: #64748b; font-family: sans-serif; font-weight: normal;">
                    ${new Date(ord.createdAt).toLocaleDateString('en-IN')}
                  </div>
                </td>
                <td style="padding: 10px 8px;">
                  <strong style="color: #6b21a8;">${vName}</strong>
                  <div style="font-size: 10px; color: #334155; margin-top: 2px;">${item.title}</div>
                </td>
                <td style="padding: 10px 8px; text-align: center; font-weight: bold;">
                  ${item.quantity || 1}
                </td>
                <td style="padding: 10px 8px; font-family: monospace; text-align: right;">
                  ${itemGross.toLocaleString('en-IN')}
                </td>
                <td style="padding: 10px 8px; font-family: monospace; text-align: right; font-weight: bold; color: #047857;">
                  +${comm.toLocaleString('en-IN')}
                </td>
                <td style="padding: 10px 8px; font-family: monospace; text-align: right; font-weight: bold; color: #1d4ed8;">
                  ${payable.toLocaleString('en-IN')}
                </td>
                <td style="padding: 10px 8px; line-height: 1.4;">
                  <strong>${addr.fullName || 'N/A'}</strong> (${addr.phone || 'N/A'})
                  <div style="font-size: 10px; color: #475569;">
                    ${addr.city || ''}, ${addr.state || ''} - ${addr.zipCode || ''}
                  </div>
                </td>
                <td style="padding: 10px 8px; text-align: center;">
                  <span style="display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: bold; ${
                    item.vendorSettled
                      ? 'background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;'
                      : 'background: #fffbeb; color: #92400e; border: 1px solid #fde68a;'
                  }">
                    ${item.vendorSettled ? 'Settled' : 'Pending'}
                  </span>
                </td>
              </tr>
            `;
          })
          .join('');
      })
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vendor_Orders_Report_${selectedMonth !== 'all' ? selectedMonth : 'Full'}</title>
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
              <h1>Marketplace Vendor Orders &amp; Settlement Statement</h1>
              <p>Period: ${monthLabel} • Merchant Filter: ${vendorFilterLabel} • Generated On: ${dateStr}</p>
            </div>
            <div class="no-print">
              <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
            </div>
          </div>

          <div class="stats-bar">
            <div class="stat-box">
              <div class="stat-label">Total Vendor Orders</div>
              <div class="stat-val" style="color: #0c2a5e;">${filteredOrders.length}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Gross Merchant Volume</div>
              <div class="stat-val" style="color: #0f172a;">${totalVolume.toLocaleString('en-IN')}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Admin 10% Commission</div>
              <div class="stat-val" style="color: #047857;">+${totalCommission.toLocaleString('en-IN')}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Pending Payouts</div>
              <div class="stat-val" style="color: #b45309;">${pendingSettlementCount}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 12%;">Invoice / Date</th>
                <th style="width: 25%;">Merchant &amp; Product</th>
                <th style="width: 5%; text-align: center;">Qty</th>
                <th style="width: 10%; text-align: right;">Total Sale</th>
                <th style="width: 9%; text-align: right;">10% Fee</th>
                <th style="width: 9%; text-align: right;">90% Payout</th>
                <th style="width: 20%;">Shipping Address</th>
                <th style="width: 10%; text-align: center;">Settlement</th>
              </tr>
            </thead>
            <tbody>
              ${orderRowsHtml}
            </tbody>
          </table>

          <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center;">
            Multi-Vendor Marketplace Accounting Statement • Generated automatically by Admin Console
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);

    success('Vendor Orders PDF export dialog opened!');
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  return (
    <AdminLayout
      title="Marketplace Vendor Orders & Payouts"
      subtitle="Track customer orders for third-party merchant products, filter by vendor, export statements, and settle payouts"
      onRefresh={fetchOrders}
    >
      <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
        {/* TOP NAVIGATION TOGGLE */}
        <div className="bg-white rounded-2xl p-1.5 border border-slate-200/90 shadow-2xs flex flex-wrap gap-2 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              to="/admin/dropshipping"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-2"
            >
              <Truck className="w-4 h-4 text-slate-500" />
              <span>Dropshipping Orders (DeoDap / Wholesale)</span>
            </Link>
            <Link
              to="/admin/vendor-orders"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-[#0c2a5e] text-white shadow-sm flex items-center gap-2"
            >
              <Store className="w-4 h-4 text-amber-300" />
              <span>Vendor Marketplace Orders &amp; Payouts</span>
              <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full ml-1">
                {vendorOrdersList.length}
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 px-2">
            <span className="text-[11px] font-bold text-slate-500">Platform Commission:</span>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              10% Retained by Admin
            </span>
          </div>
        </div>

        {/* TOP CONTROLS & EXPORT ACTIONS BAR */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Independent Vendor Orders Hub
                </h1>
                <p className="text-xs text-slate-500">
                  Manage third-party merchant orders, calculate 10% platform fee, and export accounting statements
                </p>
              </div>
            </div>

            {/* Export Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-98 transition cursor-pointer"
                title="Download CSV spreadsheet of vendor orders"
              >
                <Download className="w-4 h-4" />
                <span>Export Orders (CSV)</span>
              </button>

              <button
                onClick={handleExportPDF}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#0c2a5e] hover:bg-[#153e85] text-white font-bold text-xs shadow-md shadow-blue-900/15 active:scale-98 transition cursor-pointer"
                title="Print or Save clean landscape PDF accounting statement"
              >
                <FileText className="w-4 h-4 text-amber-300" />
                <span>Export Orders (PDF)</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filtered Orders</span>
              <div className="text-xl font-black text-slate-900 mt-0.5 font-mono">{filteredOrders.length}</div>
              <span className="text-[10px] text-slate-400">Total matched</span>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gross Volume</span>
              <div className="text-xl font-black text-slate-900 mt-0.5 font-mono">
                {totalVolume.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-emerald-600 font-bold">Total customer paid</span>
            </div>

            <div className="bg-emerald-50/40 rounded-2xl p-3.5 border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Admin 10% Fee</span>
              <div className="text-xl font-black text-emerald-700 mt-0.5 font-mono">
                +{totalCommission.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-emerald-600 font-medium">Platform revenue</span>
            </div>

            <div className="bg-purple-50/40 rounded-2xl p-3.5 border border-purple-200">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Pending Settlements</span>
              <div className="text-xl font-black text-purple-700 mt-0.5 font-mono">{pendingSettlementCount}</div>
              <span className="text-[10px] text-purple-600 font-medium">Unsettled order items</span>
            </div>
          </div>
        </div>

        {/* SEARCH & MULTI-FILTER BAR (Filter by Vendor, Date, Month, Status) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search invoice #, customer name, phone, city..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* FILTER BY VENDOR DROPDOWN */}
              <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 text-xs">
                <Store className="w-3.5 h-3.5 text-purple-700" />
                <span className="text-[11px] font-bold text-purple-700">Vendor:</span>
                <select
                  value={selectedVendor}
                  onChange={(e) => {
                    setSelectedVendor(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent font-bold text-purple-900 focus:outline-none cursor-pointer max-w-[150px] truncate"
                >
                  <option value="all">All Vendors</option>
                  {vendorOptions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Dropdown */}
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

              {/* Settlement / Delivery Status */}
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="unsettled">Pending Settlement</option>
                <option value="settled">Settled</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>

          {/* Date Range Selectors */}
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

            {(startDate || endDate || selectedMonth !== 'all' || selectedStatus !== 'all' || selectedVendor !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setSelectedMonth('all');
                  setSelectedStatus('all');
                  setSelectedVendor('all');
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
            <div className="text-sm font-bold text-slate-700">Loading Vendor Orders...</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-2xs space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Store className="w-8 h-8" />
            </div>
            <div className="text-base font-black text-slate-900">No Vendor Orders Found</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              When customers buy items listed by independent vendors, they will appear here with 10% platform commission accounting and 1-click payout settlement.
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
                  {/* Header: Invoice, Date, Payment & Copy Address Button */}
                  <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-xs sm:text-sm font-black text-[#0c2a5e] bg-purple-50 px-3 py-1 rounded-xl border border-purple-100">
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
                      <button
                        onClick={() => handleCopyCustomerAddress(order)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          isCopied
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                        title="Copy full shipping address to clipboard"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Address Copied!' : 'Copy Address'}</span>
                      </button>

                      <div className="text-right pl-2 font-mono">
                        <span className="text-[10px] font-sans font-bold text-slate-400 block uppercase">Vendor Total</span>
                        <span className="text-base sm:text-lg font-black text-slate-900">
                          {order.vendorTotal.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="divide-y divide-slate-100">
                    {order.vendorItems.map((item, idx) => {
                      const itemTotal = (item.price || 0) * (item.quantity || 1);
                      const comm = Math.round((itemTotal * 10) / 100);
                      const vendorPayable = itemTotal - comm;
                      const vendorName = item.store?.storeName || item.vendor?.name || 'Registered Merchant';

                      return (
                        <div
                          key={item._id || idx}
                          className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                        >
                          {/* Product Info & Vendor Badge */}
                          <div className="flex items-start gap-4 flex-1">
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
                                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                                  <Store className="w-3 h-3 text-purple-600" />
                                  <span>{vendorName}</span>
                                </span>

                                {(item.sourceType === 'admin_catalog' || item.sourceAdminProduct) && (
                                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200 flex items-center gap-1">
                                    <Package className="w-2.5 h-2.5 text-indigo-600" />
                                    Admin Sourced ({item.vendorProductCode || 'Central Dispatch'})
                                  </span>
                                )}

                                {item.vendor?.email && (
                                  <span className="text-[11px] text-slate-400 font-mono">
                                    ({item.vendor.email})
                                  </span>
                                )}
                              </div>

                              <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                                {item.title}
                              </h3>

                              <div className="text-xs text-slate-500 flex items-center gap-3 font-mono flex-wrap">
                                <span>
                                  Qty: <b className="text-slate-900 font-sans">{item.quantity}</b>
                                </span>
                                <span>•</span>
                                <span>
                                  Customer Price: <b className="text-slate-900">{item.price?.toLocaleString('en-IN')}</b>
                                </span>
                                <span>•</span>
                                <span>
                                  Gross: <b className="text-slate-900">{itemTotal.toLocaleString('en-IN')}</b>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Commission & Settlement Accounting Box */}
                          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 flex items-center gap-4 text-xs font-mono self-stretch sm:self-auto justify-around">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block uppercase font-sans">
                                10% Fee
                              </span>
                              <span className="font-bold text-emerald-600">+{comm.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="h-6 w-px bg-slate-200" />
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block uppercase font-sans">
                                90% Payout
                              </span>
                              <span className="font-bold text-[#0c2a5e]">{vendorPayable.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="h-6 w-px bg-slate-200" />
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block uppercase font-sans">
                                Settlement
                              </span>
                              {item.vendorSettled ? (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Settled
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Pending
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Settlement Button & Delivery Status */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto justify-end shrink-0">
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">Delivery Status</span>
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  item.deliveryStatus === 'Delivered'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : item.deliveryStatus === 'Shipped'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {item.deliveryStatus || 'Processing'}
                              </span>
                              {item.trackingNumber && (
                                <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                                  AWB: {item.trackingNumber}
                                </span>
                              )}
                            </div>

                            {!item.vendorSettled && (
                              <button
                                onClick={() => handleSettleToVendor(order._id, item._id, vendorName, vendorPayable)}
                                disabled={settlingItemId === item._id}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                <Wallet className="w-3.5 h-3.5" />
                                <span>{settlingItemId === item._id ? 'Settling...' : '1-Click Settle'}</span>
                              </button>
                            )}
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
                      <span>Order Ref: {order._id.slice(-8)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* RESPONSIVE PAGINATION */}
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
      </div>
    </AdminLayout>
  );
};

export default AdminVendorOrders;
