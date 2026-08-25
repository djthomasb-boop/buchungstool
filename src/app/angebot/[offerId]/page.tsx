/* eslint-disable @next/next/no-img-element */
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { CheckCircle, Printer, XCircle } from "lucide-react";

export default async function PublicOfferPage(props: { params: Promise<{ offerId: string }> }) {
  const params = await props.params;
  const offer = await prisma.offer.findUnique({
    where: { id: params.offerId },
    include: {
      items: true,
      booking: true
    }
  });

  if (!offer || !offer.booking) {
    notFound();
  }

  const { booking } = offer;
  const isExpired = offer.validUntil && new Date() > new Date(offer.validUntil);

  return (
    <main className="min-h-screen bg-[#f8f9fa] py-12 px-4 print:p-0 print:bg-white">
      <div className="max-w-4xl mx-auto">
        
        {/* Status Banner (Not visible in Print) */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between print:hidden">
          <div>
            {offer.status === "DRAFT" && <div className="bg-yellow-500/10 text-yellow-700 px-4 py-2 rounded-xl font-bold">Vorschau (Entwurf)</div>}
            {offer.status === "SENT" && <div className="bg-blue-500/10 text-blue-700 px-4 py-2 rounded-xl font-bold">Dieses Angebot ist gültig bis {offer.validUntil ? format(new Date(offer.validUntil), "dd.MM.yyyy") : "-"}</div>}
            {offer.status === "ACCEPTED" && <div className="bg-green-500/10 text-green-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2"><CheckCircle size={18}/> Angebot wurde angenommen</div>}
            {offer.status === "REJECTED" && <div className="bg-red-500/10 text-red-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2"><XCircle size={18}/> Angebot wurde abgelehnt</div>}
          </div>
          
          <div className="flex gap-2">
            <button className="bg-white border hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors">
              <Printer size={18} /> Drucken / PDF
            </button>
            {offer.status === "SENT" && !isExpired && (
              <form action={async () => {
                "use server";
                await prisma.offer.update({ where: { id: offer.id }, data: { status: "ACCEPTED" } });
                // redirect occurs via form refresh natively if we wanted, or client component
              }}>
                <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors">
                  <CheckCircle size={18} /> Angebot annehmen
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Paper Document */}
        <div className="bg-white shadow-xl sm:rounded-2xl print:shadow-none print:rounded-none overflow-hidden">
          
          {/* Header */}
          <div className="p-8 sm:p-12 border-b">
            <div className="flex justify-between items-start mb-12">
              <div>
                <img src="/logo.png" alt="be free Logo" className="h-16 object-contain mb-4" />
                <div className="text-sm text-gray-500">
                  be free Sport- & Freizeitzentrum<br />
                  Stettiner Str. 46b<br />
                  17367 Eggesin
                </div>
              </div>
              <div className="text-right">
                <h1 className="text-3xl font-black text-gray-900 mb-2">ANGEBOT</h1>
                <p className="text-gray-500"><strong>Nr.</strong> {offer.offerNumber}</p>
                <p className="text-gray-500"><strong>Datum:</strong> {format(new Date(offer.createdAt), "dd.MM.yyyy")}</p>
                {offer.validUntil && <p className="text-gray-500"><strong>Gültig bis:</strong> {format(new Date(offer.validUntil), "dd.MM.yyyy")}</p>}
              </div>
            </div>

            <div className="flex justify-between">
              <div className="text-gray-900">
                <p className="font-bold text-gray-400 text-xs uppercase tracking-wider mb-2">Rechnungsempfänger</p>
                <p className="font-bold text-lg">{booking.contactType === 'firma' ? booking.companyName : booking.name}</p>
                {booking.contactType === 'firma' && <p>{booking.name}</p>}
                {booking.billingAddress ? (
                  <p className="whitespace-pre-wrap">{booking.billingAddress}</p>
                ) : (
                  <p className="text-gray-400 italic">Adresse fehlt</p>
                )}
              </div>
              
              <div className="text-right bg-gray-50 p-4 rounded-xl">
                <p className="font-bold text-gray-400 text-xs uppercase tracking-wider mb-1">Eckdaten Event</p>
                <p><strong>Location:</strong> {booking.eventLocation || booking.type}</p>
                <p><strong>Datum:</strong> {format(new Date(booking.date), "dd.MM.yyyy")} ab {booking.time} Uhr</p>
                <p><strong>Personen:</strong> {booking.people}</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-8 sm:p-12">
            
            {/* Custom Text */}
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed mb-12">
              {offer.customText}
            </div>

            {/* Line Items */}
            <table className="w-full text-left border-collapse mb-8">
              <thead>
                <tr className="border-b-2 border-gray-200 text-gray-900">
                  <th className="py-3 px-2 font-bold">Pos.</th>
                  <th className="py-3 px-2 font-bold">Beschreibung</th>
                  <th className="py-3 px-2 font-bold text-right">Menge</th>
                  <th className="py-3 px-2 font-bold text-right">Einzelpreis (Netto)</th>
                  <th className="py-3 px-2 font-bold text-right">MwSt.</th>
                  <th className="py-3 px-2 font-bold text-right">Gesamt (Netto)</th>
                </tr>
              </thead>
              <tbody>
                {offer.items.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-100 text-gray-700">
                    <td className="py-4 px-2">{index + 1}</td>
                    <td className="py-4 px-2 font-medium text-gray-900">{item.description}</td>
                    <td className="py-4 px-2 text-right">{item.quantity}</td>
                    <td className="py-4 px-2 text-right">{item.unitPrice.toFixed(2)} €</td>
                    <td className="py-4 px-2 text-right text-gray-400">{item.taxRate}%</td>
                    <td className="py-4 px-2 text-right font-medium">{(item.quantity * item.unitPrice).toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-12">
              <div className="w-full sm:w-1/2 lg:w-1/3 space-y-3 text-gray-700">
                <div className="flex justify-between px-2">
                  <span>Zwischensumme (Netto)</span>
                  <span>{offer.subTotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between px-2 text-gray-500 border-b border-gray-200 pb-3">
                  <span>zzgl. Mehrwertsteuer</span>
                  <span>{offer.taxAmount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between px-2 pt-1 font-black text-xl text-gray-900">
                  <span>Gesamtbetrag (Brutto)</span>
                  <span>{offer.totalPrice.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            <div className="text-gray-500 text-sm mb-12">
              Wir hoffen, unser Angebot sagt Ihnen zu und stehen für Rückfragen gerne zur Verfügung.
            </div>

          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-8 sm:p-12 text-xs text-gray-500 grid sm:grid-cols-3 gap-8">
            <div>
              <strong>be free Sport- & Freizeitzentrum</strong><br />
              Stettiner Str. 46b<br />
              17367 Eggesin
            </div>
            <div>
              <strong>Kontakt</strong><br />
              Tel: 039779 60806<br />
              Mail: info@befree.world
            </div>
            <div>
              <strong>Bankverbindung</strong><br />
              IBAN: DEXX XXXX XXXX XXXX XXXX XX<br />
              BIC: XXXXXXXX
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Script for Print Button */}
      <script dangerouslySetInnerHTML={{ __html: `
        document.querySelector('button')?.addEventListener('click', function() {
          if (this.innerText.includes('Drucken')) window.print();
        });
      `}} />
    </main>
  );
}
