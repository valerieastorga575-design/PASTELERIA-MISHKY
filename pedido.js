// ============================================================
// Pastelería Mishky · Cotizador / Carrito de Pedido (Mejora)
// ============================================================

(function () {
    const btnAbrirPedido = document.querySelector("#btn-abrir-pedido");
    const btnCerrarPedido = document.querySelector("#btn-cerrar-pedido");
    const panelPedido = document.querySelector("#panel-pedido");
    const listaPedido = document.querySelector("#lista-pedido");
    const pedidoVacio = document.querySelector("#pedido-vacio");
    const contadorPedido = document.querySelector("#contador-pedido");
    const totalPedido = document.querySelector("#total-pedido");
    const btnVaciar = document.querySelector("#btn-vaciar-pedido");
    const btnCopiar = document.querySelector("#btn-copiar-pedido");
    const mensajeCopiado = document.querySelector("#mensaje-copiado");
    const grilla = document.querySelector("#grilla");
    const dialogo = document.querySelector("#detalle");
    const btnDetalleAgregar = document.querySelector("#detalle-agregar");
  
    let carrito = [];
    let productoActualModal = null;
  
    const formatoMoneda = new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    });
  
    function obtenerCatalogoActual() {
      if (window.__MISHKY_CAT__ && typeof window.__MISHKY_CAT__.obtenerProductos === "function") {
        return window.__MISHKY_CAT__.obtenerProductos();
      }
      return [];
    }
  
    function sincronizarBotonesTarjetas() {
      if (!grilla) return;
      const listaProductos = obtenerCatalogoActual();
  
      grilla.querySelectorAll(".tarjeta[data-id]").forEach((tarjeta) => {
        const id = Number(tarjeta.dataset.id);
        const prod = listaProductos.find((item) => item.id === id);
        const btn = tarjeta.querySelector(".tarjeta__agregar");
        if (!btn || !prod) return;
  
        const enCarrito = carrito.find((item) => item.id === id);
        const cant = enCarrito ? enCarrito.cantidad : 0;
  
        if (prod.stock <= 0) {
          btn.disabled = true;
          btn.textContent = "Agotado";
        } else if (cant >= prod.stock) {
          btn.disabled = true;
          btn.textContent = `Máx. stock (${cant})`;
        } else if (cant > 0) {
          btn.disabled = false;
          btn.textContent = `Agregar más (${cant} en pedido)`;
        } else {
          btn.disabled = false;
          btn.textContent = "Agregar al pedido";
        }
      });
    }
  
    function agregarProductoPorId(id) {
      const listaProductos = obtenerCatalogoActual();
      const prod = listaProductos.find((item) => item.id === id);
      if (!prod || prod.stock <= 0) return;
  
      const existente = carrito.find((item) => item.id === id);
      if (existente) {
        if (existente.cantidad >= prod.stock) return;
        existente.cantidad += 1;
      } else {
        carrito.push({
          id: prod.id,
          nombre: prod.nombre,
          precio: prod.precio,
          stock: prod.stock,
          cantidad: 1,
        });
      }
  
      mensajeCopiado.textContent = "";
      renderizarPedido();
      sincronizarBotonesTarjetas();
    }
  
    function cambiarCantidad(id, delta) {
      const idx = carrito.findIndex((item) => item.id === id);
      if (idx === -1) return;
  
      const nuevaCant = carrito[idx].cantidad + delta;
      if (nuevaCant <= 0) {
        carrito.splice(idx, 1);
      } else if (nuevaCant <= carrito[idx].stock) {
        carrito[idx].cantidad = nuevaCant;
      }
  
      mensajeCopiado.textContent = "";
      renderizarPedido();
      sincronizarBotonesTarjetas();
    }
  
    function renderizarPedido() {
      const totalUnidades = carrito.reduce((acc, item) => acc + item.cantidad, 0);
      const totalSoles = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  
      contadorPedido.textContent = String(totalUnidades);
      totalPedido.textContent = formatoMoneda.format(totalSoles);
  
      pedidoVacio.hidden = carrito.length > 0;
      listaPedido.replaceChildren();
  
      carrito.forEach((item) => {
        const li = document.createElement("li");
        li.className = "item-pedido";
        li.dataset.id = String(item.id);
  
        const info = document.createElement("div");
        info.className = "item-pedido__info";
        info.innerHTML =
          `<strong>${item.nombre}</strong>` +
          `<span>${formatoMoneda.format(item.precio)} c/u · Subtotal: ${formatoMoneda.format(item.precio * item.cantidad)}</span>`;
  
        const controles = document.createElement("div");
        controles.className = "item-pedido__controles";
  
        const btnMenos = document.createElement("button");
        btnMenos.type = "button";
        btnMenos.className = "btn-cant";
        btnMenos.dataset.accion = "restar";
        btnMenos.setAttribute("aria-label", `Restar unidad de ${item.nombre}`);
        btnMenos.textContent = "−";
  
        const cantTexto = document.createElement("span");
        cantTexto.className = "item-pedido__cant";
        cantTexto.textContent = String(item.cantidad);
  
        const btnMas = document.createElement("button");
        btnMas.type = "button";
        btnMas.className = "btn-cant";
        btnMas.dataset.accion = "sumar";
        btnMas.disabled = item.cantidad >= item.stock;
        btnMas.setAttribute("aria-label", `Sumar unidad de ${item.nombre}`);
        btnMas.textContent = "+";
  
        const btnQuitar = document.createElement("button");
        btnQuitar.type = "button";
        btnQuitar.className = "btn-quitar";
        btnQuitar.dataset.accion = "quitar";
        btnQuitar.setAttribute("aria-label", `Quitar ${item.nombre} del pedido`);
        btnQuitar.textContent = "✕";
  
        controles.append(btnMenos, cantTexto, btnMas, btnQuitar);
        li.append(info, controles);
        listaPedido.append(li);
      });
    }
  
    function abrirPanel() {
      panelPedido.hidden = false;
      renderizarPedido();
    }
  
    function cerrarPanel() {
      panelPedido.hidden = true;
    }
  
    function generarResumenTexto() {
      if (carrito.length === 0) return "";
      const lineas = ["Hola Pastelería Mishky, quisiera consultar este pedido:"];
      carrito.forEach((item) => {
        lineas.push(
          `- ${item.cantidad}x ${item.nombre} (${formatoMoneda.format(item.precio * item.cantidad)})`
        );
      });
      const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
      lineas.push(`Total estimado: ${formatoMoneda.format(total)}`);
      return lineas.join("\n");
    }
  
    grilla?.addEventListener("click", (evento) => {
      const btnAgregar = evento.target.closest(".tarjeta__agregar");
      if (!btnAgregar) return;
      evento.stopPropagation();
      const tarjeta = btnAgregar.closest(".tarjeta[data-id]");
      if (!tarjeta) return;
      agregarProductoPorId(Number(tarjeta.dataset.id));
    });
  
    grilla?.addEventListener("click", (evento) => {
      const tarjeta = evento.target.closest(".tarjeta[data-id]");
      if (!tarjeta || evento.target.closest(".tarjeta__agregar")) return;
      const id = Number(tarjeta.dataset.id);
      productoActualModal = obtenerCatalogoActual().find((p) => p.id === id) || null;
      if (btnDetalleAgregar && productoActualModal) {
        btnDetalleAgregar.disabled = productoActualModal.stock <= 0;
        btnDetalleAgregar.textContent =
          productoActualModal.stock <= 0 ? "Agotado" : "Agregar al pedido";
      }
    });
  
    btnDetalleAgregar?.addEventListener("click", () => {
      if (!productoActualModal) return;
      agregarProductoPorId(productoActualModal.id);
      dialogo?.close();
      abrirPanel();
    });
  
    listaPedido?.addEventListener("click", (evento) => {
      const btn = evento.target.closest("button[data-accion]");
      if (!btn) return;
      const itemEl = btn.closest(".item-pedido[data-id]");
      if (!itemEl) return;
      const id = Number(itemEl.dataset.id);
      const accion = btn.dataset.accion;
  
      if (accion === "sumar") cambiarCantidad(id, 1);
      else if (accion === "restar") cambiarCantidad(id, -1);
      else if (accion === "quitar") {
        carrito = carrito.filter((x) => x.id !== id);
        renderizarPedido();
        sincronizarBotonesTarjetas();
      }
    });
  
    btnAbrirPedido?.addEventListener("click", () => {
      if (panelPedido.hidden) abrirPanel();
      else cerrarPanel();
    });
  
    btnCerrarPedido?.addEventListener("click", cerrarPanel);
  
    btnVaciar?.addEventListener("click", () => {
      carrito = [];
      mensajeCopiado.textContent = "";
      renderizarPedido();
      sincronizarBotonesTarjetas();
    });
  
    btnCopiar?.addEventListener("click", async () => {
      const texto = generarResumenTexto();
      if (!texto) {
        mensajeCopiado.textContent = "Agrega al menos un producto primero.";
        return;
      }
      try {
        await navigator.clipboard.writeText(texto);
        mensajeCopiado.textContent = "Resumen copiado al portapapeles.";
      } catch {
        mensajeCopiado.textContent = "No se pudo copiar automáticamente.";
      }
    });
  
    if (grilla) {
      const observador = new MutationObserver(() => {
        sincronizarBotonesTarjetas();
      });
      observador.observe(grilla, { childList: true });
    }
  
    renderizarPedido();
  })();