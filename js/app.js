// ------------------------------ SIMULACION DE LOGIN/LOGOUT ------------------------------
let userRole = localStorage.getItem('userRole') || 'visitante';
 // "visitante" | "cliente" | "admin"

// Engancha login si existe en la página (persiste el rol y sincroniza UI)
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const pass  = document.getElementById('loginPass').value;

    // Determina rol
    userRole = (email === 'admin@bocatto.cl' && pass === 'admin123') ? 'admin' : 'cliente';

    // Persiste rol
    localStorage.setItem('userRole', userRole);

    // Mensaje
    if (userRole === 'admin') {
      console.log('DEBUG: userRole seteado como:', userRole);
      alert('Bienvenido ADMIN');
    } else {
      console.log('DEBUG: userRole seteado como:', userRole);
      alert('Bienvenido cliente ' + email);
    }

    // Sincroniza UI
    actualizarNavbar();
    renderCarrito(); // opcional, por si cambia visibilidad del carrito

    // Cierra modal si existe
    const modalEl = document.getElementById('loginModal');
    if (modalEl && window.bootstrap?.Modal) {
      const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      modal.hide();
    }
  });
}


// Logout si existe en la página (persiste rol y sincroniza UI)
const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
  btnLogout.addEventListener('click', () => {
    userRole = 'visitante';
    localStorage.setItem('userRole', userRole); // ✅ persistir estado

    alert('Sesión cerrada');
    actualizarNavbar();
    renderCarrito(); // opcional: por si cambia visibilidad del carrito

    // opcional: si el offcanvas del carrito está abierto, lo cerramos
    const oc = document.getElementById('offcanvasCarrito');
    if (oc && window.bootstrap?.Offcanvas) {
      const off = bootstrap.Offcanvas.getInstance(oc);
      off?.hide();
    }
  });
}

// Registro (opcional)
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    alert("Cuenta creada con éxito 🎉. Ahora puedes iniciar sesión.");
  });
}

