// =================== ESTRUCTURA BASE APP.JS ===================
// Versión: API-Ready (simulación mejorada)

// 1. CONSTANTES GLOBALES Y CONFIGURACIÓN
const CONFIG = {
    API_BASE_URL: '/graphql', // Preparado para futuro
    CAR_KEY: 'carrito_bocatto',
    USER_KEY: 'usuario_bocatto',
    ROLES: {
        VISITANTE: 'visitante',
        CLIENTE: 'cliente', 
        ADMIN: 'admin'
    }
};

// 2. ESTADO GLOBAL DE LA APLICACIÓN
const EstadoApp = {
    // Autenticación
    usuario: {
        id: null,
        email: null,
        rol: CONFIG.ROLES.VISITANTE,
        token: null
    },
    
    // Carrito
    carrito: [],
    
    // Productos (cache local)
    productos: {
        promos: [],
        menu: [],
        bebidas: []
    },
    
    // Estado de UI
    ui: {
        cargando: false,
        modalAbierto: null
    }
};

// 3. REFERENCIAS A ELEMENTOS DEL DOM (todos los IDs que identificamos)
const ElementosDOM = {
    // NAVBAR (13 elementos)
    navbarPrincipal: document.getElementById('navbarPrincipal'),
    logoBocatto: document.getElementById('logoBocatto'),
    btnRespMov: document.getElementById('btn-resp-mov'),
    navbarContent: document.getElementById('navbarContent'),
    btnMenu: document.getElementById('btn-menu'),
    btnPromos: document.getElementById('btn-promos'),
    btnConocenos: document.getElementById('btn-conocenos'),
    btnLogin: document.getElementById('btn-login'),
    btnPedidos: document.getElementById('btn-pedidos'),
    btnCarrito: document.getElementById('btn-carrito'),
    carrCont: document.getElementById('carr-cont'),
    btnAdmin: document.getElementById('btn-admin'),
    btnLogout: document.getElementById('btn-logout'),
    
    // MODAL LOGIN (5 elementos)
    loginModal: document.getElementById('loginModal'),
    registerForm: document.getElementById('registerForm'),
    btnRegistrarse: document.getElementById('btn-registrarse'),
    formLogearse: document.getElementById('form-logearse'),
    loginEmail: document.getElementById('login-Email'),
    loginContraseña: document.getElementById('login-contraseña'),
    
    // SECCIÓN PROMOCIONES (4 elementos)
    promos: document.getElementById('promos'),
    contenedorPromos: document.getElementById('contenedor-promos'),
    btnAgreProd: document.getElementById('btn-agre-prod'),
    btnMostrarModalAgregar: document.getElementById('btn-mostrar-modal-agregar'),
    
    // MODAL PRODUCTOS (12 elementos)
    modalAddProduct: document.getElementById('modalAddProduct'),
    modalProductTitle: document.getElementById('modalProductTitle'),
    productForm: document.getElementById('productForm'),
    productCategory: document.getElementById('productCategory'),
    productId: document.getElementById('productId'),
    productName: document.getElementById('productName'),
    productDesc: document.getElementById('productDesc'),
    productPrice: document.getElementById('productPrice'),
    productImg: document.getElementById('productImg'),
    btnGuardarProducto: document.getElementById('btn-guardar-producto'),
    textoBtnGuardar: document.getElementById('texto-btn-guardar'),
    spinnerGuardar: document.getElementById('spinner-guardar'),
    
    // CARRITO (7 elementos)
    offcanvasCarrito: document.getElementById('offcanvasCarrito'),
    offcanvasCarritoLabel: document.getElementById('offcanvasCarritoLabel'),
    carritoItems: document.getElementById('carrito-items'),
    carritoVacio: document.getElementById('carrito-vacio'),
    carritoTotal: document.getElementById('carrito-total'),
    btnVaciar: document.getElementById('btn-vaciar'),
    btnHacerPedido: document.getElementById('btn-hacer-pedido')
};

// 4. UTILIDADES GLOBALES
const Utilidades = {
    // Formateo de precios CLP
    formatearPrecio: (precio) => {
        return '$' + Number(precio || 0).toLocaleString('es-CL');
    },
    
    // Verificar si elemento existe (JavaScript defensivo)
    elementoExiste: (elemento) => {
        return elemento !== null && elemento !== undefined;
    },
    
    // Mostrar/ocultar elemento
    toggleElemento: (elemento, mostrar) => {
        if (Utilidades.elementoExiste(elemento)) {
            elemento.style.display = mostrar ? 'block' : 'none';
        }
    },
    
    // Cargar desde localStorage
    cargarDesdeStorage: (clave, valorPorDefecto = null) => {
        try {
            const item = localStorage.getItem(clave);
            return item ? JSON.parse(item) : valorPorDefecto;
        } catch (error) {
            console.error(`Error cargando ${clave}:`, error);
            return valorPorDefecto;
        }
    },
    
    // Guardar en localStorage
    guardarEnStorage: (clave, valor) => {
        try {
            localStorage.setItem(clave, JSON.stringify(valor));
            return true;
        } catch (error) {
            console.error(`Error guardando ${clave}:`, error);
            return false;
        }
    }
};

// 5. INICIALIZACIÓN BASE
function inicializarBase() {
    console.log('🚀 Inicializando Bocatto App...');
    
    // Cargar estado persistente
    EstadoApp.carrito = Utilidades.cargarDesdeStorage(CONFIG.CAR_KEY, []);
    EstadoApp.usuario = Utilidades.cargarDesdeStorage(CONFIG.USER_KEY, {
        id: null,
        email: null,
        rol: CONFIG.ROLES.VISITANTE,
        token: null
    });
    
    // Verificar que elementos críticos existan
    if (!Utilidades.elementoExiste(ElementosDOM.navbarPrincipal)) {
        console.warn('⚠️ Navbar no encontrado - ¿Estás en la página correcta?');
    }
    
    console.log('✅ Base inicializada correctamente');
}

// Inicializar inmediatamente
inicializarBase();

// =================== AUTH SERVICE - AUTENTICACIÓN ===================

class AuthService {
    constructor() {
        this.usuariosSimulados = this.inicializarUsuariosSimulados();
    }

    // 1. DATOS SIMULADOS (temporal - será reemplazado por API)
    inicializarUsuariosSimulados() {
        return [
            {
                id: 1,
                email: 'admin@bocatto.cl',
                password: 'admin123', // En realidad debería estar hasheado
                nombre: 'Administrador',
                rol: CONFIG.ROLES.ADMIN
            },
            {
                id: 2,
                email: 'cliente@bocatto.cl', 
                password: 'cliente123',
                nombre: 'Cliente Demo',
                rol: CONFIG.ROLES.CLIENTE
            },
            {
                id: 3,
                email: 'juan@cliente.cl',
                password: '123456',
                nombre: 'Juan Pérez',
                rol: CONFIG.ROLES.CLIENTE
            }
        ];
    }

    // 2. LOGIN (simulado - preparado para API)
    async login(email, password) {
        try {
            EstadoApp.ui.cargando = true;
            this.mostrarLoadingLogin(true);

            // Simular delay de red
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Buscar usuario en "base de datos" simulada
            const usuario = this.usuariosSimulados.find(u => 
                u.email === email.toLowerCase() && u.password === password
            );

            if (!usuario) {
                throw new Error('Credenciales incorrectas');
            }

            // Crear sesión
            const sesionUsuario = {
                id: usuario.id,
                email: usuario.email,
                nombre: usuario.nombre,
                rol: usuario.rol,
                token: this.generarTokenSimulado(usuario.id)
            };

            // Actualizar estado global
            EstadoApp.usuario = sesionUsuario;
            
            // Persistir en localStorage
            Utilidades.guardarEnStorage(CONFIG.USER_KEY, sesionUsuario);

            // Actualizar interfaz
            this.actualizarUIpostLogin();

            console.log(`✅ Login exitoso: ${usuario.nombre} (${usuario.rol})`);
            return { exito: true, usuario: sesionUsuario };

        } catch (error) {
            console.error('❌ Error en login:', error.message);
            this.mostrarErrorLogin(error.message);
            return { exito: false, error: error.message };
        } finally {
            EstadoApp.ui.cargando = false;
            this.mostrarLoadingLogin(false);
        }
    }

