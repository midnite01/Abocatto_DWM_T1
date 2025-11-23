// =================== ESTRUCTURA BASE APP.JS ===================
// Versión: INTEGRACIÓN REAL (Backend: localhost:3000)

// 1. CONFIGURACIÓN Y CLIENTE GRAPHQL (Nuestro "Mini-Apollo")
const CONFIG = {
    API_URL: 'http://localhost:3000/graphql', // ¡La dirección de tu cocina!
    CAR_KEY: 'carrito_bocatto',
    USER_KEY: 'usuario_bocatto',
    ROLES: { VISITANTE: 'visitante', CLIENTE: 'cliente', ADMIN: 'admin' }
};

// Clase para hablar con el Backend
class GQL {
    static async request(query, variables = {}) {
        // Recuperar token si existe
        const usuario = Utilidades.cargarDesdeStorage(CONFIG.USER_KEY);
        const headers = { 
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
        
        // Si hay token, lo pegamos en la frente del mensajero
        if (usuario && usuario.token) {
            headers['Authorization'] = usuario.token; // o `Bearer ${usuario.token}` según tu backend
        }

        try {
            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ query, variables })
            });

            const json = await response.json();

            if (json.errors) {
                console.error('🔥 Error de GraphQL:', json.errors);
                throw new Error(json.errors[0].message);
            }

            return json.data;

        } catch (error) {
            console.error('❌ Error de Red/Servidor:', error);
            throw error;
        }
    }
}

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
// 2. LOGIN REAL (Conectado al Backend)
    async login(email, password) {
        try {
            EstadoApp.ui.cargando = true;
            this.mostrarLoadingLogin(true);

            // A) Definimos la Mutation (La carta para la cocina)
            const mutation = `
                mutation Login($email: String!, $password: String!) {
                    loginUsuario(email: $email, password: $password) {
                        token
                        usuario {
                            id
                            nombre
                            email
                            rol
                        }
                    }
                }
            `;

            // B) Enviamos al mensajero (GQL)
            console.log('📡 Enviando intento de login al backend...');
            const data = await GQL.request(mutation, { email, password });
            
            // C) Recibimos la respuesta real
            const { token, usuario } = data.loginUsuario;

            // Crear sesión local
            const sesionUsuario = {
                ...usuario,
                token: token
            };

            // Guardar estado global y localStorage
            EstadoApp.usuario = sesionUsuario;
            Utilidades.guardarEnStorage(CONFIG.USER_KEY, sesionUsuario);

            // Actualizar interfaz
            this.actualizarUIpostLogin();

            console.log(`✅ Login REAL exitoso: ${usuario.nombre}`);
            alert(`¡Bienvenido de nuevo, ${usuario.nombre}!`);
            
            return { exito: true, usuario: sesionUsuario };

        } catch (error) {
            console.error('❌ Error en login:', error.message);
            alert('Error al iniciar sesión: ' + error.message);
            return { exito: false, error: error.message };
        } finally {
            EstadoApp.ui.cargando = false;
            this.mostrarLoadingLogin(false);
        }
    }

    // 3. REGISTRO REAL (COMPLETO)
    async register(datos) {
        try {
            EstadoApp.ui.cargando = true;
            
            // La Mutation ahora pide TODOS los campos que definimos en el Backend
            const mutation = `
                mutation Registrar(
                    $nombre: String!, $email: String!, $password: String!, 
                    $telefono: String, $run: String, $sexo: String, $fechaNacimiento: String,
                    $direccion: DireccionInput, $region: String, $provincia: String
                ) {
                    registrarUsuario(
                        nombre: $nombre, email: $email, password: $password, 
                        telefono: $telefono, run: $run, sexo: $sexo, fechaNacimiento: $fechaNacimiento,
                        direccion: $direccion, region: $region, provincia: $provincia
                    ) {
                        token
                        usuario { id nombre email rol }
                    }
                }
            `;

            console.log('📡 Enviando registro completo al backend...');
            
            // Enviamos el objeto 'datos' tal cual (ya debe venir con la estructura correcta)
            const data = await GQL.request(mutation, datos);
            const { token, usuario } = data.registrarUsuario;

            // Crear sesión y guardar
            const sesionUsuario = { ...usuario, token };
            EstadoApp.usuario = sesionUsuario;
            Utilidades.guardarEnStorage(CONFIG.USER_KEY, sesionUsuario);
            
            this.actualizarUIpostLogin();

            alert(`¡Bienvenido a la familia Bocatto, ${usuario.nombre}!`);
            
            // Cerrar el modal de registro si está abierto
            const modalReg = bootstrap.Modal.getInstance(document.getElementById('registroModal'));
            if (modalReg) modalReg.hide();

            // Limpiar backdrop por si acaso
            document.body.classList.remove('modal-open');
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(el => el.remove());

            return { exito: true };

        } catch (error) {
            console.error('❌ Error registro:', error);
            alert('Error: ' + error.message);
            return { exito: false };
        } finally {
            EstadoApp.ui.cargando = false;
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

// 2. OBTENER PRODUCTOS REAL (Conectado al Backend)
    async obtenerProductos(categoria = null) {
        try {
            const query = `
                query ObtenerProductos($categoria: String) {
                    obtenerProductos(categoria: $categoria) {
                        id
                        nombre
                        descripcion
                        precio
                        categoria
                        imagen
                        disponible
                        stock
                    }
                }
            `;
            
            const variables = categoria ? { categoria } : {};

            console.log(`📡 Solicitando productos ${categoria ? 'de ' + categoria : 'disponibles'} al backend...`);
            const data = await GQL.request(query, variables);
            
            // Reemplazar la cache local (esto es opcional, pero bueno para performance)
            if (categoria) {
                EstadoApp.productos[categoria] = data.obtenerProductos;
            } else {
                // Si solicitamos todos, actualizamos todas las categorías
                data.obtenerProductos.forEach(p => {
                    if (!EstadoApp.productos[p.categoria]) {
                        EstadoApp.productos[p.categoria] = [];
                    }
                    if (!EstadoApp.productos[p.categoria].some(ep => ep.id === p.id)) {
                        EstadoApp.productos[p.categoria].push(p);
                    }
                });
            }

            return data.obtenerProductos;

        } catch (error) {
            console.error('❌ Error obteniendo productos:', error);
            return [];
        }
    }

// 2. OBTENER PRODUCTO POR ID REAL (Conectado al Backend)
    async obtenerProductoPorId(id) {
        try {
            const query = `
                query ObtenerProducto($id: ID!) {
                    obtenerProducto(id: $id) {
                        id nombre descripcion precio categoria imagen stock disponible
                    }
                }
            `;
            
            console.log(`📡 Solicitando producto ID ${id} al backend...`);
            const data = await GQL.request(query, { id });
            
            const producto = data.obtenerProducto;
            
            // Opcional: Actualizar la cache si el producto existe
            if (producto && EstadoApp.productos[producto.categoria]) {
                const index = EstadoApp.productos[producto.categoria].findIndex(p => p.id === producto.id);
                if (index !== -1) {
                    EstadoApp.productos[producto.categoria][index] = producto;
                }
            }
            
            return producto;

        } catch (error) {
            console.error('❌ Error obteniendo producto por ID:', error);
            return null;
        }
    }

// 3. CREAR PRODUCTO REAL (Conectado al Backend)
    async crearProducto(datosProducto) {
        try {
            // Revalidar permisos (doble check, aunque el backend también lo hará)
            if (!authService.esAdmin()) {
                throw new Error('Se requieren permisos de administrador');
            }
            
            const mutation = `
                mutation CrearProducto(
                    $nombre: String!, $descripcion: String!, $precio: Float!, 
                    $categoria: String!, $imagen: String, $stock: Int
                ) {
                    crearProducto(
                        nombre: $nombre, descripcion: $descripcion, precio: $precio, 
                        categoria: $categoria, imagen: $imagen, stock: $stock
                    ) {
                        producto { id nombre categoria }
                        mensaje
                    }
                }
            `;
            
            // Preparar variables con los tipos de datos correctos
            const variables = {
                ...datosProducto,
                precio: Number(datosProducto.precio),
                stock: Number(datosProducto.stock) || 10,
                imagen: datosProducto.imagen || 'Recursos_Esteticos/img/default.jpg' // Default en caso de vacío
            };

            console.log('📡 Creando producto en el backend...');
            const data = await GQL.request(mutation, variables);
            
            const nuevoProducto = data.crearProducto.producto;
            
            // Opcional: Agregar a la cache del EstadoApp para uso inmediato
            if (EstadoApp.productos[nuevoProducto.categoria]) {
                EstadoApp.productos[nuevoProducto.categoria].push(nuevoProducto);
            }
            
            console.log(`✅ Producto creado: ${nuevoProducto.nombre} (ID: ${nuevoProducto.id})`);
            return { exito: true, producto: nuevoProducto };

        } catch (error) {
            console.error('❌ Error creando producto:', error);
            // El error.message viene del throw en GQL.request (json.errors[0].message)
            return { exito: false, error: error.message };
        }
    }

// 4. ACTUALIZAR PRODUCTO REAL (Conectado al Backend)
    async actualizarProducto(id, datosActualizados) {
        try {
            if (!authService.esAdmin()) {
                throw new Error('Se requieren permisos de administrador');
            }

            const mutation = `
                mutation ActualizarProducto(
                    $id: ID!, $nombre: String, $descripcion: String, $precio: Float, 
                    $categoria: String, $imagen: String, $stock: Int, $disponible: Boolean
                ) {
                    actualizarProducto(
                        id: $id, nombre: $nombre, descripcion: $descripcion, precio: $precio, 
                        categoria: $categoria, imagen: $imagen, stock: $stock, disponible: $disponible
                    ) {
                        producto { id nombre categoria }
                        mensaje
                    }
                }
            `;

            // Limpiar datos: solo enviar los definidos y convertir tipos
            const variables = {
                id,
                ...(datosActualizados.nombre && { nombre: datosActualizados.nombre }),
                ...(datosActualizados.descripcion && { descripcion: datosActualizados.descripcion }),
                ...(datosActualizados.precio !== undefined && { precio: Number(datosActualizados.precio) }),
                ...(datosActualizados.categoria && { categoria: datosActualizados.categoria }),
                ...(datosActualizados.imagen !== undefined && { imagen: datosActualizados.imagen }),
                ...(datosActualizados.stock !== undefined && { stock: Number(datosActualizados.stock) }),
                ...(datosActualizados.disponible !== undefined && { disponible: datosActualizados.disponible }),
            };

            console.log(`📡 Actualizando producto ID ${id} en el backend...`);
            const data = await GQL.request(mutation, variables);
            
            const productoActualizado = data.actualizarProducto.producto;

            // Nota: El renderizado completo (y, por tanto, la actualización de la caché)
            // ocurre en productService.manejarSubmitProducto, por lo que no lo repetimos aquí.
            
            console.log(`✏️ Producto actualizado: ${productoActualizado.nombre}`);
            return { exito: true, producto: productoActualizado };

        } catch (error) {
            console.error('❌ Error actualizando producto:', error);
            return { exito: false, error: error.message };
        }
    }

// 5. ELIMINAR PRODUCTO REAL
    async eliminarProducto(id) {
        try {
            if (!authService.esAdmin()) {
                throw new Error('Se requieren permisos de administrador');
            }

            // 1. Primero necesitamos saber la categoría para repintarla después
            // Como ya no tenemos caché confiable, la adivinamos del DOM o pedimos el producto antes
            // Truco rápido: buscamos el elemento en el HTML para ver su categoría
            const cardElement = document.querySelector(`button[data-producto-id="${id}"]`);
            let categoriaParaRefrescar = 'promos'; // Default por seguridad
            
            if (cardElement) {
                // Intentamos subir hasta encontrar el contenedor o la card que tenga el dato
                const colPadre = cardElement.closest('.col');
                if (colPadre && colPadre.dataset.categoria) {
                    categoriaParaRefrescar = colPadre.dataset.categoria;
                }
            }
            
            const mutation = `
                mutation EliminarProducto($id: ID!) {
                    eliminarProducto(id: $id) {
                        success
                        message
                    }
                }
            `;
            
            console.log(`📡 Eliminando producto ID ${id} en el backend...`);
            const data = await GQL.request(mutation, { id });
            
            if (data.eliminarProducto.success) {
                console.log(`🗑️ Producto eliminado. Refrescando categoría: ${categoriaParaRefrescar}`);
                
                // CLAVE: Aquí forzamos la actualización visual inmediata
                await this.renderProductosCategoria(categoriaParaRefrescar);
                
                return { exito: true, mensaje: data.eliminarProducto.message };
            } else {
                throw new Error(data.eliminarProducto.message);
            }

        } catch (error) {
            console.error('❌ Error eliminando producto:', error);
            return { exito: false, error: error.message };
        }
    }

// 6. RENDERIZADO DE PRODUCTOS
    async renderProductosCategoria(categoria) {
        // TRUCO INTELIGENTE: 
        // Si la categoría viene de la BD como "acompañamientos", la traducimos al ID "acompanamientos"
        let sufijoId = categoria;
        if (categoria === 'acompañamientos') {
            sufijoId = 'acompanamientos';
        }

        const contenedorId = `contenedor-${sufijoId}`;
        const contenedor = document.getElementById(contenedorId);
        
        if (!contenedor) {
            return; // Si no existe en esta página, no hacemos nada
        }

        try {
            // Llamamos siempre a la API para tener datos frescos
            const productos = await this.obtenerProductos(categoria);
            contenedor.innerHTML = '';
            // ... (el resto del código sigue igual)

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
                precio: ElementosDOM.productPrice.value,
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
                // Éxito: Refrescamos la vista de la categoría
                await this.renderProductosCategoria(datos.categoria);
                alert(`✅ Producto ${productoId ? 'actualizado' : 'creado'} correctamente`);
            } else {
                throw new Error(resultado.error);
            }

        } catch (error) {
            console.error('❌ Error guardando producto:', error);
            alert(`Error: ${error.message}`);
        } finally {
            // === ZONA DE SEGURIDAD Y LIMPIEZA (LA SOLUCIÓN VIOLENTA) ===
            // Esto se ejecuta SIEMPRE, haya éxito o error, para devolver el control.

            // 1. Restaurar botón
            textoBtn.textContent = 'Guardar';
            textoBtn.style.display = 'inline-block';
            spinner.style.display = 'none';
            btnGuardar.disabled = false;

            // 2. DESALOJO FORZOSO DEL MODAL
            const modalElement = ElementosDOM.modalAddProduct;
            
            // Intento diplomático (Bootstrap)
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) modalInstance.hide();

            // Fuerza Bruta (DOM)
            modalElement.classList.remove('show');
            modalElement.style.display = 'none';
            modalElement.setAttribute('aria-hidden', 'true');
            modalElement.removeAttribute('role');

            // 3. ELIMINAR LA CAPA NEGRA (BACKDROP)
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(el => el.remove());

            // 4. DESBLOQUEAR EL SCROLL DEL BODY
            document.body.classList.remove('modal-open');
            document.body.style.overflow = 'auto';
            document.body.style.paddingRight = '0';
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
        // 1. Lógica de Tipo de Entrega
        const radiosEntrega = document.querySelectorAll('input[name="tipoEntrega"]');
        radiosEntrega.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const esDelivery = e.target.value === 'delivery';
                Utilidades.toggleElemento(document.getElementById('seccion-direccion-delivery'), esDelivery);
                Utilidades.toggleElemento(document.getElementById('seccion-info-retiro'), !esDelivery);
                
                const textoEnvio = document.getElementById('checkout-envio');
                if (textoEnvio) textoEnvio.textContent = esDelivery ? 'Por calcular' : 'Gratis';
            });
        });

        // 2. Lógica de Método de Pago
        const radiosPago = document.querySelectorAll('input[name="metodoPago"]');
        radiosPago.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const esTarjeta = e.target.value === 'tarjeta';
                Utilidades.toggleElemento(document.getElementById('seccion-tarjeta'), esTarjeta);
                Utilidades.toggleElemento(document.getElementById('seccion-info-contraentrega'), !esTarjeta);
            });
        });

        // 3. Botón Confirmar Compra (INTEGRACIÓN REAL)
        const btnConfirmar = document.getElementById('btn-confirmar-compra');
        if (btnConfirmar) {
            btnConfirmar.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.procesarCompra();
            });
        }
    }

    async procesarCompra() {
        try {
            // A) Validaciones Previas
            if (EstadoApp.carrito.length === 0) {
                alert('El carrito está vacío');
                return;
            }

            const usuario = authService.getUsuarioActual();
            if (!usuario || !usuario.id) {
                alert('Debes iniciar sesión para confirmar la compra');
                return;
            }

            // B) Recolectar Datos del Formulario
            const tipoEntrega = document.querySelector('input[name="tipoEntrega"]:checked').value;
            const metodoPago = document.querySelector('input[name="metodoPago"]:checked').value;
            const notas = document.getElementById('input-notas')?.value || '';

            // Preparar objeto dirección (solo si es delivery)
            let direccionEntrega = null;
            if (tipoEntrega === 'delivery') {
                const calle = document.getElementById('input-calle').value;
                const comuna = document.getElementById('input-comuna').value;
                
                if (!calle) {
                    alert('Debes ingresar una dirección para el despacho');
                    return;
                }
                
                direccionEntrega = {
                    calle: calle,
                    comuna: comuna || 'Santiago',
                    ciudad: 'Santiago',
                    notas: notas
                };
            }

            // Preparar datos de pago (Dummy o Reales del form)
            const datosPago = {
                metodo: metodoPago,
                ultimosDigitos: metodoPago === 'tarjeta' ? '4242' : null, // Simulado por ahora
                transaccionId: `PEND_${Date.now()}`
            };

            // C) Preparar Items del Carrito para GraphQL
            const itemsInput = EstadoApp.carrito.map(item => ({
                productoId: item.id,
                nombre: item.nombre,
                precio: Number(item.precio),
                cantidad: Number(item.cantidad),
                imagen: item.imagen
            }));

            // D) Definir la Mutation
            const mutation = `
                mutation CrearPedido(
                    $usuarioId: ID!, 
                    $items: [ItemPedidoInput!]!, 
                    $tipoEntrega: String!, 
                    $direccionEntrega: DireccionEntregaInput, 
                    $metodoPago: String!, 
                    $datosPago: DatosPagoInput!, 
                    $notas: String
                ) {
                    crearPedido(
                        usuarioId: $usuarioId, 
                        items: $items, 
                        tipoEntrega: $tipoEntrega, 
                        direccionEntrega: $direccionEntrega, 
                        metodoPago: $metodoPago, 
                        datosPago: $datosPago, 
                        notas: $notas
                    ) {
                        pedido { id numeroBoleta total estado }
                        mensaje
                    }
                }
            `;

            const variables = {
                usuarioId: usuario.id,
                items: itemsInput,
                tipoEntrega,
                direccionEntrega,
                metodoPago,
                datosPago,
                notas
            };

            // E) Enviar al Backend
            console.log('📡 Creando pedido...', variables);
            const btn = document.getElementById('btn-confirmar-compra');
            btn.disabled = true;
            btn.textContent = 'Procesando...';

            const data = await GQL.request(mutation, variables);
            
            // F) Éxito
            const nuevoPedido = data.crearPedido.pedido;
            console.log('✅ Pedido creado:', nuevoPedido);

            // Guardar ID del pedido temporalmente para la validación de pago
            sessionStorage.setItem('pedido_actual_id', nuevoPedido.id);
            sessionStorage.setItem('metodo_pago_actual', metodoPago);

            // Vaciar carrito local (ya está en la DB)
            await carritoService.vaciarCarrito();

            // Redirigir a validación de pago
            window.location.href = 'Val_pago.html';

        } catch (error) {
            console.error('❌ Error al crear pedido:', error);
            alert('Hubo un error al procesar tu pedido: ' + error.message);
            const btn = document.getElementById('btn-confirmar-compra');
            btn.disabled = false;
            btn.textContent = 'Confirmar Compra';
        }
    }

    renderizarResumen() {
        // ... (Mantener el código anterior de renderizarResumen igual) ...
        const contenedor = document.getElementById('lista-resumen-checkout');
        if (!contenedor) return;

        contenedor.innerHTML = '';
        const carrito = EstadoApp.carrito;

        if (carrito.length === 0) {
            contenedor.innerHTML = '<div class="text-center text-muted">El carrito está vacío</div>';
            return;
        }

        let subtotal = 0;

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

        const elSubtotal = document.getElementById('checkout-subtotal');
        const elTotal = document.getElementById('checkout-total');
        
        if (elSubtotal) elSubtotal.textContent = Utilidades.formatearPrecio(subtotal);
        if (elTotal) elTotal.textContent = Utilidades.formatearPrecio(subtotal);
    }
}
// Instancia global
const checkoutService = new CheckoutService();


