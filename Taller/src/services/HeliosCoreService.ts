import { VaultLinkedList } from "../structures/VaultLinkedList";
import { FluxRequisition, NimbusRFQ, SolarisQuote, CometOrder, PulseInvoice, DawnShippingOfficer, TerraeBuyerAgent, StrixSupervisor, KeldorSeller, WyrmReceiveAgent } from "../models/NexusModels";
import { VortexQuoteStatus, ZephyrOrderStatus, ThalionProduct, OrbisQuoteItem } from "../types/NexusTypes";

let _rc=1,_rq=1,_qt=1,_od=1,_iv=1;
const gid = (p:string,n:number) => `${p}-${String(n).padStart(4,"0")}`;

export class HeliosCoreService {
  readonly requisitions  = new VaultLinkedList<FluxRequisition>();
  readonly rfqs          = new VaultLinkedList<NimbusRFQ>();
  readonly quotes        = new VaultLinkedList<SolarisQuote>();
  readonly orders        = new VaultLinkedList<CometOrder>();
  readonly invoices      = new VaultLinkedList<PulseInvoice>();

  readonly shippingOfficer = new DawnShippingOfficer("U01","Oficina Central");
  readonly buyerAgent      = new TerraeBuyerAgent("U02","Agente Compras");
  readonly supervisor      = new StrixSupervisor("U03","Supervisor General");
  readonly seller          = new KeldorSeller("U04","Vendedor Principal");
  readonly receiveAgent    = new WyrmReceiveAgent("U05","Agente Recepción");

  createRequisition(products: ThalionProduct[], notes="") {
    const r = new FluxRequisition(gid("REQ",_rc++), this.shippingOfficer, products, notes);
    this.requisitions.append(r); return r;
  }

  createRFQ(requisitionId: string, needsReview: boolean, notes="") {
    const req = this.requisitions.find(r=>r.id===requisitionId);
    if(!req) return null;
    const rfq = new NimbusRFQ(gid("RFQ",_rq++), req, this.buyerAgent, notes);
    rfq.needsSupervisorReview = needsReview;
    this.rfqs.append(rfq); return rfq;
  }

  supervisorReviewRFQ(rfqId: string, approve: boolean) {
    const rfq = this.rfqs.find(r=>r.id===rfqId);
    if(!rfq||!rfq.needsSupervisorReview) return null;
    rfq.isApprovedBySupervisor = approve; return rfq;
  }

  createQuote(rfqId: string, items: OrbisQuoteItem[], daysValid=15) {
    const rfq = this.rfqs.find(r=>r.id===rfqId);
    if(!rfq) return null;
    if(rfq.needsSupervisorReview && !rfq.isApprovedBySupervisor) return null;
    const vd = new Date(); vd.setDate(vd.getDate()+daysValid);
    const q = new SolarisQuote(gid("COT",_qt++), rfq, this.seller, items, vd);
    q.status = VortexQuoteStatus.SENT;
    this.quotes.append(q); return q;
  }

  reviewQuote(quoteId: string, accept: boolean, notes="") {
    const q = this.quotes.find(q=>q.id===quoteId);
    if(!q) return null;
    q.reviewNotes=notes; q.status=accept?VortexQuoteStatus.APPROVED:VortexQuoteStatus.REJECTED;
    q.isAcceptedByBuyer=accept; return q;
  }

  createOrder(quoteId: string) {
    const q = this.quotes.find(q=>q.id===quoteId&&q.isAcceptedByBuyer);
    if(!q) return null;
    const o = new CometOrder(gid("ORD",_od++), q, this.buyerAgent);
    o.status = ZephyrOrderStatus.SUBMITTED;
    this.orders.append(o); return o;
  }

  sellerReviewOrder(orderId: string, accept: boolean) {
    const o = this.orders.find(o=>o.id===orderId);
    if(!o) return null;
    o.status = accept?ZephyrOrderStatus.ACCEPTED:ZephyrOrderStatus.REJECTED; return o;
  }

  fulfillOrderAndInvoice(orderId: string, days=30) {
    const o = this.orders.find(o=>o.id===orderId&&o.status===ZephyrOrderStatus.ACCEPTED);
    if(!o) return null;
    o.status = ZephyrOrderStatus.FULFILLED;
    const dd = new Date(); dd.setDate(dd.getDate()+days);
    const inv = new PulseInvoice(gid("FAC",_iv++), o, this.seller, dd);
    this.invoices.append(inv);
    o.invoiceNumber=inv.id; o.status=ZephyrOrderStatus.INVOICED; return inv;
  }

  registerPayment(invoiceId: string) {
    const inv = this.invoices.find(i=>i.id===invoiceId);
    if(!inv) return null;
    inv.isPaid=true; inv.order.paymentConfirmed=true;
    inv.order.status=ZephyrOrderStatus.PAID; return inv;
  }

  confirmDelivery(orderId: string, note: string) {
    const o = this.orders.find(o=>o.id===orderId&&o.status===ZephyrOrderStatus.PAID);
    if(!o) return null;
    o.deliveryNote=note; o.status=ZephyrOrderStatus.DELIVERED; return o;
  }

  getPendingRFQs()  { return this.rfqs.filter(r=>r.needsSupervisorReview&&!r.isApprovedBySupervisor).toArray(); }
  getQuotesByStatus(s:VortexQuoteStatus) { return this.quotes.filter(q=>q.status===s).toArray(); }
  getOrdersByStatus(s:ZephyrOrderStatus) { return this.orders.filter(o=>o.status===s).toArray(); }
  getUnpaidInvoices() { return this.invoices.filter(i=>!i.isPaid).toArray(); }
  getTotalRevenue()   { return this.invoices.filter(i=>i.isPaid).toArray().reduce((s,i)=>s+i.getAmount(),0); }
  getAllRequisitions() { return this.requisitions.toArray(); }
  getAllRFQs()         { return this.rfqs.toArray(); }
  getAllQuotes()       { return this.quotes.toArray(); }
  getAllOrders()       { return this.orders.toArray(); }
  getAllInvoices()     { return this.invoices.toArray(); }
}