    // 3. LOGOUT
    async logout() {
        try {
            const usuarioAnterior = { ...EstadoApp.usuario };
            
            // Limpiar estado
            EstadoApp.usuario = {
                id: null,
                email: null,
                rol: CONFIG.ROLES.VISITANTE,
                token: null
            };

            // Limpiar localStorage
            localStorage.removeItem(CONFIG.USER_KEY);

            // Actualizar interfaz
            this.actualizarUIpostLogout();

            // Cerrar modales/offcanvas abiertos
            this.cerrarModalesAbiertos();

            console.log(`✅ Logout exitoso: ${usuarioAnterior.email}`);
            return { exito: true };

        } catch (error) {
            console.error('❌ Error en logout:', error);
            return { exito: false, error: error.message };
        }
    }

    // 4. VERIFICAR SESIÓN EXISTENTE
    verificarSesionActiva() {
        const usuarioStorage = Utilidades.cargarDesdeStorage(CONFIG.USER_KEY);
        
        if (usuarioStorage && usuarioStorage.token) {
            EstadoApp.usuario = usuarioStorage;
            this.actualizarUIpostLogin();
            console.log(`✅ Sesión recuperada: ${usuarioStorage.email}`);
            return true;
        }
        
        return false;
    }

    // 5. ACTUALIZACIÓN DE INTERFAZ
    actualizarUIpostLogin() {
        // Actualizar navbar según rol
        this.actualizarNavbar();
        
        // Mostrar/ocultar elementos admin en productos
        this.toggleElementosAdmin();
        
        // Cerrar modal de login si está abierto
        this.cerrarModalLogin();
        
        // Actualizar carrito (por si cambia visibilidad)
        if (typeof carritoService !== 'undefined') {
            carritoService.renderCarrito();
        }
    }

    actualizarUIpostLogout() {
        // Actualizar navbar a estado visitante
        this.actualizarNavbar();
        
        // Ocultar elementos admin
        this.toggleElementosAdmin();
        
        // Actualizar carrito
        if (typeof carritoService !== 'undefined') {
            carritoService.renderCarrito();
        }
    }

    actualizarNavbar() {
        const { usuario } = EstadoApp;
        
        // Ocultar todos los botones primero
        this.toggleElementosNavbar(false);

        // Mostrar según rol
        switch (usuario.rol) {
            case CONFIG.ROLES.VISITANTE:
                if (Utilidades.elementoExiste(ElementosDOM.btnLogin)) {
                    ElementosDOM.btnLogin.hidden = false;
                }
                break;

            case CONFIG.ROLES.CLIENTE:
                if (Utilidades.elementoExiste(ElementosDOM.btnPedidos)) {
                    ElementosDOM.btnPedidos.hidden = false;
                }
                if (Utilidades.elementoExiste(ElementosDOM.btnCarrito)) {
                    ElementosDOM.btnCarrito.hidden = false;
                }
                if (Utilidades.elementoExiste(ElementosDOM.btnLogout)) {
                    ElementosDOM.btnLogout.hidden = false;
                }
                break;

            case CONFIG.ROLES.ADMIN:
                if (Utilidades.elementoExiste(ElementosDOM.btnAdmin)) {
                    ElementosDOM.btnAdmin.hidden = false;
                }
                if (Utilidades.elementoExiste(ElementosDOM.btnLogout)) {
                    ElementosDOM.btnLogout.hidden = false;
                }
                break;
        }

        console.log(`🔄 Navbar actualizado para rol: ${usuario.rol}`);
    }

    toggleElementosNavbar(mostrar = false) {
        const elementos = [
            ElementosDOM.btnLogin,
            ElementosDOM.btnPedidos,
            ElementosDOM.btnCarrito,
            ElementosDOM.btnAdmin,
            ElementosDOM.btnLogout
        ];

        elementos.forEach(elemento => {
            if (Utilidades.elementoExiste(elemento)) {
                elemento.hidden = !mostrar;
            }
        });
    }

// En AuthService (app.js)
toggleElementosAdmin() {
    const esAdmin = EstadoApp.usuario.rol === CONFIG.ROLES.ADMIN;
    
    // 1. Buscar TODOS los elementos marcados para admin (botones agregar, botones editar, etc.)
    const elementosAdmin = document.querySelectorAll('[data-visible-role="admin"]');

    // 2. Mostrar u ocultar cada uno
    elementosAdmin.forEach(elemento => {
        // Usamos 'inherit' o una clase vacía para que recupere su display original (block, flex, etc.)
        // O forzamos 'block' si son botones de bloque.
        if (elemento.classList.contains('admin-actions')) {
             elemento.style.display = esAdmin ? 'flex' : 'none'; // Para los botones dentro de las cards
        } else {
             elemento.style.display = esAdmin ? 'block' : 'none'; // Para los botones de "Agregar Producto"
        }
    });

    console.log(`👑 Elementos admin: ${esAdmin ? 'VISIBLES' : 'OCULTOS'} (${elementosAdmin.length} elementos)`);
}

    // 6. MANEJO DE MODALES
    cerrarModalLogin() {
        if (Utilidades.elementoExiste(ElementosDOM.loginModal) && window.bootstrap) {
            const modal = bootstrap.Modal.getInstance(ElementosDOM.loginModal);
            if (modal) {
                modal.hide();
                
                // Limpiar formulario
                if (Utilidades.elementoExiste(ElementosDOM.formLogearse)) {
                    ElementosDOM.formLogearse.reset();
                }
            }
        }
    }

    cerrarModalesAbiertos() {
        // Cerrar offcanvas carrito si está abierto
        if (Utilidades.elementoExiste(ElementosDOM.offcanvasCarrito) && window.bootstrap) {
            const offcanvas = bootstrap.Offcanvas.getInstance(ElementosDOM.offcanvasCarrito);
            if (offcanvas) {
                offcanvas.hide();
            }
        }
    }

    // 7. FEEDBACK VISUAL
    mostrarLoadingLogin(mostrar) {
        // Podríamos implementar spinners en el modal de login
        if (Utilidades.elementoExiste(ElementosDOM.btnLogin)) {
            ElementosDOM.btnLogin.disabled = mostrar;
        }
    }

    mostrarErrorLogin(mensaje) {
        // Podríamos mostrar el error en el modal de login
        alert(`Error de login: ${mensaje}`); // Temporal - mejorar con UI propia
    }

    // 8. UTILIDADES
    generarTokenSimulado(usuarioId) {
        // En realidad sería un JWT del backend
        return `simulated_token_${usuarioId}_${Date.now()}`;
    }

    // 9. GETTERS
    getUsuarioActual() {
        return { ...EstadoApp.usuario };
    }

    estaAutenticado() {
        return EstadoApp.usuario.rol !== CONFIG.ROLES.VISITANTE;
    }

    esAdmin() {
        return EstadoApp.usuario.rol === CONFIG.ROLES.ADMIN;
    }

    esCliente() {
        return EstadoApp.usuario.rol === CONFIG.ROLES.CLIENTE;
    }
}

// Instancia global del servicio
const authService = new AuthService();

// =================== CARRITO SERVICE - CARRITO DE COMPRAS ===================

class CarritoService {
    constructor() {
        this.cargarCarritoInicial();
    }

    // 1. INICIALIZACIÓN
    cargarCarritoInicial() {
        EstadoApp.carrito = Utilidades.cargarDesdeStorage(CONFIG.CAR_KEY, []);
        console.log(`🛒 Carrito cargado: ${EstadoApp.carrito.length} items`);
    }

    persistirCarrito() {
        Utilidades.guardarEnStorage(CONFIG.CAR_KEY, EstadoApp.carrito);
    }

    // 2. AGREGAR PRODUCTOS AL CARRITO
    async agregarAlCarrito(nombre, precio, imagen, productoId = null) {
        try {
            // Verificar autenticación para clientes
            if (!authService.estaAutenticado() || !authService.esCliente()) {
                this.mostrarErrorAutenticacion();
                return { exito: false, error: 'Autenticación requerida' };
            }

            const producto = {
                id: productoId || this.generarIdTemporal(),
                nombre: nombre,
                precio: Number(precio) || 0,
                imagen: imagen || 'Recursos_Esteticos/img/default.jpg',
                cantidad: 1,
                agregadoEn: new Date().toISOString()
            };

            // Verificar si ya existe en el carrito
            const existeIndex = EstadoApp.carrito.findIndex(item => 
                item.nombre === producto.nombre
            );

            if (existeIndex !== -1) {
                // Incrementar cantidad si ya existe
                EstadoApp.carrito[existeIndex].cantidad++;
                console.log(`➕ Cantidad aumentada: ${producto.nombre}`);
            } else {
                // Agregar nuevo producto
                EstadoApp.carrito.push(producto);
                console.log(`🛒 Producto agregado: ${producto.nombre}`);
            }

            // Persistir y actualizar UI
            this.persistirCarrito();
            this.renderCarrito();
            this.mostrarFeedbackAgregado(producto.nombre);

            return { exito: true, producto: producto };

        } catch (error) {
            console.error('❌ Error agregando al carrito:', error);
            return { exito: false, error: error.message };
        }
    }