// =================== ORDER SERVICE - GESTIÓN DE PEDIDOS/BOLETAS ===================

// =================== ORDER SERVICE - GESTIÓN DE PEDIDOS/BOLETAS ===================

class OrderService {
    constructor() {
        // Detectar en qué página estamos para iniciar la lógica correcta
        if (document.getElementById('lista-pedidos')) {
            this.inicializarHistorial();
        }
        
        // Si estamos en la página de Tracking
        if (document.querySelector('.tracker-container')) {
            this.inicializarTracking();
        }
    }

    // =================== 1. LOGICA DE TRACKING (Est_pedido.html) ===================
    
    async inicializarTracking() {
        console.log('📍 Inicializando Tracking de Pedido...');
        
        const params = new URLSearchParams(window.location.search);
        const pedidoId = params.get('id');

        if (!pedidoId) {
            alert('No se especificó un pedido para rastrear.');
            window.location.href = 'Ges_boletas.html';
            return;
        }

        try {
            const query = `
                query ObtenerTracking($id: ID!) {
                    obtenerPedido(id: $id) {
                        id
                        numeroBoleta
                        estado
                        tiempoEstimado
                        createdAt
                        items { nombre cantidad }
                    }
                }
            `;

            const data = await GQL.request(query, { id: pedidoId });
            const pedido = data.obtenerPedido;

            if (!pedido) throw new Error('Pedido no encontrado');

            this.renderizarTracking(pedido);

        } catch (error) {
            console.error('❌ Error cargando tracking:', error);
            // Evitamos alert para no bloquear si es un error menor
        }
    }

