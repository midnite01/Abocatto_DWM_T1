// =================== ESTRUCTURA BASE APP.JS ===================
// Versión: INTEGRACIÓN REAL (Backend: localhost:3000)

// =================== LÓGICA GLOBAL DE LA APLICACIÓN ===================

// ----------------- CONFIGURACIÓN Y CLIENTE GRAPHQL (Nuestro "Mini-Apollo") ----------------- 
/*
Este bloque CONFIG es el centro de control para no repetir texto a lo largo del código y mantener el orden en la memoria del navegador.
Todo lo que se va a guardar en localStorage, se definen aquí.
*/
const CONFIG = {
    API_URL: 'http://localhost:3000/graphql', // URL del servidor GraphQL
    CAR_KEY: 'carrito_bocatto',
    USER_KEY: 'usuario_bocatto',
    ROLES: { VISITANTE: 'visitante', CLIENTE: 'cliente', ADMIN: 'admin' }
};
// —----------------------------- LÓGICA : CLASE GQL- MANEJO DE PETICIONES —-----------*/
/* 
Esta clase estática centraliza la comunicación. Toma la orden (query/variables), 
busca si hay un usuario logueado para inyectar su token, y maneja la respuesta cruda del servidor.
*/
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

// —-----------------------------LÓGICA : STORE/ ESTADO GLOBAL DE LA APLICACIÓN—-----------
/* 
Aquí vive la "verdad" de la app en tiempo de ejecución.
En lugar de tener variables sueltas, todo se agrupa en 'EstadoApp'.
Esto facilita el debugging porque puedes escribir 'EstadoApp' en la consola y ver todo.
Esta es la Memoria RAM de tu aplicación frontend. Mientras la página esté abierta, aquí viven los datos.
EstadoApp solo guarda lo que necesitas acceder rápidamente y en múltiples lugares.
*/
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


// -----------------------------LÓGICA : MAPEO DEL DOM -----------
/* 
Se capturan todos los elementos HTML por su ID y se guardan en un objeto. 
IMPORTANTE: Como este script se carga en todas las páginas (Home, Menú, Pagos),
muchos de estos elementos serán 'null' dependiendo de en qué página esté el usuario.
Por ejemplo: 'btn-confirmar-compra' será null si estoy en el Home.
Es un diccionario para tener "a mano" todos los botones y cajas del HTML.
*/
const ElementosDOM = {
    // NAVBAR (13 elementos)
    navbarPrincipal: document.getElementById('navbarPrincipal'),
    logoBocatto: document.getElementById('logoBocatto'),
    btnRespMov: document.getElementById('btn-resp-mov'),
    navbarContent: document.getElementById('navbarContent'),
    btnMenu: document.getElementById('btn-menu'),
    btnPerfil: document.getElementById('btn-perfil'),
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

// ---------------------LOGICA : UTILIDADES GLOBALES -----------------
//Es tu caja de herramientas. Son funciones "tontas" (puras) que no saben nada del negocio, solo hacen tareas repetitivas.

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

// -------------------------LOGICA : INICIALIZACIÓN BASE -----------------------
// Esta función corre al cargar la app, para preparar el estado inicial. Es el "arranque en frío". Se ejecuta apenas el navegador lee el archivo.
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

/*
====================================== LOGICA DE AUTENTICACIÓN (AuthService) GESTION DE USUARIO ======================================
Esta clase administra el ciclo de vida del usuario: Inicio de sesión, Registro, 
Cierre de sesión y Persistencia (mantener la cuenta abierta al recargar).
También actúa como "Controlador de UI", mostrando u ocultando botones según el rol (Admin/Cliente).
======================================================================================================================================
*/


/* No se hasta donde esto es una simulacion 
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
    */

// --------------------------- METODO: LOGIN INTEGRADO CON BACKEND ---------------------------
/*
Este método es el encargado de autenticar a un usuario frente al servidor. Toma el correo y la contraseña ingresados, los envía al Backend para su verificación y, 
si son correctos, guarda la "llave" (token) que permite al usuario navegar como alguien identificado.
*/
class AuthService {
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
            console.error('❌ Error en login:', error.message);// Error: UI bloqueante. Usar 'alert' detiene la ejecución del hilo principal.Solución: Reemplazar por un mensaje en el DOM (ej: div .alert-danger dentro del modal).
            alert('Error al iniciar sesión: ' + error.message); // ¿por que dice que detiene el hilo principal? ¿ a que se refiere con eso?
            return { exito: false, error: error.message };
        } finally {
            EstadoApp.ui.cargando = false;
            this.mostrarLoadingLogin(false);
        }
    }

// —-----------------------------METODO : REGISTRO INTEGRADO CON EL BACKEND —-----------
/*
Este método maneja la creación de una cuenta nueva. Es más complejo que el login porque debe empaquetar un formulario extenso (Nombre, RUT, Dirección, etc.) 
y enviarlo al servidor. Si todo sale bien, inicia sesión automáticamente para que el usuario no tenga que loguearse después de registrarse.
*/
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

// —----------------------------- METODO : LOGOUT -----------
/*
Este método se encarga de cerrar la sesión del usuario. A diferencia del Login o Registro, esta es una operación principalmente local: se trata de "olvidar" 
quién es el usuario en el navegador para que vuelva a ser un visitante anónimo.
*/ 
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

// -------------------------- METODO: VERIFICAR SESIÓN EXISTENTE----------------
/*
Este método se ejecuta automáticamente cuando la página carga (dentro de inicializarBase o AppInicializador). 
Su misión es revisar si el usuario dejó una sesión abierta anteriormente para no obligarlo a loguearse de nuevo.
*/
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

// ------------------------------METODO: ACTUALIZACIÓN DE INTERFAZ-------------------------
/*
Estos métodos son los tramolla. Se llaman inmediatamente después de que cambia el estado de la sesión (EstadoApp.usuario) 
para reflejar esos cambios en la pantalla.
*/
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