    // 3. ACTUALIZAR CANTIDADES
    async actualizarCantidad(productoId, operacion) {
        try {
            const itemIndex = EstadoApp.carrito.findIndex(item => item.id === productoId);
            
            if (itemIndex === -1) {
                throw new Error('Producto no encontrado en carrito');
            }

            const item = EstadoApp.carrito[itemIndex];

            switch (operacion) {
                case 'incrementar':
                    item.cantidad++;
                    console.log(`➕ Incrementado: ${item.nombre} (${item.cantidad})`);
                    break;

                case 'decrementar':
                    item.cantidad--;
                    if (item.cantidad <= 0) {
                        EstadoApp.carrito.splice(itemIndex, 1);
                        console.log(`🗑️ Eliminado: ${item.nombre}`);
                    } else {
                        console.log(`➖ Decrementado: ${item.nombre} (${item.cantidad})`);
                    }
                    break;

                default:
                    throw new Error('Operación no válida');
            }

            this.persistirCarrito();
            this.renderCarrito();

            return { exito: true };

        } catch (error) {
            console.error('❌ Error actualizando cantidad:', error);
            return { exito: false, error: error.message };
        }
    }

    // 4. ELIMINAR PRODUCTO DEL CARRITO
    async eliminarDelCarrito(productoId) {
        try {
            const itemIndex = EstadoApp.carrito.findIndex(item => item.id === productoId);
            
            if (itemIndex === -1) {
                throw new Error('Producto no encontrado en carrito');
            }

            const productoEliminado = EstadoApp.carrito[itemIndex];
            EstadoApp.carrito.splice(itemIndex, 1);

            this.persistirCarrito();
            this.renderCarrito();

            console.log(`🗑️ Producto eliminado: ${productoEliminado.nombre}`);
            return { exito: true, producto: productoEliminado };

        } catch (error) {
            console.error('❌ Error eliminando del carrito:', error);
            return { exito: false, error: error.message };
        }
    }

    // 5. VACIAR CARRITO
    async vaciarCarrito() {
        try {
            const cantidadItems = EstadoApp.carrito.length;
            EstadoApp.carrito = [];

            this.persistirCarrito();
            this.renderCarrito();

            console.log(`🧹 Carrito vaciado: ${cantidadItems} items eliminados`);
            return { exito: true, itemsEliminados: cantidadItems };

        } catch (error) {
            console.error('❌ Error vaciando carrito:', error);
            return { exito: false, error: error.message };
        }
    }

    // 6. RENDERIZADO DEL CARRITO
    renderCarrito() {
        this.actualizarBadgeCarrito();
        
        // Si no existe el offcanvas del carrito en esta página, salir
        if (!Utilidades.elementoExiste(ElementosDOM.carritoItems)) {
            return;
        }

        this.renderOffcanvasCarrito();
    }

    actualizarBadgeCarrito() {
        if (!Utilidades.elementoExiste(ElementosDOM.carrCont)) {
            return;
        }

        const totalItems = this.obtenerTotalItems();
        
        if (totalItems === 0) {
            ElementosDOM.carrCont.hidden = true;
        } else {
            ElementosDOM.carrCont.hidden = false;
            ElementosDOM.carrCont.textContent = totalItems;
        }

        // Actualizar visibilidad del botón carrito según autenticación
        if (Utilidades.elementoExiste(ElementosDOM.btnCarrito)) {
            ElementosDOM.btnCarrito.hidden = !authService.esCliente();
        }
    }

    renderOffcanvasCarrito() {
        const { carritoItems, carritoVacio, carritoTotal, btnVaciar } = ElementosDOM;
        const total = this.obtenerTotalPrecio();

        // Limpiar contenedor
        carritoItems.innerHTML = '';

        // Mostrar mensaje de carrito vacío o items
        if (EstadoApp.carrito.length === 0) {
            carritoVacio.style.display = 'block';
            if (btnVaciar) btnVaciar.disabled = true;
        } else {
            carritoVacio.style.display = 'none';
            if (btnVaciar) btnVaciar.disabled = false;
            
            // Renderizar cada item del carrito
            EstadoApp.carrito.forEach((item, index) => {
                const itemElement = this.crearElementoItemCarrito(item, index);
                carritoItems.appendChild(itemElement);
            });
        }

        // Actualizar total
        carritoTotal.textContent = Utilidades.formatearPrecio(total);
    }

    crearElementoItemCarrito(item, index) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'd-flex align-items-center border-bottom py-2 gap-2';
        itemDiv.innerHTML = `
            <img src="${item.imagen}" alt="${item.nombre}" 
                 class="me-2 rounded" style="width:60px;height:60px;object-fit:cover;">
            <div class="flex-grow-1">
                <h6 class="mb-0 small">${item.nombre}</h6>
                <small class="text-muted">${Utilidades.formatearPrecio(item.precio)} c/u</small>
            </div>
            <div class="d-flex align-items-center">
                <button class="btn btn-sm btn-outline-light btn-restar" 
                        data-producto-id="${item.id}">-</button>
                <span class="mx-2">${item.cantidad}</span>
                <button class="btn btn-sm btn-outline-light btn-sumar" 
                        data-producto-id="${item.id}">+</button>
            </div>
            <strong class="text-nowrap">${Utilidades.formatearPrecio(item.precio * item.cantidad)}</strong>
            <button class="btn btn-sm btn-outline-danger btn-eliminar" 
                    data-producto-id="${item.id}">&times;</button>
        `;
        return itemDiv;
    }

    // 7. CÁLCULOS
    obtenerTotalItems() {
        return EstadoApp.carrito.reduce((total, item) => total + (item.cantidad || 0), 0);
    }

    obtenerTotalPrecio() {
        return EstadoApp.carrito.reduce((total, item) => {
            return total + (Number(item.precio) || 0) * (item.cantidad || 0);
        }, 0);
    }

    obtenerResumenCarrito() {
        return {
            totalItems: this.obtenerTotalItems(),
            totalPrecio: this.obtenerTotalPrecio(),
            items: [...EstadoApp.carrito]
        };
    }

    // 8. MANEJO DE PEDIDOS
   // En CarritoService (dentro de app.js)

    async procesarPedido() {
        try {
            // 1. Verificar autenticación (El "Guardia" del que hablamos)
            if (!authService.estaAutenticado() || !authService.esCliente()) {
                this.mostrarErrorAutenticacion();
                return { exito: false, error: 'Autenticación requerida' };
            }

            // 2. Verificar que el carrito no esté vacío
            if (this.estaVacio()) {
                alert('Tu carrito está vacío. ¡Agrega algo rico primero!');
                return { exito: false, error: 'Carrito vacío' };
            }

            // 3. ¡REDIRECCIÓN AL CHECKOUT!
            // Aquí es donde ocurre la magia del link
            console.log('🛒 Redirigiendo al checkout...');
            window.location.href = 'Ges_pagos.html';
            
            return { exito: true };

        } catch (error) {
            console.error('❌ Error procesando pedido:', error);
            return { exito: false, error: error.message };
        }
    }

    // 9. FEEDBACK VISUAL
    mostrarFeedbackAgregado(nombreProducto) {
        // Podríamos implementar un toast o notificación
        console.log(`✅ ${nombreProducto} agregado al carrito`);
        
        // Feedback visual temporal
        if (Utilidades.elementoExiste(ElementosDOM.btnCarrito)) {
            ElementosDOM.btnCarrito.classList.add('btn-success');
            setTimeout(() => {
                ElementosDOM.btnCarrito.classList.remove('btn-success');
            }, 500);
        }
    }

    mostrarErrorAutenticacion() {
        alert('Debes iniciar sesión como cliente para agregar productos al carrito');
        
        // Abrir modal de login si existe
        if (Utilidades.elementoExiste(ElementosDOM.loginModal) && window.bootstrap) {
            const modal = new bootstrap.Modal(ElementosDOM.loginModal);
            modal.show();
        }
    }

    // 10. UTILIDADES
    generarIdTemporal() {
        return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 11. GETTERS
    estaVacio() {
        return EstadoApp.carrito.length === 0;
    }

    obtenerCantidadProductos() {
        return EstadoApp.carrito.length;
    }
}