    renderizarTracking(pedido) {
        // Datos básicos
        const elId = document.getElementById('track-id');
        const elFecha = document.getElementById('track-fecha');
        
        if (elId) elId.textContent = pedido.numeroBoleta || pedido.id.slice(-6);
        if (elFecha) elFecha.textContent = new Date(Number(pedido.createdAt)).toLocaleDateString();

        // Lógica de Pasos (Stepper)
        const estadosOrden = ['confirmado', 'en_preparacion', 'en_camino', 'entregado'];
        const pasosDOM = document.querySelectorAll('.tracker-step'); 

        let indiceActual = -1;
        let estadoNormalizado = pedido.estado;
        
        if (pedido.estado === 'pendiente') indiceActual = -1;
        else if (pedido.estado === 'listo_retiro') estadoNormalizado = 'en_camino';
        else if (pedido.estado === 'retirado') estadoNormalizado = 'entregado';
        
        indiceActual = estadosOrden.indexOf(estadoNormalizado);

        pasosDOM.forEach((paso, index) => {
            paso.classList.remove('active', 'done');
            if (index < indiceActual) {
                paso.classList.add('done'); 
            } else if (index === indiceActual) {
                paso.classList.add('active'); 
            }
        });

        // Textos dinámicos
        const titulos = ['Confirmado ✅', 'En cocina 🔥', 'En camino 🛵', 'Entregado 🍽️'];
        const descripciones = ['Validando detalles.', 'Preparando tus Bocattos.', 'Repartidor en ruta.', '¡Disfrútalo!'];

        const tituloEl = document.querySelector('.card-body h4');
        const descEl = document.querySelector('.card-body p.text-muted:last-of-type');

        if (tituloEl && indiceActual >= 0 && titulos[indiceActual]) tituloEl.textContent = titulos[indiceActual];
        if (descEl && indiceActual >= 0 && descripciones[indiceActual]) descEl.textContent = descripciones[indiceActual];
    }

