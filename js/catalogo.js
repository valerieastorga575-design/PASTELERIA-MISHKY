// ============================================================
// Pastelería Mishky · Catálogo dinámico (Lab 11 + 10 retos)
// ============================================================

const RUTA_DATOS = "data/productos.json";
const TODAS = "Todas";
const EXT_VALIDAS = /\.(jpe?g|png|webp|avif)$/i;
const NUM_FANTASMAS = 8;

// --- Referencias al DOM -------------------------------------
const contControles = document.querySelector("#controles");
const contFiltros = document.querySelector("#filtros");
const buscador = document.querySelector("#buscador");
const selOrden = document.querySelector("#orden");
const chkDisponibles = document.querySelector("#solo-disponibles");
const grilla = document.querySelector("#grilla");
const estado = document.querySelector("#estado");
const aviso = document.querySelector("#aviso");
const plantilla = document.querySelector("#tpl-producto");
const dialogo = document.querySelector("#detalle");

// --- Estado de la aplicación --------------------------------
let productos = [];
let categoriaActiva = TODAS;
let tarjetaAbierta = null; // Reto 8: para devolver el foco

const soles = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

// ============================================================
// RETO 6 · Validación de productos
// ============================================================
function motivosInvalido(p, idsVistos) {
  const m = [];
  if (typeof p !== "object" || p === null) return ["no es un objeto"];
  if (typeof p.id !== "number" || !Number.isFinite(p.id)) m.push("id no numérico");
  else if (idsVistos.has(p.id)) m.push("id repetido");
  if (typeof p.precio !== "number" || !(p.precio > 0)) m.push("precio no válido");
  if (!Number.isInteger(p.stock) || p.stock < 0) m.push("stock no válido");
  if (typeof p.categoria !== "string" || p.categoria.trim() === "") {
    m.push("categoría vacía");
  }
  if (typeof p.imagen !== "string" || !EXT_VALIDAS.test(p.imagen)) {
    m.push("imagen sin extensión válida");
  }
  return m;
}

function validarProductos(lista) {
  const idsVistos = new Set();
  const validos = [];
  const descartados = [];

  lista.forEach((p, indice) => {
    const motivos = motivosInvalido(p, idsVistos);
    if (motivos.length === 0) {
      idsVistos.add(p.id);
      validos.push(p);
    } else {
      descartados.push({ posicion: indice, id: p?.id, motivos: motivos.join(", ") });
    }
  });

  return { validos, descartados };
}

function mostrarAviso(descartados) {
  if (descartados.length === 0) {
    aviso.hidden = true;
    return;
  }
  console.warn(`Se descartaron ${descartados.length} producto(s) inválido(s):`);
  console.table(descartados);
  aviso.textContent =
    `Se descartaron ${descartados.length} producto(s) con datos inválidos (ver consola).`;
  aviso.hidden = false;
}

// ============================================================
// Carga con fetch y errores diferenciados (Reto 10)
// ============================================================
async function cargarProductos() {
  const respuesta = await fetch(RUTA_DATOS);
  if (!respuesta.ok) {
    const e = new Error(`HTTP ${respuesta.status}`);
    e.tipo = "http";
    e.status = respuesta.status;
    throw e;
  }

  let datos;
  try {
    datos = await respuesta.json();
  } catch (causa) {
    const e = new Error("JSON inválido", { cause: causa });
    e.tipo = "json";
    throw e;
  }

  if (!Array.isArray(datos)) {
    const e = new Error("El JSON debe ser un arreglo");
    e.tipo = "formato";
    throw e;
  }

  return datos;
}

function mensajeError(error) {
  if (error.tipo === "http" && error.status === 404) {
    return "No se encontró el archivo de productos (error 404). Revise la ruta del JSON.";
  }
  if (error.tipo === "http") {
    return `El servidor respondió con un error (${error.status}). Intente nuevamente.`;
  }
  if (error.tipo === "json" || error.tipo === "formato") {
    return "El archivo de productos tiene un formato incorrecto. Avise al administrador.";
  }
  return "No se pudo cargar el catálogo. Verifique su conexión o use Live Server.";
}

// ============================================================
// RETOS 1-3 · Tubería: categoría → búsqueda → stock → orden
// ============================================================
function leerControles() {
  return {
    texto: buscador.value.trim().toLowerCase(),
    orden: selOrden.value,
    soloDisponibles: chkDisponibles.checked,
  };
}

function coincide(p, { texto, soloDisponibles }) {
  return (
    p.nombre.toLowerCase().includes(texto) && (!soloDisponibles || p.stock > 0)
  );
}

function obtenerVisibles() {
  const ctl = leerControles();
  const filtrados = productos.filter(
    (p) =>
      (categoriaActiva === TODAS || p.categoria === categoriaActiva) &&
      coincide(p, ctl)
  );
  return ordenar(filtrados, ctl.orden);
}

function ordenar(lista, criterio) {
  const copia = [...lista]; // nunca se ordena el arreglo original
  if (criterio === "precio-asc") copia.sort((a, b) => a.precio - b.precio);
  else if (criterio === "precio-desc") copia.sort((a, b) => b.precio - a.precio);
  else if (criterio === "nombre") {
    copia.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }
  return copia;
}