//—----------------------------- GESTIÓN VISUAL DE ROLES —-----------
/*
Este conjunto de funciones se encarga de adaptar la interfaz (HTML) basándose en el "sombrero" que lleva puesto el usuario (Visitante, Cliente o Admin). 
Se ejecuta cada vez que cambia el estado de la sesión.
*/ 
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
                if (Utilidades.elementoExiste(ElementosDOM.btnPerfil)) {
                    ElementosDOM.btnPerfil.hidden = false; 
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
                if (Utilidades.elementoExiste(ElementosDOM.btnPerfil)) {
                    ElementosDOM.btnPerfil.hidden = false;
                }
                break;

            case CONFIG.ROLES.ADMIN:
                if (Utilidades.elementoExiste(ElementosDOM.btnAdmin)) {
                    ElementosDOM.btnAdmin.hidden = false;
                }
                if (Utilidades.elementoExiste(ElementosDOM.btnLogout)) {
                    ElementosDOM.btnLogout.hidden = false;
                }
                if (Utilidades.elementoExiste(ElementosDOM.btnPerfil)) {
                    ElementosDOM.btnPerfil.hidden = false;
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
            ElementosDOM.btnLogout,
            ElementosDOM.btnPerfil
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

// --------------------------------------- MANEJO DE MODALES----------------------
/*
Este bloque contiene utilidades para manipular las ventanas emergentes (Modales) y paneles laterales (Offcanvas) de Bootstrap mediante JavaScript.
*/
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

    //-------------------------FEEDBACK VISUAL---------------------------------------
    /*
    Este bloque gestiona la comunicación inmediata con el usuario mientras el sistema "piensa" o cuando algo sale mal.
    */ 
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
/*
    // 8. UTILIDADES Esto al parecer es una simulacion que ya no se usa borrar hasa la liena 570
    generarTokenSimulado(usuarioId) {
        // En realidad sería un JWT del backend
        return `simulated_token_${usuarioId}_${Date.now()}`;
    }
*/
//-------------------------GETTERS-----------------------------------
/*
Son fiunciones que devuelven información del estado actual del usuario.
*/ 
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

/* 
================================ LOGICA DEL CARRITO ============================================
Esta clase maneja toda la lógica del carrito: añadir productos, modificar cantidades,
calcular totales y persistir la información en localStorage para que no se pierda al recargar.
También actúa como puente hacia la pasarela de pago ('Ges_pagos.html').
================================================================================================
*/


class CarritoService {
    constructor() {
        this.cargarCarritoInicial();
    }

// ----------------------------- METODO : INICIALIZACION Y PERSISTENCIA DEL CARRITO------------------- 
//Este bloque se encarga de que el carrito de compras "sobreviva" a los refrescos de página (F5) o al cierre del navegador.
    cargarCarritoInicial() {
        EstadoApp.carrito = Utilidades.cargarDesdeStorage(CONFIG.CAR_KEY, []);
        console.log(`🛒 Carrito cargado: ${EstadoApp.carrito.length} items`);
    }

    persistirCarrito() {
        Utilidades.guardarEnStorage(CONFIG.CAR_KEY, EstadoApp.carrito);
    }
/* —----------------------------- METODO : GESTIÓN DE ITEMS (CRUD Local) -----------*/
// Este bloque maneja la lógica principal del carrito, meter cosas al carrito, es donde el Frontend decide qué estructura de datos enviar al Backend después.
    async agregarAlCarrito(nombre, precio, imagen, productoId = null) {
        try {
            // Verificar autenticación para clientes
            if (!authService.estaAutenticado() || !authService.esCliente()) {
                this.mostrarErrorAutenticacion();
                return { exito: false, error: 'Autenticación requerida' };
            }

            const producto = {
                id: productoId,
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

//--------------------------------------ACTUALIZAR CANTIDADES---------------------------------------------------------------------------
/* 
Este conjunto de funciones permite al usuario manipular los productos que ya están dentro del carrito (subir cantidad, bajar cantidad o borrarlos)
y asegura que la vista siempre refleje esos cambios.
*/
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
                    console.log(`➕ Incrementado: ${item.nombre} (${item.cantidad})`);// Aqui el boton para agregar del mismo producto 
                    break;

                case 'decrementar':
                    item.cantidad--;
                    if (item.cantidad <= 0) {
                        EstadoApp.carrito.splice(itemIndex, 1);
                        console.log(`🗑️ Eliminado: ${item.nombre}`);
                    } else {
                        console.log(`➖ Decrementado: ${item.nombre} (${item.cantidad})`);// Aqui el boton para restar del mismo producto
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

//---------------------------------ELIMINAR PRODUCTO DEL CARRITO----------------------------------
/*
Esta función es responsable de la eliminación de un ítem del carrito. Se activa cuando el usuario presiona el botón de "Papelera" o "X" al lado de un producto.
*/
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

//----------------------------------------VACIAR CARRITO-----------------------------------------------
// Esta función elimina todos los ítems del carrito de una sola vez.
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

//-----------------------------------------RENDERIZADO DEL CARRITO---------------------------------------
/*
Este conjunto de funciones transforma los datos abstractos del array EstadoApp.carrito en elementos HTML visibles para el usuario. 
Se divide en dos áreas principales: el Badge (globito rojo en el menú) y el Offcanvas (panel lateral con la lista de productos).
*/
    renderCarrito() {
        this.actualizarBadgeCarrito();
        
        // Si no existe el offcanvas del carrito en esta página, salir
        if (!Utilidades.elementoExiste(ElementosDOM.carritoItems)) {
            return;
        }

        this.renderOffcanvasCarrito();
    }
// Actualiza el globito rojo del carrito en el navbar
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
// Esta función es la que construye la lista de productos "desde cero" cada vez que hay un cambio.
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

// -----------------------------CÁLCULOS------------------------------------------
// Estas funciones realizan los cálculos necesarios para mostrar totales y resúmenes del carrito.
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

//---------------------------- PROCESAR PEDIDO ------------------------------------------------
//Esta función es el puente crítico entre la selección de productos y la finalización de la compra. Se ejecuta cuando el usuario presiona el botón "Hacer Pedido" en el carrito.

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

//--------------------------------------FEEDBACK VISUAL-----------------------------------------
/* 
Este bloque se encarga de dar retroalimentación inmediata al usuario. Confirman acciones exitosas o explican errores de forma amigable y proactiva.
*/
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

//-----------------------GETTERS------------------------------------------
    estaVacio() {
        return EstadoApp.carrito.length === 0;
    }

    obtenerCantidadProductos() {
        return EstadoApp.carrito.length;
    }
}

// Instancia global del servicio
const carritoService = new CarritoService();

/* ============================================= LOGICA DE PRODUCTOS ======================================
Esta clase administra el inventario de productos: Carga inicial, CRUD (Crear, Leer, Actualizar, Eliminar)
conectado al Backend GraphQL, y la renderización dinámica de las tarjetas en el HTML.
También gestiona la apertura y cierre de los modales de administración.
===========================================================================================================
*/

class ProductService {

//--------------------------------------- LECTURA DE DATOS DESDE EL BACKEND-------------------------------------------
// Esta función es la responsable de llenar los estantes. Puede traer todo el catálogo de una sola vez o traer solo una categoría específica.
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

//----------------------------OBTENER PRODUCTO POR ID REAL (Conectado al Backend)-------------------------------------------------------
/* 
Esta función tiene una misión específica: recuperar los datos frescos de un solo producto desde el servidor. 
Es fundamental para la función de Editar Producto, ya que necesitamos llenar el formulario con los datos actuales antes de permitir cambios.
*/ 
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
    
//-------------------------------------------CREAR PRODUCTO-----------------------------------------
/* 
Esta función tiene la misión de insertar un nuevo registro en la base de datos. A diferencia de las funciones de lectura, esta implica una escritura, por lo que requiere permisos elevados y un manejo cuidadoso de los tipos de datos antes de enviarlos.
*/
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

//-----------------------------------------------ACTUALIZAR PRODUCTO-------------------------------------------------------
/* 
Esta función permite modificar las propiedades de un producto existente en la base de datos. Es una operación delicada porque debe respetar los datos que NO queremos 
cambiar y solo actualizar los que sí.
*/ 
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

//-------------------------------------------------- ELIMINAR PRODUCTO -----------------------------------------------------
/*
Esta función elimina un ítem de la base de datos y, lo más importante, actualiza la interfaz visual inmediatamente para que el producto desaparezca de la lista sin necesidad de presionar F5.
*/
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

//---------------------------------- RENDERIZADO DE PRODUCTOS EN EL HTML -------------------------------------------
/*
Esta función se encarga de poblar una sección específica del menú (ej: "Sandwiches" o "Bebidas") con los productos correspondientes traídos desde el Backend.
*/

    async renderProductosCategoria(categoria) {
        // TRUCO INTELIGENTE: 
        // Si la categoría viene de la BD como "acompañamientos", la traducimos al ID "acompanamientos"
        let sufijoId = categoria;
        if (categoria === 'acompañamientos') {
            sufijoId = 'acompanamientos';
        }
                // Error Relacionado al #4: Aquí está el manejo de la "ñ".
        // La lógica asume que el ID del HTML es 'contenedor-acompanamientos' (sin ñ) 
        // pero que la categoría en la BD es 'acompañamientos' (con ñ).
        // Si al refrescar la página, el 'AppInicializador' llama a esta función usando el string 'acompañamientos',
        // esta lógica funciona. PERO, si el Backend devuelve la categoría normalizada sin ñ, o si hay un mismatch
        // entre lo que espera 'obtenerProductos' y lo que hay en BD, la lista volverá vacía.
        // SOLUCIÓN: Revisar estrictamente qué string exacto está guardado en MongoDB para los productos de esa categoría.

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

// —--------------------------------CREACION DE PRODUCTO-------------------------------------
/*
Esta función toma un objeto de datos (JSON) y lo convierte en una cadena de texto (String) que contiene código HTML. Este HTML representa una "tarjeta" visual usando clases 
de Bootstrap.
*/
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

//----------------------------------MANEJO DEL MODAL DE PRODUCTOS-------------------------------------------
/* 
Este bloque contiene las funciones que se ejecutan antes de que el administrador vea el formulario. Su trabajo es limpiar los campos (si es agregar) o rellenarlos con datos 
existentes (si es editar).
*/
    abrirModalAgregarProducto(categoria) {                                       // ... (Resetear form y abrir modal con Bootstrap) quizas aqui falta una funcion que cierre el modal despues de guardar asi se resuelve el problema da la parlisis
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

        try {// ... (Bloquear botón y mostrar spinner)
            textoBtn.style.display = 'none';
            spinner.style.display = 'inline-block';
            btnGuardar.disabled = true;

            const datos = {// Recolectar datos del formulario
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
            // Error Relacionado al #5: "La página paraliza el scroll".
            // Este bloque 'finally' contiene la lógica explícita para forzar la reactivación del scroll.
            // Si Bootstrap falla al limpiar sus clases (algo común si el modal se cierra o renderiza rápido),
            // estas líneas fuerzan al navegador a quitar 'modal-open' y restaurar 'overflow: auto'.
            // OBSERVACIÓN: Es un parche efectivo, pero indica que el manejo del ciclo de vida del modal de Bootstrap podría ser inestable. ¿por qué el ciclo de vida del modal bootstrap es inestable?¿nosotros lo hicimos inestable?

            // 1. Restaurar botón
            textoBtn.textContent = 'Guardar';
            textoBtn.style.display = 'inline-block';
            spinner.style.display = 'none';
            btnGuardar.disabled = false;

            // 2. DESALOJO FORZOSO DEL MODAL
            const modalElement = ElementosDOM.modalAddProduct;
            
             /*// Intento diplomático (Bootstrap)
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) modalInstance.hide();
*/
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
        // Fin de la violencia 

//--------------------------------------------------------GETTERS--------------------------------------------------------
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

/* ====================================== LOGICA: GESTION DE PROCESO DE PAGO =============================================
Esta clase controla la interfaz de usuario en la página de pago ('Ges_pagos.html').
Sus funciones principales son:
1. Alternar la visibilidad de formularios (Delivery vs Retiro, Tarjeta vs Efectivo).
2. Recopilar todos los datos del formulario y del carrito.
3. Enviar la Mutation 'crearPedido' al Backend.
4. Redirigir al usuario a la pantalla de validación ('Val_pago.html').
=======================================================================================================================
*/

//------------------------- INICIALIZACIÓN DEL SERVICIO DE CHECKOUT ------------------------------
/* Este bloque es el portero lógico del proceso de pago. Su función principal es asegurarse de que el código del checkout solo se ejecute cuando el usuario está físicamente 
en la página de pagos, evitando errores en otras páginas.
*/
class CheckoutService {
    constructor() {
        if (document.getElementById('lista-resumen-checkout')) {
            this.inicializarCheckout();
        }
    }
//------------------------------- INICIALIZACIÓN Y REGISTRO DE EVENTOS --------------------------------
/* Es el orquestador. Llama a las dos funciones vitales para que la página sea útil: mostrar qué estás comprando (renderizarResumen) y permitirte interactuar con el formulario
(registrarEventos).
*/
    inicializarCheckout() {
        console.log('💳 Inicializando Checkout...');
        this.renderizarResumen();
        this.registrarEventos();
    }

    registrarEventos() {

        //Tipo de Entrega
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

        //Método de Pago
        const radiosPago = document.querySelectorAll('input[name="metodoPago"]');
        radiosPago.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const esTarjeta = e.target.value === 'tarjeta';
                Utilidades.toggleElemento(document.getElementById('seccion-tarjeta'), esTarjeta);
                Utilidades.toggleElemento(document.getElementById('seccion-info-contraentrega'), !esTarjeta);
            });
        });

        //Botón Confirmar Compra (INTEGRACIÓN REAL)
        const btnConfirmar = document.getElementById('btn-confirmar-compra');
        if (btnConfirmar) {
            btnConfirmar.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.procesarCompra();
            });
        }
    }
//—-----------------------------CREACIÓN DEL PEDIDO----------------------------------------------
//Esta función recopila toda la información dispersa (carrito, usuario, formulario de dirección, método de pago), la empaqueta y crea la orden en el sistema.
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
                const ciudad = document.getElementById('input-ciudad').value || 'Santiago'; // Valor por defecto
                
                if (!calle || !comuna) {
                    alert('Debes ingresar una dirección para el despacho (Calle y Comuna)');
                    return;
                }
                
                direccionEntrega = {
                    calle: calle,
                    comuna: comuna,
                    ciudad: ciudad,
                    notas: notas
                };
            }

            // Preparar datos de pago (Datos REALES ahora)
            // Solución al Problema 1.2 y 3: Leemos los inputs reales del HTML.
            let datosTarjetaParaPasarela = null; 
            let ultimos4Digitos = null;

            if (metodoPago === 'tarjeta') {
                // Lectura de inputs
                const numero = document.getElementById('card-numero').value.replace(/\s/g, '');
                const nombre = document.getElementById('card-nombre').value;
                const exp = document.getElementById('card-exp').value; // MM/AA
                const cvv = document.getElementById('card-cvv').value;
                const guardarTarjeta = document.getElementById('guardar-tarjeta')?.checked || false;

                // 🔥 AGREGA ESTA LÍNEA PARA ESPIAR:
    console.log('🕵️‍♂️ [APP.JS] Checkbox guardar detectado como:', guardarTarjeta);

                // Validación de campos llenos (Solución Problema 3)
                if (!numero || numero.length < 13 || !nombre || !exp || !cvv) {
                    alert('Por favor completa todos los datos de la tarjeta para continuar');
                    return;
                }

                const [mes, anio] = exp.split('/');

                // Empaquetamos los datos REALES para pasárselos a la siguiente página (Val_pago.html)
                datosTarjetaParaPasarela = {
                    numero,
                    nombreTitular: nombre,
                    mesVencimiento: mes,
                    anioVencimiento: anio,
                    cvv,
                    guardarTarjeta // Este flag es importante para el Problema 1.1
                };

                // Extraemos los últimos 4 para el registro histórico del pedido
                ultimos4Digitos = numero.slice(-4);
            }

            // Objeto de pago para la base de datos (Pedido)
            // Ya no usamos simulaciones fijas, usamos lo que el usuario escribió.
            const datosPago = {
                metodo: metodoPago,
                ultimosDigitos: ultimos4Digitos, // Ahora es dinámico o null
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

            // PUENTE CRÍTICO: Guardamos los datos de tarjeta para que Val_pago.html los use
            if (datosTarjetaParaPasarela) {
                sessionStorage.setItem('datos_tarjeta_temp', JSON.stringify(datosTarjetaParaPasarela));
            }

            // Vaciar carrito local (ya está en la DB)
            await carritoService.vaciarCarrito();

            // Redirigir a validación de pago
            window.location.href = 'Val_pago.html';

        } catch (error) {
            console.error('❌ Error al crear pedido:', error);
            alert('Hubo un error al procesar tu pedido: ' + error.message);
            const btn = document.getElementById('btn-confirmar-compra');
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Confirmar Compra';
            }
        }
    }

//------------------------------- RENDERIZADO DEL RESUMEN DEL PEDIDO --------------------------------
// Dibuja la lista pequeña de productos en el lado derecho de la pantalla de pago.
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
/* 
====================================== LOGICA DE ORDER Est_pedido.html SEGUIMIENTO =======================================================
Este bloque es el punto de partida para toda la lógica post-venta
==========================================================================================================
*/

//------------------------- INICIALIZACIÓN DEL SERVICIO DE PEDIDOS ------------------------------
/* 
Este bloque es el punto de partida para toda la lógica post-venta. Su función principal es detectar el contexto (la página actual) y activar solo las funciones necesarias, 
evitando errores por intentar manipular elementos que no existen.
*/
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

//-----------------------------TRACKING-------------------------------------------------------------
//Este bloque se encarga de consultar el estado de un pedido específico y actualizar la barra de progreso visual.
    
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
//------------------------------- RENDERIZADO DEL TRACKING ---------------------------------------------
// Esta función traduce el estado del backend (texto) a una representación visual (pasos iluminados).
    renderizarTracking(pedido) {
        // Datos básicos
        const elId = document.getElementById('track-id');
        const elFecha = document.getElementById('track-fecha');
        
        // Error Potencial: Formato de Fecha.
        // Si 'createdAt' viene del backend como string ISO ("2023-10..."), 'Number()' devolverá NaN.
        // Solución: Usar 'new Date(pedido.createdAt)' directamente o verificar el formato antes de castear.
        if (elId) elId.textContent = pedido.numeroBoleta || pedido.id.slice(-6);
        if (elFecha) elFecha.textContent = new Date(Number(pedido.createdAt)).toLocaleDateString();

        // Lógica de Pasos (Stepper)
        const estadosOrden = ['confirmado', 'en_preparacion', 'en_camino', 'entregado'];
        const pasosDOM = document.querySelectorAll('.tracker-step'); 

        let indiceActual = -1;
        let estadoNormalizado = pedido.estado;
        
        // Normalización de estados del Backend (8 tipos) a estados Visuales (4 pasos)
        if (pedido.estado === 'pendiente') indiceActual = -1;
        else if (pedido.estado === 'listo_retiro') estadoNormalizado = 'en_camino';
        else if (pedido.estado === 'retirado') estadoNormalizado = 'entregado';
        
                // Error Relacionado al #3 (Progreso Real):
        // El array 'estadosOrden' NO incluye 'cancelado'. Si el pedido está cancelado, 'indexOf' devuelve -1.
        // Visualmente, el tracker se quedará vacío (ningún paso activo), lo cual puede confundir al usuario.
        // Solución: Agregar lógica específica para mostrar un estado de "Cancelado" o alerta roja.

        indiceActual = estadosOrden.indexOf(estadoNormalizado);

        pasosDOM.forEach((paso, index) => {
            // Error Relacionado al #2 (Contraste):
            // Aquí se asignan las clases '.active' y '.done'. Si el CSS de estas clases
            // tiene colores grises sobre fondo negro (como reportaste), aquí es donde el JS
            // "activa" ese estilo defectuoso. La corrección será CSS, pero el JS es el gatillante.
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

/* 
=====================================================LOGICA DE HISTORIAL DE PEDIDOS========================================================
Este bloque gestiona la visualización de la lista de compras del usuario. Se conecta al backend para traer los datos y luego usa lógica en el cliente (navegador) 
para filtrar y buscar sin volver a llamar al servidor.
===========================================================================================================================================
*/ 
//------------------------- INICIALIZACIÓN DEL SERVICIO DE PEDIDOS ------------------------------
/* 
Este bloque es el punto de partida para toda la lógica del historial de pedidos. Su función principal es detectar si estamos en la página correcta y activar solo las funciones 
necesarias, evitando errores por intentar manipular elementos que no existen.
*/
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

// ------------------------------- OBTENCIÓN DE PEDIDOS ----------------------------------------------
// Esta función consulta al backend para traer los pedidos del usuario actual.
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

//------------------------------- RENDERIZADO DEL HISTORIAL ----------------------------------------------
// Esta función dibuja la lista de pedidos en el HTML, aplicando filtros y búsqueda en el cliente.
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

//------------------------------- REGISTRO DE FILTROS Y BÚSQUEDA ----------------------------------------------
// Esta función configura los listeners para los filtros y la barra de búsqueda.
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

//------------------------------- MODAL DE BOLETA DETALLADA ----------------------------------------------
// Esta función llena y muestra el modal con los detalles de la boleta.
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
        // Error Potencial: Si 'window.bootstrap' no está cargado (CDN falló), esto crashea.
        const modalEl = document.getElementById('modalBoleta');
        if (modalEl && window.bootstrap) {
            new bootstrap.Modal(modalEl).show();
        }
    }
}

// Instancia global
const orderService = new OrderService();


/* ====================================== LOGICA: VALIDACION Y PROCESAMIENTO DE PAGOS =============================================
Esta clase controla la lógica de procesamiento de pagos en Val_pago.html.
Sus funciones principales son:
1. Procesar el pago (cobro) mediante la mutation procesarPago
2. Guardar la tarjeta del usuario si lo desea
3. Mostrar el estado de validación al usuario
4. Redirigir al tracking del pedido
=======================================================================================================================
*/

class PaymentValidationService {
    constructor() {
        // Detectar si estamos en Val_pago.html
        if (document.getElementById('box-loading')) {
            this.inicializarValidacionPago();
        }
    }

    // Mapeo del DOM de Val_pago.html
    getUIElements() {
        return {
            boxLoading: document.getElementById('box-loading'),
            boxOk: document.getElementById('box-ok'),
            boxFail: document.getElementById('box-fail'),
            msgStatus: document.getElementById('msg-status'),
            errorDetail: document.getElementById('error-detail'),
            timerSecs: document.getElementById('secs')
        };
    }

    inicializarValidacionPago() {
        console.log('💳 Inicializando Validación de Pago...');
        
        // Timer visual
        const ui = this.getUIElements();
        let s = 3;
        if (ui.timerSecs) ui.timerSecs.textContent = s;
        const timerInterval = setInterval(() => {
            if (s > 0) {
                if (ui.timerSecs) ui.timerSecs.textContent = --s;
            }
        }, 1000);

        // Iniciar proceso
        this.procesarPago().catch(error => {
            clearInterval(timerInterval);
            console.error('Error en procesamiento de pago:', error);
        });
    }

    async procesarPago() {
        const ui = this.getUIElements();

        try {
            // 1. Recuperar datos de SessionStorage
            const pedidoId = sessionStorage.getItem('pedido_actual_id');
            const metodoPago = sessionStorage.getItem('metodo_pago_actual');
            
            if (!pedidoId) {
                throw new Error('No se encontró orden activa.');
            }

            let datosTarjeta = null;
            let guardarTarjeta = false;

            // 2. Recuperar datos de tarjeta (si aplica)
            if (metodoPago === 'tarjeta') {
                const datosRaw = sessionStorage.getItem('datos_tarjeta_temp');
                if (datosRaw) {
                    const datosObj = JSON.parse(datosRaw);
                    guardarTarjeta = datosObj.guardarTarjeta;
                    // Limpiar el objeto para la API
                    datosTarjeta = {
                        numero: datosObj.numero,
                        mesVencimiento: datosObj.mesVencimiento,
                        anioVencimiento: datosObj.anioVencimiento,
                        cvv: datosObj.cvv,
                        nombreTitular: datosObj.nombreTitular
                    };
                }
            }

            // 3. Procesar Pago (Cobro)
            if (ui.msgStatus) ui.msgStatus.textContent = "Autorizando transacción...";
            console.log('💳 Procesando pago para pedido:', pedidoId);

            const mutationPago = `mutation ProcesarPago($pedidoId: ID!, $metodoPago: String!, $datosTarjeta: DatosTarjetaInput) {
                procesarPago(pedidoId: $pedidoId, metodoPago: $metodoPago, datosTarjeta: $datosTarjeta) {
                    transaccion { id estado }
                }
            }`;

            const respuestaPago = await GQL.request(mutationPago, {
                pedidoId,
                metodoPago,
                datosTarjeta
            });

            console.log('✅ Pago procesado:', respuestaPago);

            // 4. Guardar Tarjeta (Si usuario quiso)
            if (metodoPago === 'tarjeta' && guardarTarjeta && datosTarjeta) {
                if (ui.msgStatus) ui.msgStatus.textContent = "Guardando tarjeta en tu perfil...";
                console.log('💾 Intentando guardar tarjeta...');
                
                const mutationGuardar = `mutation GuardarMetodoPago($datosTarjeta: DatosTarjetaInput!, $alias: String, $usuarioId: ID!) {
                    guardarMetodoPago(datosTarjeta: $datosTarjeta, alias: $alias, usuarioId: $usuarioId) { metodoPago { id } }
                }`;
                console.log({
                        datosTarjeta: datosTarjeta,
                        alias: `Tarjeta terminada en ${datosTarjeta.numero.slice(-4)}`,
                        usuarioId: EstadoApp.usuario.id
                    });
                try {
                    
                    await GQL.request(mutationGuardar, {
                        datosTarjeta,
                        alias: `Tarjeta terminada en ${datosTarjeta.numero.slice(-4)}`,
                        usuarioId: EstadoApp.usuario.id
                    });
                    console.log('✅ Tarjeta guardada con éxito');
                } catch (e) {
                    console.warn('⚠️ Error al guardar tarjeta (pero pago exitoso):', e.message);
                }
            }

            // 5. Éxito
            sessionStorage.removeItem('datos_tarjeta_temp');
            if (ui.boxLoading) ui.boxLoading.classList.add('d-none');
            if (ui.boxOk) ui.boxOk.classList.remove('d-none');

            // Redirigir al tracking del pedido después de 2.5s
            setTimeout(() => {
                window.location.href = `Est_pedido.html?id=${pedidoId}`;
            }, 25000000);

        } catch (error) {
            console.error('❌ Error en validación de pago:', error);
            if (ui.boxLoading) ui.boxLoading.classList.add('d-none');
            if (ui.boxFail) ui.boxFail.classList.remove('d-none');
            if (ui.errorDetail) ui.errorDetail.textContent = error.message;
        }
    }
}

// Instancia global
const paymentValidationService = new PaymentValidationService();



/* ====== Logica: PROFILE SERVICE (Gestión de Datos del Usuario) ===================
   Esta clase maneja la vista 'Mi Perfil'. Se encarga de:
   1. Traer los datos personales y puntos desde el Backend.
   2. Gestionar la edición de datos (Nombre, Email, Dirección).
   3. Visualizar y Eliminar tarjetas guardadas.
   ====================================================== */

class ProfileService {
    constructor() {
        // Solo inicializar si estamos en la página de perfil
        if (document.getElementById('form-perfil-usuario')) {
            this.inicializarPerfil();
        }
    }

    async inicializarPerfil() {
        console.log('👤 Inicializando Perfil de Usuario...');
        
        if (!authService.estaAutenticado()) {
            alert('Debes iniciar sesión para ver tu perfil');
            window.location.href = 'Web_principal.html';
            return;
        }

        // 1. Cargar Datos Básicos
        await this.cargarDatosPerfil();
        
        // 2. Cargar Tarjetas Guardadas
        await this.cargarTarjetasGuardadas();
        
        // 3. Activar Botones del formulario
        this.registrarEventosPerfil();
    }

    // 1. CARGAR DATOS DEL PERFIL
    async cargarDatosPerfil() {
        try {
            this.mostrarLoading(true);

            const query = `
                query ObtenerMiPerfil {
                    obtenerPerfil {
                        id nombre email telefono puntos
                        direccion { calle comuna ciudad }
                    }
                }
            `;

            console.log('📡 Solicitando datos de perfil...');
            const data = await GQL.request(query);
            const usuario = data.obtenerPerfil;

            // Rellenar el Formulario
            if (document.getElementById('perfil-nombre')) 
                document.getElementById('perfil-nombre').value = usuario.nombre;

            if (document.getElementById('perfil-email')) 
                document.getElementById('perfil-email').value = usuario.email;

            if (document.getElementById('perfil-telefono')) 
                document.getElementById('perfil-telefono').value = usuario.telefono || '';

            if (usuario.direccion) {
                if (document.getElementById('perfil-direccion')) 
                    document.getElementById('perfil-direccion').value = usuario.direccion.calle || '';
                
                if (document.getElementById('perfil-comuna')) 
                    document.getElementById('perfil-comuna').value = usuario.direccion.comuna || '';
                    
                if (document.getElementById('perfil-region')) 
                    document.getElementById('perfil-region').value = 'Metropolitana';
            }

            if (document.getElementById('puntos-saldo')) {
                document.getElementById('puntos-saldo').textContent = usuario.puntos || 0;
            }

            console.log('✅ Datos de perfil cargados');

        } catch (error) {
            console.error('❌ Error cargando perfil:', error);
            alert('No se pudieron cargar tus datos: ' + error.message);
        } finally {
            this.mostrarLoading(false);
        }
    }

    // Utilidad interna
    mostrarLoading(cargando) {
        const inputs = document.querySelectorAll('#form-perfil-usuario input');
        inputs.forEach(input => input.disabled = cargando);
    }

    // 2. CARGAR TARJETAS GUARDADAS
    async cargarTarjetasGuardadas() {
        const contenedor = document.getElementById('lista-tarjetas');
        if (!contenedor) return;

        try {
            contenedor.innerHTML = '<div class="text-center text-muted">Cargando tarjetas...</div>';

            const query = `
                query ObtenerMisTarjetas {
                    obtenerMetodosPago {
                        id alias
                        datosTarjeta { ultimosDigitos tipo }
                    }
                }
            `;

            console.log('📡 Buscando tarjetas guardadas...');
            const data = await GQL.request(query);
            const tarjetas = data.obtenerMetodosPago;

            contenedor.innerHTML = '';

            if (!tarjetas || tarjetas.length === 0) {
                contenedor.innerHTML = `
                    <div class="alert alert-dark border-secondary text-center small">
                        <i class="bi bi-credit-card-2-front fs-4 d-block mb-2"></i>
                        No tienes tarjetas guardadas.
                    </div>
                `;
                return;
            }

            tarjetas.forEach(tarjeta => {
                let iconoMarca = 'bi-credit-card';
                if (tarjeta.datosTarjeta.tipo === 'visa') iconoMarca = 'bi-credit-card-2-back';

                const cardHTML = document.createElement('div');
                cardHTML.className = 'card bg-dark border-secondary mb-2';
                cardHTML.innerHTML = `
                    <div class="card-body d-flex justify-content-between align-items-center py-2 px-3">
                        <div class="d-flex align-items-center gap-3">
                            <i class="bi ${iconoMarca} fs-4 text-warning"></i>
                            <div>
                                <div class="fw-bold text-light small">${tarjeta.alias}</div>
                                <div class="text-muted small">Terminada en •••• ${tarjeta.datosTarjeta.ultimosDigitos}</div>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-outline-danger btn-borrar-tarjeta border-0" 
                                data-id="${tarjeta.id}" title="Eliminar tarjeta">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                `;
                contenedor.appendChild(cardHTML);
            });

            contenedor.querySelectorAll('.btn-borrar-tarjeta').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // Aquí accedemos a la función que está dentro de la MISMA clase
                    // usando 'e.currentTarget' para asegurar que tomamos el botón y no el ícono
                    const id = e.currentTarget.dataset.id;
                    this.eliminarTarjeta(id);
                });
            });

        } catch (error) {
            console.error('❌ Error cargando tarjetas:', error);
            contenedor.innerHTML = '<div class="text-danger small text-center">Error al cargar tarjetas</div>';
        }
    }

    // 3. GUARDAR CAMBIOS
    async guardarCambiosPerfil(event) {
        event.preventDefault();
        
        const btnGuardar = document.getElementById('btn-guardar-perfil');
        const spinner = document.getElementById('spinner-guardar-perfil');
        
        try {
            if (btnGuardar) btnGuardar.disabled = true;
            if (spinner) spinner.style.display = 'inline-block';

            const datosBasicos = {
                nombre: document.getElementById('perfil-nombre').value,
                email: document.getElementById('perfil-email').value,
                telefono: document.getElementById('perfil-telefono').value,
                direccion: {
                    calle: document.getElementById('perfil-direccion').value,
                    comuna: document.getElementById('perfil-comuna').value,
                    ciudad: 'Santiago'
                }
            };

            const mutationUpdate = `
                mutation ActualizarPerfil($nombre: String, $email: String, $telefono: String, $direccion: DireccionInput) {
                    actualizarUsuario(nombre: $nombre, email: $email, telefono: $telefono, direccion: $direccion) {
                        id nombre email
                    }
                }
            `;

            console.log('📡 Guardando datos básicos...');
            await GQL.request(mutationUpdate, datosBasicos);

            // Cambio de Contraseña (Opcional)
            const passActual = document.getElementById('perfil-pass-actual')?.value;
            const passNueva = document.getElementById('perfil-pass-nueva')?.value;

            if (passActual && passNueva) {
                console.log('🔐 Detectado cambio de contraseña...');
                const mutationPass = `
                    mutation CambiarPass($passwordActual: String!, $nuevoPassword: String!) {
                        cambiarPassword(passwordActual: $passwordActual, nuevoPassword: $nuevoPassword) {
                            success message
                        }
                    }
                `;
                const resPass = await GQL.request(mutationPass, { passwordActual: passActual, nuevoPassword: passNueva });
                if (!resPass.cambiarPassword.success) {
                    throw new Error(resPass.cambiarPassword.message);
                }
            }

            alert('¡Datos actualizados correctamente!');
            await this.cargarDatosPerfil();
            
            if (document.getElementById('perfil-pass-actual')) document.getElementById('perfil-pass-actual').value = '';
            if (document.getElementById('perfil-pass-nueva')) document.getElementById('perfil-pass-nueva').value = '';

        } catch (error) {
            console.error('❌ Error guardando perfil:', error);
            alert('Hubo un problema al guardar: ' + error.message);
        } finally {
            if (btnGuardar) btnGuardar.disabled = false;
            if (spinner) spinner.style.display = 'none';
        }
    }

    // 4. ELIMINAR TARJETA
    async eliminarTarjeta(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta tarjeta?')) return;

        try {
            const mutation = `
                mutation EliminarTarjeta($id: ID!) {
                    eliminarMetodoPago(id: $id) { success message }
                }
            `;

            console.log(`🗑️ Eliminando tarjeta ID: ${id}...`);
            const data = await GQL.request(mutation, { id });

            if (data.eliminarMetodoPago.success) {
                alert('Tarjeta eliminada correctamente');
                await this.cargarTarjetasGuardadas();
            } else {
                throw new Error(data.eliminarMetodoPago.message);
            }

        } catch (error) {
            console.error('❌ Error eliminando tarjeta:', error);
            alert('No se pudo eliminar la tarjeta: ' + error.message);
        }
    }

    // 5. REGISTRAR EVENTOS DEL PERFIL
    registrarEventosPerfil() {
        const form = document.getElementById('form-perfil-usuario');
        if (form) {
            form.addEventListener('submit', (e) => this.guardarCambiosPerfil(e));
        }
        
        const btnTogglePass = document.getElementById('btn-toggle-pass');
        if(btnTogglePass) {
            btnTogglePass.addEventListener('click', (e) => {
               e.preventDefault();
               const containerPass = document.getElementById('container-cambio-pass');
               if(containerPass) {
                   containerPass.classList.remove('d-none');
                   btnTogglePass.style.display = 'none';
               }
            });
        }
    }
} // <--- ¡AQUÍ CIERRA LA CLASE! Esta es la llave que faltaba en el lugar correcto.

