"use strict";

// ═══════════════════════════════════════════
// VaultLinkedList — Lista Enlazada Genérica
// ═══════════════════════════════════════════
class PrismaNode {
  constructor(data) { this.data = data; this.next = null; }
}

class VaultLinkedList {
  constructor() { this.head = null; this._size = 0; }
  get size() { return this._size; }
  append(data) {
    const node = new PrismaNode(data);
    if (!this.head) this.head = node;
    else { let c = this.head; while (c.next) c = c.next; c.next = node; }
    this._size++;
  }
  removeAt(index) {
    if (index < 0 || index >= this._size) return null;
    let removed;
    if (index === 0) { removed = this.head.data; this.head = this.head.next; }
    else { let c = this.head; for (let i=0;i<index-1;i++) c=c.next; removed=c.next.data; c.next=c.next.next; }
    this._size--; return removed;
  }
  get(index) {
    if (index < 0 || index >= this._size) return null;
    let c = this.head; for (let i=0;i<index;i++) c=c.next; return c?c.data:null;
  }
  find(predicate) { let c=this.head; while(c){if(predicate(c.data))return c.data;c=c.next;} return null; }
  filter(predicate) { const r=new VaultLinkedList(); let c=this.head; while(c){if(predicate(c.data))r.append(c.data);c=c.next;} return r; }
  toArray() { const a=[]; let c=this.head; while(c){a.push(c.data);c=c.next;} return a; }
  isEmpty() { return this._size===0; }
  clear() { this.head=null; this._size=0; }
  forEach(cb) { let c=this.head,i=0; while(c){cb(c.data,i);c=c.next;i++;} }
}

// ═══════════════════════════════════════════
// Enums
// ═══════════════════════════════════════════
const VortexQuoteStatus = { PENDING:"PENDIENTE", REVIEWING:"EN_REVISION", APPROVED:"APROBADA", REJECTED:"RECHAZADA", SENT:"ENVIADA" };
const ZephyrOrderStatus = { DRAFT:"BORRADOR", SUBMITTED:"ENVIADO", ACCEPTED:"ACEPTADO", REJECTED:"RECHAZADO", FULFILLED:"COMPLETADO", INVOICED:"FACTURADO", PAID:"PAGADO", DELIVERED:"ENTREGADO" };
const CruxActorRole     = { SHIPPING_OFFICE:"Oficina de Despacho", BUYER_AGENT:"Agente Comprador", SUPERVISOR:"Supervisor", SELLER:"Vendedor", RECEIVE_AGENT:"Agente Receptor" };

// ═══════════════════════════════════════════
// Modelos
// ═══════════════════════════════════════════
class GalvornActor { constructor(id,name,role){this.id=id;this.name=name;this.role=role;} }
class DawnShippingOfficer extends GalvornActor { constructor(id,name){super(id,name,CruxActorRole.SHIPPING_OFFICE);} }
class TerraeBuyerAgent    extends GalvornActor { constructor(id,name){super(id,name,CruxActorRole.BUYER_AGENT);} }
class StrixSupervisor     extends GalvornActor { constructor(id,name){super(id,name,CruxActorRole.SUPERVISOR);} }
class KeldorSeller        extends GalvornActor { constructor(id,name){super(id,name,CruxActorRole.SELLER);} }
class WyrmReceiveAgent    extends GalvornActor { constructor(id,name){super(id,name,CruxActorRole.RECEIVE_AGENT);} }

class FluxRequisition {
  constructor(id,createdBy,products,notes=""){this.id=id;this.createdBy=createdBy;this.products=products;this.notes=notes;this.createdAt=new Date();}
  getTotalItems(){return this.products.reduce((s,p)=>s+p.quantity,0);}
}

class NimbusRFQ {
  constructor(id,requisition,createdBy,notes=""){this.id=id;this.requisition=requisition;this.createdBy=createdBy;this.notes=notes;this.createdAt=new Date();this.needsSupervisorReview=false;this.isApprovedBySupervisor=false;}
}

class SolarisQuote {
  constructor(id,rfq,seller,items,validUntil){this.id=id;this.rfq=rfq;this.seller=seller;this.items=items;this.validUntil=validUntil;this.createdAt=new Date();this.status=VortexQuoteStatus.PENDING;this.reviewNotes="";this.isAcceptedByBuyer=false;}
  getTotal(){return this.items.reduce((s,i)=>i.available?s+i.product.quantity*i.offeredPrice:s,0);}
}