// ============================================================
// Botones de filtro y RETO 4 · Contadores dinámicos
// ============================================================
function obtenerCategorias(lista) {
  return [TODAS, ...new Set(lista.map((p) => p.categoria))];
}

function renderizarFiltros(categorias) {
  const fragmento = document.createDocumentFragment();
  categorias.forEach((cat) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "filtro";
    boton.dataset.categoria = cat;
    boton.setAttribute("aria-pressed", String(cat === categoriaActiva));
    fragmento.append(boton);
  });
  contFiltros.replaceChildren(fragmento);
  actualizarContadores();
}

function actualizarContadores() {
  const ctl = leerControles();
  contFiltros.querySelectorAll(".filtro").forEach((boton) => {
    const cat = boton.dataset.categoria;
    const total = productos.filter(
      (p) => (cat === TODAS || p.categoria === cat) && coincide(p, ctl)
    ).length;
    boton.textContent = `${cat} (${total})`; // solo cambia el texto
  });
}

function marcarBotonActivo() {
  contFiltros.querySelectorAll(".filtro").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.categoria === categoriaActiva));
  });
}

// ============================================================
// RETO 5 · Categoría en la URL (location.hash)
// ============================================================
function categoriaDesdeHash(categorias) {
  const crudo = location.hash.slice(1);
  if (crudo === "") return TODAS;
  let cat;
  try {
    cat = decodeURIComponent(crudo); // lanza URIError si el hash está mal formado
  } catch {
    return TODAS;
  }
  return categorias.includes(cat) ? cat : TODAS;
}

function actualizarHash() {
  const nuevo =
    categoriaActiva === TODAS
      ? location.pathname + location.search
      : "#" + encodeURIComponent(categoriaActiva);
  history.replaceState(null, "", nuevo);
}

// ============================================================
// Tarjetas (RETO 9: srcset, sizes y evento load)
// ============================================================
const SIZES = "(max-width: 600px) calc(100vw - 2rem), (max-width: 900px) 45vw, 280px";

function variante(ruta, ancho) {
  return ruta.replace(/\.(\w+)$/, `-${ancho}.$1`);
}

function crearTarjeta(p) {
  const nodo = plantilla.content.cloneNode(true);
  const tarjeta = nodo.querySelector(".tarjeta");
  const img = nodo.querySelector("img");
  const etiqueta = nodo.querySelector(".etiqueta");

  tarjeta.dataset.id = p.id;
  tarjeta.tabIndex = 0;
  tarjeta.setAttribute("aria-label", `${p.nombre}, ${soles.format(p.precio)}. Ver detalle`);

  img.addEventListener("load", () => tarjeta.classList.add("foto-cargada"));
  img.onerror = () => {
    img.onerror = null; // evita bucle si también falta el respaldo
    img.removeAttribute("srcset");
    img.src = "img/sin-imagen.jpg";
  };

  img.alt = p.nombre;
  img.sizes = SIZES;
  img.srcset =
    `${variante(p.imagen, 300)} 300w, ${variante(p.imagen, 600)} 600w, ${p.imagen} 900w`;
  img.src = p.imagen;
  if (img.complete && img.naturalWidth > 0) tarjeta.classList.add("foto-cargada");

  nodo.querySelector(".tarjeta__categoria").textContent = p.categoria;
  nodo.querySelector(".tarjeta__nombre").textContent = p.nombre;
  nodo.querySelector(".tarjeta__descripcion").textContent = p.descripcion;
  nodo.querySelector(".tarjeta__precio").textContent = soles.format(p.precio);
  nodo.querySelector(".tarjeta__porciones").textContent =
    p.porciones > 1 ? `${p.porciones} porciones` : "1 unidad";

  if (p.stock === 0) {
    etiqueta.textContent = "Agotado";
    etiqueta.classList.add("etiqueta--agotado");
    etiqueta.hidden = false;
    tarjeta.classList.add("tarjeta--agotado");
  } else if (p.destacado) {
    etiqueta.textContent = "Favorito";
    etiqueta.hidden = false;
  }

  return nodo;
}

// ============================================================
// Renderizado y mensaje de estado (RETO 1)
// ============================================================
function textoEstado(n) {
  const ctl = leerControles();
  const partes = [`Mostrando ${n} ${n === 1 ? "producto" : "productos"}`];
  partes.push(categoriaActiva === TODAS ? "en total" : `en «${categoriaActiva}»`);
  if (ctl.texto) partes.push(`con «${buscador.value.trim()}» en el nombre`);
  if (ctl.soloDisponibles) partes.push("(solo disponibles)");
  return partes.join(" ") + ".";
}

function renderizarCatalogo() {
  const lista = obtenerVisibles();

  if (lista.length === 0) {
    grilla.replaceChildren();
    estado.textContent = "No hay productos que coincidan con su búsqueda.";
    return;
  }

  const fragmento = document.createDocumentFragment();
  lista.forEach((p) => fragmento.append(crearTarjeta(p)));
  grilla.replaceChildren(fragmento);
  estado.textContent = textoEstado(lista.length);
}