// Instancia global del servicio
const profileService = new ProfileService();
/* 
================================ LOGICA DE LOS REPORTES DEL LOCAL =========================================================
Esta clase administra la vista exclusiva de Administrador ('Ges_reportes.html').
Sus responsabilidades son:
1. Proteger la ruta (Verificar rol Admin).
2. Gestionar los filtros de fecha (Día, Mes, Año).
3. Solicitar métricas calculadas al Backend mediante GraphQL.
4. Renderizar gráficos interactivos usando la librería Chart.js.
=========================================================================================================================== */



class DashboardService {
    constructor() {
        // Solo inicializar si estamos en la página de reportes y existe el gráfico principal
        // Esto evita errores si cargamos este script en el Home o el Menú.
        if (document.getElementById('chartTop')) {
            this.inicializarDashboard();
        }
    }
// ------------------------------- INICIALIZACIÓN DEL DASHBOARD --------------------------------
// Este es el orquestador principal que llama a las funciones vitales para que el dashboard funcione.
    async inicializarDashboard() {
        console.log('📊 Inicializando Dashboard Real...');
        
        // 1. Verificar si es admin (Seguridad Frontend)
        // Error: Seguridad solo en cliente. Si un usuario experto modifica el JS o el localStorage,
        // podría saltarse este check. Aunque el Backend debe tener su propia seguridad (los TODOs que vimos),
        // aquí es la primera línea de defensa.
        if (!authService.esAdmin()) {
            alert('Acceso denegado: Se requieren permisos de administrador.');
            window.location.href = 'Web_principal.html';
            return;
        }

        // Variables para las instancias de los gráficos (para poder destruirlos y redibujarlos)
        // Es vital guardar las referencias para llamar a .destroy() antes de actualizar.
        this.chartTop = null;
        this.chartPay = null;
        this.chartType = null;

        // 2. Configurar filtros de fecha (Listeners de los chips)
        this.configurarFiltros();
        
        // 3. Cargar datos iniciales (por defecto "mes")
        await this.cargarDatos('mes');
    }

// ------------------------------- CARGA DE DATOS DEL DASHBOARD --------------------------------
// Esta función centraliza la lógica de consulta al backend y renderizado.

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

//------------------------------- CONFIGURACIÓN DE FILTROS ----------------------------------------------
// Esta función configura los listeners para los chips de filtro y el botón de exportación.
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

/*
Simulacion detectada: Botón de Exportación.
Aunque el Backend tiene la mutación `exportarReporteExcel`, el Frontend aquí solo muestra un alert.
Para conectar la funcionalidad real, deberíamos llamar a `GQL.request` con esa mutación y manejar
la respuesta (que devuelve un string CSV) creando un Blob y forzando la descarga en el navegador.
*/   

//------------------------------- MANEJO DE INPUTS DE FECHA ----------------------------------------------
// Esta función muestra u oculta los inputs de fecha según el modo seleccionado.
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

//------------------------------- RENDERIZADO DE KPIS Y GRÁFICOS ----------------------------------------------
/* 
Este conjunto de funciones se encarga de la capa de presentación del panel de administración. Su objetivo es inyectar los datos calculados en el DOM y 
dibujar los gráficos interactivos.
*/

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

//------------------------------- RENDERIZADO DE GRÁFICOS ----------------------------------------------
/* 
Esta función actúa como traductora. Transforma los objetos de datos complejos en arrays simples que Chart.js puede entender (Etiquetas y Valores).
*/ 
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

//------------------------------- FUNCIÓN GENÉRICA DE CREACIÓN DE GRÁFICOS ----------------------------------------------
// Esta es la función técnica más compleja del bloque. Encapsula la creación de gráficos para no repetir código de configuración.
    crearGrafico(canvasId, tipo, labels, data, labelDatos, colores) {
        // Error: Dependencia Externa.
        // Si la librería Chart.js no se cargó en el HTML (<script src="...chart.umd.min.js">), 
        // 'Chart' no estará definido y esto romperá la ejecución.
        // Solución: Verificar `if (typeof Chart === 'undefined')` antes de instanciar.
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        // Destruir gráfico anterior si existe para evitar superposiciones (glitch visual común)
        // Esto es muy importante en SPAs o páginas que no recargan al cambiar filtros.
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
                maintainAspectRatio: true,
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

/* 
=========================== LOGICA DE INICIALIZADOR =============================================================================
Esta clase es el punto de entrada (Entry Point). Su función es coordinar el arranque de la aplicación.
Asegura que el DOM esté listo, carga la sesión, llena los estantes de productos y
conecta todos los cables (Event Listeners) para que los botones funcionen.
================================================================================================================================= 
*/

class AppInicializador {
    constructor() {
        this.eventListenersRegistrados = false;
    }

// ------------------------------- INICIALIZACIÓN PRINCIPAL ----------------------------------------------
/* 
Esta clase es el Punto de Entrada (Entry Point) de la aplicación. Su responsabilidad es ejecutar una secuencia estricta de pasos para que 
la página cargue correctamente: primero recuperamos al usuario, luego traemos los datos del servidor y finalmente activamos los botones.
*/

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

    
// --------------------------------CARGA MASIVA DE CATEGORIAS Y PRODUCTOS -------------------------------------
/* 
Esta función se ejecuta durante el arranque de la aplicación (inicializarApp). Su objetivo es poblar las diferentes secciones del menú 
(Menu.html o Web_Principal.html) con los productos correspondientes traídos del servidor.
*/
    async cargarProductosIniciales() {
        try {
            console.log('🔄 Cargando catálogo completo...');

            // Lista de todas las categorías que tu negocio maneja
            // Error Relacionado al #4 (Acompañamientos):
            // Esta lista está "Hardcodeada" (escrita a mano). Si en la Base de Datos creas una categoría nueva
            // llamada "Postres", NO APARECERÁ en la página a menos que la agregues manualmente aquí.
            // Además, si aquí dice 'acompañamientos' (con ñ) y el ID del HTML es 'contenedor-acompanamientos' (sin ñ),
            // dependemos totalmente del "Truco Inteligente" que vimos en ProductService.
            // Solución Ideal: Obtener esta lista dinámicamente desde el Backend (Query obtenerCategorias).
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

//---------------------------------------------REGISTRO DE EVENTOS LISTENERS----------------------------------------------
/* 
Esta función centraliza el registro de todos los event listeners de la aplicación.
Evita registros múltiples y asegura que cada sección tenga sus propios listeners bien organizados.
Esta función es el Organizador de Conexiones. Su trabajo no es escuchar los clics directamente, 
sino asegurarse de que todas las funciones que sí lo hacen se activen una sola vez y en orden.
*/
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

//----------------------------------LISTENERS DE AUTENTICACIÓN------------------------------------------------------------

//Este bloque conecta los formularios de Login y Registro con la lógica del AuthService.
registrarListenersAutenticacion() {
        if (Utilidades.elementoExiste(ElementosDOM.formLogearse)) {
            ElementosDOM.formLogearse.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('login-Email').value;
                const pass = document.getElementById('login-contraseña').value;
                await authService.login(email, pass);
            });
        }

//BRIDGE: IR A REGISTRO (Botón "Registrarse")
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

//BRIDGE: VOLVER A LOGIN (Botón "Volver al Login")
        const btnVolver = document.getElementById('btn-volver-login');
        if (btnVolver) {
            btnVolver.addEventListener('click', () => {
                const modalReg = bootstrap.Modal.getInstance(document.getElementById('registroModal'));
                if (modalReg) modalReg.hide();

                const modalLogin = new bootstrap.Modal(ElementosDOM.loginModal);
                modalLogin.show();
            });
        }

//---------------------------------------REGISTRO COMPLETO (Formulario gigante)-------------------------------------------------------------------------------
        const formRegistro = document.getElementById('form-registro-completo'); // Ojo con el ID del form
        if (formRegistro) {
            formRegistro.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Recolectar datos del formulario gigante
                // Error Relacionado al #1 (Estilos Modal):
                // El JS funciona bien recolectando datos, pero el problema reportado es visual (contraste).
                // Sin embargo, si al cambiar los estilos CSS cambiamos los IDs de los inputs, este bloque fallará.
                // Mantener los IDs 'reg-nombre', 'reg-run', etc., intactos al arreglar el CSS.
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

//-------------------------------------LISTENERS DE CARRITO DE COMPRAS--------------------------------------------------
    registrarListenersCarrito() {
        // Delegación para botones "Agregar al carrito" en productos
        // Esto es muy eficiente: un solo listener para todos los botones de la página.
        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('btn-agregar-carrito')) {
                const nombre = e.target.dataset.nombre;
                const precio = e.target.dataset.precio;
                const imagen = e.target.dataset.imagen;
                const productoId = e.target.dataset.productoId;
                
                await carritoService.agregarAlCarrito(nombre, precio, imagen, productoId);
            }
        });
// Listeners dentro del offcanvas del carrito
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
// Esto asegura que si agregaste algo y el carrito estaba oculto, al abrirlo se vea actualizado.
        if (Utilidades.elementoExiste(ElementosDOM.offcanvasCarrito)) {
            ElementosDOM.offcanvasCarrito.addEventListener('show.bs.offcanvas', () => {
                carritoService.renderCarrito();
            });
        }

        console.log('🛒 Listeners de carrito registrados');
    }

//-----------------------------LISTENERS DE PRODUCTOS (ADMIN)--------------------------------------------------
// En AppInicializador (app.js)

registrarListenersProductos() {
// Listener para el formulario del modal (Guardar)
    if (Utilidades.elementoExiste(ElementosDOM.productForm)) {
        ElementosDOM.productForm.addEventListener('submit', async (e) => {
            await productService.manejarSubmitProducto(e);
        });
    }

// Listener GLOBAL para botones "Agregar Producto" (Delegación)
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

// Listener para botones Editar/Eliminar (Ya lo tenías con delegación, lo mantenemos)
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

//----------------------------------------LISTENERS GLOBALES---------------------------------------------------
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

        // --- Listener para botón Tus Pedidos ---
        if (Utilidades.elementoExiste(ElementosDOM.btnPedidos)) {
            ElementosDOM.btnPedidos.addEventListener('click', () => {
                console.log('📂 Yendo a mis pedidos...');
                window.location.href = 'Ges_boletas.html';
            });
        }

      // --- Listener para botón de Mi Perfil ---

        if (Utilidades.elementoExiste(ElementosDOM.btnPerfil)) {
            ElementosDOM.btnPerfil.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Lógica de protección simple
                if (!authService.estaAutenticado()) {
                    alert('¡Vuélvete parte de la familia Bocatto para gestionar tu perfil!');
                    // Opcional: abrir modal login
                    const modalLogin = new bootstrap.Modal(document.getElementById('loginModal'));
                    modalLogin.show();
                } else {
                    console.log('👤 Yendo a Mi Perfil...');
                    // Todavía no creamos el HTML, así que por ahora solo log o alert
                    // window.location.href = 'Ges_datos_Usuario.html'; // DESCOMENTAR CUANDO EXISTA
                    alert('Próximamente: Interfaz de Perfil');
                }
            });
        }

