import { HeliosCoreService } from "./services/HeliosCoreService";
import { VortexQuoteStatus, ZephyrOrderStatus, ThalionProduct, OrbisQuoteItem } from "./types/NexusTypes";

const svc = new HeliosCoreService();
(window as any).svc = svc;

// ── Utilidades UI ─────────────────────────────────────────────
function $(id: string): HTMLElement { return document.getElementById(id)!; }
function showToast(msg: string, type: "success"|"error"|"info" = "success") {
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  document.getElementById("toast-container")!.appendChild(t);
  setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => { t.classList.remove("show"); setTimeout(()=>t.remove(),400); }, 3000);
}
function openModal(id: string) { document.getElementById(id)!.classList.add("active"); }
function closeModal(id: string) { document.getElementById(id)!.classList.remove("active"); }

// ── Navegación entre secciones ────────────────────────────────
function showSection(name: string) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.getElementById(`sec-${name}`)!.classList.add("active");
  document.querySelector(`[data-section="${name}"]`)!.classList.add("active");
  renderSection(name);
}

function renderSection(name: string) {
  if (name === "dashboard")      renderDashboard();
  if (name === "requisiciones")  renderRequisiciones();
  if (name === "rfqs")           renderRFQs();
  if (name === "cotizaciones")   renderCotizaciones();
  if (name === "pedidos")        renderPedidos();
  if (name === "facturas")       renderFacturas();
}

// ── DASHBOARD ─────────────────────────────────────────────────
function renderDashboard() {
  $("stat-req").textContent   = String(svc.getAllRequisitions().length);
  $("stat-rfq").textContent   = String(svc.getAllRFQs().length);
  $("stat-cot").textContent   = String(svc.getAllQuotes().length);
  $("stat-ped").textContent   = String(svc.getAllOrders().length);
  $("stat-fac").textContent   = String(svc.getAllInvoices().length);
  $("stat-rev").textContent   = `$${svc.getTotalRevenue().toFixed(2)}`;
  $("stat-pend").textContent  = String(svc.getPendingRFQs().length);
  $("stat-unpaid").textContent= String(svc.getUnpaidInvoices().length);
}

// ── REQUISICIONES ─────────────────────────────────────────────
function renderRequisiciones() {
  const items = svc.getAllRequisitions();
  const tbody = $("tbl-req");
  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty">No hay requisiciones aún</td></tr>`; return;
  }
  tbody.innerHTML = items.map(r => `
    <tr>
      <td><span class="badge badge-blue">${r.id}</span></td>
      <td>${r.createdBy.name}</td>
      <td>${r.products.map(p=>p.name).join(", ")}</td>
      <td>${r.getTotalItems()}</td>
      <td>${r.createdAt.toLocaleDateString()}</td>
    </tr>`).join("");
}

function openModalReq() {
  $("req-products-list").innerHTML = productRow(1);
  $("req-prod-count").textContent = "1";
  openModal("modal-req");
}

function productRow(n: number) {
  return `<div class="product-row" id="prow-${n}">
    <input type="text"   placeholder="Nombre del producto" id="pname-${n}" class="input" />
    <input type="number" placeholder="Cantidad"            id="pqty-${n}"  class="input" min="1" value="1"/>
    <input type="number" placeholder="Precio unitario"     id="pprice-${n}" class="input" min="0" step="0.01" value="0"/>
    ${n>1?`<button class="btn-remove" onclick="removeProductRow(${n})">✕</button>`:""}
  </div>`;
}

(window as any).addProductRow = function() {
  const count = parseInt($("req-prod-count").textContent||"1") + 1;
  $("req-prod-count").textContent = String(count);
  $("req-products-list").insertAdjacentHTML("beforeend", productRow(count));
};

(window as any).removeProductRow = function(n: number) {
  document.getElementById(`prow-${n}`)?.remove();
};