// --- Actualiza navbar según el rol actual ---
function actualizarNavbar() {
  const btnLogin   = document.getElementById('btn-login');
  const btnPedidos = document.getElementById('btn-pedidos');
  const btnCarrito = document.getElementById('btn-carrito');
  const btnAdmin   = document.getElementById('btn-admin');
  const btnLogout  = document.getElementById('btn-logout');

  // ocultar todo por defecto, si existen
  [btnLogin, btnPedidos, btnCarrito, btnAdmin, btnLogout].forEach(el => { if (el) el.hidden = true; });

  if (userRole === "visitante") {
    if (btnLogin) btnLogin.hidden = false;
  } else if (userRole === "cliente") {
    if (btnPedidos) btnPedidos.hidden = false;
    if (btnCarrito) btnCarrito.hidden = false;
    if (btnLogout)  btnLogout.hidden  = false;
  } else if (userRole === "admin") {
    if (btnAdmin)  btnAdmin.hidden  = false;
    if (btnLogout) btnLogout.hidden = false;
  }

  // Mostrar/ocultar controles admin en cards
  document.querySelectorAll('.admin-actions').forEach(el => {
    if (userRole === "admin") { el.classList.add("d-flex"); el.hidden = false; }
    else { el.classList.remove("d-flex"); el.hidden = true; }
  });

  // Botón "Agregar producto" (promos)
  const btnAddPromo = document.getElementById('btn-add-promo');
  if (btnAddPromo) btnAddPromo.hidden = (userRole !== "admin");
}
/*
// ================== CARRITO ==================
let carrito = [];

// Agregar al carrito
window.agregarAlCarrito = function(nombre, precio, img) {
  try {
    if (typeof userRole !== 'undefined' && userRole !== 'cliente') {
      alert('Debes iniciar sesión como cliente para agregar productos al carrito.');
      const modalEl = document.getElementById('loginModal');
      if (modalEl && window.bootstrap?.Modal) new bootstrap.Modal(modalEl).show();
      return;
    }
  } catch (_) {}

  const existe = carrito.find(i => i.nombre === nombre);
  if (existe) existe.cantidad++;
  else carrito.push({ nombre, precio: Number(precio)||0, cantidad: 1, img });

  renderCarrito();
};

// Actualizar cantidad
window.actualizarCantidad = function(index, operacion) {
  const i = Number(index);
  if (!Number.isInteger(i) || !carrito[i]) return;
  if (operacion === 'sumar') carrito[i].cantidad++;
  if (operacion === 'restar') {
    carrito[i].cantidad--;
    if (carrito[i].cantidad <= 0) carrito.splice(i, 1);
  }
  renderCarrito();
};

// Eliminar línea
window.eliminarDelCarrito = function(index) {
  const i = Number(index);
  if (Number.isInteger(i) && carrito[i]) carrito.splice(i, 1);
  renderCarrito();
};

// Render del offcanvas
window.renderCarrito = function() {
  const items  = document.getElementById('carrito-items');
  const vacio  = document.getElementById('carrito-vacio');
  const total  = document.getElementById('carrito-total');
  const badge  = document.getElementById('cart-count');  // opcional
  const vaciar = document.getElementById('btn-vaciar');  // opcional

  // Si esta página no tiene offcanvas, no rompemos
  if (!items || !vacio || !total) return;

  items.innerHTML = '';
  const totalItems = carrito.reduce((a,i)=>a+i.cantidad,0);
  const total$     = carrito.reduce((a,i)=>a+i.precio*i.cantidad,0);

  vacio.style.display = carrito.length ? 'none' : 'block';
  total.textContent   = '$' + total$.toLocaleString();

  if (badge) {
    badge.hidden = totalItems === 0;
    if (!badge.hidden) badge.textContent = totalItems;
  }
  if (vaciar) vaciar.disabled = carrito.length === 0;

  carrito.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className = 'd-flex align-items-center border-bottom py-2 gap-2';
    row.innerHTML = `
      <img src="${item.img}" alt="${item.nombre}" class="me-2 rounded" style="width:60px;height:60px;object-fit:cover;">
      <div class="flex-grow-1">
        <h6 class="mb-0 small">${item.nombre}</h6>
        <small class="text-muted">$${item.precio.toLocaleString()}</small>
      </div>
      <div class="d-flex align-items-center">
        <button class="btn btn-sm btn-outline-light btn-restar" data-index="${idx}">-</button>
        <span class="mx-2">${item.cantidad}</span>
        <button class="btn btn-sm btn-outline-light btn-sumar" data-index="${idx}">+</button>
      </div>
      <strong class="text-nowrap">$${(item.precio*item.cantidad).toLocaleString()}</strong>
      <button class="btn btn-sm btn-outline-danger btn-eliminar" data-index="${idx}">&times;</button>
    `;
    items.appendChild(row);
  });
};

// Delegación de eventos (carrito)
document.addEventListener('DOMContentLoaded', () => {
  actualizarNavbar();
  renderCarrito();

  const items = document.getElementById('carrito-items');
  if (items) {
    items.addEventListener('click', e => {
      const index = e.target.dataset.index;
      if (typeof index === 'undefined') return;
      if (e.target.classList.contains('btn-sumar'))    actualizarCantidad(index, 'sumar');
      if (e.target.classList.contains('btn-restar'))   actualizarCantidad(index, 'restar');
      if (e.target.classList.contains('btn-eliminar')) eliminarDelCarrito(index);
    });
  }

  const vaciar = document.getElementById('btn-vaciar');
  if (vaciar) {
    vaciar.addEventListener('click', () => {
      if (confirm('¿Vaciar carrito?')) { carrito = []; renderCarrito(); }
    });
  }

  // Re-render al abrir offcanvas (por si vienes de otra página)
  const oc = document.getElementById('offcanvasCarrito');
  if (oc) oc.addEventListener('show.bs.offcanvas', renderCarrito);
});
*/
// ================== CARRITO ==================

// Clave de persistencia
const CAR_KEY = 'carrito_bocatto';

// Cargar carrito guardado (si existe)
let carrito = [];
try {
  const raw = localStorage.getItem(CAR_KEY);
  carrito = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(carrito)) carrito = [];
} catch (_) {
  carrito = [];
}

// Guardar cambios del carrito
function persistCarrito() {
  try { localStorage.setItem(CAR_KEY, JSON.stringify(carrito)); } catch (_) {}
}

// Formateo simple CLP
const CLP = n => '$' + Number(n || 0).toLocaleString('es-CL');