// Instancia global del servicio
const carritoService = new CarritoService();

// Funciones globales para compatibilidad con HTML existente
window.agregarAlCarrito = function(nombre, precio, imagen) {
    return carritoService.agregarAlCarrito(nombre, precio, imagen);
};

window.actualizarCantidad = function(productoId, operacion) {
    return carritoService.actualizarCantidad(productoId, operacion);
};

window.eliminarDelCarrito = function(productoId) {
    return carritoService.eliminarDelCarrito(productoId);
};

window.renderCarrito = function() {
    return carritoService.renderCarrito();
};

// =================== PRODUCT SERVICE - GESTIÓN DE PRODUCTOS ===================

class ProductService {
    constructor() {
        this.productosSimulados = this.inicializarProductosSimulados();
        this.cargarProductosIniciales();
    }

    // 1. DATOS SIMULADOS (temporal - será reemplazado por API)
    inicializarProductosSimulados() {
        return [
            {
                id: 1,
                nombre: "Pizza Pepperoni",
                descripcion: "Deliciosa pizza con pepperoni y queso mozzarella",
                precio: 7990,
                imagen: "Recursos_Esteticos/img/hero1.jpg",
                categoria: "promos",
                activo: true,
                stock: 50,
                creadoEn: new Date().toISOString()
            },
            {
                id: 2,
                nombre: "Panini Caprese",
                descripcion: "Mozzarella, tomate, pesto y albahaca fresca",
                precio: 5990,
                imagen: "Recursos_Esteticos/img/hero2.jpg", 
                categoria: "promos",
                activo: true,
                stock: 30,
                creadoEn: new Date().toISOString()
            },
            {
                id: 3,
                nombre: "Combo Baguette + Bebida",
                descripcion: "Para llevar y compartir con amigos",
                precio: 8990,
                imagen: "Recursos_Esteticos/img/hero3.jpg",
                categoria: "promos",
                activo: true,
                stock: 20,
                creadoEn: new Date().toISOString()
            }
        ];
    }

    cargarProductosIniciales() {
        // Agrupar productos por categoría
        EstadoApp.productos = {
            promos: this.productosSimulados.filter(p => p.categoria === 'promos'),
            menu: this.productosSimulados.filter(p => p.categoria === 'menu'),
            bebidas: this.productosSimulados.filter(p => p.categoria === 'bebidas')
        };
        console.log('📦 Productos simulados cargados');
    }

    // 2. OBTENER PRODUCTOS
    async obtenerProductos(categoria = null) {
        try {
            // Simular delay de red
            await new Promise(resolve => setTimeout(resolve, 500));

            if (categoria && EstadoApp.productos[categoria]) {
                return EstadoApp.productos[categoria].filter(p => p.activo);
            } else if (categoria) {
                return [];
            }

            // Todos los productos activos
            const todosProductos = [
                ...EstadoApp.productos.promos,
                ...EstadoApp.productos.menu,
                ...EstadoApp.productos.bebidas
            ].filter(p => p.activo);

            return todosProductos;

        } catch (error) {
            console.error('❌ Error obteniendo productos:', error);
            return [];
        }
    }

    async obtenerProductoPorId(id) {
        try {
            const todosProductos = await this.obtenerProductos();
            return todosProductos.find(p => p.id === parseInt(id)) || null;
        } catch (error) {
            console.error('❌ Error obteniendo producto por ID:', error);
            return null;
        }
    }

    // 3. CREAR PRODUCTO
    async crearProducto(datosProducto) {
        try {
            // Verificar permisos de admin
            if (!authService.esAdmin()) {
                throw new Error('Se requieren permisos de administrador');
            }

            // Validar datos requeridos
            if (!datosProducto.nombre || !datosProducto.precio || !datosProducto.categoria) {
                throw new Error('Nombre, precio y categoría son requeridos');
            }

            // Generar nuevo ID
            const nuevoId = this.generarNuevoId();

            const producto = {
                id: nuevoId,
                nombre: datosProducto.nombre.trim(),
                descripcion: datosProducto.descripcion?.trim() || '',
                precio: Number(datosProducto.precio),
                imagen: datosProducto.imagen?.trim() || 'Recursos_Esteticos/img/default.jpg',
                categoria: datosProducto.categoria,
                activo: true,
                stock: datosProducto.stock || 0,
                creadoEn: new Date().toISOString(),
                actualizadoEn: new Date().toISOString()
            };

            // Agregar a la categoría correspondiente
            if (!EstadoApp.productos[producto.categoria]) {
                EstadoApp.productos[producto.categoria] = [];
            }
            EstadoApp.productos[producto.categoria].push(producto);

            // Actualizar interfaz
            await this.renderProductosCategoria(producto.categoria);

            console.log(`✅ Producto creado: ${producto.nombre} (ID: ${producto.id})`);
            return { exito: true, producto: producto };

        } catch (error) {
            console.error('❌ Error creando producto:', error);
            return { exito: false, error: error.message };
        }
    }

    // 4. ACTUALIZAR PRODUCTO
    async actualizarProducto(id, datosActualizados) {
        try {
            // Verificar permisos de admin
            if (!authService.esAdmin()) {
                throw new Error('Se requieren permisos de administrador');
            }

            // Buscar producto en todas las categorías
            let productoEncontrado = null;
            let categoriaProducto = null;

            for (const [categoria, productos] of Object.entries(EstadoApp.productos)) {
                const index = productos.findIndex(p => p.id === parseInt(id));
                if (index !== -1) {
                    productoEncontrado = productos[index];
                    categoriaProducto = categoria;
                    break;
                }
            }

            if (!productoEncontrado) {
                throw new Error('Producto no encontrado');
            }

            // Actualizar campos
            const productoActualizado = {
                ...productoEncontrado,
                ...datosActualizados,
                actualizadoEn: new Date().toISOString()
            };

            // Reemplazar en el array
            const categoriaArray = EstadoApp.productos[categoriaProducto];
            const index = categoriaArray.findIndex(p => p.id === parseInt(id));
            categoriaArray[index] = productoActualizado;

            // Si cambió la categoría, mover el producto
            if (datosActualizados.categoria && datosActualizados.categoria !== categoriaProducto) {
                // Remover de categoría anterior
                EstadoApp.productos[categoriaProducto] = categoriaArray.filter(p => p.id !== parseInt(id));
                
                // Agregar a nueva categoría
                if (!EstadoApp.productos[datosActualizados.categoria]) {
                    EstadoApp.productos[datosActualizados.categoria] = [];
                }
                EstadoApp.productos[datosActualizados.categoria].push(productoActualizado);
                
                // Renderizar ambas categorías
                await this.renderProductosCategoria(categoriaProducto);
                await this.renderProductosCategoria(datosActualizados.categoria);
            } else {
                // Solo renderizar la categoría actual
                await this.renderProductosCategoria(categoriaProducto);
            }

            console.log(`✏️ Producto actualizado: ${productoActualizado.nombre}`);
            return { exito: true, producto: productoActualizado };

        } catch (error) {
            console.error('❌ Error actualizando producto:', error);
            return { exito: false, error: error.message };
        }
    }

    // 5. ELIMINAR PRODUCTO
    async eliminarProducto(id) {
        try {
            // Verificar permisos de admin
            if (!authService.esAdmin()) {
                throw new Error('Se requieren permisos de administrador');
            }

            // Buscar producto en todas las categorías
            let productoEliminado = null;
            let categoriaProducto = null;

            for (const [categoria, productos] of Object.entries(EstadoApp.productos)) {
                const index = productos.findIndex(p => p.id === parseInt(id));
                if (index !== -1) {
                    productoEliminado = productos[index];
                    categoriaProducto = categoria;
                    EstadoApp.productos[categoria] = productos.filter(p => p.id !== parseInt(id));
                    break;
                }
            }

            if (!productoEliminado) {
                throw new Error('Producto no encontrado');
            }

            // Actualizar interfaz
            await this.renderProductosCategoria(categoriaProducto);

            console.log(`🗑️ Producto eliminado: ${productoEliminado.nombre}`);
            return { exito: true, producto: productoEliminado };

        } catch (error) {
            console.error('❌ Error eliminando producto:', error);
            return { exito: false, error: error.message };
        }
    }

