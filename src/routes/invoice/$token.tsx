import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getPublicInvoiceFn } from "@/features/invoices/server/public-invoice.fn";
import {
  InvoiceStatusBadge,
  PaymentStatusBadge,
} from "@/components/shared/status-badge";
import { formatIDR } from "@/lib/money";
import { formatDateID } from "@/lib/dates";
import {
  ADMIN_CONTACT,
  getAdminWhatsAppUrl,
  formatInvoiceFileName,
} from "@/lib/constants";
import { exportInvoiceHtmlPdf } from "@/lib/invoice-pdf";
import { Button } from "@/components/ui/button";
import { Download, Printer, MessageCircle, AlertCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/invoice/$token")({
  component: PublicInvoicePage,
});

function PublicInvoicePage() {
  const { token } = Route.useParams();
  const invoiceCardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const {
    data: invoice,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["public-invoice", token],
    queryFn: () => getPublicInvoiceFn({ data: { token } }),
  });

  const fileName = invoice
    ? formatInvoiceFileName(invoice.number, invoice.customerName)
    : "Invoice";

  useEffect(() => {
    if (invoice) {
      document.title = fileName;
    }
  }, [invoice, fileName]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Memuat dokumen invoice...
          </p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-xs">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-6" />
          </div>
          <h2 className="mt-4 text-lg font-bold">Invoice Tidak Ditemukan</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Link invoice ini tidak valid atau telah dihapus. Silakan hubungi
            admin Mari Mari Outdoor.
          </p>
        </div>
      </div>
    );
  }

  const remainingBalance = Math.max(0, invoice.total - invoice.amountPaid);

  function handlePrint() {
    document.title = fileName;
    window.print();
  }

  async function handleDownloadPdf() {
    if (!invoiceCardRef.current || isExporting) return;
    try {
      setIsExporting(true);
      await exportInvoiceHtmlPdf(invoiceCardRef.current, fileName);
    } catch (err) {
      console.error("Failed to export PDF:", err);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4 font-sans text-foreground sm:px-6 print:min-h-0 print:bg-white print:p-0 print:text-black">
      {/* Action Bar (Hidden when printing) */}
      <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <img
            src="/marimari-logo.png"
            alt="Mari Mari Outdoor"
            className="size-7"
          />
          <span className="text-xs font-semibold text-muted-foreground">
            Mari Mari Outdoor • Digital Invoice
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="gap-1.5 text-xs shadow-xs"
            size="sm"
          >
            {isExporting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            <span>{isExporting ? "Mengunduh..." : "Unduh PDF"}</span>
          </Button>
          <Button
            onClick={handlePrint}
            variant="outline"
            className="gap-1.5 text-xs shadow-xs"
            size="sm"
          >
            <Printer className="size-3.5" />
            <span>Cetak</span>
          </Button>
          <a
            href={getAdminWhatsAppUrl(
              `Halo Admin Mari Mari Outdoor, saya ingin menanyakan perihal invoice ${invoice.number}`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-accent transition"
          >
            <MessageCircle className="size-3.5 text-success" />
            <span>Hubungi Admin</span>
          </a>
        </div>
      </div>

      {/* Main Printable Document Card */}
      <div
        id="invoice-document"
        ref={invoiceCardRef}
        className="mx-auto max-w-3xl rounded-xl border border-border bg-card p-6 shadow-sm sm:p-10 print:m-0 print:max-w-none print:border-none print:p-0 print:shadow-none"
      >
        {/* Header */}
        <div className="flex flex-col justify-between gap-6 border-b border-border pb-8 sm:flex-row sm:items-start">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <img
                src="/marimari-logo.png"
                alt="Mari Mari Outdoor"
                className="size-12 rounded-xl object-cover ring-1 ring-border/50 shadow-2xs"
              />
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  MARI MARI OUTDOOR
                </h1>
                <p className="text-xs text-muted-foreground">
                  Penyewaan Perlengkapan Outdoor & Camping
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Instagram: {ADMIN_CONTACT.instagram} • WhatsApp:{" "}
              {ADMIN_CONTACT.phoneDisplay}
            </p>
          </div>

          <div className="space-y-1 sm:text-right">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Invoice Sewa
            </div>
            <div className="font-mono text-xl font-bold">{invoice.number}</div>
            <div className="flex items-center gap-2 sm:justify-end pt-1">
              <InvoiceStatusBadge status={invoice.status as any} />
              <PaymentStatusBadge status={invoice.paymentStatus as any} />
            </div>
            <p className="text-[11px] text-muted-foreground pt-1">
              Tanggal: {formatDateID(invoice.createdAt)}
            </p>
          </div>
        </div>

        {/* Customer & Rental Schedule Details */}
        <div className="grid grid-cols-1 gap-6 py-6 border-b border-border sm:grid-cols-2">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Penyewa / Ditagihkan Kepada:
            </span>
            <div className="text-base font-bold text-foreground">
              {invoice.customerName}
            </div>
            <div className="text-xs text-muted-foreground">
              No. WhatsApp: {invoice.customerPhone}
            </div>
          </div>

          <div className="space-y-1.5 sm:text-right">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Jadwal Masa Sewa:
            </span>
            <div className="text-xs font-semibold">
              {formatDateID(invoice.rentStart)} —{" "}
              {formatDateID(invoice.rentEnd)}
            </div>
            <div className="text-xs text-muted-foreground">
              Durasi:{" "}
              <span className="font-bold text-foreground">
                {invoice.days} Hari
              </span>{" "}
              (Inklusif)
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="py-6">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2.5 px-1 text-left font-semibold">No</th>
                <th className="py-2.5 px-3 text-left font-semibold">
                  Perlengkapan Outdoor
                </th>
                <th className="py-2.5 px-3 text-center font-semibold">Qty</th>
                <th className="py-2.5 px-3 text-right font-semibold">
                  Tarif / Hari
                </th>
                <th className="py-2.5 px-3 text-right font-semibold">
                  Total ({invoice.days} Hari)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {invoice.items.map((it, idx) => (
                <tr key={it.id}>
                  <td className="py-3 px-1 text-muted-foreground">{idx + 1}</td>
                  <td className="py-3 px-3 font-semibold text-foreground">
                    {it.equipmentName}
                  </td>
                  <td className="py-3 px-3 text-center tabular-nums font-medium">
                    {it.quantity} unit
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-muted-foreground">
                    {formatIDR(it.unitPrice)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold tabular-nums text-foreground">
                    {formatIDR(it.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Payment Summary */}
        <div className="flex flex-col justify-between gap-6 border-t border-border pt-6 sm:flex-row">
          <div className="max-w-xs space-y-2 text-xs">
            {invoice.notes && (
              <div>
                <span className="font-semibold text-foreground">
                  Catatan Sewa:
                </span>
                <p className="mt-0.5 text-muted-foreground">{invoice.notes}</p>
              </div>
            )}
            <div className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground">
              Pembayaran dapat dilakukan melalui transfer bank atau tunai saat
              pengambilan alat.
            </div>
          </div>

          <div className="w-full max-w-xs space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span className="font-medium tabular-nums">
                {formatIDR(invoice.subtotal)}
              </span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Potongan Diskon:</span>
                <span className="font-medium tabular-nums">
                  -{formatIDR(invoice.discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2 text-sm font-bold text-foreground">
              <span>Total Tagihan:</span>
              <span className="text-base tabular-nums">
                {formatIDR(invoice.total)}
              </span>
            </div>
            <div className="flex justify-between text-success">
              <span>Sudah Dibayar / DP:</span>
              <span className="font-semibold tabular-nums">
                {formatIDR(invoice.amountPaid)}
              </span>
            </div>
            <div className="flex justify-between border-t border-border/80 pt-1 font-bold">
              <span>Sisa Pembayaran:</span>
              <span
                className={`tabular-nums ${
                  remainingBalance > 0 ? "text-destructive" : "text-success"
                }`}
              >
                {remainingBalance > 0 ? formatIDR(remainingBalance) : "LUNAS"}
              </span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="mt-8 rounded-lg border border-border/60 bg-muted/20 p-4 text-[11px] text-muted-foreground">
          <h4 className="font-semibold text-foreground mb-1">
            Syarat & Ketentuan Penyewaan Mari Mari Outdoor:
          </h4>
          <ol className="list-decimal pl-4 space-y-0.5">
            <li>
              Penyewa wajib membawa identitas diri asli (KTP/SIM) sebagai
              penjamin sewa.
            </li>
            <li>
              Perlengkapan wajib dijaga kebersihan dan kelengkapannya selama
              masa sewa.
            </li>
            <li>
              Keterlambatan pengembalian tanpa konfirmasi akan dikenakan denda
              sesuai tarif harian.
            </li>
            <li>
              Kerusakan atau kehilangan barang sepenuhnya menjadi tanggung jawab
              penyewa.
            </li>
          </ol>
        </div>

        {/* Signatures */}
        <div
          data-invoice-signatures
          className="mt-12 hidden grid-cols-2 pt-8 text-center text-xs print:grid"
        >
          <div>
            <p className="text-muted-foreground">Penyewa,</p>
            <div className="h-16" />
            <p className="font-semibold border-t border-border mx-12 pt-1">
              ( {invoice.customerName} )
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">
              Pengelola Mari Mari Outdoor,
            </p>
            <div className="h-16" />
            <p className="font-semibold border-t border-border mx-12 pt-1">
              ( Administrator )
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
