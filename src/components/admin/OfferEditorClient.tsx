"use client";

import { useState } from "react";
import { PlusCircle, Trash2, Save, Send, Eye, FileText } from "lucide-react";
import { updateOffer, sendOfferEmail } from "@/app/actions/offer";
import { format } from "date-fns";

export function OfferEditorClient({ offer, booking }: { offer: any, booking: any }) {
  const [items, setItems] = useState<any[]>(offer.items || []);
  const [customText, setCustomText] = useState(offer.customText || "");
  const [validUntil, setValidUntil] = useState(
    offer.validUntil ? format(new Date(offer.validUntil), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState(offer.status);

  const addItem = () => {
    setItems([...items, { id: `temp-${Date.now()}`, description: "Neue Position", quantity: 1, unitPrice: 0, taxRate: 19 }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const calculateTax = () => items.reduce((acc, item) => acc + (item.quantity * item.unitPrice * (item.taxRate / 100)), 0);

  const subTotal = calculateSubtotal();
  const taxAmount = calculateTax();
  const totalPrice = subTotal + taxAmount;

  const handleSave = async () => {
    setIsSaving(true);
    const res = await updateOffer(offer.id, {
      validUntil: new Date(validUntil),
      customText,
      status
    }, items);
    
    setIsSaving(false);
    if (res.success) {
      alert("Angebot erfolgreich gespeichert!");
    } else {
      alert("Fehler beim Speichern: " + res.error);
    }
  };

  const handleSend = async () => {
    if (!window.confirm("Angebot jetzt an den Kunden senden?")) return;
    setIsSaving(true);
    // First save the current state
    await updateOffer(offer.id, {
      validUntil: new Date(validUntil),
      customText,
      status: "SENT" // Will be overridden to SENT in action anyway, but good for local state
    }, items);
    
    // Then send email
    const res = await sendOfferEmail(offer.id);
    
    setIsSaving(false);
    if (res.success) {
      setStatus("SENT");
      alert("Angebot wurde erfolgreich versendet!");
    } else {
      alert("Fehler beim Senden: " + res.error);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Status Bar */}
      <div className="glass p-4 rounded-2xl flex items-center justify-between border border-foreground/5">
        <div className="flex items-center gap-4">
          <span className="font-bold text-sm">Status:</span>
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            className="bg-background border rounded-lg px-3 py-1.5 text-sm font-bold"
          >
            <option value="DRAFT">Entwurf</option>
            <option value="SENT">Gesendet</option>
            <option value="ACCEPTED">Akzeptiert</option>
            <option value="REJECTED">Abgelehnt</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.open(`/angebot/${offer.id}`, '_blank')} className="flex items-center gap-2 px-4 py-2 bg-foreground/5 hover:bg-foreground/10 text-foreground/80 rounded-xl text-sm font-bold transition-colors">
            <Eye size={16} /> Vorschau ansehen
          </button>
          <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
            <Save size={16} /> {isSaving ? "Speichere..." : "Speichern"}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Left Column: Form & Text */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass p-6 rounded-3xl border border-foreground/5">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FileText size={20} className="text-blue-500" /> Anschreiben & Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Gültig bis</label>
                <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="w-full bg-background border rounded-xl px-4 py-3" />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-2">Kunden-Anschreiben</label>
                <textarea 
                  value={customText} 
                  onChange={e => setCustomText(e.target.value)} 
                  className="w-full bg-background border rounded-xl px-4 py-3 resize-none h-48"
                />
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-3xl border border-foreground/5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><PlusCircle size={20} className="text-blue-500" /> Positionen</h2>
              <button onClick={addItem} className="text-sm font-bold text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-lg hover:bg-blue-500/20">
                + Leeren Posten
              </button>
            </div>

            <div className="mb-6 flex flex-wrap gap-2 pb-4 border-b border-foreground/5">
              <span className="text-xs font-bold text-foreground/50 w-full mb-1">Vorlagen schnell einfügen:</span>
              <button onClick={() => setItems([...items, { id: `temp-${Date.now()}`, description: `Schnitzelbuffet (${booking.people} Personen)`, quantity: booking.people, unitPrice: 20, taxRate: 19 }])} className="text-xs font-medium bg-foreground/5 hover:bg-foreground/10 px-2 py-1 rounded">Schnitzelbuffet (20€)</button>
              <button onClick={() => setItems([...items, { id: `temp-${Date.now()}`, description: `Buntes Buffet (${booking.people} Personen)`, quantity: booking.people, unitPrice: 25, taxRate: 19 }])} className="text-xs font-medium bg-foreground/5 hover:bg-foreground/10 px-2 py-1 rounded">Buntes Buffet (25€)</button>
              <button onClick={() => setItems([...items, { id: `temp-${Date.now()}`, description: `Großes Buffet (${booking.people} Personen)`, quantity: booking.people, unitPrice: 30, taxRate: 19 }])} className="text-xs font-medium bg-foreground/5 hover:bg-foreground/10 px-2 py-1 rounded">Großes Buffet (30€)</button>
              <button onClick={() => setItems([...items, { id: `temp-${Date.now()}`, description: `Grillbuffet (${booking.people} Personen)`, quantity: booking.people, unitPrice: 35, taxRate: 19 }])} className="text-xs font-medium bg-foreground/5 hover:bg-foreground/10 px-2 py-1 rounded">Grillbuffet (35€)</button>
              <button onClick={() => setItems([...items, { id: `temp-${Date.now()}`, description: `Getränke nach Verzehr`, quantity: 1, unitPrice: 0, taxRate: 19 }])} className="text-xs font-medium bg-foreground/5 hover:bg-foreground/10 px-2 py-1 rounded">Getränke (nach Verzehr)</button>
              <button onClick={() => setItems([...items, { id: `temp-${Date.now()}`, description: `Servicekräfte (nach Aufwand)`, quantity: booking.eventServiceStaff || 1, unitPrice: 85, taxRate: 19 }])} className="text-xs font-medium bg-foreground/5 hover:bg-foreground/10 px-2 py-1 rounded">Servicekräfte (85€/h)</button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id || index} className="flex gap-2 items-start p-3 bg-background border rounded-xl">
                  <div className="flex-1">
                    <input type="text" value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} className="w-full bg-transparent border-b border-foreground/10 px-2 py-1 text-sm font-bold mb-2 focus:border-blue-500 outline-none" placeholder="Beschreibung" />
                    <div className="flex gap-2">
                      <div className="w-20">
                        <label className="text-xs text-foreground/50">Menge</label>
                        <input type="number" value={item.quantity} onChange={e => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)} className="w-full bg-foreground/5 rounded px-2 py-1 text-sm" />
                      </div>
                      <div className="w-24">
                        <label className="text-xs text-foreground/50">Einzelpreis (Netto)</label>
                        <input type="number" value={item.unitPrice} onChange={e => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full bg-foreground/5 rounded px-2 py-1 text-sm" />
                      </div>
                      <div className="w-20">
                        <label className="text-xs text-foreground/50">MwSt. %</label>
                        <select value={item.taxRate} onChange={e => updateItem(index, 'taxRate', parseFloat(e.target.value) || 0)} className="w-full bg-foreground/5 rounded px-2 py-1 text-sm">
                          <option value={19}>19%</option>
                          <option value={7}>7%</option>
                          <option value={0}>0%</option>
                        </select>
                      </div>
                      <div className="w-24 ml-auto text-right">
                        <label className="text-xs text-foreground/50">Gesamt (Netto)</label>
                        <div className="font-bold py-1 text-sm">{(item.quantity * item.unitPrice).toFixed(2)} €</div>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removeItem(index)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg mt-6">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {items.length === 0 && <div className="text-center text-sm text-foreground/50 py-4">Keine Positionen angelegt.</div>}
            </div>
          </div>
        </div>

        {/* Right Column: Customer Info & Summary */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-3xl border border-foreground/5 bg-blue-500/5 border-blue-500/20">
            <h2 className="text-lg font-bold mb-4 text-blue-600">Kunde / Rechnungsempfänger</h2>
            <div className="text-sm space-y-2">
              <p><strong>Typ:</strong> {booking.contactType === 'firma' ? 'Firma / Verein' : 'Privatperson'}</p>
              {booking.companyName && <p><strong>Firma:</strong> {booking.companyName}</p>}
              <p><strong>Name:</strong> {booking.name}</p>
              {booking.billingAddress && <p><strong>Adresse:</strong> {booking.billingAddress}</p>}
              <p><strong>E-Mail:</strong> {booking.email}</p>
              <p><strong>Telefon:</strong> {booking.phone}</p>
            </div>
          </div>

          <div className="glass p-6 rounded-3xl border border-foreground/5">
            <h2 className="text-lg font-bold mb-4">Zusammenfassung</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Summe (Netto)</span>
                <span>{subTotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-foreground/70 border-b border-foreground/10 pb-2">
                <span>zzgl. MwSt.</span>
                <span>{taxAmount.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between font-black text-xl pt-2">
                <span>Gesamtpreis</span>
                <span>{totalPrice.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          <button onClick={handleSend} disabled={isSaving} className="w-full flex justify-center items-center gap-2 py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold transition-colors disabled:opacity-50">
            <Send size={18} /> {isSaving && status === "SENT" ? "Wird gesendet..." : "Angebot an Kunde senden"}
          </button>
        </div>

      </div>
    </div>
  );
}