        // --- Listener para botón Panel Admin ---
        if (Utilidades.elementoExiste(ElementosDOM.btnAdmin)) {
            ElementosDOM.btnAdmin.addEventListener('click', () => {
                console.log('👑 Yendo al panel de admin...');
                window.location.href = 'Ges_reportes.html';
            });
        }

        // --- Listener para botón Locales del Navbar ---
        // Lo enlazamos al enlace del navbar principal que tiene el href="#locales"
        document.querySelectorAll('a[href="#locales"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault(); // Prevenimos el scroll
                console.log('📍 Yendo a la página de locales...');
                window.location.href = 'Locales.html';
            });
        });
        // FALTANTE RELACIONADO AL ERROR 6 (Carrusel):
        // No veo ningún listener registrado para "Editar Carrusel".
        // La lista de errores menciona que se debe crear esta funcionalidad.
        // Aquí es donde deberíamos registrar el botón (probablemente en Web_principal.html)
        // para abrir un modal de gestión de imágenes.

        console.log('🌐 Listeners globales registrados');
    }

//----------------------------RENDERIZADO DEL ESTADO INICIAL----------------------------------------------------------
    renderizarEstadoInicial() {
        // Renderizar carrito (badge y estado)
        carritoService.renderCarrito();
        
        // Actualizar navbar según autenticación
        authService.actualizarNavbar();
        authService.toggleElementosAdmin();
        
        console.log('🎨 Estado inicial renderizado');
    }

//----------------------------------DESTRUIR EVENT LISTENERS (para SPA)-----------------------------------------------------
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
// Asegura que no intentemos buscar elementos (getElementById) antes de que existan.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        appInicializador.inicializarApp();
    });
} else {
    appInicializador.inicializarApp();
}

// =================== COMPATIBILIDAD CON CÓDIGO EXISTENTE ===================

// Funciones globales (Polluting Global Scope)
// Error: Mantener funciones en 'window' es mala práctica si ya usamos listeners.
// Se recomienda borrar esto una vez que estemos seguros de que el HTML no tiene 'onclick="..."'.
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