    // =================== 2. LOGICA DE HISTORIAL (Ges_boletas.html) ===================
    
    async inicializarHistorial() {
        console.log('📜 Inicializando Historial de Pedidos Real...');
        
        const usuario = authService.getUsuarioActual();
        if (!usuario || !usuario.id) {
            // Si no está logueado, redirigir o mostrar vacío
            return;
        }

        // Cargar pedidos del backend
        this.pedidos = await this.obtenerMisPedidos(usuario.id);
        
        // Renderizar
        this.renderizarPedidos();
        this.registrarFiltros();
    }

    async obtenerMisPedidos(usuarioId) {
        try {
            const query = `
                query ObtenerMisPedidos($usuarioId: ID!) {
                    obtenerPedidos(usuarioId: $usuarioId) {
                        id
                        numeroBoleta
                        createdAt
                        estado
                        total
                        tipoEntrega
                        items { nombre cantidad precio }
                    }
                }
            `;

            const data = await GQL.request(query, { usuarioId });
            // Mapeamos 'createdAt' a 'fecha' para compatibilidad con el renderizador
            return data.obtenerPedidos.map(p => ({...p, fecha: p.createdAt})) || [];

        } catch (error) {
            console.error('❌ Error cargando historial:', error);
            const lista = document.getElementById('lista-pedidos');
            if(lista) lista.innerHTML = `<div class="text-center text-danger py-5">Error: ${error.message}</div>`;
            return [];
        }
    }