(window as any).submitReq = function() {
  const count = parseInt($("req-prod-count").textContent||"1");
  const products: ThalionProduct[] = [];
  for (let i = 1; i <= count; i++) {
    const row = document.getElementById(`prow-${i}`);
    if (!row) continue;
    const name  = (document.getElementById(`pname-${i}`)  as HTMLInputElement)?.value.trim();
    const qty   = parseInt((document.getElementById(`pqty-${i}`)   as HTMLInputElement)?.value||"1");
    const price = parseFloat((document.getElementById(`pprice-${i}`) as HTMLInputElement)?.value||"0");
    if (name) products.push({ id:`P${i}`, name, quantity:qty, unitPrice:price });
  }
  if (products.length === 0) { showToast("Agrega al menos un producto","error"); return; }
  const notes = ($("req-notes") as HTMLInputElement).value;
  svc.createRequisition(products, notes);
  closeModal("modal-req");
  renderRequisiciones();
  renderDashboard();
  showToast("Requisición creada correctamente ✔");
};

// ── RFQs ──────────────────────────────────────────────────────
function renderRFQs() {
  const items = svc.getAllRFQs();
  const tbody = $("tbl-rfq");
  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty">No hay RFQs aún</td></tr>`; return;
  }
  tbody.innerHTML = items.map(r => {
    let badge = `<span class="badge badge-blue">Directo</span>`;
    if (r.needsSupervisorReview) badge = r.isApprovedBySupervisor
      ? `<span class="badge badge-green">Aprobado</span>`
      : `<span class="badge badge-yellow">Pendiente</span>`;
    const canApprove = r.needsSupervisorReview && !r.isApprovedBySupervisor;
    return `<tr>
      <td><span class="badge badge-blue">${r.id}</span></td>
      <td>${r.requisition.id}</td>
      <td>${r.createdBy.name}</td>
      <td>${badge}</td>
      <td>${r.notes||"—"}</td>
      <td>${canApprove
        ? `<button class="btn-action btn-green" onclick="approveRFQ('${r.id}',true)">Aprobar</button>
           <button class="btn-action btn-red"   onclick="approveRFQ('${r.id}',false)">Rechazar</button>`
        : "—"}</td>
    </tr>`;
  }).join("");
}

(window as any).approveRFQ = function(id: string, approve: boolean) {
  svc.supervisorReviewRFQ(id, approve);
  renderRFQs(); renderDashboard();
  showToast(approve ? "RFQ aprobado ✔" : "RFQ rechazado", approve?"success":"error");
};

function openModalRFQ() {
  const reqs = svc.getAllRequisitions();
  if (reqs.length === 0) { showToast("Primero crea una requisición","error"); return; }
  const sel = $("rfq-req-select") as HTMLSelectElement;
  sel.innerHTML = reqs.map(r=>`<option value="${r.id}">${r.id} — ${r.products.map(p=>p.name).join(", ")}</option>`).join("");
  openModal("modal-rfq");
}

(window as any).submitRFQ = function() {
  const reqId   = ($("rfq-req-select") as HTMLSelectElement).value;
  const review  = ($("rfq-needs-review") as HTMLInputElement).checked;
  const notes   = ($("rfq-notes") as HTMLInputElement).value;
  const rfq = svc.createRFQ(reqId, review, notes);
  if (!rfq) { showToast("Error al crear RFQ","error"); return; }
  closeModal("modal-rfq");
  renderRFQs(); renderDashboard();
  showToast("RFQ creado correctamente ✔");
};

// ── COTIZACIONES ──────────────────────────────────────────────
function renderCotizaciones() {
  const items = svc.getAllQuotes();
  const tbody = $("tbl-cot");
  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty">No hay cotizaciones aún</td></tr>`; return;
  }
  tbody.innerHTML = items.map(q => {
    const sc: Record<string,string> = {
      [VortexQuoteStatus.SENT]:"badge-blue",[VortexQuoteStatus.APPROVED]:"badge-green",
      [VortexQuoteStatus.REJECTED]:"badge-red",[VortexQuoteStatus.PENDING]:"badge-yellow"
    };
    const canReview = q.status === VortexQuoteStatus.SENT;
    return `<tr>
      <td><span class="badge badge-blue">${q.id}</span></td>
      <td>${q.rfq.id}</td>
      <td>${q.seller.name}</td>
      <td>$${q.getTotal().toFixed(2)}</td>
      <td><span class="badge ${sc[q.status]||'badge-blue'}">${q.status}</span></td>
      <td>${q.validUntil.toLocaleDateString()}</td>
      <td>${canReview
        ? `<button class="btn-action btn-green" onclick="reviewQuote('${q.id}',true)">Aceptar</button>
           <button class="btn-action btn-red"   onclick="reviewQuote('${q.id}',false)">Rechazar</button>`
        : "—"}</td>
    </tr>`;
  }).join("");
}