// Agregar al carrito
window.agregarAlCarrito = function (nombre, precio, img) {
  try {
    if (typeof userRole !== 'undefined' && userRole !== 'cliente') {
      alert('Debes iniciar sesión como cliente para agregar productos al carrito.');
      const modalEl = document.getElementById('loginModal');
      if (modalEl && window.bootstrap?.Modal) new bootstrap.Modal(modalEl).show();
      return;
    }
  } catch (_) {}

  const existe = carrito.find(i => i.nombre === nombre);
  if (existe) {
    existe.cantidad++;
  } else {
    carrito.push({ nombre, precio: Number(precio) || 0, cantidad: 1, img });
  }

  persistCarrito();
  renderCarrito();
};

// Actualizar cantidad (+ / -)
window.actualizarCantidad = function (index, operacion) {
  const i = Number(index);
  if (!Number.isInteger(i) || !carrito[i]) return;

  if (operacion === 'sumar') carrito[i].cantidad++;
  if (operacion === 'restar') {
    carrito[i].cantidad--;
    if (carrito[i].cantidad <= 0) carrito.splice(i, 1);
  }

  persistCarrito();
  renderCarrito();
};

// Eliminar línea
window.eliminarDelCarrito = function (index) {
  const i = Number(index);
  if (Number.isInteger(i) && carrito[i]) carrito.splice(i, 1);
  persistCarrito();
  renderCarrito();
};

// Render del offcanvas (y badge)
window.renderCarrito = function () {
  const items  = document.getElementById('carrito-items');
  const vacio  = document.getElementById('carrito-vacio');
  const total  = document.getElementById('carrito-total');
  const badge  = document.getElementById('cart-count');     // opcional (navbar)
  const vaciar = document.getElementById('btn-vaciar');     // opcional (offcanvas)

  const totalItems = carrito.reduce((a, i) => a + (i.cantidad || 0), 0);
  const total$     = carrito.reduce((a, i) => a + (Number(i.precio) || 0) * (i.cantidad || 0), 0);

  // Actualiza badge y estado del botón "Vaciar" aunque no exista offcanvas
  if (badge) {
    badge.hidden = totalItems === 0;
    if (!badge.hidden) badge.textContent = totalItems;
  }
  if (vaciar) vaciar.disabled = carrito.length === 0;

  // Si esta página no tiene offcanvas, no seguimos (pero badge ya quedó correcto)
  if (!items || !vacio || !total) return;

  items.innerHTML = '';
  vacio.style.display = carrito.length ? 'none' : 'block';
  total.textContent   = CLP(total$);

  carrito.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className = 'd-flex align-items-center border-bottom py-2 gap-2';
    row.innerHTML = `
      <img src="${item.img || 'Recursos_Esteticos/img/default.jpg'}" alt="${item.nombre}" class="me-2 rounded" style="width:60px;height:60px;object-fit:cover;">
      <div class="flex-grow-1">
        <h6 class="mb-0 small">${item.nombre}</h6>
        <small class="text-muted">${CLP(item.precio)}</small>
      </div>
      <div class="d-flex align-items-center">
        <button class="btn btn-sm btn-outline-light btn-restar" data-index="${idx}">-</button>
        <span class="mx-2">${item.cantidad}</span>
        <button class="btn btn-sm btn-outline-light btn-sumar" data-index="${idx}">+</button>
      </div>
      <strong class="text-nowrap">${CLP((item.precio || 0) * (item.cantidad || 0))}</strong>
      <button class="btn btn-sm btn-outline-danger btn-eliminar" data-index="${idx}">&times;</button>
    `;
    items.appendChild(row);
  });
};