    renderizarPedidos(filtro = 'todos', busqueda = '') {
        const contenedor = document.getElementById('lista-pedidos');
        if (!contenedor) return;

        contenedor.innerHTML = '';

        if (!this.pedidos || this.pedidos.length === 0) {
            contenedor.innerHTML = '<div class="text-center text-muted py-5">No tienes pedidos registrados aún.</div>';
            return;
        }

        const filtrados = this.pedidos.filter(p => {
            const pasaFiltro = filtro === 'todos' || p.estado === filtro;
            const textoBusqueda = busqueda.toLowerCase();
            const pasaBusqueda = !busqueda || 
                                 (p.numeroBoleta && p.numeroBoleta.toLowerCase().includes(textoBusqueda)) ||
                                 p.id.toLowerCase().includes(textoBusqueda);
            return pasaFiltro && pasaBusqueda;
        });

        if (filtrados.length === 0) {
            contenedor.innerHTML = '<div class="text-center text-muted py-5">No se encontraron pedidos.</div>';
            return;
        }

        filtrados.forEach(p => {
            const fechaFmt = new Date(Number(p.fecha)).toLocaleDateString('es-CL');
            
            let badgeClass = 'bg-secondary';
            let estadoTexto = p.estado; // Simplificado
            
            if (p.estado === 'confirmado') badgeClass = 'bg-primary';
            if (p.estado === 'en_preparacion') { badgeClass = 'bg-warning text-dark'; estadoTexto = 'En Cocina'; }
            if (p.estado === 'en_camino') { badgeClass = 'bg-info text-dark'; estadoTexto = 'En Camino'; }
            if (p.estado === 'entregado') badgeClass = 'bg-success';

            const div = document.createElement('div');
            div.className = 'card rounded-4 mb-3 border-secondary';
            div.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <span class="badge ${badgeClass} me-2">${estadoTexto}</span>
                            <span class="text-muted small">Boleta: ${p.numeroBoleta || 'Pendiente'}</span>
                        </div>
                        <div class="fw-bold text-warning">${Utilidades.formatearPrecio(p.total)}</div>
                    </div>
                    <div class="d-flex justify-content-between align-items-end">
                        <div class="small text-muted">Fecha: ${fechaFmt}</div>
                        <div>
                            <button class="btn btn-sm btn-outline-light me-2 btn-ver-boleta" data-id="${p.id}">Detalle</button>
                            <a href="Est_pedido.html?id=${p.id}" class="btn btn-sm btn-danger">Seguimiento</a>
                        </div>
                    </div>
                </div>
            `;
            contenedor.appendChild(div);
        });

        document.querySelectorAll('.btn-ver-boleta').forEach(btn => {
            btn.addEventListener('click', (e) => this.abrirModalBoleta(e.target.dataset.id));
        });
    }

    registrarFiltros() {
        const inputBusqueda = document.getElementById('input-busqueda-pedido');
        if (inputBusqueda) {
            inputBusqueda.addEventListener('input', (e) => {
                const chipActivo = document.querySelector('.chip.active');
                const filtro = chipActivo ? chipActivo.dataset.filter : 'todos';
                this.renderizarPedidos(filtro, e.target.value);
            });
        }

        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                const busqueda = document.getElementById('input-busqueda-pedido')?.value || '';
                this.renderizarPedidos(e.target.dataset.filter, busqueda);
            });
        });
    }

    abrirModalBoleta(id) {
        const pedido = this.pedidos.find(p => p.id === id);
        if (!pedido) return;

        const elNum = document.getElementById('modal-boleta-num');
        const elFecha = document.getElementById('modal-boleta-fecha');
        const elTotal = document.getElementById('modal-boleta-total');
        
        if(elNum) elNum.textContent = pedido.numeroBoleta || '---';
        if(elFecha) elFecha.textContent = new Date(Number(pedido.fecha)).toLocaleDateString();
        if(elTotal) elTotal.textContent = Utilidades.formatearPrecio(pedido.total);

        const tbody = document.getElementById('modal-boleta-items');
        if (tbody) {
            tbody.innerHTML = '';
            pedido.items.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.nombre}</td>
                    <td class="text-center">${item.cantidad}</td>
                    <td class="text-end">${Utilidades.formatearPrecio(item.precio)}</td>
                    <td class="text-end">${Utilidades.formatearPrecio(item.precio * item.cantidad)}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        const modalEl = document.getElementById('modalBoleta');
        if (modalEl && window.bootstrap) {
            new bootstrap.Modal(modalEl).show();
        }
    }
}

// Instancia global
const orderService = new OrderService();

// =================== DASHBOARD SERVICE - REPORTES ADMIN ===================

class DashboardService {
    constructor() {
        // Solo inicializar si estamos en la página de reportes y existe el gráfico
        if (document.getElementById('chartTop')) {
            this.inicializarDashboard();
        }
    }

    async inicializarDashboard() {
        console.log('📊 Inicializando Dashboard Real...');
        
        // 1. Verificar si es admin (Seguridad Frontend)
        if (!authService.esAdmin()) {
            alert('Acceso denegado: Se requieren permisos de administrador.');
            window.location.href = 'Web_principal.html';
            return;
        }

        // Variables para las instancias de los gráficos (para poder destruirlos y redibujarlos)
        this.chartTop = null;
        this.chartPay = null;
        this.chartType = null;

        // 2. Configurar filtros de fecha (Listeners de los chips)
        this.configurarFiltros();
        
        // 3. Cargar datos iniciales (por defecto "mes")
        await this.cargarDatos('mes');
    }

    async cargarDatos(periodo, fechaInicio = null, fechaFin = null) {
        try {
            // Mostrar estado de carga visual en los números
            this.mostrarLoadingKPIs();

            // 1. Consulta GraphQL para obtener Datos Gráficos
            const queryGraficos = `
                query ObtenerDatosGraficos($periodo: String, $fechaInicio: String, $fechaFin: String) {
                    obtenerDatosGraficos(periodo: $periodo, fechaInicio: $fechaInicio, fechaFin: $fechaFin) {
                        datos {
                            topProductos { nombre cantidadVendida }
                            metodosPago { metodo cantidad }
                            tiposEntrega { tipo cantidad }
                        }
                    }
                }
            `;

            // 2. Consulta GraphQL para obtener Reporte Consolidado (KPIs numéricos)
            const queryKPIs = `
                query ObtenerReporteConsolidado($periodo: String, $fechaInicio: String, $fechaFin: String) {
                    obtenerReporteConsolidado(periodo: $periodo, fechaInicio: $fechaInicio, fechaFin: $fechaFin) {
                        reporte {
                            totalVentas
                            cantidadPedidos
                            ticketPromedio
                            resumenProductos { totalProductosVendidos }
                            resumenMetodosPago { metodoMasUsado }
                            resumenTiposEntrega { tipoMasUsado }
                        }
                    }
                }
            `;

            const variables = { periodo, fechaInicio, fechaFin };

            // Ejecutar ambas consultas en paralelo para mayor velocidad
            const [resGraficos, resKPIs] = await Promise.all([
                GQL.request(queryGraficos, variables),
                GQL.request(queryKPIs, variables)
            ]);

            const datosGraficos = resGraficos.obtenerDatosGraficos.datos;
            const reporte = resKPIs.obtenerReporteConsolidado.reporte;

            // 3. Renderizar todo en pantalla
            this.renderizarKPIs(reporte);
            this.renderizarGraficos(datosGraficos);

        } catch (error) {
            console.error('❌ Error cargando dashboard:', error);
            alert('Error cargando datos del reporte: ' + error.message);
        }
    }

    configurarFiltros() {
        // Lógica para los chips (Hoy, Mes, Año)
        document.querySelectorAll('.chip[data-mode]').forEach(chip => {
            chip.addEventListener('click', (e) => {
                // Actualizar UI (clase active)
                document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                
                const modo = e.target.dataset.mode;
                this.mostrarInputFecha(modo);
                
                // Si no es personalizado, cargar datos inmediatamente
                if (modo !== 'personalizado') {
                    this.cargarDatos(modo);
                }
            });
        });
        
        // Listener simple para botón exportar (Simulado por ahora en el frontend, real en backend)
        const btnExport = document.getElementById('btn-export');
        if (btnExport) {
            btnExport.addEventListener('click', () => alert('Funcionalidad de exportación disponible en Backend'));
        }
    }

    mostrarInputFecha(modo) {
        Utilidades.toggleElemento(document.getElementById('box-dia'), modo === 'dia');
        Utilidades.toggleElemento(document.getElementById('box-mes'), modo === 'mes');
        Utilidades.toggleElemento(document.getElementById('box-anio'), modo === 'anio');
    }

    mostrarLoadingKPIs() {
        ['kpi-sales', 'kpi-prod', 'kpi-pay', 'kpi-type'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.textContent = '...';
        });
    }

    renderizarKPIs(reporte) {
        // Ventas Totales
        document.getElementById('kpi-sales').textContent = Utilidades.formatearPrecio(reporte.totalVentas);
        document.getElementById('kpi-sales-sub').textContent = `${reporte.cantidadPedidos} pedidos`;

        // Producto Top (Unidades totales)
        document.getElementById('kpi-prod').textContent = reporte.resumenProductos.totalProductosVendidos;
        document.getElementById('kpi-prod-sub').textContent = 'unidades vendidas';

        // Pago Favorito
        document.getElementById('kpi-pay').textContent = reporte.resumenMetodosPago.metodoMasUsado.toUpperCase();
        document.getElementById('kpi-pay-sub').textContent = 'más usado';

        // Entrega Favorita
        document.getElementById('kpi-type').textContent = reporte.resumenTiposEntrega.tipoMasUsado.toUpperCase();
        document.getElementById('kpi-type-sub').textContent = 'más solicitado';
    }

    renderizarGraficos(datos) {
        // 1. Gráfico de Barras: Top Productos
        const labelsProd = datos.topProductos.map(p => p.nombre);
        const dataProd = datos.topProductos.map(p => p.cantidadVendida);

        this.crearGrafico('chartTop', 'bar', labelsProd, dataProd, 'Unidades', ['#ffc107']);

        // 2. Gráfico de Dona: Métodos de Pago
        const labelsPay = datos.metodosPago.map(m => m.metodo.toUpperCase());
        const dataPay = datos.metodosPago.map(m => m.cantidad);

        this.crearGrafico('chartPay', 'doughnut', labelsPay, dataPay, 'Pedidos', ['#ffc107', '#343a40', '#dc3545']);

        // 3. Gráfico de Torta: Tipos de Entrega
        const labelsType = datos.tiposEntrega.map(t => t.tipo.toUpperCase());
        const dataType = datos.tiposEntrega.map(t => t.cantidad);

        this.crearGrafico('chartType', 'pie', labelsType, dataType, 'Pedidos', ['#0dcaf0', '#198754']);
    }

    crearGrafico(canvasId, tipo, labels, data, labelDatos, colores) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        // Destruir gráfico anterior si existe para evitar superposiciones (glitch visual común)
        if (this[canvasId] instanceof Chart) {
            this[canvasId].destroy();
        }

        // Crear nuevo gráfico
        this[canvasId] = new Chart(ctx, {
            type: tipo,
            data: {
                labels: labels,
                datasets: [{
                    label: labelDatos,
                    data: data,
                    backgroundColor: colores,
                    borderColor: '#212529',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#ccc' } }
                },
                scales: tipo === 'bar' ? {
                    y: { beginAtZero: true, ticks: { color: '#ccc' } },
                    x: { ticks: { color: '#ccc' } }
                } : {}
            }
        });
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
            console.log('🔄 Cargando catálogo completo...');

            // Lista de todas las categorías que tu negocio maneja
            const categoriasAContenedor = [
                'promos', 
                'sandwiches', 
                'paninis', 
                'acompanamientos', 
                'bebibles', 
                'experimentos'
            ];
            
            // Recorremos todas las categorías
            // Si el contenedor existe en la página actual, cargamos sus productos.
            const promesasCarga = categoriasAContenedor.map(cat => {
                const contenedorId = `contenedor-${cat}`;
                const contenedor = document.getElementById(contenedorId);
                
                if (Utilidades.elementoExiste(contenedor)) {
                    console.log(`📦 Cargando categoría: ${cat}`);
                    return productService.renderProductosCategoria(cat);
                }
                return Promise.resolve(); // Si no está en esta página, no hacemos nada
            });
            
            // Esperamos a que todas terminen
            await Promise.all(promesasCarga);
            
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
        // 1. FORMULARIO LOGIN
        if (Utilidades.elementoExiste(ElementosDOM.formLogearse)) {
            ElementosDOM.formLogearse.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('login-Email').value;
                const pass = document.getElementById('login-contraseña').value;
                await authService.login(email, pass);
            });
        }

        // 2. BRIDGE: ABRIR MODAL REGISTRO (Botón "Crear Cuenta")
        if (Utilidades.elementoExiste(ElementosDOM.btnRegistrarse)) {
            ElementosDOM.btnRegistrarse.addEventListener('click', () => {
                // Cerrar login primero
                const modalLogin = bootstrap.Modal.getInstance(ElementosDOM.loginModal);
                if (modalLogin) modalLogin.hide();

                // Abrir registro
                const modalReg = new bootstrap.Modal(document.getElementById('registroModal'));
                modalReg.show();
            });
        }

        // 3. BRIDGE: VOLVER AL LOGIN (Botón "Volver")
        const btnVolver = document.getElementById('btn-volver-login');
        if (btnVolver) {
            btnVolver.addEventListener('click', () => {
                const modalReg = bootstrap.Modal.getInstance(document.getElementById('registroModal'));
                if (modalReg) modalReg.hide();

                const modalLogin = new bootstrap.Modal(ElementosDOM.loginModal);
                modalLogin.show();
            });
        }

        // 4. SUBMIT REGISTRO (¡AQUÍ RECOLECTAMOS TODO!)
        const formRegistro = document.getElementById('form-registro-completo'); // Ojo con el ID del form
        if (formRegistro) {
            formRegistro.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Recolectar datos del formulario gigante
                const datos = {
                    nombre: document.getElementById('reg-nombre').value,
                    run: document.getElementById('reg-run').value,
                    fechaNacimiento: document.getElementById('reg-fecha').value,
                    sexo: document.getElementById('reg-sexo').value,
                    email: document.getElementById('reg-email').value,
                    telefono: document.getElementById('reg-telefono').value,
                    password: document.getElementById('reg-pass').value,
                    region: document.getElementById('reg-region').value,
                    provincia: document.getElementById('reg-provincia').value,
                    direccion: {
                        calle: document.getElementById('reg-direccion').value,
                        comuna: document.getElementById('reg-comuna').value,
                        ciudad: 'Santiago' // Valor por defecto, ya que no lo pedimos explícitamente
                    }
                };

                // ¡Mandamos el paquete completo!
                await authService.register(datos);
            });
        }

        // Logout
        if (Utilidades.elementoExiste(ElementosDOM.btnLogout)) {
            ElementosDOM.btnLogout.addEventListener('click', () => authService.logout());
        }
        
        console.log('🔐 Listeners de autenticación registrados (Completo)');
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