(window as any).reviewQuote = function(id: string, accept: boolean) {
  svc.reviewQuote(id, accept);
  renderCotizaciones(); renderDashboard();
  showToast(accept?"Cotización aceptada ✔":"Cotización rechazada", accept?"success":"error");
};

function openModalCot() {
  const rfqs = svc.getAllRFQs().filter(r=>!r.needsSupervisorReview||r.isApprovedBySupervisor);
  if (rfqs.length === 0) { showToast("No hay RFQs disponibles para cotizar","error"); return; }
  const sel = $("cot-rfq-select") as HTMLSelectElement;
  sel.innerHTML = rfqs.map(r=>`<option value="${r.id}">${r.id} — Req:${r.requisition.id}</option>`).join("");
  (window as any).loadCotProducts();
  openModal("modal-cot");
}

(window as any).loadCotProducts = function() {
  const rfqId = ($("cot-rfq-select") as HTMLSelectElement).value;
  const rfq   = svc.getAllRFQs().find(r=>r.id===rfqId);
  if (!rfq) return;
  $("cot-items-list").innerHTML = rfq.requisition.products.map((p,i)=>`
    <div class="product-row">
      <span class="input-label">${p.name} (x${p.quantity})</span>
      <input type="number" id="cot-price-${i}" class="input" placeholder="Precio ofertado" value="${p.unitPrice}" min="0" step="0.01"/>
      <label class="checkbox-label"><input type="checkbox" id="cot-avail-${i}" checked/> Disponible</label>
    </div>`).join("");
  $("cot-prod-count").textContent = String(rfq.requisition.products.length);
};

(window as any).submitCot = function() {
  const rfqId = ($("cot-rfq-select") as HTMLSelectElement).value;
  const rfq   = svc.getAllRFQs().find(r=>r.id===rfqId);
  if (!rfq) return;
  const count = parseInt($("cot-prod-count").textContent||"0");
  const items: OrbisQuoteItem[] = rfq.requisition.products.slice(0,count).map((p,i)=>({
    product: p,
    offeredPrice: parseFloat((document.getElementById(`cot-price-${i}`) as HTMLInputElement)?.value||"0"),
    available: (document.getElementById(`cot-avail-${i}`) as HTMLInputElement)?.checked ?? true
  }));
  const days = parseInt(($("cot-days") as HTMLInputElement).value)||15;
  const q = svc.createQuote(rfqId, items, days);
  if (!q) { showToast("Error al crear cotización","error"); return; }
  closeModal("modal-cot");
  renderCotizaciones(); renderDashboard();
  showToast("Cotización creada ✔");
};