    // 6. RENDERIZADO DE PRODUCTOS
    async renderProductosCategoria(categoria) {
        const contenedorId = `contenedor-${categoria}`;
        const contenedor = document.getElementById(contenedorId);
        
        if (!contenedor) {
            console.log(`⚠️ Contenedor no encontrado para categoría: ${categoria}`);
            return;
        }

        try {
            const productos = await this.obtenerProductos(categoria);
            contenedor.innerHTML = '';

            if (productos.length === 0) {
                contenedor.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <p class="text-muted">No hay productos en esta categoría</p>
                    </div>
                `;
                return;
            }

            productos.forEach(producto => {
                const cardHTML = this.crearCardProducto(producto);
                contenedor.innerHTML += cardHTML;
            });

            console.log(`🔄 Renderizados ${productos.length} productos en ${categoria}`);

        } catch (error) {
            console.error(`❌ Error renderizando productos de ${categoria}:`, error);
            contenedor.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-danger">Error cargando productos</p>
                </div>
            `;
        }
    }

    crearCardProducto(producto) {
        return `
            <div class="col" data-producto-id="${producto.id}" data-categoria="${producto.categoria}">
                <div class="card h-100 rounded-4">
                    <div class="card-img-top bg-dark rounded-top-4" 
                         style="height:180px; background:url('${producto.imagen}') center/cover;">
                    </div>
                    <div class="card-body text-center" style="background-color:#e6b800; border-radius:0 0 1rem 1rem;">
                        <h5 class="card-title fw-bold text-dark">${producto.nombre}</h5>
                        <p class="card-text text-dark">${producto.descripcion}</p>
                        <p class="fw-bold text-dark">${Utilidades.formatearPrecio(producto.precio)}</p>
                        
                        <button class="btn btn-light text-dark fw-bold btn-agregar-carrito"
                                data-producto-id="${producto.id}"
                                data-nombre="${producto.nombre}"
                                data-precio="${producto.precio}"
                                data-imagen="${producto.imagen}">
                            Agregar al carrito
                        </button>

                        <div class="admin-actions mt-2 justify-content-center gap-2" 
                             data-visible-role="admin" 
                             style="display: ${authService.esAdmin() ? 'flex' : 'none'};">
                            <button class="btn btn-sm btn-outline-light btn-editar-producto"
                                    data-producto-id="${producto.id}">
                                Editar
                            </button>
                            <button class="btn btn-sm btn-outline-danger btn-eliminar-producto"
                                    data-producto-id="${producto.id}">
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 7. MANEJO DEL MODAL DE PRODUCTOS
    abrirModalAgregarProducto(categoria) {
        if (!Utilidades.elementoExiste(ElementosDOM.modalAddProduct)) return;

        // Configurar modal para agregar
        ElementosDOM.modalProductTitle.textContent = 'Agregar producto';
        ElementosDOM.productCategory.value = categoria;
        ElementosDOM.productId.value = '';
        ElementosDOM.productForm.reset();

        // Mostrar modal
        const modal = new bootstrap.Modal(ElementosDOM.modalAddProduct);
        modal.show();
    }

    abrirModalEditarProducto(productoId) {
        if (!Utilidades.elementoExiste(ElementosDOM.modalAddProduct)) return;

        this.obtenerProductoPorId(productoId).then(producto => {
            if (!producto) {
                alert('Producto no encontrado');
                return;
            }

            // Configurar modal para editar
            ElementosDOM.modalProductTitle.textContent = 'Editar producto';
            ElementosDOM.productId.value = producto.id;
            ElementosDOM.productCategory.value = producto.categoria;
            ElementosDOM.productName.value = producto.nombre;
            ElementosDOM.productDesc.value = producto.descripcion;
            ElementosDOM.productPrice.value = producto.precio;
            ElementosDOM.productImg.value = producto.imagen;

            // Mostrar modal
            const modal = new bootstrap.Modal(ElementosDOM.modalAddProduct);
            modal.show();
        });
    }

    async manejarSubmitProducto(event) {
        event.preventDefault();

        const btnGuardar = ElementosDOM.btnGuardarProducto;
        const textoBtn = ElementosDOM.textoBtnGuardar;
        const spinner = ElementosDOM.spinnerGuardar;

        try {
            // Mostrar loading
            textoBtn.style.display = 'none';
            spinner.style.display = 'inline-block';
            btnGuardar.disabled = true;

            const datos = {
                nombre: ElementosDOM.productName.value,
                descripcion: ElementosDOM.productDesc.value,
                precio: Number(ElementosDOM.productPrice.value),
                imagen: ElementosDOM.productImg.value,
                categoria: ElementosDOM.productCategory.value
            };

            const productoId = ElementosDOM.productId.value;
            let resultado;

            if (productoId) {
                // Editar producto existente
                resultado = await this.actualizarProducto(productoId, datos);
            } else {
                // Crear nuevo producto
                resultado = await this.crearProducto(datos);
            }
            if (resultado.exito) {
                // Intentar cerrar el modal usando la instancia existente
                const modalElement = ElementosDOM.modalAddProduct;
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) {
                    modalInstance.hide();
                }

                // Eliminamos manualmente la capa negra después de medio segundo
                setTimeout(() => {
                    const backdrops = document.querySelectorAll('.modal-backdrop');
                    backdrops.forEach(el => el.remove());
                    document.body.classList.remove('modal-open');
                    document.body.style = '';
                }, 500);

                // Le decimos a la app que vuelva a pintar la categoría donde agregamos el producto
                await this.renderProductosCategoria(datos.categoria);

                // 4. Mensaje de éxito
                alert(`✅ Producto ${productoId ? 'actualizado' : 'creado'} correctamente`);
            } else {
                throw new Error(resultado.error);
            }

        } catch (error) {
            console.error('❌ Error guardando producto:', error);
            alert(`Error: ${error.message}`);
        } finally {
            // Restaurar botón
            textoBtn.textContent = 'Guardar';
            textoBtn.style.display = 'inline-block';
            spinner.style.display = 'none';
            btnGuardar.disabled = false;
        }
    }

    // 8. UTILIDADES
    generarNuevoId() {
        const todosProductos = [
            ...EstadoApp.productos.promos,
            ...EstadoApp.productos.menu,
            ...EstadoApp.productos.bebidas
        ];
        const maxId = todosProductos.reduce((max, p) => Math.max(max, p.id), 0);
        return maxId + 1;
    }

    // 9. GETTERS
    obtenerCategorias() {
        return Object.keys(EstadoApp.productos);
    }

    obtenerEstadisticas() {
        const todosProductos = [
            ...EstadoApp.productos.promos,
            ...EstadoApp.productos.menu, 
            ...EstadoApp.productos.bebidas
        ];

        return {
            totalProductos: todosProductos.length,
            productosActivos: todosProductos.filter(p => p.activo).length,
            porCategoria: {
                promos: EstadoApp.productos.promos.length,
                menu: EstadoApp.productos.menu.length,
                bebidas: EstadoApp.productos.bebidas.length
            }
        };
    }
}

// Instancia global del servicio
const productService = new ProductService();

// =================== CHECKOUT SERVICE - GESTIÓN DE PAGOS ===================

class CheckoutService {
    constructor() {
        // Solo inicializar si estamos en la página de pagos
        if (document.getElementById('lista-resumen-checkout')) {
            this.inicializarCheckout();
        }
    }

    inicializarCheckout() {
        console.log('💳 Inicializando Checkout...');
        this.renderizarResumen();
        this.registrarEventos();
    }

    registrarEventos() {
        // 1. Lógica de Tipo de Entrega (Radio Buttons)
        const radiosEntrega = document.querySelectorAll('input[name="tipoEntrega"]');
        radiosEntrega.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const esDelivery = e.target.value === 'delivery';
                
                // Mostrar/Ocultar secciones
                Utilidades.toggleElemento(document.getElementById('seccion-direccion-delivery'), esDelivery);
                Utilidades.toggleElemento(document.getElementById('seccion-info-retiro'), !esDelivery);
                
                // Actualizar texto de envío en el resumen
                const textoEnvio = document.getElementById('checkout-envio');
                if (textoEnvio) textoEnvio.textContent = esDelivery ? 'Gratis' : 'N/A';
            });
        });

        // 2. Lógica de Método de Pago (Radio Buttons)
        const radiosPago = document.querySelectorAll('input[name="metodoPago"]');
        radiosPago.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const esTarjeta = e.target.value === 'tarjeta';
                
                // Mostrar/Ocultar secciones
                Utilidades.toggleElemento(document.getElementById('seccion-tarjeta'), esTarjeta);
                Utilidades.toggleElemento(document.getElementById('seccion-info-contraentrega'), !esTarjeta);
            });
        });

        // 3. Botón Confirmar Compra
        const btnConfirmar = document.getElementById('btn-confirmar-compra');
        if (btnConfirmar) {
            btnConfirmar.addEventListener('click', (e) => {
                e.preventDefault();
                alert('🚧 ¡Aquí conectaremos la API de Pagos en la próxima etapa!');
                // Aquí llamaremos a pagoService.procesarPago(...)
            });
        }
    }

    renderizarResumen() {
        const contenedor = document.getElementById('lista-resumen-checkout');
        if (!contenedor) return;

        contenedor.innerHTML = '';
        const carrito = EstadoApp.carrito;

        if (carrito.length === 0) {
            contenedor.innerHTML = '<div class="text-center text-muted">El carrito está vacío</div>';
            return;
        }

        let subtotal = 0;

        // Generar HTML de cada item
        carrito.forEach(item => {
            const totalItem = item.precio * item.cantidad;
            subtotal += totalItem;

            const div = document.createElement('div');
            div.className = 'd-flex justify-content-between align-items-center mb-2 small';
            div.innerHTML = `
                <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-secondary">${item.cantidad}</span>
                    <span>${item.nombre}</span>
                </div>
                <span class="fw-semibold">${Utilidades.formatearPrecio(totalItem)}</span>
            `;
            contenedor.appendChild(div);
        });

        // Actualizar Totales
        const elSubtotal = document.getElementById('checkout-subtotal');
        const elTotal = document.getElementById('checkout-total');
        
        if (elSubtotal) elSubtotal.textContent = Utilidades.formatearPrecio(subtotal);
        if (elTotal) elTotal.textContent = Utilidades.formatearPrecio(subtotal);
    }
}

// Instancia global
const checkoutService = new CheckoutService();


// =================== ORDER SERVICE - GESTIÓN DE PEDIDOS/BOLETAS ===================

class OrderService {
    constructor() {
        // Solo inicializar si estamos en la página de historial
        if (document.getElementById('lista-pedidos')) {
            this.inicializarHistorial();
        }
    }

    inicializarHistorial() {
        console.log('📜 Inicializando Historial de Pedidos...');
        this.cargarPedidosMock(); // Cargar datos falsos si no hay
        this.renderizarPedidos();
        this.registrarFiltros();
    }

    // Simular base de datos local
    cargarPedidosMock() {
        const KEY = 'pedidos_bocatto';
        let pedidos = Utilidades.cargarDesdeStorage(KEY, []);

        if (pedidos.length === 0) {
            console.log('🌱 Sembrando pedidos de prueba...');
            // Crear 3 pedidos de ejemplo
            pedidos = [
                {
                    id: '1001', boleta: 'B-9921', fecha: new Date().toISOString(), estado: 'en_preparacion',
                    total: 15980, items: [{ nombre: 'Pizza Pepperoni', cant: 2, precio: 7990 }]
                },
                {
                    id: '1002', boleta: 'B-8842', fecha: new Date(Date.now() - 86400000).toISOString(), estado: 'entregado',
                    total: 5990, items: [{ nombre: 'Panini Caprese', cant: 1, precio: 5990 }]
                },
                {
                    id: '1003', boleta: 'B-7731', fecha: new Date(Date.now() - 172800000).toISOString(), estado: 'entregado',
                    total: 12980, items: [{ nombre: 'Sanguche de Potito', cant: 1, precio: 6990 }, { nombre: 'Bebida', cant: 2, precio: 2995 }]
                }
            ];
            Utilidades.guardarEnStorage(KEY, pedidos);
        }
        this.pedidos = pedidos;
    }

    renderizarPedidos(filtro = 'todos', busqueda = '') {
        const contenedor = document.getElementById('lista-pedidos');
        if (!contenedor) return;

        contenedor.innerHTML = '';

        // Filtrar
        const filtrados = this.pedidos.filter(p => {
            const pasaFiltro = filtro === 'todos' || p.estado === filtro;
            const pasaBusqueda = !busqueda || JSON.stringify(p).toLowerCase().includes(busqueda.toLowerCase());
            return pasaFiltro && pasaBusqueda;
        });

        if (filtrados.length === 0) {
            contenedor.innerHTML = '<div class="text-center text-muted py-5">No se encontraron pedidos.</div>';
            return;
        }

        // Renderizar Cards
        filtrados.forEach(p => {
            const fechaFmt = new Date(p.fecha).toLocaleDateString('es-CL');
            
            // Configurar badge de estado
            let badgeClass = 'bg-secondary';
            let estadoTexto = p.estado;
            if (p.estado === 'en_preparacion') { badgeClass = 'bg-warning text-dark'; estadoTexto = 'En Cocina'; }
            if (p.estado === 'entregado') { badgeClass = 'bg-success'; estadoTexto = 'Entregado'; }

            const div = document.createElement('div');
            div.className = 'card rounded-4 mb-3 border-secondary';
            div.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <span class="badge ${badgeClass} me-2">${estadoTexto}</span>
                            <span class="text-muted small">Pedido #${p.id}</span>
                        </div>
                        <div class="fw-bold text-warning">${Utilidades.formatearPrecio(p.total)}</div>
                    </div>
                    <div class="d-flex justify-content-between align-items-end">
                        <div class="small text-muted">Fecha: ${fechaFmt} • Boleta: ${p.boleta}</div>
                        <div>
                            <button class="btn btn-sm btn-outline-light me-2 btn-ver-boleta" data-id="${p.id}">Ver Boleta</button>
                            <a href="Est_pedido.html" class="btn btn-sm btn-danger">Seguimiento</a>
                        </div>
                    </div>
                </div>
            `;
            contenedor.appendChild(div);
        });