function refrescar() {
  renderizarCatalogo();
  actualizarContadores();
}

// ============================================================
// RETO 7 · Tarjetas fantasma
// ============================================================
function mostrarFantasmas(cantidad = NUM_FANTASMAS) {
  const fragmento = document.createDocumentFragment();
  for (let i = 0; i < cantidad; i++) {
    const li = document.createElement("li");
    li.className = "tarjeta tarjeta--fantasma";
    li.setAttribute("aria-hidden", "true");
    li.innerHTML =
      '<div class="tarjeta__foto"></div><div class="tarjeta__cuerpo">' +
      '<span class="fantasma__linea fantasma__linea--corta"></span>' +
      '<span class="fantasma__linea"></span><span class="fantasma__linea"></span></div>';
    fragmento.append(li); // HTML fijo del programa, sin datos del usuario
  }
  grilla.replaceChildren(fragmento);
}

// ============================================================
// RETOS 1, 2, 3 · Delegación de eventos en #controles
// ============================================================
contControles.addEventListener("click", (evento) => {
  const boton = evento.target.closest(".filtro");
  if (!boton || boton.dataset.categoria === categoriaActiva) return;

  categoriaActiva = boton.dataset.categoria;
  marcarBotonActivo();
  actualizarHash();
  refrescar();
});

contControles.addEventListener("input", (evento) => {
  if (evento.target.matches("#buscador")) refrescar();
});

contControles.addEventListener("change", (evento) => {
  if (evento.target.matches("#orden, #solo-disponibles")) refrescar();
});

// ============================================================
// RETO 8 · Modal <dialog> con delegación sobre #grilla
// ============================================================
function abrirDetalle(tarjeta) {
  const p = productos.find((x) => x.id === Number(tarjeta.dataset.id));
  if (!p) return;

  tarjetaAbierta = tarjeta;
  const img = document.querySelector("#detalle-img");
  img.src = p.imagen;
  img.alt = p.nombre;

  document.querySelector("#detalle-categoria").textContent = p.categoria;
  document.querySelector("#detalle-titulo").textContent = p.nombre;
  document.querySelector("#detalle-descripcion").textContent = p.descripcion;
  document.querySelector("#detalle-precio").textContent = soles.format(p.precio);
  document.querySelector("#detalle-stock").textContent =
    p.stock === 0 ? "Agotado" : `Stock: ${p.stock} ${p.stock === 1 ? "unidad" : "unidades"}`;

  dialogo.showModal(); // Escape lo cierra de forma nativa
}

grilla.addEventListener("click", (evento) => {
  const tarjeta = evento.target.closest(".tarjeta[data-id]");
  if (tarjeta) abrirDetalle(tarjeta);
});

grilla.addEventListener("keydown", (evento) => {
  if (evento.key !== "Enter" && evento.key !== " ") return;
  const tarjeta = evento.target.closest(".tarjeta[data-id]");
  if (tarjeta && evento.target === tarjeta) {
    evento.preventDefault();
    abrirDetalle(tarjeta);
  }
});

dialogo.addEventListener("click", (evento) => {
  // botón «Cerrar» o clic en el fondo (backdrop)
  if (evento.target.closest("[data-cerrar]") || evento.target === dialogo) dialogo.close();
});

dialogo.addEventListener("close", () => {
  if (tarjetaAbierta) tarjetaAbierta.focus(); // devuelve el foco a la tarjeta
  tarjetaAbierta = null;
});

// Bonus del reto 5: si el hash cambia sin recargar (por ejemplo, desde un enlace)
window.addEventListener("hashchange", () => {
  if (productos.length === 0) return;
  categoriaActiva = categoriaDesdeHash(obtenerCategorias(productos));
  marcarBotonActivo();
  refrescar();
});

// ============================================================
// Inicio (RETOS 5, 6, 7, 10)
// ============================================================
function limpiarError() {
  estado.classList.remove("estado--error");
  estado.querySelector(".estado__reintentar")?.remove();
}

function mostrarError(error) {
  console.error(error);
  grilla.replaceChildren();
  estado.classList.add("estado--error");
  estado.textContent = mensajeError(error) + " ";

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "estado__reintentar";
  boton.textContent = "Reintentar";
  boton.addEventListener("click", iniciar);
  estado.append(boton);
  boton.focus();
}

async function iniciar() {
  limpiarError();
  grilla.setAttribute("aria-busy", "true");
  estado.textContent = "Cargando productos...";
  mostrarFantasmas();

  try {
    const datos = await cargarProductos();
    const { validos, descartados } = validarProductos(datos);
    mostrarAviso(descartados);
    productos = validos;
    const categorias = obtenerCategorias(productos);
    categoriaActiva = categoriaDesdeHash(categorias);
    renderizarFiltros(categorias);
    refrescar();
  } catch (error) {
    mostrarError(error);
  } finally {
    grilla.setAttribute("aria-busy", "false");
  }
}

iniciar();