// ── PEDIDOS ───────────────────────────────────────────────────
function renderPedidos() {
  const items = svc.getAllOrders();
  const tbody = $("tbl-ped");
  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty">No hay pedidos aún</td></tr>`; return;
  }
  const sc: Record<string,string> = {
    [ZephyrOrderStatus.SUBMITTED]:"badge-blue",[ZephyrOrderStatus.ACCEPTED]:"badge-green",
    [ZephyrOrderStatus.REJECTED]:"badge-red",[ZephyrOrderStatus.FULFILLED]:"badge-purple",
    [ZephyrOrderStatus.INVOICED]:"badge-yellow",[ZephyrOrderStatus.PAID]:"badge-green",
    [ZephyrOrderStatus.DELIVERED]:"badge-green",[ZephyrOrderStatus.DRAFT]:"badge-gray"
  };
  tbody.innerHTML = items.map(o=>{
    let actions = "—";
    if (o.status===ZephyrOrderStatus.SUBMITTED)
      actions=`<button class="btn-action btn-green" onclick="sellerReview('${o.id}',true)">Aceptar</button>
               <button class="btn-action btn-red"   onclick="sellerReview('${o.id}',false)">Rechazar</button>`;
    else if (o.status===ZephyrOrderStatus.ACCEPTED)
      actions=`<button class="btn-action btn-purple" onclick="fulfillOrder('${o.id}')">Completar</button>`;
    else if (o.status===ZephyrOrderStatus.INVOICED)
      actions=`<button class="btn-action btn-green" onclick="openPayModal('${o.id}')">Registrar Pago</button>`;
    else if (o.status===ZephyrOrderStatus.PAID)
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

(window as any).sellerReview = function(id:string,accept:boolean){
  svc.sellerReviewOrder(id,accept);
  renderPedidos(); renderDashboard();
  showToast(accept?"Pedido aceptado ✔":"Pedido rechazado",accept?"success":"error");
};

(window as any).fulfillOrder = function(id:string){
  const inv = svc.fulfillOrderAndInvoice(id,30);
  if (!inv){ showToast("Error al completar","error"); return; }
  renderPedidos(); renderFacturas(); renderDashboard();
  showToast(`Pedido completado. Factura: ${inv.id} ✔`);
};

(window as any).openPayModal = function(orderId:string){
  const inv = svc.getAllInvoices().find(i=>i.order.id===orderId);
  if(!inv) return;
  $("pay-inv-id").textContent = inv.id;
  $("pay-amount").textContent = `$${inv.getAmount().toFixed(2)}`;
  ($("pay-inv-hidden") as HTMLInputElement).value = inv.id;
  openModal("modal-pay");
};

(window as any).submitPay = function(){
  const id = ($("pay-inv-hidden") as HTMLInputElement).value;
  svc.registerPayment(id);
  closeModal("modal-pay");
  renderPedidos(); renderFacturas(); renderDashboard();
  showToast("Pago registrado ✔");
};

(window as any).openDelivModal = function(orderId:string){
  ($("deliv-order-hidden") as HTMLInputElement).value = orderId;
  $("deliv-order-id").textContent = orderId;
  openModal("modal-deliv");
};

(window as any).submitDeliv = function(){
  const id   = ($("deliv-order-hidden") as HTMLInputElement).value;
  const note = ($("deliv-note") as HTMLInputElement).value || "Entrega confirmada";
  svc.confirmDelivery(id, note);
  closeModal("modal-deliv");
  renderPedidos(); renderDashboard();
  showToast("Entrega confirmada ✔");
};

function openModalPed(){
  const quotes = svc.getQuotesByStatus(VortexQuoteStatus.APPROVED);
  if(quotes.length===0){showToast("No hay cotizaciones aprobadas","error");return;}
  const sel = $("ped-cot-select") as HTMLSelectElement;
  sel.innerHTML = quotes.map(q=>`<option value="${q.id}">${q.id} — $${q.getTotal().toFixed(2)}</option>`).join("");
  openModal("modal-ped");
}

(window as any).submitPed = function(){
  const id = ($("ped-cot-select") as HTMLSelectElement).value;
  const o  = svc.createOrder(id);
  if(!o){showToast("Error al crear pedido","error");return;}
  closeModal("modal-ped");
  renderPedidos(); renderDashboard();
  showToast("Pedido creado ✔");
};

// ── FACTURAS ──────────────────────────────────────────────────
function renderFacturas(){
  const items = svc.getAllInvoices();
  const tbody = $("tbl-fac");
  if(items.length===0){
    tbody.innerHTML=`<tr><td colspan="6" class="empty">No hay facturas aún</td></tr>`;return;
  }
  tbody.innerHTML = items.map(i=>`
    <tr>
      <td><span class="badge badge-blue">${i.id}</span></td>
      <td>${i.order.id}</td>
      <td>${i.seller.name}</td>
      <td>$${i.getAmount().toFixed(2)}</td>
      <td>${i.dueDate.toLocaleDateString()}</td>
      <td>${i.isPaid
        ?`<span class="badge badge-green">PAGADA</span>`
        :`<span class="badge badge-red">PENDIENTE</span>`}</td>
    </tr>`).join("");
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  showSection("dashboard");

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => showSection(btn.getAttribute("data-section")!));
  });

  document.querySelectorAll(".modal-overlay").forEach(m => {
    m.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).classList.contains("modal-overlay"))
        m.classList.remove("active");
    });
  });

  // Botones abrir modales
  document.getElementById("btn-open-req")?.addEventListener("click", openModalReq);
  document.getElementById("btn-open-rfq")?.addEventListener("click", openModalRFQ);
  document.getElementById("btn-open-cot")?.addEventListener("click", openModalCot);
  document.getElementById("btn-open-ped")?.addEventListener("click", openModalPed);
});