class CometOrder {
  constructor(id,quote,buyerAgent){this.id=id;this.quote=quote;this.buyerAgent=buyerAgent;this.createdAt=new Date();this.status=ZephyrOrderStatus.DRAFT;this.invoiceNumber=null;this.deliveryNote=null;this.paymentConfirmed=false;}
  getTotal(){return this.quote.getTotal();}
}

class PulseInvoice {
  constructor(id,order,seller,dueDate){this.id=id;this.order=order;this.seller=seller;this.dueDate=dueDate;this.issuedAt=new Date();this.isPaid=false;}
  getAmount(){return this.order.getTotal();}
}

// ═══════════════════════════════════════════
// HeliosCoreService
// ═══════════════════════════════════════════
let _rc=1,_rq=1,_qt=1,_od=1,_iv=1;
const gid=(p,n)=>`${p}-${String(n).padStart(4,"0")}`;

class HeliosCoreService {
  constructor(){
    this.requisitions = new VaultLinkedList();
    this.rfqs         = new VaultLinkedList();
    this.quotes       = new VaultLinkedList();
    this.orders       = new VaultLinkedList();
    this.invoices     = new VaultLinkedList();
    this.shippingOfficer = new DawnShippingOfficer("U01","Oficina Central");
    this.buyerAgent      = new TerraeBuyerAgent("U02","Agente Compras");
    this.supervisor      = new StrixSupervisor("U03","Supervisor General");
    this.seller          = new KeldorSeller("U04","Vendedor Principal");
    this.receiveAgent    = new WyrmReceiveAgent("U05","Agente Recepción");
  }
  createRequisition(products,notes=""){const r=new FluxRequisition(gid("REQ",_rc++),this.shippingOfficer,products,notes);this.requisitions.append(r);return r;}
  createRFQ(requisitionId,needsReview,notes=""){const req=this.requisitions.find(r=>r.id===requisitionId);if(!req)return null;const rfq=new NimbusRFQ(gid("RFQ",_rq++),req,this.buyerAgent,notes);rfq.needsSupervisorReview=needsReview;this.rfqs.append(rfq);return rfq;}
  supervisorReviewRFQ(rfqId,approve){const rfq=this.rfqs.find(r=>r.id===rfqId);if(!rfq||!rfq.needsSupervisorReview)return null;rfq.isApprovedBySupervisor=approve;return rfq;}
  createQuote(rfqId,items,daysValid=15){const rfq=this.rfqs.find(r=>r.id===rfqId);if(!rfq)return null;if(rfq.needsSupervisorReview&&!rfq.isApprovedBySupervisor)return null;const vd=new Date();vd.setDate(vd.getDate()+daysValid);const q=new SolarisQuote(gid("COT",_qt++),rfq,this.seller,items,vd);q.status=VortexQuoteStatus.SENT;this.quotes.append(q);return q;}
  reviewQuote(quoteId,accept,notes=""){const q=this.quotes.find(q=>q.id===quoteId);if(!q)return null;q.reviewNotes=notes;q.status=accept?VortexQuoteStatus.APPROVED:VortexQuoteStatus.REJECTED;q.isAcceptedByBuyer=accept;return q;}
  createOrder(quoteId){const q=this.quotes.find(q=>q.id===quoteId&&q.isAcceptedByBuyer);if(!q)return null;const o=new CometOrder(gid("ORD",_od++),q,this.buyerAgent);o.status=ZephyrOrderStatus.SUBMITTED;this.orders.append(o);return o;}
  sellerReviewOrder(orderId,accept){const o=this.orders.find(o=>o.id===orderId);if(!o)return null;o.status=accept?ZephyrOrderStatus.ACCEPTED:ZephyrOrderStatus.REJECTED;return o;}
  fulfillOrderAndInvoice(orderId,days=30){const o=this.orders.find(o=>o.id===orderId&&o.status===ZephyrOrderStatus.ACCEPTED);if(!o)return null;o.status=ZephyrOrderStatus.FULFILLED;const dd=new Date();dd.setDate(dd.getDate()+days);const inv=new PulseInvoice(gid("FAC",_iv++),o,this.seller,dd);this.invoices.append(inv);o.invoiceNumber=inv.id;o.status=ZephyrOrderStatus.INVOICED;return inv;}
  registerPayment(invoiceId){const inv=this.invoices.find(i=>i.id===invoiceId);if(!inv)return null;inv.isPaid=true;inv.order.paymentConfirmed=true;inv.order.status=ZephyrOrderStatus.PAID;return inv;}
  confirmDelivery(orderId,note){const o=this.orders.find(o=>o.id===orderId&&o.status===ZephyrOrderStatus.PAID);if(!o)return null;o.deliveryNote=note;o.status=ZephyrOrderStatus.DELIVERED;return o;}
  getPendingRFQs(){return this.rfqs.filter(r=>r.needsSupervisorReview&&!r.isApprovedBySupervisor).toArray();}
  getQuotesByStatus(s){return this.quotes.filter(q=>q.status===s).toArray();}
  getOrdersByStatus(s){return this.orders.filter(o=>o.status===s).toArray();}
  getUnpaidInvoices(){return this.invoices.filter(i=>!i.isPaid).toArray();}
  getTotalRevenue(){return this.invoices.filter(i=>i.isPaid).toArray().reduce((s,i)=>s+i.getAmount(),0);}
  getAllRequisitions(){return this.requisitions.toArray();}
  getAllRFQs(){return this.rfqs.toArray();}
  getAllQuotes(){return this.quotes.toArray();}
  getAllOrders(){return this.orders.toArray();}
  getAllInvoices(){return this.invoices.toArray();}
}