        // Activar botones "Ver Boleta"
        document.querySelectorAll('.btn-ver-boleta').forEach(btn => {
            btn.addEventListener('click', (e) => this.abrirModalBoleta(e.target.dataset.id));
        });
    }

    registrarFiltros() {
        // Chips
        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                this.renderizarPedidos(e.target.dataset.filter, document.getElementById('input-busqueda-pedido').value);
            });
        });

        // Buscador
        const inputBusqueda = document.getElementById('input-busqueda-pedido');
        if (inputBusqueda) {
            inputBusqueda.addEventListener('input', (e) => {
                const filtroActivo = document.querySelector('.chip.active').dataset.filter;
                this.renderizarPedidos(filtroActivo, e.target.value);
            });
        }
    }

    abrirModalBoleta(id) {
        const pedido = this.pedidos.find(p => p.id === id);
        if (!pedido) return;

        document.getElementById('modal-boleta-num').textContent = pedido.boleta;
        document.getElementById('modal-boleta-fecha').textContent = new Date(pedido.fecha).toLocaleDateString();
        document.getElementById('modal-boleta-total').textContent = Utilidades.formatearPrecio(pedido.total);

        const tbody = document.getElementById('modal-boleta-items');
        tbody.innerHTML = '';
        pedido.items.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.nombre}</td>
                <td class="text-center">${item.cant}</td>
                <td class="text-end">${Utilidades.formatearPrecio(item.precio)}</td>
                <td class="text-end">${Utilidades.formatearPrecio(item.precio * item.cant)}</td>
            `;
            tbody.appendChild(tr);
        });

        new bootstrap.Modal(document.getElementById('modalBoleta')).show();
    }
}

// Instancia global
const orderService = new OrderService();

// =================== DASHBOARD SERVICE - REPORTES ADMIN ===================

class DashboardService {
    constructor() {
        // Solo inicializar si estamos en la página de reportes
        if (document.getElementById('chartTop')) {
            this.inicializarDashboard();
        }
    }

    inicializarDashboard() {
        console.log('📊 Inicializando Dashboard de Ventas...');
        
        // Variables para los gráficos (para poder destruirlos y redibujarlos)
        this.chartTop = null;
        this.chartPay = null;
        this.chartType = null;

        // 1. Generar Datos Simulados (Para que se vea bonito)
        this.datos = this.generarDatosSimulados();
        
        // 2. Configurar Filtros de Fecha
        this.configurarFiltros();
        
        // 3. Renderizar vista inicial (Día actual)
        this.actualizarDashboard('dia');
    }

    generarDatosSimulados() {
        // Generamos 150 pedidos aleatorios de los últimos 6 meses
        const pedidos = [];
        const productos = ['Pizza Pepperoni', 'Panini Caprese', 'Sanguche de Potito', 'Barros Luco', 'Bebida', 'Papas Fritas'];
        const metodos = ['tarjeta', 'contraentrega'];
        const tipos = ['delivery', 'retiro'];

        for (let i = 0; i < 150; i++) {
            const diasAtras = Math.floor(Math.random() * 180);
            const fecha = new Date();
            fecha.setDate(fecha.getDate() - diasAtras);

            pedidos.push({
                id: i,
                fecha: fecha,
                total: Math.floor(Math.random() * 20000) + 5000,
                producto: productos[Math.floor(Math.random() * productos.length)],
                metodo: metodos[Math.floor(Math.random() * metodos.length)],
                tipo: tipos[Math.floor(Math.random() * tipos.length)]
            });
        }
        return pedidos;
    }

    configurarFiltros() {
        // Chips de periodo (Hoy, Mes, Año)
        document.querySelectorAll('.chip[data-mode]').forEach(chip => {
            chip.addEventListener('click', (e) => {
                // Activar chip visualmente
                document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                
                // Mostrar inputs correspondientes
                const modo = e.target.dataset.mode;
                this.mostrarInputFecha(modo);
                
                // Actualizar datos
                this.actualizarDashboard(modo);
            });
        });

        // Listeners para los inputs de fecha
        ['inp-dia', 'inp-mes', 'inp-anio'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('change', () => {
                    const modo = document.querySelector('.chip.active').dataset.mode;
                    this.actualizarDashboard(modo);
                });
            }
        });

        // Botón Exportar
        const btnExport = document.getElementById('btn-export');
        if (btnExport) {
            btnExport.addEventListener('click', () => {
                alert('📊 Generando archivo Excel... (Simulación)');
            });
        }
    }

    mostrarInputFecha(modo) {
        Utilidades.toggleElemento(document.getElementById('box-dia'), modo === 'dia');
        Utilidades.toggleElemento(document.getElementById('box-mes'), modo === 'mes');
        Utilidades.toggleElemento(document.getElementById('box-anio'), modo === 'anio');
    }

    actualizarDashboard(modo) {
        // 1. Filtrar datos según el periodo seleccionado
        const datosFiltrados = this.filtrarDatos(modo);
        
        // 2. Calcular KPIs
        this.renderizarKPIs(datosFiltrados);
        
        // 3. Dibujar Gráficos
        this.renderizarGraficos(datosFiltrados);
    }

    filtrarDatos(modo) {
        const ahora = new Date();
        let inicio, fin;

        // Lógica simple de fechas
        if (modo === 'dia') {
            const inputVal = document.getElementById('inp-dia').value;
            const base = inputVal ? new Date(inputVal + 'T00:00:00') : new Date(); // Truco para zona horaria
            inicio = new Date(base.getFullYear(), base.getMonth(), base.getDate());
            fin = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1);
        } else if (modo === 'mes') {
            inicio = new Date(ahora.getFullYear(), agora.getMonth(), 1); // Por defecto este mes
            fin = new Date();
        } else {
            inicio = new Date(ahora.getFullYear(), 0, 1); // Este año
            fin = new Date();
        }

        return this.datos.filter(p => p.fecha >= inicio && p.fecha < fin);
    }

    renderizarKPIs(datos) {
        // Ventas Totales
        const total = datos.reduce((sum, p) => sum + p.total, 0);
        document.getElementById('kpi-sales').textContent = Utilidades.formatearPrecio(total);
        document.getElementById('kpi-sales-sub').textContent = `${datos.length} pedidos en este período`;

        // Producto Top
        const conteoProd = {};
        datos.forEach(p => conteoProd[p.producto] = (conteoProd[p.producto] || 0) + 1);
        const topProd = Object.entries(conteoProd).sort((a,b) => b[1] - a[1])[0];
        document.getElementById('kpi-prod').textContent = topProd ? topProd[0] : 'N/A';
        document.getElementById('kpi-prod-sub').textContent = topProd ? `${topProd[1]} unidades vendidas` : '-';

        // Pago y Tipo (Lógica similar simplificada para el ejemplo)
        const conteoPago = {};
        datos.forEach(p => conteoPago[p.metodo] = (conteoPago[p.metodo] || 0) + 1);
        const topPago = Object.entries(conteoPago).sort((a,b) => b[1] - a[1])[0];
        document.getElementById('kpi-pay').textContent = topPago ? (topPago[0] === 'tarjeta' ? 'Tarjeta' : 'Efectivo') : 'N/A';
    }

    renderizarGraficos(datos) {
        // Preparar datos para Chart.js
        const conteoProd = {};
        datos.forEach(p => conteoProd[p.producto] = (conteoProd[p.producto] || 0) + 1);
        
        const labels = Object.keys(conteoProd);
        const data = Object.values(conteoProd);

        // Gráfico de Barras (Productos)
        if (this.chartTop) this.chartTop.destroy(); // Limpiar anterior
        
        const ctxTop = document.getElementById('chartTop');
        if (ctxTop) {
            this.chartTop = new Chart(ctxTop, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Unidades Vendidas',
                        data: data,
                        backgroundColor: '#ffc107',
                        borderColor: '#ffc107',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true, ticks: { color: '#ccc' } },
                        x: { ticks: { color: '#ccc' } }
                    },
                    plugins: { legend: { labels: { color: '#ccc' } } }
                }
            });
        }

        // Gráfico de Dona (Métodos de Pago) - Simplificado
        const conteoPago = { 'Tarjeta': 0, 'Efectivo': 0 };
        datos.forEach(p => p.metodo === 'tarjeta' ? conteoPago['Tarjeta']++ : conteoPago['Efectivo']++);
        
        if (this.chartPay) this.chartPay.destroy();
        const ctxPay = document.getElementById('chartPay');
        if (ctxPay) {
            this.chartPay = new Chart(ctxPay, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(conteoPago),
                    datasets: [{
                        data: Object.values(conteoPago),
                        backgroundColor: ['#ffc107', '#343a40'],
                        borderColor: '#212529'
                    }]
                },
                options: { maintainAspectRatio: false, plugins: { legend: { labels: { color: '#ccc' } } } }
            });
        }
        
        // (Aquí iría el chartType igual al chartPay, pero por espacio lo omití en el ejemplo)
    }
}

// Instancia global
const dashboardService = new DashboardService();

// =================== EVENT LISTENERS E INICIALIZACIÓN ===================

class AppInicializador {
    constructor() {
        this.eventListenersRegistrados = false;
    }

    // 1. INICIALIZACIÓN PRINCIPAL
    async inicializarApp() {
        console.log('🚀 Inicializando aplicación Bocatto...');
        
        try {
            // Verificar sesión activa
            authService.verificarSesionActiva();
            
            // Cargar productos iniciales
            await this.cargarProductosIniciales();
            
            // Registrar event listeners
            this.registrarEventListeners();
            
            // Renderizar estado inicial
            this.renderizarEstadoInicial();
            
            console.log('✅ Aplicación inicializada correctamente');

        } catch (error) {
            console.error('❌ Error inicializando aplicación:', error);
        }
    }

    // 2. CARGA DE PRODUCTOS INICIALES
    async cargarProductosIniciales() {
        try {
            // Cargar promociones si la sección existe
            if (Utilidades.elementoExiste(ElementosDOM.contenedorPromos)) {
                await productService.renderProductosCategoria('promos');
            }
            
            // Aquí podríamos cargar otras categorías según la página
            // await productService.renderProductosCategoria('menu');
            // await productService.renderProductosCategoria('bebidas');
            
        } catch (error) {
            console.error('❌ Error cargando productos iniciales:', error);
        }
    }

    // 3. REGISTRO DE EVENT LISTENERS
    registrarEventListeners() {
        if (this.eventListenersRegistrados) {
            console.log('⚠️ Event listeners ya registrados');
            return;
        }

        this.registrarListenersAutenticacion();
        this.registrarListenersCarrito();
        this.registrarListenersProductos();
        this.registrarListenersGlobales();

        this.eventListenersRegistrados = true;
        console.log('✅ Todos los event listeners registrados');
    }

    // 4. LISTENERS DE AUTENTICACIÓN
    registrarListenersAutenticacion() {
        // Login form
        if (Utilidades.elementoExiste(ElementosDOM.formLogearse)) {
            ElementosDOM.formLogearse.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = ElementosDOM.loginEmail.value;
                const password = ElementosDOM.loginContraseña.value;
                
                await authService.login(email, password);
            });
        }

        // Botón registrarse
        if (Utilidades.elementoExiste(ElementosDOM.btnRegistrarse)) {
            ElementosDOM.btnRegistrarse.addEventListener('click', (e) => {
                e.preventDefault();
                alert('🚧 Función de registro en desarrollo - Usa: cliente@bocatto.cl / cliente123');
            });
        }

        // Botón logout
        if (Utilidades.elementoExiste(ElementosDOM.btnLogout)) {
            ElementosDOM.btnLogout.addEventListener('click', () => {
                authService.logout();
            });
        }

        console.log('🔐 Listeners de autenticación registrados');
    }

    // 5. LISTENERS DE CARRITO (DELEGACIÓN DE EVENTOS)
    registrarListenersCarrito() {
        // Delegación para botones "Agregar al carrito" en productos
        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('btn-agregar-carrito')) {
                const nombre = e.target.dataset.nombre;
                const precio = e.target.dataset.precio;
                const imagen = e.target.dataset.imagen;
                const productoId = e.target.dataset.productoId;
                
                await carritoService.agregarAlCarrito(nombre, precio, imagen, productoId);
            }
        });

        // Delegación para botones dentro del carrito
        if (Utilidades.elementoExiste(ElementosDOM.carritoItems)) {
            ElementosDOM.carritoItems.addEventListener('click', async (e) => {
                const productoId = e.target.dataset.productoId;
                
                if (!productoId) return;

                if (e.target.classList.contains('btn-sumar')) {
                    await carritoService.actualizarCantidad(productoId, 'incrementar');
                } else if (e.target.classList.contains('btn-restar')) {
                    await carritoService.actualizarCantidad(productoId, 'decrementar');
                } else if (e.target.classList.contains('btn-eliminar')) {
                    await carritoService.eliminarDelCarrito(productoId);
                }
            });
        }

        // Botón vaciar carrito
        if (Utilidades.elementoExiste(ElementosDOM.btnVaciar)) {
            ElementosDOM.btnVaciar.addEventListener('click', async () => {
                if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
                    await carritoService.vaciarCarrito();
                }
            });
        }

        // Botón hacer pedido
        if (Utilidades.elementoExiste(ElementosDOM.btnHacerPedido)) {
            ElementosDOM.btnHacerPedido.addEventListener('click', async (e) => {
                e.preventDefault();
                await carritoService.procesarPedido();
            });
        }

        // Re-renderizar carrito cuando se abre el offcanvas
        if (Utilidades.elementoExiste(ElementosDOM.offcanvasCarrito)) {
            ElementosDOM.offcanvasCarrito.addEventListener('show.bs.offcanvas', () => {
                carritoService.renderCarrito();
            });
        }

        console.log('🛒 Listeners de carrito registrados');
    }

    // 6. LISTENERS DE PRODUCTOS (ADMIN)
// En AppInicializador (app.js)

registrarListenersProductos() {
    // 1. Listener para el formulario del modal (Guardar)
    if (Utilidades.elementoExiste(ElementosDOM.productForm)) {
        ElementosDOM.productForm.addEventListener('submit', async (e) => {
            await productService.manejarSubmitProducto(e);
        });
    }

    // 2. Listener GLOBAL para botones "Agregar Producto" (Delegación)
    // Esto arregla el problema de tener múltiples botones en distintas categorías
    document.addEventListener('click', (e) => {
        // Buscamos si el clic fue en un botón (o en el ícono dentro del botón)
        const btnAgregar = e.target.closest('button');

        // Verificamos si es un botón que abre el modal de agregar productos
        if (btnAgregar && btnAgregar.dataset.bsTarget === '#modalAddProduct') {
            // Obtenemos la categoría del botón (ej: "sandwiches", "bebibles")
            const categoria = btnAgregar.dataset.category || 'promos';
            console.log(`➕ Abriendo modal para: ${categoria}`);
            productService.abrirModalAgregarProducto(categoria);
        }
    });

    // 3. Listener para botones Editar/Eliminar (Ya lo tenías con delegación, lo mantenemos)
    document.addEventListener('click', async (e) => {
        const productoId = e.target.dataset.productoId;
        if (!productoId) return;

        if (e.target.classList.contains('btn-editar-producto')) {
            productService.abrirModalEditarProducto(productoId);
        } else if (e.target.classList.contains('btn-eliminar-producto')) {
            if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
                await productService.eliminarProducto(productoId);
            }
        }
    });

    console.log('📦 Listeners de productos registrados (Modo Delegación)');
}

    // 7. LISTENERS GLOBALES
    registrarListenersGlobales() {
        // Prevenir envío de formularios vacíos
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.checkValidity && !form.checkValidity()) {
                e.preventDefault();
                e.stopPropagation();
            }
            form.classList.add('was-validated');
        });

        // Manejar clicks en enlaces internos (smooth scroll)
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href^="#"]')) {
                e.preventDefault();
                const target = document.querySelector(e.target.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });

        // Actualizar interfaz cuando cambia el estado de autenticación
        document.addEventListener('authStateChanged', () => {
            authService.actualizarNavbar();
            authService.toggleElementosAdmin();
        });

        // --- NUEVO: Listener para botón Tus Pedidos ---
        if (Utilidades.elementoExiste(ElementosDOM.btnPedidos)) {
            ElementosDOM.btnPedidos.addEventListener('click', () => {
                console.log('📂 Yendo a mis pedidos...');
                window.location.href = 'Ges_boletas.html';
            });
        }

        // --- NUEVO: Listener para botón Panel Admin ---
        if (Utilidades.elementoExiste(ElementosDOM.btnAdmin)) {
            ElementosDOM.btnAdmin.addEventListener('click', () => {
                console.log('👑 Yendo al panel de admin...');
                window.location.href = 'Ges_reportes.html';
            });
        }

        // --- NUEVO: Listener para botón Locales del Navbar ---
        // Lo enlazamos al enlace del navbar principal que tiene el href="#locales"
        document.querySelectorAll('a[href="#locales"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault(); // Prevenimos el scroll
                console.log('📍 Yendo a la página de locales...');
                window.location.href = 'Locales.html';
            });
        });
        // ----------------------------------------------------

        console.log('🌐 Listeners globales registrados');
    }

    // 8. RENDERIZADO DEL ESTADO INICIAL
    renderizarEstadoInicial() {
        // Renderizar carrito (badge y estado)
        carritoService.renderCarrito();
        
        // Actualizar navbar según autenticación
        authService.actualizarNavbar();
        authService.toggleElementosAdmin();
        
        console.log('🎨 Estado inicial renderizado');
    }

    // 9. DESTRUIR EVENT LISTENERS (para SPA)
    destruirEventListeners() {
        // Limpiar event listeners específicos si es necesario
        this.eventListenersRegistrados = false;
        console.log('🧹 Event listeners destruidos');
    }
}

// =================== INICIALIZACIÓN AL CARGAR EL DOM ===================

// Instancia global del inicializador
const appInicializador = new AppInicializador();

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        appInicializador.inicializarApp();
    });
} else {
    appInicializador.inicializarApp();
}

// =================== COMPATIBILIDAD CON CÓDIGO EXISTENTE ===================

// Mantener funciones globales para compatibilidad
window.actualizarNavbar = function() {
    authService.actualizarNavbar();
    authService.toggleElementosAdmin();
};

// Exportar servicios para debugging (opcional)
if (typeof window !== 'undefined') {
    window.BocattoApp = {
        auth: authService,
        carrito: carritoService,
        productos: productService,
        estado: EstadoApp,
        utilidades: Utilidades
    };
    console.log('🔧 BocattoApp disponible en consola para debugging');
}