// Delegación de eventos (carrito) + “Hacer pedido”
document.addEventListener('DOMContentLoaded', () => {
  // Si existe en esta página, actualiza navbar (compat.)
  try { if (typeof actualizarNavbar === 'function') actualizarNavbar(); } catch (_) {}

  renderCarrito();

  // Delegación de botones dentro del offcanvas
  const items = document.getElementById('carrito-items');
  if (items) {
    items.addEventListener('click', e => {
      const index = e.target.dataset.index;
      if (typeof index === 'undefined') return;
      if (e.target.classList.contains('btn-sumar'))    actualizarCantidad(index, 'sumar');
      if (e.target.classList.contains('btn-restar'))   actualizarCantidad(index, 'restar');
      if (e.target.classList.contains('btn-eliminar')) eliminarDelCarrito(index);
    });
  }

  // Botón "Vaciar carrito"
  const vaciar = document.getElementById('btn-vaciar');
  if (vaciar) {
    vaciar.addEventListener('click', () => {
      if (confirm('¿Vaciar carrito?')) { carrito = []; persistCarrito(); renderCarrito(); }
    });
  }

  // Re-render al abrir offcanvas (por si vienes de otra página)
  const oc = document.getElementById('offcanvasCarrito');
  if (oc) oc.addEventListener('show.bs.offcanvas', renderCarrito);

  // Botón/Enlace "Hacer pedido" (debe tener id="btn-hacer-pedido")
  const btnPedido = document.getElementById('btn-hacer-pedido');
  if (btnPedido) {
    btnPedido.addEventListener('click', (e) => {
      // Rol requerido: cliente
      try {
        if (typeof userRole !== 'undefined' && userRole !== 'cliente') {
          e.preventDefault();
          alert('Debes iniciar sesión como cliente para continuar.');
          const modalEl = document.getElementById('loginModal');
          if (modalEl && window.bootstrap?.Modal) new bootstrap.Modal(modalEl).show();
          return;
        }
      } catch (_) {}

      if (carrito.length === 0) {
        e.preventDefault();
        alert('No hay artículos en tu carrito.');
        return;
      }
      // Ir al checkout
      window.location.href = 'Ges_pagos.html';
    });
  }
});

// ================== ADMIN PRODUCTOS (solo ajuste en botón) ==================
const productForm = document.getElementById('productForm');
if (productForm) {
  productForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const category = document.getElementById('productCategory').value;
    const name = document.getElementById('productName').value;
    const desc = document.getElementById('productDesc').value;
    const price = Number(document.getElementById('productPrice').value);
    const img = document.getElementById('productImg').value || "Recursos_Esteticos/img/default.jpg";
    const editIndex = document.getElementById('editIndex').value;
    const row = document.querySelector(`#${category} .row`);

    if (editIndex === "") {
      const col = document.createElement('div');
      col.classList.add('col');
      col.innerHTML = `
        <div class="card h-100 rounded-4">
          <div class="card-img-top bg-dark rounded-top-4" style="height:180px; background:url('${img}') center/cover;"></div>
          <div class="card-body text-center" style="background-color:#e6b800; border-radius:0 0 1rem 1rem;">
            <h5 class="card-title fw-bold text-dark">${name}</h5>
            <p class="card-text text-dark">${desc}</p>
            <p class="fw-bold text-dark">$${price.toLocaleString()}</p>
            <button class="btn btn-light text-dark fw-bold"
                    onclick="agregarAlCarrito('${name.replace(/'/g,"\\'")}', ${price}, '${img.replace(/'/g,"\\'")}')">
              Agregar al carrito
            </button>
            <div class="mt-2 justify-content-center gap-2 admin-actions" hidden>
              <button class="btn btn-sm btn-outline-light btn-edit" data-category="${category}">Editar</button>
              <button class="btn btn-sm btn-outline-danger btn-delete" data-category="${category}">Eliminar</button>
            </div>
          </div>
        </div>`;
      row.appendChild(col);
    } else {
      const card = row.children[editIndex].querySelector('.card-body');
      card.querySelector('.card-title').innerText = name;
      card.querySelector('.card-text').innerText = desc;
      card.querySelector('.fw-bold.text-dark').innerText = `$${price.toLocaleString()}`;
      row.children[editIndex].querySelector('.card-img-top').style.background = `url('${img}') center/cover`;
    }

    productForm.reset();
    document.getElementById('editIndex').value = "";
    const modalEl = document.getElementById('modalAddProduct');
    if (modalEl && window.bootstrap?.Modal) bootstrap.Modal.getInstance(modalEl)?.hide();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  actualizarNavbar();
  renderCarrito();
  const oc = document.getElementById('offcanvasCarrito');
  if (oc) oc.addEventListener('show.bs.offcanvas', renderCarrito);
});

// Delegación global para todos los botones "Agregar al carrito" basados en data-*
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-add-cart');
  if (!btn) return;

  const name  = btn.dataset.name;
  const price = Number(btn.dataset.price) || 0;
  const img   = btn.dataset.img || "Recursos_Esteticos/img/default.jpg";

  agregarAlCarrito(name, price, img);
});