// ═══════════════════════════════════════════
// UI
// ═══════════════════════════════════════════
const svc = new HeliosCoreService();
window.svc = svc;

function $(id){return document.getElementById(id);}
function showToast(msg,type="success"){
  const t=document.createElement("div");
  t.className=`toast toast-${type}`;t.textContent=msg;
  document.getElementById("toast-container").appendChild(t);
  setTimeout(()=>t.classList.add("show"),10);
  setTimeout(()=>{t.classList.remove("show");setTimeout(()=>t.remove(),400);},3000);
}
function openModal(id){document.getElementById(id).classList.add("active");}
function closeModal(id){document.getElementById(id).classList.remove("active");}

function showSection(name){
  document.querySelectorAll(".section").forEach(s=>s.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
  document.getElementById(`sec-${name}`).classList.add("active");
  document.querySelector(`[data-section="${name}"]`).classList.add("active");
  renderSection(name);
}

function renderSection(name){
  if(name==="dashboard")     renderDashboard();
  if(name==="requisiciones") renderRequisiciones();
  if(name==="rfqs")          renderRFQs();
  if(name==="cotizaciones")  renderCotizaciones();
  if(name==="pedidos")       renderPedidos();
  if(name==="facturas")      renderFacturas();
}

// DASHBOARD
function renderDashboard(){
  $("stat-req").textContent   = String(svc.getAllRequisitions().length);
  $("stat-rfq").textContent   = String(svc.getAllRFQs().length);
  $("stat-cot").textContent   = String(svc.getAllQuotes().length);
  $("stat-ped").textContent   = String(svc.getAllOrders().length);
  $("stat-fac").textContent   = String(svc.getAllInvoices().length);
  $("stat-rev").textContent   = `$${svc.getTotalRevenue().toFixed(2)}`;
  $("stat-pend").textContent  = String(svc.getPendingRFQs().length);
  $("stat-unpaid").textContent= String(svc.getUnpaidInvoices().length);
}

// REQUISICIONES
function renderRequisiciones(){
  const items=svc.getAllRequisitions();
  const tbody=$("tbl-req");
  if(items.length===0){tbody.innerHTML=`<tr><td colspan="5" class="empty">No hay requisiciones aún</td></tr>`;return;}
  tbody.innerHTML=items.map(r=>`<tr>
    <td><span class="badge badge-blue">${r.id}</span></td>
    <td>${r.createdBy.name}</td>
    <td>${r.products.map(p=>p.name).join(", ")}</td>
    <td>${r.getTotalItems()}</td>
    <td>${r.createdAt.toLocaleDateString()}</td>
  </tr>`).join("");
}

function productRow(n){
  return `<div class="product-row" id="prow-${n}">
    <input type="text"   placeholder="Nombre del producto" id="pname-${n}"  class="input"/>
    <input type="number" placeholder="Cantidad"            id="pqty-${n}"   class="input" min="1" value="1"/>
    <input type="number" placeholder="Precio unitario"     id="pprice-${n}" class="input" min="0" step="0.01" value="0"/>
    ${n>1?`<button class="btn-remove" onclick="removeProductRow(${n})">✕</button>`:""}
  </div>`;
}

function openModalReq(){
  $("req-products-list").innerHTML=productRow(1);
  $("req-prod-count").textContent="1";
  $("req-notes").value="";
  openModal("modal-req");
}

window.addProductRow=function(){
  const count=parseInt($("req-prod-count").textContent||"1")+1;
  $("req-prod-count").textContent=String(count);
  $("req-products-list").insertAdjacentHTML("beforeend",productRow(count));
};

window.removeProductRow=function(n){document.getElementById(`prow-${n}`)?.remove();};

window.submitReq=function(){
  const count=parseInt($("req-prod-count").textContent||"1");
  const products=[];
  for(let i=1;i<=count;i++){
    const row=document.getElementById(`prow-${i}`);if(!row)continue;
    const name=(document.getElementById(`pname-${i}`)?.value||"").trim();
    const qty=parseInt(document.getElementById(`pqty-${i}`)?.value||"1");
    const price=parseFloat(document.getElementById(`pprice-${i}`)?.value||"0");
    if(name)products.push({id:`P${i}`,name,quantity:qty,unitPrice:price});
  }
  if(products.length===0){showToast("Agrega al menos un producto","error");return;}
  const notes=$("req-notes").value;
  svc.createRequisition(products,notes);
  closeModal("modal-req");
  renderRequisiciones();renderDashboard();
  showToast("Requisición creada correctamente ✔");
};

// RFQs
function renderRFQs(){
  const items=svc.getAllRFQs();
  const tbody=$("tbl-rfq");
  if(items.length===0){tbody.innerHTML=`<tr><td colspan="6" class="empty">No hay RFQs aún</td></tr>`;return;}
  tbody.innerHTML=items.map(r=>{
    let badge=`<span class="badge badge-blue">Directo</span>`;
    if(r.needsSupervisorReview)badge=r.isApprovedBySupervisor
      ?`<span class="badge badge-green">Aprobado</span>`
      :`<span class="badge badge-yellow">Pendiente</span>`;
    const canApprove=r.needsSupervisorReview&&!r.isApprovedBySupervisor;
    return `<tr>
      <td><span class="badge badge-blue">${r.id}</span></td>
      <td>${r.requisition.id}</td>
      <td>${r.createdBy.name}</td>
      <td>${badge}</td>
      <td>${r.notes||"—"}</td>
      <td>${canApprove
        ?`<button class="btn-action btn-green" onclick="approveRFQ('${r.id}',true)">Aprobar</button>
           <button class="btn-action btn-red"   onclick="approveRFQ('${r.id}',false)">Rechazar</button>`
        :"—"}</td>
    </tr>`;
  }).join("");
}

window.approveRFQ=function(id,approve){
  svc.supervisorReviewRFQ(id,approve);
  renderRFQs();renderDashboard();
  showToast(approve?"RFQ aprobado ✔":"RFQ rechazado",approve?"success":"error");
};

function openModalRFQ(){
  const reqs=svc.getAllRequisitions();
  if(reqs.length===0){showToast("Primero crea una requisición","error");return;}
  const sel=$("rfq-req-select");
  sel.innerHTML=reqs.map(r=>`<option value="${r.id}">${r.id} — ${r.products.map(p=>p.name).join(", ")}</option>`).join("");
  $("rfq-notes").value="";
  $("rfq-needs-review").checked=false;
  openModal("modal-rfq");
}

window.submitRFQ=function(){
  const reqId=$("rfq-req-select").value;
  const review=$("rfq-needs-review").checked;
  const notes=$("rfq-notes").value;
  const rfq=svc.createRFQ(reqId,review,notes);
  if(!rfq){showToast("Error al crear RFQ","error");return;}
  closeModal("modal-rfq");
  renderRFQs();renderDashboard();
  showToast("RFQ creado correctamente ✔");
};

// COTIZACIONES
function renderCotizaciones(){
  const items=svc.getAllQuotes();
  const tbody=$("tbl-cot");
  if(items.length===0){tbody.innerHTML=`<tr><td colspan="7" class="empty">No hay cotizaciones aún</td></tr>`;return;}
  const sc={[VortexQuoteStatus.SENT]:"badge-blue",[VortexQuoteStatus.APPROVED]:"badge-green",[VortexQuoteStatus.REJECTED]:"badge-red",[VortexQuoteStatus.PENDING]:"badge-yellow"};
  tbody.innerHTML=items.map(q=>{
    const canReview=q.status===VortexQuoteStatus.SENT;
    return `<tr>
      <td><span class="badge badge-blue">${q.id}</span></td>
      <td>${q.rfq.id}</td>
      <td>${q.seller.name}</td>
      <td>$${q.getTotal().toFixed(2)}</td>
      <td><span class="badge ${sc[q.status]||'badge-blue'}">${q.status}</span></td>
      <td>${q.validUntil.toLocaleDateString()}</td>
      <td>${canReview
        ?`<button class="btn-action btn-green" onclick="reviewQuote('${q.id}',true)">Aceptar</button>
           <button class="btn-action btn-red"   onclick="reviewQuote('${q.id}',false)">Rechazar</button>`
        :"—"}</td>
    </tr>`;
  }).join("");
}

window.reviewQuote=function(id,accept){
  svc.reviewQuote(id,accept);
  renderCotizaciones();renderDashboard();
  showToast(accept?"Cotización aceptada ✔":"Cotización rechazada",accept?"success":"error");
};

window.loadCotProducts=function(){
  const rfqId=$("cot-rfq-select").value;
  const rfq=svc.getAllRFQs().find(r=>r.id===rfqId);
  if(!rfq)return;
  $("cot-items-list").innerHTML=rfq.requisition.products.map((p,i)=>`
    <div class="product-row">
      <span class="input-label">${p.name} (x${p.quantity})</span>
      <input type="number" id="cot-price-${i}" class="input" placeholder="Precio ofertado" value="${p.unitPrice}" min="0" step="0.01"/>
      <label class="checkbox-label"><input type="checkbox" id="cot-avail-${i}" checked/> Disponible</label>
    </div>`).join("");
  $("cot-prod-count").textContent=String(rfq.requisition.products.length);
};

function openModalCot(){
  const rfqs=svc.getAllRFQs().filter(r=>!r.needsSupervisorReview||r.isApprovedBySupervisor);
  if(rfqs.length===0){showToast("No hay RFQs disponibles para cotizar","error");return;}
  const sel=$("cot-rfq-select");
  sel.innerHTML=rfqs.map(r=>`<option value="${r.id}">${r.id} — Req:${r.requisition.id}</option>`).join("");
  window.loadCotProducts();
  openModal("modal-cot");
}

window.submitCot=function(){
  const rfqId=$("cot-rfq-select").value;
  const rfq=svc.getAllRFQs().find(r=>r.id===rfqId);
  if(!rfq)return;
  const count=parseInt($("cot-prod-count").textContent||"0");
  const items=rfq.requisition.products.slice(0,count).map((p,i)=>({
    product:p,
    offeredPrice:parseFloat(document.getElementById(`cot-price-${i}`)?.value||"0"),
    available:document.getElementById(`cot-avail-${i}`)?.checked??true
  }));
  const days=parseInt($("cot-days").value)||15;
  const q=svc.createQuote(rfqId,items,days);
  if(!q){showToast("Error al crear cotización","error");return;}
  closeModal("modal-cot");
  renderCotizaciones();renderDashboard();
  showToast("Cotización creada ✔");
};

// PEDIDOS
function renderPedidos(){
  const items=svc.getAllOrders();
  const tbody=$("tbl-ped");
  if(items.length===0){tbody.innerHTML=`<tr><td colspan="7" class="empty">No hay pedidos aún</td></tr>`;return;}
  const sc={[ZephyrOrderStatus.SUBMITTED]:"badge-blue",[ZephyrOrderStatus.ACCEPTED]:"badge-green",[ZephyrOrderStatus.REJECTED]:"badge-red",[ZephyrOrderStatus.FULFILLED]:"badge-purple",[ZephyrOrderStatus.INVOICED]:"badge-yellow",[ZephyrOrderStatus.PAID]:"badge-green",[ZephyrOrderStatus.DELIVERED]:"badge-teal",[ZephyrOrderStatus.DRAFT]:"badge-gray"};
  tbody.innerHTML=items.map(o=>{
    let actions="—";
    if(o.status===ZephyrOrderStatus.SUBMITTED)
      actions=`<button class="btn-action btn-green" onclick="sellerReview('${o.id}',true)">Aceptar</button><button class="btn-action btn-red" onclick="sellerReview('${o.id}',false)">Rechazar</button>`;
    else if(o.status===ZephyrOrderStatus.ACCEPTED)
      actions=`<button class="btn-action btn-purple" onclick="fulfillOrder('${o.id}')">Completar</button>`;
    else if(o.status===ZephyrOrderStatus.INVOICED)
      actions=`<button class="btn-action btn-green" onclick="openPayModal('${o.id}')">Registrar Pago</button>`;
    else if(o.status===ZephyrOrderStatus.PAID)
      actions=`<button class="btn-action btn-blue" onclick="openDelivModal('${o.id}')">Confirmar Entrega</button>`;
    return `<tr>
      <td><span class="badge badge-blue">${o.id}</span></td>
      <td>${o.quote.id}</td>
      <td>$${o.getTotal().toFixed(2)}</td>
      <td><span class="badge ${sc[o.status]||'badge-blue'}">${o.status}</span></td>
      <td>${o.invoiceNumber||"—"}</td>
      <td>${o.deliveryNote||"—"}</td>
      <td>${actions}</td>
    </tr>`;
  }).join("");
}

window.sellerReview=function(id,accept){svc.sellerReviewOrder(id,accept);renderPedidos();renderDashboard();showToast(accept?"Pedido aceptado ✔":"Pedido rechazado",accept?"success":"error");};
window.fulfillOrder=function(id){const inv=svc.fulfillOrderAndInvoice(id,30);if(!inv){showToast("Error","error");return;}renderPedidos();renderFacturas();renderDashboard();showToast(`Pedido completado. Factura: ${inv.id} ✔`);};
window.openPayModal=function(orderId){const inv=svc.getAllInvoices().find(i=>i.order.id===orderId);if(!inv)return;$("pay-inv-id").textContent=inv.id;$("pay-amount").textContent=`$${inv.getAmount().toFixed(2)}`;$("pay-inv-hidden").value=inv.id;openModal("modal-pay");};
window.submitPay=function(){const id=$("pay-inv-hidden").value;svc.registerPayment(id);closeModal("modal-pay");renderPedidos();renderFacturas();renderDashboard();showToast("Pago registrado ✔");};
window.openDelivModal=function(orderId){$("deliv-order-hidden").value=orderId;$("deliv-order-id").textContent=orderId;$("deliv-note").value="";openModal("modal-deliv");};
window.submitDeliv=function(){const id=$("deliv-order-hidden").value;const note=$("deliv-note").value||"Entrega confirmada";svc.confirmDelivery(id,note);closeModal("modal-deliv");renderPedidos();renderDashboard();showToast("Entrega confirmada ✔");};

function openModalPed(){
  const quotes=svc.getQuotesByStatus(VortexQuoteStatus.APPROVED);
  if(quotes.length===0){showToast("No hay cotizaciones aprobadas","error");return;}
  const sel=$("ped-cot-select");
  sel.innerHTML=quotes.map(q=>`<option value="${q.id}">${q.id} — $${q.getTotal().toFixed(2)}</option>`).join("");
  openModal("modal-ped");
}

window.submitPed=function(){const id=$("ped-cot-select").value;const o=svc.createOrder(id);if(!o){showToast("Error al crear pedido","error");return;}closeModal("modal-ped");renderPedidos();renderDashboard();showToast("Pedido creado ✔");};

// FACTURAS
function renderFacturas(){
  const items=svc.getAllInvoices();
  const tbody=$("tbl-fac");
  if(items.length===0){tbody.innerHTML=`<tr><td colspan="6" class="empty">No hay facturas aún</td></tr>`;return;}
  tbody.innerHTML=items.map(i=>`<tr>
    <td><span class="badge badge-blue">${i.id}</span></td>
    <td>${i.order.id}</td>
    <td>${i.seller.name}</td>
    <td>$${i.getAmount().toFixed(2)}</td>
    <td>${i.dueDate.toLocaleDateString()}</td>
    <td>${i.isPaid?`<span class="badge badge-green">PAGADA</span>`:`<span class="badge badge-red">PENDIENTE</span>`}</td>
  </tr>`).join("");
}

// INIT
document.addEventListener("DOMContentLoaded",()=>{
  showSection("dashboard");
  document.querySelectorAll(".nav-btn").forEach(btn=>{
    btn.addEventListener("click",()=>showSection(btn.getAttribute("data-section")));
  });
  document.querySelectorAll(".modal-overlay").forEach(m=>{
    m.addEventListener("click",e=>{if(e.target.classList.contains("modal-overlay"))m.classList.remove("active");});
  });
  document.getElementById("btn-open-req")?.addEventListener("click",openModalReq);
  document.getElementById("btn-open-rfq")?.addEventListener("click",openModalRFQ);
  document.getElementById("btn-open-cot")?.addEventListener("click",openModalCot);
  document.getElementById("btn-open-ped")?.addEventListener("click",openModalPed);
});
